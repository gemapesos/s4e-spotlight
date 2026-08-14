import { afterEach, describe, expect, it, vi } from "vitest"

import { handleContentMessage } from "../src/content"

function makeVisible() {
  vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body)
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe("content script report messages", () => {
  it("reports a live Seller Central store session", () => {
    document.body.innerHTML = '<nav id="sc-top-nav-root"><a href="/home">Home</a></nav>'
    makeVisible()
    const sendResponse = vi.fn()

    expect(handleContentMessage({ type: "REPORTS_SESSION_STATUS" }, {} as chrome.runtime.MessageSender, sendResponse)).toBeUndefined()
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, loggedInToStore: true, settled: true })
  })

  it("opens the palette on the report sign-in screen", async () => {
    const setOpen = vi.fn()
    const sendResponse = vi.fn()
    const load = vi.fn(async () => ({ setOpen }))

    expect(handleContentMessage(
      { type: "OPEN_PALETTE", mode: "report-login" },
      {} as chrome.runtime.MessageSender,
      sendResponse,
      load,
    )).toBe(true)

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true }))
    expect(setOpen).toHaveBeenCalledWith(true, "report-login")
  })
})
