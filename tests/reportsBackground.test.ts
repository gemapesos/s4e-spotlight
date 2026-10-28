import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  createBulkRemoval,
  ensureSellerCentralTab,
  focusBulkRemovalTab,
  SELLER_CENTRAL_HOME_URL,
  SELLER_CENTRAL_TAB_URL_PATTERN,
  waitForTabComplete,
} from "../src/background"

describe("Seller Central tab", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()
  const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    focusWindow.mockReset(); focusWindow.mockResolvedValue({})
    addUpdatedListener.mockReset()
    removeUpdatedListener.mockReset()
    vi.stubGlobal("chrome", {
      tabs: { create, update, query, get, onUpdated: { addListener: addUpdatedListener, removeListener: removeUpdatedListener } },
      windows: { update: focusWindow },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it("reuses the Seller Central tab in the sender's window without focusing it", async () => {
    query.mockResolvedValue([
      { id: 11, windowId: 2, lastAccessed: 200 } as chrome.tabs.Tab,
      { id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
    ])

    await expect(ensureSellerCentralTab(sender, { focus: false })).resolves.toEqual({ tabId: 22 })
    expect(query).toHaveBeenCalledWith({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
    expect(update).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it("opens Seller Central in the sender's window when no tab matches", async () => {
    await expect(ensureSellerCentralTab(sender, { focus: false })).resolves.toEqual({ tabId: 91, opened: true })
    expect(create).toHaveBeenCalledWith({ active: true, url: SELLER_CENTRAL_HOME_URL, windowId: 4 })
    expect(update).not.toHaveBeenCalled()
  })

  it("opens only one Seller Central tab when five callers race", async () => {
    let created = false
    query.mockImplementation(async () => (
      created ? [{ id: 91, windowId: 4, lastAccessed: 1 } as chrome.tabs.Tab] : []
    ))
    create.mockImplementation(async () => {
      created = true
      return { id: 91, windowId: 4 }
    })

    await Promise.all(Array.from({ length: 5 }, () => ensureSellerCentralTab(sender, { focus: false })))

    expect(create).toHaveBeenCalledOnce()
  })

  it("waits for a newly opened tab to finish loading", async () => {
    get.mockResolvedValue({ id: 91, status: "loading", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    addUpdatedListener.mockImplementation((listener: (tabId: number, changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab) => void) => {
      listener(91, { status: "complete" }, { id: 91, url: "https://sellercentral.amazon.com/home" } as chrome.tabs.Tab)
    })

    await waitForTabComplete(91)
    expect(addUpdatedListener).toHaveBeenCalledOnce()
    expect(removeUpdatedListener).toHaveBeenCalledOnce()
  })
})

describe("Bulk removal", () => {
  const sendMessage = vi.fn(async (): Promise<Record<string, unknown>> => ({ ok: true, loggedInToStore: true, settled: true }))
  const createTab = vi.fn(async (properties: chrome.tabs.CreateProperties) => ({ id: 31, ...properties } as chrome.tabs.Tab))
  const update = vi.fn(async (tabId: number) => ({ id: tabId, windowId: 4 } as chrome.tabs.Tab))
  const windowsUpdate = vi.fn(async () => ({}))
  let session: Record<string, unknown>
  const sender = { id: 7, windowId: 4, index: 2 } as chrome.tabs.Tab

  beforeEach(() => {
    session = {}
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, loggedInToStore: true, settled: true })
    createTab.mockClear(); update.mockClear(); windowsUpdate.mockClear()
    vi.stubGlobal("chrome", {
      tabs: {
        create: vi.fn(),
        update,
        query: vi.fn(async () => [{ id: 22, windowId: 4, lastAccessed: 100 }]),
        get: vi.fn(async () => ({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL })),
        sendMessage,
        onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      windows: { update: windowsUpdate },
      storage: {
        session: {
          get: vi.fn(async (key: string) => (key in session ? { [key]: session[key] } : {})),
          set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(session, items) }),
          remove: vi.fn(async (key: string) => { delete session[key] }),
        },
      },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it("opens one background tab beside the palette with only the removable SKUs", async () => {
    sendMessage
      .mockResolvedValueOnce({ ok: true, loggedInToStore: true, settled: true })
      .mockResolvedValueOnce({
        ok: true,
        items: [{ sku: "CC10", asin: "A1", fnSku: "F1", removableUnits: 3 }],
        skipped: [{ sku: "TYPO", reason: "Not in unfulfillable inventory" }],
        nextRemovalOrderId: "S4EJM0013",
        eligibilityUnknown: false,
      })

    const result = await createBulkRemoval([" CC10 ", "TYPO", "CC10", 5], sender, createTab)

    expect(sendMessage).toHaveBeenCalledWith(22, { type: "BULK_REMOVAL_RESOLVE", skus: ["CC10", "TYPO"] }, { frameId: 0 })
    expect(createTab).toHaveBeenCalledTimes(1)
    expect(createTab).toHaveBeenCalledWith({
      url: expect.stringMatching(/^https:\/\/sellercentral\.amazon\.com\/recovery\/requests\/redirect\/removal-order\?mSku\.0=CC10&fnSku\.0=F1&asin\.0=A1&/),
      active: false,
      windowId: 4,
      index: 3,
    })
    // The palette runs on any web page, so it gets no ASINs or FNSKUs back.
    expect(result).toEqual({
      ok: true,
      openedCount: 1,
      skipped: [{ sku: "TYPO", reason: "Not in unfulfillable inventory" }],
      nextRemovalOrderId: "S4EJM0013",
      eligibilityUnknown: false,
    })

    await expect(focusBulkRemovalTab(sender)).resolves.toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith(31, { active: true })
    expect(windowsUpdate).toHaveBeenCalledWith(4, { focused: true })
  })

  it("still finds the removal tab after Chrome restarts the idle service worker", async () => {
    sendMessage
      .mockResolvedValueOnce({ ok: true, loggedInToStore: true, settled: true })
      .mockResolvedValueOnce({ ok: true, items: [{ sku: "CC10", asin: "A1", fnSku: "F1", removableUnits: 3 }], skipped: [], nextRemovalOrderId: null })
    await createBulkRemoval(["CC10"], sender, createTab)

    vi.resetModules()
    const restarted = await import("../src/background")

    await expect(restarted.focusBulkRemovalTab(sender)).resolves.toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith(31, { active: true })
  })

  it("opens nothing when no SKU can be removed", async () => {
    sendMessage
      .mockResolvedValueOnce({ ok: true, loggedInToStore: true, settled: true })
      .mockResolvedValueOnce({ ok: true, items: [], skipped: [{ sku: "CC10", reason: "Inventory Unavailable" }], nextRemovalOrderId: null })

    await expect(createBulkRemoval(["CC10"], { id: 8, windowId: 4 } as chrome.tabs.Tab, createTab)).resolves.toMatchObject({ openedCount: 0 })
    expect(createTab).not.toHaveBeenCalled()
    await expect(focusBulkRemovalTab({ id: 8 } as chrome.tabs.Tab)).rejects.toThrow("The removal tab is no longer open.")
  })

  it("rejects empty and oversized batches, and runs during a store switch", async () => {
    await expect(createBulkRemoval([], sender, createTab)).rejects.toThrow("Enter at least one SKU.")
    await expect(createBulkRemoval(Array.from({ length: 51 }, (_, index) => `SKU${index}`), sender, createTab)).rejects.toThrow("no more than 50")
    session.accountsActiveJob = { startedAt: Date.now() }
    await expect(createBulkRemoval(["CC10"], sender, createTab)).rejects.toThrow("Wait for the store switch to finish")
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it("stops when the Seller Central tab is not signed in", async () => {
    sendMessage.mockResolvedValue({ ok: true, loggedInToStore: false, settled: true })
    await expect(createBulkRemoval(["CC10"], sender, createTab)).rejects.toThrow("Sign in to Seller Central")
    expect(sendMessage).not.toHaveBeenCalledWith(22, expect.objectContaining({ type: "BULK_REMOVAL_RESOLVE" }), { frameId: 0 })
    expect(createTab).not.toHaveBeenCalled()
  })
})
