import { createLogger, errorMessage, forwardLogsToBackground, setLogSink } from "./lib/log"
import { hasAuthenticatedSellerUi, visible } from "./lib/sellerCentralSession"

const STATUS_ID = "s4e-account-switch-status"
const documentStartedAt = Date.now()
const attempts = new Map<string, number>()
let inFlight: { stage: string; startedAt: number } | null = null
let leavingLogout = false
const RETRY_DELAY_MS = 5_000
const MAX_ATTEMPTS = 2
const STEP_TIMEOUT_MS = 90_000
const CAPTCHA_TEXT_SCAN_INTERVAL_MS = 3_000
let lastCaptchaTextScanAt = 0
let lastCaptchaTextScanResult = false
let runTimer: number | undefined
let waitingForLoad = false
let reportedWaitingPath: string | null = null
let manualSignIn = false
let stalledHiddenStage: string | null = null
const automationLog = createLogger("automation")

const EMAIL_INPUT_SELECTORS = ["#ap_email", 'input[name="email"]', 'input[type="email"]', 'input[autocomplete="username"]']
const PASSWORD_INPUT_SELECTORS = ["#ap_password", 'input[name="password"]', 'input[type="password"]']
const OTP_INPUT_SELECTORS = [
  "#auth-mfa-otpcode",
  'input[name="otpCode"]',
  'input[autocomplete="one-time-code"]',
  'input[inputmode="numeric"]',
]

type AutomationResponse = {
  ok: boolean
  error?: string
  value?: string
  waitMs?: number
  job?: { id: string; stage: string; resumeStage?: string } | null
}

async function send(message: Record<string, unknown>): Promise<AutomationResponse> {
  return chrome.runtime.sendMessage(message) as Promise<AutomationResponse>
}

/** Runs the workflow again after `delayMs`, replacing any run already scheduled so only one loop polls. */
function scheduleRun(delayMs: number): void {
  if (runTimer !== undefined) window.clearTimeout(runTimer)
  runTimer = window.setTimeout(() => {
    runTimer = undefined
    void run()
  }, delayMs)
}

function setWorkflowStatus(text: string, tone: "normal" | "error" = "normal"): void {
  let element = document.getElementById(STATUS_ID)
  if (!element) {
    element = document.createElement("div")
    element.id = STATUS_ID
    element.setAttribute("role", "status")
    Object.assign(element.style, {
      position: "fixed", right: "16px", bottom: "16px", zIndex: "2147483647",
      maxWidth: "360px", padding: "10px 14px", borderRadius: "8px",
      color: "white", font: "13px/1.4 system-ui, sans-serif",
      boxShadow: "0 4px 18px rgba(0,0,0,.25)",
    })
    document.documentElement.append(element)
  }
  element.setAttribute("role", tone === "error" ? "alert" : "status")
  element.style.background = tone === "error" ? "#991b1b" : "#1f2937"
  element.textContent = text
}

/** The confirmed store document stays open after the switch, so it must not keep the overlay. */
function clearWorkflowStatus(): void {
  document.getElementById(STATUS_ID)?.remove()
}

function input(selectors: readonly string[]): HTMLInputElement | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLInputElement && visible(element)) return element
  }
  return null
}

function button(selectors: readonly string[], names: RegExp): HTMLElement | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (visible(element)) return element
  }
  return Array.from(document.querySelectorAll<HTMLElement>("button, input[type=submit], a[role=button]"))
    .find((element) => visible(element) && names.test(element.textContent || (element as HTMLInputElement).value || "")) ?? null
}

function fill(element: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

type ClickAction = "continue" | "password-submit" | "otp-submit"

/** Amazon wraps each submit input in a same-id span; a page-level click must reach the input itself. */
function submitControl(element: HTMLElement): HTMLElement {
  if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) return element
  return element.querySelector<HTMLElement>('input[type="submit"], button[type="submit"], button, input[type="button"]') ?? element
}

