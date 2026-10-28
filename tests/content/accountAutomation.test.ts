import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const job = { id: "job-1", stage: "signin" }

function makeVisible(rect = { left: 100, top: 200, width: 300, height: 40 }) {
  vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body)
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    ...rect,
    x: rect.left,
    y: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    toJSON: () => ({}),
  } as DOMRect)
}

async function loadAutomation(html: string, secret: string) {
  document.body.innerHTML = html
  makeVisible()
  vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
  const click = vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => undefined)
  const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
    if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
    if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: secret }
    return { ok: true }
  })
  vi.stubGlobal("chrome", { runtime: { sendMessage } })
  vi.resetModules()
  await import("../../src/content/" + "accountAutomation")
  await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" })))
  return { click, sendMessage }
}

// Each test imports a fresh copy of the script; stop earlier copies from watching this document
// or waking up later and reporting to the next test's chrome stub.
const observers: MutationObserver[] = []
const timers = new Set<number>()
const nativeSetTimeout = globalThis.setTimeout
const nativeClearTimeout = globalThis.clearTimeout
const trackedSetTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
  const id = (nativeSetTimeout as unknown as typeof window.setTimeout)(handler, timeout, ...args)
  timers.add(id)
  return id
}) as typeof setTimeout
const NativeMutationObserver = globalThis.MutationObserver
class TrackedMutationObserver extends NativeMutationObserver {
  constructor(callback: MutationCallback) {
    super(callback)
    observers.push(this)
  }
}

beforeEach(() => {
  vi.stubGlobal("MutationObserver", TrackedMutationObserver)
  vi.stubGlobal("setTimeout", trackedSetTimeout)
  vi.useRealTimers()
  document.body.replaceChildren()
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "complete" })
})

afterEach(() => {
  for (const observer of observers.splice(0)) observer.disconnect()
  for (const id of timers) (nativeClearTimeout as unknown as typeof window.clearTimeout)(id)
  timers.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.replaceChildren()
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "complete" })
  Reflect.deleteProperty(document, "visibilityState")
})

