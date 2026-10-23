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
  await import("../src/" + "accountAutomation")
  await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" })))
  return { click, sendMessage }
}

beforeEach(() => {
  vi.useRealTimers()
  document.body.replaceChildren()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.replaceChildren()
  Object.defineProperty(document, "readyState", { configurable: true, get: () => "complete" })
})

describe("Seller Central account automation", () => {
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
    await import("../src/" + "accountAutomation")
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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")
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

  it("completes only after login when signed-in Seller Central UI is present", async () => {
    document.body.innerHTML = '<nav id="sc-top-nav-root"><a href="/home">Home</a></nav>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job: { id: "job-1", stage: "password" } }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")
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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")

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
    await import("../src/" + "accountAutomation")
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
    await import("../src/" + "accountAutomation")
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
    await import("../src/" + "accountAutomation")
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
    await import("../src/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(5_000)

    const polls = sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_GET_JOB")
    expect(polls.length).toBeGreaterThanOrEqual(5)
    expect(polls.length).toBeLessThanOrEqual(7)
    expect(addListener.mock.calls.filter(([type]) => type === "load")).toHaveLength(1)
  })
})