async function activate(
  jobId: string,
  element: HTMLElement | null,
  action: ClickAction,
  missingMessage: string,
): Promise<void> {
  if (!element) throw new Error(missingMessage)
  if (!visible(element)) throw new Error(`${missingMessage} The control is not visible.`)
  // A sign-in window covered by other windows is hidden, and Chrome does not deliver debugger
  // input to hidden pages, so submit through the page there. It also avoids the debugging bar.
  if (document.visibilityState === "hidden") {
    automationLog.withRun(jobId).info("automation.click", { action, mode: "page" })
    submitControl(element).click()
    return
  }
  const rect = element.getBoundingClientRect()
  const finite = [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
  if (!finite || rect.width <= 0 || rect.height <= 0) {
    throw new Error(`${missingMessage} The control has invalid click coordinates.`)
  }
  const click = () => send({
    type: "ACCOUNT_AUTOMATION_CLICK",
    jobId,
    action,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
  const response = await click()
  // Other extensions own their UI. Leave it intact when Chrome refuses the attachment.
  if (!response.ok && isDebuggerBlocked(response.error)) {
    automationLog.warn("account.switch.debuggerBlocked", { action })
    throw new Error("Another Chrome extension is preventing automated sign-in. Its interface was left open. Complete sign-in manually, or resolve the conflict and retry the switch.")
  }
  if (!response.ok) throw new Error(response.error ?? "Chrome could not activate Amazon’s login control.")
}

function isDebuggerBlocked(error: string | undefined): boolean {
  return Boolean(error?.includes("chrome-extension:// URL of different extension"))
}

function prepareStage(stage: string, failureMessage: string): boolean {
  if (inFlight?.stage !== stage) {
    inFlight = null
    return true
  }
  const elapsed = Date.now() - inFlight.startedAt
  if (elapsed < RETRY_DELAY_MS) {
    scheduleRun(RETRY_DELAY_MS - elapsed)
    return false
  }
  if ((attempts.get(stage) ?? 0) >= MAX_ATTEMPTS) {
    if (document.visibilityState === "hidden") stalledHiddenStage = stage
    throw new Error(failureMessage)
  }
  inFlight = null
  return true
}

/** Needs attention shows the window; once visible, trusted clicks work, so retry the stalled step. */
function retryStalledStageWhenVisible(): void {
  const stage = stalledHiddenStage
  if (!stage) return
  stalledHiddenStage = null
  document.addEventListener("visibilitychange", function onVisible() {
    if (document.visibilityState !== "visible") return
    document.removeEventListener("visibilitychange", onVisible)
    attempts.delete(stage)
    inFlight = null
    manualSignIn = false
    scheduleRun(0)
  })
}

function markStageSubmitted(stage: string): void {
  attempts.set(stage, (attempts.get(stage) ?? 0) + 1)
  inFlight = { stage, startedAt: Date.now() }
  scheduleRun(RETRY_DELAY_MS)
}

function hasCaptcha(): boolean {
  if (document.querySelector('iframe[src*="captcha" i], input[name*="captcha" i], #captchacharacters')) {
    return true
  }
  const now = Date.now()
  if (now - lastCaptchaTextScanAt < CAPTCHA_TEXT_SCAN_INTERVAL_MS) {
    return lastCaptchaTextScanResult
  }
  lastCaptchaTextScanAt = now
  lastCaptchaTextScanResult = /enter the characters you see|solve this puzzle|captcha/iu.test(
    document.body?.innerText ?? "",
  )
  return lastCaptchaTextScanResult
}

function hasAuthError(): boolean {
  const alert = Array.from(document.querySelectorAll('[role="alert"], .a-alert-error, #auth-error-message-box'))
    .find((element) => element.id !== STATUS_ID && visible(element) && (element.textContent?.trim().length ?? 0) > 0)
  return Boolean(alert)
}

function hasManualVerification(): boolean {
  return /^\/ap\/(?:cvf|mfa|challenge|dcq|pv)(?:\/|$)/u.test(location.pathname)
    && document.readyState === "complete"
    && !input(EMAIL_INPUT_SELECTORS) && !input(PASSWORD_INPUT_SELECTORS) && !input(OTP_INPUT_SELECTORS)
}

async function requestAttention(jobId: string, reason: string): Promise<void> {
  if (!attempts.has(reason)) {
    attempts.set(reason, 1)
    await send({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId, reason })
  }
  scheduleRun(1500)
}

/** Logged-in enough to open the saved store URL (shell UI or merchant/marketplace picker). */
function isReadyForStoreNavigation(): boolean {
  if (hasAuthenticatedSellerUi()) return true
  return location.pathname.startsWith("/account-switcher/")
}

function shouldCompleteAuthenticatedSession(stage: string): boolean {
  if (location.pathname.startsWith("/account-switcher/")) return true
  return stage !== "logout" && stage !== "signin"
}

async function requestSecret(jobId: string, kind: "email" | "password" | "otp"): Promise<string | null> {
  const response = await send({ type: "ACCOUNT_AUTOMATION_SECRET", jobId, kind })
  if (!response.ok) throw new Error(response.error ?? "The saved account details are unavailable.")
  if (response.waitMs) {
    setWorkflowStatus("Waiting for a fresh verification code…")
    scheduleRun(response.waitMs)
    return null
  }
  return response.value ?? null
}

async function leaveLogout(jobId: string): Promise<void> {
  leavingLogout = true
  const left = await send({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId })
  if (!left.ok) {
    leavingLogout = false
    throw new Error(left.error ?? "Could not leave Amazon’s logout page.")
  }
}

/** Ends the switch with a visible error; the background worker logs the reason. */
async function failWorkflow(jobId: string, error: unknown): Promise<void> {
  const message = errorMessage(error, "Account switching failed.")
  setWorkflowStatus(message, "error")
  retryStalledStageWhenVisible()
  // Report once per document; later polls keep retrying without flooding the log.
  if (!manualSignIn) {
    manualSignIn = true
    await send({ type: "ACCOUNT_AUTOMATION_ERROR", jobId, error: message })
  }
  scheduleRun(1500)
}

function onLogoutIntercept(): boolean {
  return location.pathname.startsWith("/ap/")
    || location.pathname.includes("signin")
    || Boolean(input(EMAIL_INPUT_SELECTORS) || input(PASSWORD_INPUT_SELECTORS) || input(OTP_INPUT_SELECTORS))
}

async function run(): Promise<void> {
  const response = await send({ type: "ACCOUNT_AUTOMATION_GET_JOB" })
  const job = response.job
  if (!response.ok || !job) {
    clearWorkflowStatus()
    return
  }
  const stage = job.resumeStage ?? job.stage

  try {
    if (hasCaptcha()) {
      setWorkflowStatus("Amazon needs you to complete the CAPTCHA. Automation will resume afterward.")
      await requestAttention(job.id, "captcha")
      return
    }
    if (hasManualVerification()) {
      setWorkflowStatus("Amazon needs you to complete verification in this window. Automation will resume afterward.")
      await requestAttention(job.id, "verification")
      return
    }
    if (stage === "store") {
      if (hasAuthenticatedSellerUi() && document.readyState === "complete") {
        setWorkflowStatus("Store loaded. Finishing the switch…")
        const ready = await send({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id })
        if (!ready.ok) throw new Error(ready.error ?? "Couldn’t finish the store switch.")
        if (ready.waitMs) scheduleRun(ready.waitMs)
        else clearWorkflowStatus()
        return
      }
      if (location.pathname.startsWith("/ap/") && (input(EMAIL_INPUT_SELECTORS) || input(PASSWORD_INPUT_SELECTORS) || input(OTP_INPUT_SELECTORS))) {
        const reauth = await send({ type: "ACCOUNT_AUTOMATION_REAUTH", jobId: job.id })
        if (!reauth.ok) throw new Error(reauth.error ?? "Sign in to this account again.")
        return
      }
      if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) throw new Error("The selected store did not finish loading. Review this window or cancel and retry.")
      setWorkflowStatus("Opening and checking the selected store…")
      scheduleRun(1000)
      return
    }
    if (manualSignIn) {
      if (hasAuthenticatedSellerUi() || location.pathname.startsWith("/account-switcher/")) {
        const completed = await send({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id })
        if (!completed.ok) throw new Error(completed.error ?? "Couldn’t open the selected store.")
      } else scheduleRun(1500)
      return
    }
    if (hasAuthError()) {
      await failWorkflow(job.id, "Amazon rejected the login details. Review the page or edit the saved account.")
      return
    }

    // Never fill credentials on Amazon's logout re-auth (return_to=sign-out); wait for canonical sign-in navigation.
    if (stage === "logout" || leavingLogout) {
      if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) {
        throw new Error("Amazon did not finish signing out. Cancel the switch and try again.")
      }
      setWorkflowStatus("Signing out of the current Seller Central account…")
      if (!leavingLogout && (onLogoutIntercept() || document.readyState === "complete")) {
        await leaveLogout(job.id)
      } else if (document.readyState !== "complete" && !waitingForLoad) {
        waitingForLoad = true
        window.addEventListener("load", () => scheduleRun(0), { once: true })
      }
      scheduleRun(1000)
      return
    }

    const email = input(EMAIL_INPUT_SELECTORS)
    if (email) {
      if (!prepareStage("email", "Amazon’s Continue button did not advance the login.")) return
      setWorkflowStatus("Entering the saved account email…")
      const value = await requestSecret(job.id, "email")
      if (!value) return
      fill(email, value)
      const next = button(["#continue", 'input[name="continue"]'], /continue/iu)
      await activate(job.id, next, "continue", "Amazon’s Continue button was not found.")
      markStageSubmitted("email")
      return
    }

    const password = input(PASSWORD_INPUT_SELECTORS)
    if (password) {
      if (!prepareStage("password", "Amazon’s password button did not advance the login.")) return
      setWorkflowStatus("Entering the saved password…")
      const value = await requestSecret(job.id, "password")
      if (!value) return
      fill(password, value)
      const submit = button(["#signInSubmit", 'input[name="signIn"]', 'button[type="submit"]'], /sign in|next|continue/iu)
      await activate(job.id, submit, "password-submit", "Amazon’s password submit button was not found.")
      markStageSubmitted("password")
      return
    }

    const otp = input(OTP_INPUT_SELECTORS)
    if (otp) {
      if (!prepareStage("otp", "Amazon’s verification-code button did not advance the login.")) return
      setWorkflowStatus("Generating and entering a fresh verification code…")
      const value = await requestSecret(job.id, "otp")
      if (!value) return
      fill(otp, value)
      const submit = button(["#auth-signin-button", 'input[type="submit"]', 'button[type="submit"]'], /sign in|submit|continue/iu)
      await activate(job.id, submit, "otp-submit", "Amazon’s verification-code submit button was not found.")
      markStageSubmitted("otp")
      return
    }

    if (isReadyForStoreNavigation() && (job.stage === "paused" || shouldCompleteAuthenticatedSession(stage))) {
      setWorkflowStatus("Signed in. Opening the selected store…")
      const completed = await send({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id })
      if (!completed.ok) throw new Error(completed.error ?? "Couldn’t open the selected store.")
      return
    }

    if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) throw new Error("Amazon’s login page did not match a supported step.")
    if (reportedWaitingPath !== location.pathname) {
      // An unrecognized page is the first sign that Amazon changed its login flow.
      reportedWaitingPath = location.pathname
      automationLog.withRun(job.id).info("automation.waiting", { stage: job.stage, path: location.pathname, title: document.title })
    }
    setWorkflowStatus("Waiting for Amazon’s next login step…")
    scheduleRun(1000)
  } catch (error) {
    await failWorkflow(job.id, error)
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.id) setLogSink(forwardLogsToBackground())
void run()
