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
  job?: { id: string; stage: string } | null
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

async function activate(
  jobId: string,
  element: HTMLElement | null,
  action: ClickAction,
  missingMessage: string,
): Promise<void> {
  if (!element) throw new Error(missingMessage)
  if (!visible(element)) throw new Error(`${missingMessage} The control is not visible.`)
  const rect = element.getBoundingClientRect()
  const finite = [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
  if (!finite || rect.width <= 0 || rect.height <= 0) {
    throw new Error(`${missingMessage} The control has invalid click coordinates.`)
  }
  const response = await send({
    type: "ACCOUNT_AUTOMATION_CLICK",
    jobId,
    action,
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  })
  if (!response.ok) throw new Error(response.error ?? "Chrome could not activate Amazon’s login control.")
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
  if ((attempts.get(stage) ?? 0) >= MAX_ATTEMPTS) throw new Error(failureMessage)
  inFlight = null
  return true
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
  await send({ type: "ACCOUNT_AUTOMATION_ERROR", jobId, error: message })
}

function onLogoutIntercept(): boolean {
  return location.pathname.startsWith("/ap/")
    || location.pathname.includes("signin")
    || Boolean(input(EMAIL_INPUT_SELECTORS) || input(PASSWORD_INPUT_SELECTORS) || input(OTP_INPUT_SELECTORS))
}

async function run(): Promise<void> {
  const response = await send({ type: "ACCOUNT_AUTOMATION_GET_JOB" })
  const job = response.job
  if (!response.ok || !job) return

  try {
    if (hasCaptcha()) {
      setWorkflowStatus("Amazon needs you to complete the CAPTCHA. Automation will resume afterward.")
      if (!attempts.has("captcha")) {
        attempts.set("captcha", 1)
        await send({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId: job.id })
      }
      scheduleRun(1500)
      return
    }
    if (hasAuthError()) {
      await failWorkflow(job.id, "Amazon rejected the login details. Review the page or edit the saved account.")
      return
    }

    // Never fill credentials on Amazon's logout re-auth (return_to=sign-out); wait for canonical sign-in navigation.
    if (job.stage === "logout" || leavingLogout) {
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

    if (isReadyForStoreNavigation() && shouldCompleteAuthenticatedSession(job.stage)) {
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
