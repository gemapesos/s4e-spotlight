import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  prepareReports,
  SELLER_CENTRAL_HOME_URL,
  SELLER_CENTRAL_TAB_URL_PATTERN,
} from "../src/background"

describe("Generate Reports Seller Central preflight", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; loggedInToStore?: boolean; settled?: boolean }> => ({
    ok: true,
    loggedInToStore: true,
    settled: true,
  }))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, loggedInToStore: true, settled: true })
    focusWindow.mockReset(); focusWindow.mockResolvedValue({})
    addUpdatedListener.mockReset()
    removeUpdatedListener.mockReset()
    vi.stubGlobal("chrome", {
      tabs: {
        create,
        update,
        query,
        get,
        sendMessage,
        onUpdated: { addListener: addUpdatedListener, removeListener: removeUpdatedListener },
      },
      windows: { update: focusWindow },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it("focuses an existing Seller Central tab and reports a store session", async () => {
    query.mockResolvedValue([
      { id: 11, windowId: 2, lastAccessed: 200 } as chrome.tabs.Tab,
      { id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
    ])
    get.mockResolvedValue({ id: 22, status: "complete", url: "https://sellercentral.amazon.com/home" } as chrome.tabs.Tab)
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(prepareReports(sender)).resolves.toEqual({
      ok: true,
      loggedInToStore: true,
      sellerCentralTabId: 22,
    })
    expect(query).toHaveBeenCalledWith({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
    expect(update).toHaveBeenCalledWith(22, { active: true })
    expect(focusWindow).toHaveBeenCalledWith(4, { focused: true })
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_SESSION_STATUS" })
    expect(create).not.toHaveBeenCalled()
  })

  it("opens Seller Central when no matching tab exists", async () => {
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(prepareReports(sender)).resolves.toEqual({
      ok: true,
      loggedInToStore: true,
      sellerCentralTabId: 91,
    })
    expect(create).toHaveBeenCalledWith({ active: true, url: SELLER_CENTRAL_HOME_URL, windowId: 4 })
    expect(update).not.toHaveBeenCalled()
  })

  it("waits for a newly opened tab to finish loading", async () => {
    get.mockResolvedValue({ id: 91, status: "loading", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    addUpdatedListener.mockImplementation((listener: (tabId: number, changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab) => void) => {
      listener(91, { status: "complete" }, { id: 91, url: "https://sellercentral.amazon.com/home" } as chrome.tabs.Tab)
    })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(prepareReports(sender)).resolves.toMatchObject({ loggedInToStore: true, sellerCentralTabId: 91 })
    expect(addUpdatedListener).toHaveBeenCalledOnce()
    expect(removeUpdatedListener).toHaveBeenCalledOnce()
  })

  it("keeps the prompt on the current tab when Seller Central is not signed in to a store", async () => {
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: "https://sellercentral.amazon.com/ap/signin" } as chrome.tabs.Tab)
    sendMessage.mockResolvedValue({ ok: true, loggedInToStore: false, settled: true })
    const sender = { id: 22, windowId: 4 } as chrome.tabs.Tab

    await expect(prepareReports(sender)).resolves.toEqual({
      ok: true,
      loggedInToStore: false,
      sellerCentralTabId: 22,
    })
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_SESSION_STATUS" })
    expect(sendMessage).not.toHaveBeenCalledWith(22, expect.objectContaining({ type: "OPEN_PALETTE" }))
  })

  it("opens the palette on Seller Central when launched from another page without a store session", async () => {
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: "https://sellercentral.amazon.com/ap/signin" } as chrome.tabs.Tab)
    sendMessage
      .mockResolvedValueOnce({ ok: true, loggedInToStore: false, settled: true })
      .mockResolvedValueOnce({ ok: true })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(prepareReports(sender)).resolves.toEqual({
      ok: true,
      loggedInToStore: false,
      sellerCentralTabId: 22,
      openedPromptOnSellerCentral: true,
    })
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "OPEN_PALETTE", mode: "report-login" })
  })
})
