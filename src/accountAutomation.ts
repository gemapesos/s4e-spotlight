const STATUS_ID = "s4e-account-switch-status"
const documentStartedAt = Date.now()
const attempts = new Map<string, number>()
let inFlight: { stage: string; startedAt: number } | null = null
let leavingLogout = false
const RETRY_DELAY_MS = 5_000
const MAX_ATTEMPTS = 2

type AutomationResponse = { ok: boolean; error?: string; value?: string; waitMs?: number; job?: { id: string; stage: string } | null }

async function send(message: Record<string, unknown>): Promise<AutomationResponse> {
  return chrome.runtime.sendMessage(message) as Promise<AutomationResponse>
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

function visible(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.offsetParent !== null
}

function input(selectors: string[]): HTMLInputElement | null {
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (element instanceof HTMLInputElement && visible(element)) return element
  }
  return null
}

function button(selectors: string[], names: RegExp): HTMLElement | null {
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
  if (
    !Number.isFinite(rect.left) ||
    !Number.isFinite(rect.top) ||
    !Number.isFinite(rect.width) ||
    !Number.isFinite(rect.height) ||
    rect.width <= 0 ||
    rect.height <= 0
  ) {
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
    window.setTimeout(() => void run(), RETRY_DELAY_MS - elapsed)
    return false
  }
  if ((attempts.get(stage) ?? 0) >= MAX_ATTEMPTS) throw new Error(failureMessage)
  inFlight = null
  return true
}

function markStageSubmitted(stage: string): void {
  attempts.set(stage, (attempts.get(stage) ?? 0) + 1)
  inFlight = { stage, startedAt: Date.now() }
  window.setTimeout(() => void run(), RETRY_DELAY_MS)
}

function hasCaptcha(): boolean {
  return Boolean(document.querySelector('iframe[src*="captcha" i], input[name*="captcha" i], #captchacharacters')) || /enter the characters you see|solve this puzzle|captcha/iu.test(document.body?.innerText ?? "")
}

function hasAuthError(): boolean {
  const alert = Array.from(document.querySelectorAll('[role="alert"], .a-alert-error, #auth-error-message-box'))
    .find((element) => element.id !== STATUS_ID && visible(element) && (element.textContent?.trim().length ?? 0) > 0)
  return Boolean(alert)
}

function hasAuthenticatedSellerUi(root: ParentNode = document): boolean {
  const modernShell = [
    "#sc-navtab-home",
    "#sc-top-nav-root",
    '[data-testid="global-nav"]',
  ].some((selector) => visible(root.querySelector(selector)))
  if (modernShell) return true

  const classicShellMarkers = [
    "#sc-search-field",
    'a.logo-container[href="/home"]',
    'a[aria-label="Messages"][href^="/messaging/"]',
  ].filter((selector) => visible(root.querySelector(selector)))

  return classicShellMarkers.length >= 2
}

/** Logged-in enough to open the saved store URL (shell UI or merchant/marketplace picker). */
function isReadyForStoreNavigation(): boolean {
  if (hasAuthenticatedSellerUi()) return true
  return location.pathname.startsWith("/account-switcher/")
}

async function requestSecret(jobId: string, kind: "email" | "password" | "otp"): Promise<string | null> {
  const response = await send({ type: "ACCOUNT_AUTOMATION_SECRET", jobId, kind })
  if (!response.ok) throw new Error(response.error)
  if (response.waitMs) {
    setWorkflowStatus("Waiting for a fresh verification code…")
    window.setTimeout(() => void run(), response.waitMs)
    return null
  }
  return response.value ?? null
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
      window.setTimeout(() => void run(), 1500)
      return
    }
    if (hasAuthError()) {
      setWorkflowStatus("Amazon rejected the login details. Review the page or edit the saved account.", "error")
      await send({ type: "ACCOUNT_AUTOMATION_ERROR", jobId: job.id })
      return
    }

    // Never fill credentials on Amazon's logout re-auth (return_to=sign-out); wait for canonical sign-in navigation.
    if (job.stage === "logout" || leavingLogout) {
      if (Date.now() - documentStartedAt > 90_000) throw new Error("Amazon did not finish signing out. Cancel the switch and try again.")
      setWorkflowStatus("Signing out of the current Seller Central account…")
      const onLogoutIntercept =
        location.pathname.startsWith("/ap/") ||
        location.pathname.includes("signin") ||
        Boolean(input(["#ap_email", 'input[name="email"]', 'input[type="email"]', 'input[autocomplete="username"]'])) ||
        Boolean(input(["#ap_password", 'input[name="password"]', 'input[type="password"]'])) ||
        Boolean(input(["#auth-mfa-otpcode", 'input[name="otpCode"]', 'input[autocomplete="one-time-code"]', 'input[inputmode="numeric"]']))
      if (!leavingLogout && onLogoutIntercept) {
        leavingLogout = true
        const left = await send({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id })
        if (!left.ok) {
          leavingLogout = false
          throw new Error(left.error ?? "Could not leave Amazon’s logout page.")
        }
        return
      }
      window.setTimeout(() => void run(), 1000)
      return
    }

    const email = input(["#ap_email", 'input[name="email"]', 'input[type="email"]', 'input[autocomplete="username"]'])
    if (email) {
      if (!prepareStage("email", "Amazon’s Continue button did not advance the login.")) return
      setWorkflowStatus("Entering the saved account email…")
      const value = await requestSecret(job.id, "email")
      if (!value) return
      fill(email, value)
      await activate(job.id, button(["#continue", 'input[name="continue"]'], /continue/iu), "continue", "Amazon’s Continue button was not found.")
      markStageSubmitted("email")
      return
    }

    const password = input(["#ap_password", 'input[name="password"]', 'input[type="password"]'])
    if (password) {
      if (!prepareStage("password", "Amazon’s password button did not advance the login.")) return
      setWorkflowStatus("Entering the saved password…")
      const value = await requestSecret(job.id, "password")
      if (!value) return
      fill(password, value)
      await activate(job.id, button(["#signInSubmit", 'input[name="signIn"]', 'button[type="submit"]'], /sign in|next|continue/iu), "password-submit", "Amazon’s password submit button was not found.")
      markStageSubmitted("password")
      return
    }

    const otp = input(["#auth-mfa-otpcode", 'input[name="otpCode"]', 'input[autocomplete="one-time-code"]', 'input[inputmode="numeric"]'])
    if (otp) {
      if (!prepareStage("otp", "Amazon’s verification-code button did not advance the login.")) return
      setWorkflowStatus("Generating and entering a fresh verification code…")
      const value = await requestSecret(job.id, "otp")
      if (!value) return
      fill(otp, value)
      await activate(job.id, button(["#auth-signin-button", 'input[type="submit"]', 'button[type="submit"]'], /sign in|submit|continue/iu), "otp-submit", "Amazon’s verification-code submit button was not found.")
      markStageSubmitted("otp")
      return
    }

    if (isReadyForStoreNavigation()) {
      setWorkflowStatus("Signed in. Opening the selected store…")
      const completed = await send({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id })
      if (!completed.ok) throw new Error(completed.error)
      return
    }

    if (Date.now() - documentStartedAt > 90_000) throw new Error("Amazon’s login page did not match a supported step.")
    setWorkflowStatus("Waiting for Amazon’s next login step…")
    window.setTimeout(() => void run(), 1000)
  } catch (error) {
    setWorkflowStatus(error instanceof Error ? error.message : "Account switching failed.", "error")
    await send({ type: "ACCOUNT_AUTOMATION_ERROR", jobId: job.id })
  }
}

void run()