describe("Seller Central account automation", () => {
  it("confirms the loaded store separately from sign-in completion", async () => {
    document.body.innerHTML = '<div id="sc-navtab-home">Target store</div>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "ACCOUNT_AUTOMATION_GET_JOB" ? { ok: true, job: { id: "job-1", stage: "store" } } : { ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: "job-1" }))
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_COMPLETE" }))
  })

  it("waits for the store document to finish loading before confirming it", async () => {
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    Object.defineProperty(document, "readyState", { configurable: true, get: () => "interactive" })
    document.body.innerHTML = '<div id="sc-navtab-home">Target store</div>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "ACCOUNT_AUTOMATION_GET_JOB" ? { ok: true, job: { id: "job-1", stage: "store" } } : { ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.waitFor(() => expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Opening and checking the selected store"))
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_STORE_READY" }))
  })

  it("removes the status overlay from the store page once the switch is confirmed", async () => {
    document.body.innerHTML = '<div id="sc-navtab-home">Target store</div>'
    makeVisible()
    let overlayWhileConfirming: string | null | undefined
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: { id: "job-1", stage: "store" } }
      if (message.type === "ACCOUNT_AUTOMATION_STORE_READY") overlayWhileConfirming = document.querySelector("#s4e-account-switch-status")?.textContent
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: "job-1" }))
    await vi.waitFor(() => expect(document.querySelector("#s4e-account-switch-status")).toBeNull())
    expect(overlayWhileConfirming).toContain("Store loaded")
  })

  it("reports a store page that never loads once, then keeps waiting for manual completion", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = "<main>Choose an account</main>"
    let current: { id: string; stage: string; resumeStage?: string } = { id: "job-1", stage: "store" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: current }
      if (message.type === "ACCOUNT_AUTOMATION_ERROR") current = { id: "job-1", stage: "paused", resumeStage: "store" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(120_000)

    const errors = sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_ERROR")
    expect(errors).toEqual([[{ type: "ACCOUNT_AUTOMATION_ERROR", jobId: "job-1", error: "The selected store did not finish loading. Review this window or cancel and retry." }]])
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("did not finish loading")
    expect(sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_GET_JOB").length).toBeGreaterThan(10)
  })

  it("submits a hidden background sign-in through the page instead of a trusted click", async () => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" })
    document.body.innerHTML = '<form><input id="ap_email" type="email"><span id="continue" class="a-button"><span class="a-button-inner"><input id="continue" class="a-button-input" type="submit"></span></span></form>'
    makeVisible()
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const click = vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => undefined)
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(click.mock.contexts[0]).toBe(document.querySelector("input.a-button-input"))
    expect(document.querySelector<HTMLInputElement>("#ap_email")?.value).toBe("operator@example.test")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" }))
  })

  it("retries a step that stalled while hidden with a trusted click once the window is shown", async () => {
    vi.useFakeTimers()
    let visibility: DocumentVisibilityState = "hidden"
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility })
    document.body.innerHTML = '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>'
    makeVisible()
    vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => undefined)
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(11_000)

    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_ERROR", jobId: "job-1", error: "Amazon’s Continue button did not advance the login." })
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" }))

    visibility = "visible"
    document.dispatchEvent(new Event("visibilitychange"))
    await vi.advanceTimersByTimeAsync(10)
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: "job-1", action: "continue" }))
  })

  it("re-enters sign-in if a same-credential store navigation finds an expired session", async () => {
    vi.stubGlobal("location", { ...window.location, pathname: "/ap/signin" })
    document.body.innerHTML = '<input id="ap_email" type="email">'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "ACCOUNT_AUTOMATION_GET_JOB" ? { ok: true, job: { id: "job-1", stage: "store" } } : { ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_REAUTH", jobId: "job-1" }))
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_SECRET" }))
  })

  it("requests attention for manual verification and preserves a paused store step", async () => {
    vi.useFakeTimers()
    vi.stubGlobal("location", { ...window.location, pathname: "/ap/cvf" })
    document.body.innerHTML = '<main>Approve this sign-in on your phone.</main>'
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "ACCOUNT_AUTOMATION_GET_JOB" ? { ok: true, job: { id: "job-1", stage: "paused", resumeStage: "store" } } : { ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)
    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId: "job-1", reason: "verification" })
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_SECRET" }))
  })

  it("resumes a manually completed sign-in from a paused initial login step", async () => {
    document.body.innerHTML = '<div id="sc-navtab-home">Signed in</div>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "ACCOUNT_AUTOMATION_GET_JOB" ? { ok: true, job: { id: "job-1", stage: "paused", resumeStage: "signin" } } : { ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: "job-1" }))
  })

  it("fills the observed email form and requests a trusted center click", async () => {
    const { click, sendMessage } = await loadAutomation(
      '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>',
      "operator@example.test",
    )

    expect(document.querySelector<HTMLInputElement>("#ap_email")?.value).toBe("operator@example.test")
    expect(click).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNT_AUTOMATION_CLICK",
      jobId: "job-1",
      action: "continue",
      x: 250,
      y: 220,
    })
  })

  async function loadWithBlockedDebugger(extraHtml: string, clickResults: Array<{ ok: boolean; error?: string }>) {
    document.body.innerHTML = `<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>${extraHtml}`
    makeVisible()
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const click = vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => undefined)
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      if (message.type === "ACCOUNT_AUTOMATION_CLICK") return clickResults.shift() ?? { ok: true }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage, id: "ownextension" } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    return { click, sendMessage }
  }

  const blocked = { ok: false, error: "Cannot access a chrome-extension:// URL of different extension" }

  it("leaves another extension's frame intact and explains a debugger conflict", async () => {
    const { click, sendMessage } = await loadWithBlockedDebugger(
      '<iframe id="foreign" src="chrome-extension://otherextension/autofill.html"></iframe><iframe id="own" src="chrome-extension://ownextension/x.html"></iframe>', [blocked],
    )
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_ERROR", error: expect.stringContaining("Its interface was left open") })))
    expect(sendMessage.mock.calls.filter(([m]) => m.type === "ACCOUNT_AUTOMATION_CLICK")).toHaveLength(1)
    expect(document.querySelector("#foreign")).not.toBeNull()
    expect(document.querySelector("#own")).not.toBeNull()
    expect(click).not.toHaveBeenCalled()
  })

  it("fails with a clear message when the blocking extension frame cannot be found", async () => {
    const { click, sendMessage } = await loadWithBlockedDebugger("", [blocked])

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: "ACCOUNT_AUTOMATION_ERROR",
      error: expect.stringContaining("Another Chrome extension is preventing"),
    })))
    expect(sendMessage.mock.calls.filter(([m]) => m.type === "ACCOUNT_AUTOMATION_CLICK")).toHaveLength(1)
    expect(click).not.toHaveBeenCalled()
  })

  it("waits during logout even when Amazon shows a re-auth email form", async () => {
    document.body.innerHTML = '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>'
    makeVisible()
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const logoutJob = { id: "job-1", stage: "logout" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: logoutJob }
      if (message.type === "ACCOUNT_AUTOMATION_LEAVE_LOGOUT") return { ok: true }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: "job-1" }))
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signing out")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_SECRET" }))
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" }))
    expect(document.querySelector<HTMLInputElement>("#ap_email")?.value).toBe("")
  })

  it.each([
    {
      name: "password",
      html: '<input id="ap_password" type="password"><input id="signInSubmit" type="submit" value="Sign in">',
      secret: "example-password",
      actions: ["password-submit"],
    },
    {
      name: "OTP",
      html: '<input id="auth-mfa-otpcode" autocomplete="one-time-code"><input id="auth-signin-button" type="submit" value="Sign in">',
      secret: "123456",
      actions: ["otp-submit"],
    },
  ])("uses trusted activation for the $name stage", async ({ html, secret, actions }) => {
    const { click, sendMessage } = await loadAutomation(html, secret)
    await vi.waitFor(() => {
      const trustedActions = sendMessage.mock.calls
        .map(([message]) => message)
        .filter((message) => message.type === "ACCOUNT_AUTOMATION_CLICK")
        .map((message) => message.action)
      expect(trustedActions).toEqual(actions)
    })
    expect(click).not.toHaveBeenCalled()
  })

  it("fills the password and submits directly without passkey dismissal", async () => {
    document.body.innerHTML = '<button type="button">Cancel</button><input id="ap_password" type="password"><input id="signInSubmit" type="submit" value="Sign in">'
    makeVisible()
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const observed: Array<{ type: unknown; action?: unknown; password: string }> = []
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "example-password" }
      observed.push({ type: message.type, action: message.action, password: document.querySelector<HTMLInputElement>("#ap_password")?.value ?? "" })
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    await vi.waitFor(() => expect(observed.map(({ type, action }) => [type, action])).toEqual([
      ["ACCOUNT_AUTOMATION_CLICK", "password-submit"],
    ]))
    expect(observed.every(({ password }) => password === "example-password")).toBe(true)
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Entering the saved password")
  })

  it("retries a stalled Continue once, then reports a specific error", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>'
    makeVisible()
    const click = vi.spyOn(HTMLElement.prototype, "click").mockImplementation(() => undefined)
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)

    expect(click).not.toHaveBeenCalled()
    const clickCount = () => sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_CLICK").length
    expect(clickCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(clickCount()).toBe(2)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(clickCount()).toBe(2)
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Amazon’s Continue button did not advance the login.")
    expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNT_AUTOMATION_ERROR",
      jobId: "job-1",
      error: "Amazon’s Continue button did not advance the login.",
    })
  })

  it("runs the next step as soon as Amazon swaps the form in place, without waiting out the retry timer", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "fixture-value" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)
    const actions = () => sendMessage.mock.calls.map(([message]) => message).filter((message) => message.type === "ACCOUNT_AUTOMATION_CLICK").map((message) => message.action)
    expect(actions()).toEqual(["continue"])

    document.body.innerHTML = '<form><input id="ap_password" type="password"><input id="signInSubmit" type="submit" value="Sign in"></form>'
    await vi.advanceTimersByTimeAsync(200)
    expect(actions()).toEqual(["continue", "password-submit"])
  })

  it("asks for a later verification code once when Amazon rejects the first", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div class="a-alert-error">The code you entered is not valid.</div><input id="auth-mfa-otpcode"><input id="auth-signin-button" type="submit" value="Sign in">'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "123456" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)

    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job-1", kind: "otp", retry: true })
    expect(document.querySelector<HTMLInputElement>("#auth-mfa-otpcode")?.value).toBe("123456")
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Retrying with the next verification code")
    // A second rejection on the same page stops instead of retrying again.
    await vi.advanceTimersByTimeAsync(5_000)
    expect(sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_SECRET")).toHaveLength(1)
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_ERROR" }))
  })

  it("requests a verification code without a retry on a clean code page", async () => {
    document.body.innerHTML = '<input id="auth-mfa-otpcode"><input id="auth-signin-button" type="submit" value="Sign in">'
    const { sendMessage } = await loadAutomation(document.body.innerHTML, "654321")
    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job-1", kind: "otp" })
  })

  it("confirms its login document is open to the background before content.js loads, and leaves other messages alone", async () => {
    const addListener = vi.fn()
    vi.stubGlobal("chrome", {
      runtime: {
        id: "test-extension",
        getURL: (path: string) => `chrome-extension://test-extension/${path}`,
        sendMessage: vi.fn(async () => ({ ok: true, job: null })),
        onMessage: { addListener },
      },
    })
    vi.resetModules()
    const { handleResumeCheck } = await import("../../src/content/" + "accountAutomation")
    expect(addListener).toHaveBeenCalledWith(handleResumeCheck)
    const background = { id: "test-extension", url: "chrome-extension://test-extension/background.js" }
    const reply = vi.fn()

    handleResumeCheck({ type: "ACCOUNTS_RESUME_CHECK" }, background, reply)
    expect(reply).toHaveBeenCalledExactlyOnceWith({ ok: true })
    reply.mockClear()
    handleResumeCheck({ type: "REPORTS_SESSION_STATUS" }, background, reply)
    handleResumeCheck({ type: "ACCOUNTS_RESUME_CHECK" }, { ...background, tab: { id: 4 } as chrome.tabs.Tab }, reply)
    handleResumeCheck({ type: "ACCOUNTS_RESUME_CHECK" }, { id: "other-extension" }, reply)
    expect(reply).not.toHaveBeenCalled()
  })

  it("completes only after login when signed-in Seller Central UI is present", async () => {
    document.body.innerHTML = '<nav id="sc-top-nav-root"><a href="/home">Home</a></nav>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: { id: "job-1", stage: "password" } }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signed in")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: "job-1" }))
  })

  it("recognizes the classic signed-in Seller Central shell", async () => {
    document.body.innerHTML = `
      <a class="logo-container" href="/home" aria-label="Amazon">Amazon</a>
      <input id="sc-search-field" placeholder="Search">
      <a class="button-link" href="/messaging/inbox" aria-label="Messages">Messages</a>
    `
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: { id: "job-1", stage: "password" } }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signed in")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: "job-1" }))
  })

  it("completes from the merchant marketplace account switcher after login", async () => {
    vi.stubGlobal("location", { ...window.location, pathname: "/account-switcher/default/merchantMarketplace", href: "https://sellercentral.amazon.com/account-switcher/default/merchantMarketplace?returnTo=%2Fhome" })
    document.body.innerHTML = "<main>Select an account Loading accounts...</main>"
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signed in")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: "job-1" }))
  })

  it("does not treat the current store shell as a finished login during sign-in", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="sc-navbar-container"><div id="ngstrim-nav-menu"></div></div>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)

    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_COMPLETE" }))
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Waiting for Amazon’s next login step")
  })

  it("leaves a completed logout homepage for canonical sign-in", async () => {
    document.body.innerHTML = "<main>Seller Central</main>"
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const logoutJob = { id: "job-1", stage: "logout" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: logoutJob }
      if (message.type === "ACCOUNT_AUTOMATION_LEAVE_LOGOUT") return { ok: true }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signing out")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: "job-1" }))
  })

  it("waits for a loading logout homepage before leaving", async () => {
    Object.defineProperty(document, "readyState", { configurable: true, get: () => "interactive" })
    document.body.innerHTML = "<main>Seller Central</main>"
    vi.spyOn(window, "setTimeout").mockImplementation(() => undefined as never)
    const logoutJob = { id: "job-1", stage: "logout" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: logoutJob }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Signing out")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT" }))
  })

  it("does not authenticate from only one classic-shell marker", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<a class="logo-container" href="/home" aria-label="Amazon">Amazon</a>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)

    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_COMPLETE" }))
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Waiting for Amazon’s next login step")
  })

  it("does not treat an unknown redirect as authenticated", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = "<main>Unexpected Seller Central page</main>"
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(91_000)

    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_COMPLETE" }))
    expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNT_AUTOMATION_ERROR",
      jobId: "job-1",
      error: "Amazon’s login page did not match a supported step.",
    })
  })

  it("polls a logout page and reports a specific timeout instead of hanging", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = "<main>Signing out</main>"
    const logoutJob = { id: "job-1", stage: "logout" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: logoutJob }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(91_000)

    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Amazon did not finish signing out")
    expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNT_AUTOMATION_ERROR",
      jobId: "job-1",
      error: "Amazon did not finish signing out. Cancel the switch and try again.",
    })
  })

  it("keeps a single polling loop while a logout page loads", async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, "readyState", { configurable: true, get: () => "interactive" })
    document.body.innerHTML = "<main>Signing out</main>"
    const addListener = vi.spyOn(window, "addEventListener")
    const logoutJob = { id: "job-1", stage: "logout" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: logoutJob }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../../src/content/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(5_000)

    const polls = sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_GET_JOB")
    expect(polls.length).toBeGreaterThanOrEqual(5)
    expect(polls.length).toBeLessThanOrEqual(7)
    expect(addListener.mock.calls.filter(([type]) => type === "load")).toHaveLength(1)
  })
})
