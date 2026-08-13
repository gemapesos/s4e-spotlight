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
  const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
    if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
    if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: secret }
    return { ok: true }
  })
  vi.stubGlobal("chrome", { runtime: { sendMessage } })
  vi.resetModules()
  await import("../src/" + "accountAutomation")
  await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNT_AUTOMATION_CLICK" })))
  return sendMessage
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
})

describe("Seller Central account automation", () => {
  it("fills the observed email form and requests a trusted center click", async () => {
    const sendMessage = await loadAutomation(
      '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>',
      "operator@example.test",
    )

    expect(document.querySelector<HTMLInputElement>("#ap_email")?.value).toBe("operator@example.test")
    expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNT_AUTOMATION_CLICK",
      jobId: "job-1",
      action: "continue",
      x: 250,
      y: 220,
    })
  })

  it.each([
    {
      name: "password",
      html: '<button type="button">Cancel</button><input id="ap_password" type="password"><input id="signInSubmit" type="submit" value="Sign in">',
      secret: "example-password",
      actions: ["passkey-cancel", "password-submit"],
    },
    {
      name: "OTP",
      html: '<input id="auth-mfa-otpcode" autocomplete="one-time-code"><input id="auth-signin-button" type="submit" value="Sign in">',
      secret: "123456",
      actions: ["otp-submit"],
    },
  ])("uses trusted clicks for the $name stage", async ({ html, secret, actions }) => {
    const sendMessage = await loadAutomation(html, secret)
    await vi.waitFor(() => {
      const trustedActions = sendMessage.mock.calls
        .map(([message]) => message)
        .filter((message) => message.type === "ACCOUNT_AUTOMATION_CLICK")
        .map((message) => message.action)
      expect(trustedActions).toEqual(actions)
    })
  })

  it("retries a stalled Continue once, then reports a specific error", async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<form><input id="ap_email" type="email"><input id="continue" type="submit" value="Continue"></form>'
    makeVisible()
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNT_AUTOMATION_GET_JOB") return { ok: true, job }
      if (message.type === "ACCOUNT_AUTOMATION_SECRET") return { ok: true, value: "operator@example.test" }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.resetModules()
    await import("../src/" + "accountAutomation")
    await vi.advanceTimersByTimeAsync(0)

    const clickCount = () => sendMessage.mock.calls.filter(([message]) => message.type === "ACCOUNT_AUTOMATION_CLICK").length
    expect(clickCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(clickCount()).toBe(2)
    await vi.advanceTimersByTimeAsync(5_000)
    expect(clickCount()).toBe(2)
    expect(document.querySelector("#s4e-account-switch-status")).toHaveTextContent("Amazon’s Continue button did not advance the login.")
    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNT_AUTOMATION_ERROR", jobId: "job-1" })
  })
})
