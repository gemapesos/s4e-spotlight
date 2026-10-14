import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  fetchFeedbackReport,
  fetchStrandedReport,
  fetchSuppressedReport,
  fetchUnfulfillableReport,
  prepareReports,
  relayReportProgress,
  SELLER_CENTRAL_HOME_URL,
  SELLER_CENTRAL_TAB_URL_PATTERN,
} from "../src/background"

describe("Generate Reports Seller Central preflight", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; loggedInToStore?: boolean; settled?: boolean; listings?: unknown[] }> => ({
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
      storage: {
        local: { get: vi.fn(async () => ({})) },
      },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it("uses an existing Seller Central tab without focusing when a store session is active", async () => {
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
    expect(update).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
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
    get.mockResolvedValue({ id: 22, windowId: 4, status: "complete", url: "https://sellercentral.amazon.com/ap/signin" } as chrome.tabs.Tab)
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
    expect(update).toHaveBeenCalledWith(22, { active: true })
    expect(focusWindow).toHaveBeenCalledWith(4, { focused: true })
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "OPEN_PALETTE", mode: "report-login" })
  })
})

describe("Generate Reports unfulfillable fetch", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; listings?: unknown[]; error?: string }> => ({ ok: true, listings: [] }))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, listings: [] })
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

  it("fetches unfulfillable listings from the current Seller Central tab", async () => {
    const listings = [{ coreListingFields: { sku: "ABC-123" } }]
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockResolvedValue({ ok: true, listings })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(fetchUnfulfillableReport(sender)).resolves.toEqual({ ok: true, listings })
    expect(update).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_FETCH_UNFULFILLABLE" })
  })

  it("waits for the Seller Central tab to finish loading before fetching", async () => {
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "loading", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    addUpdatedListener.mockImplementation((listener: (tabId: number, changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab) => void) => {
      listener(22, { status: "complete" }, { id: 22, url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    })
    sendMessage.mockResolvedValue({ ok: true, listings: [] })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(fetchUnfulfillableReport(sender)).resolves.toEqual({ ok: true, listings: [] })
    expect(update).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_FETCH_UNFULFILLABLE" })
  })
})

describe("Generate Reports feedback fetch", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; feedbacks?: unknown[]; error?: string }> => ({ ok: true, feedbacks: [] }))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, feedbacks: [] })
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

  it("fetches seller feedback from the current Seller Central tab", async () => {
    const feedbacks = [{ feedbackId: "A1JYWNJI6O4TQ1", numericRating: 1 }]
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockResolvedValue({ ok: true, feedbacks })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(fetchFeedbackReport(sender)).resolves.toEqual({ ok: true, feedbacks })
    expect(update).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_FETCH_FEEDBACK" })
  })
})

describe("Generate Reports stranded fetch", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; listings?: unknown[]; error?: string }> => ({ ok: true, listings: [] }))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, listings: [] })
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

  it("fetches stranded listings from the current Seller Central tab", async () => {
    const listings = [{ SKU: "2026-07-24-B0F2KGX1K3-15700", StrandedReasonCode: "ERR_NO_PRICE" }]
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockResolvedValue({ ok: true, listings })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(fetchStrandedReport(sender)).resolves.toEqual({ ok: true, listings })
    expect(update).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_FETCH_STRANDED" })
  })
})

describe("Generate Reports suppressed fetch", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; listings?: unknown[]; error?: string }> => ({ ok: true, listings: [] }))
  const focusWindow = vi.fn(async () => ({}))
  const addUpdatedListener = vi.fn()
  const removeUpdatedListener = vi.fn()

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, listings: [] })
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

  it("fetches search-suppressed listings from the current Seller Central tab", async () => {
    const listings = [{ coreListingFields: { sku: "STOCK-SKU" }, availability: { quantity: 12 } }]
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockResolvedValue({ ok: true, listings })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await expect(fetchSuppressedReport(sender)).resolves.toEqual({ ok: true, listings })
    expect(update).not.toHaveBeenCalled()
    expect(sendMessage).toHaveBeenCalledWith(22, { type: "REPORTS_FETCH_SUPPRESSED" })
  })
})

describe("Generate Reports parallel fetches", () => {
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async () => ({}))
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const get = vi.fn(async (): Promise<chrome.tabs.Tab> => ({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab))
  const sendMessage = vi.fn(async (): Promise<{ ok?: boolean; listings?: unknown[]; feedbacks?: unknown[] }> => ({
    ok: true,
    listings: [],
    feedbacks: [],
  }))
  const focusWindow = vi.fn(async () => ({}))

  beforeEach(() => {
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 })
    update.mockReset(); update.mockResolvedValue({})
    query.mockReset(); query.mockResolvedValue([])
    get.mockReset(); get.mockResolvedValue({ id: 91, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    sendMessage.mockReset(); sendMessage.mockResolvedValue({ ok: true, listings: [], feedbacks: [] })
    focusWindow.mockReset(); focusWindow.mockResolvedValue({})
    vi.stubGlobal("chrome", {
      tabs: {
        create,
        update,
        query,
        get,
        sendMessage,
        onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
      },
      windows: { update: focusWindow },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it("opens only one Seller Central tab when four fetches race", async () => {
    let created = false
    query.mockImplementation(async () => (
      created ? [{ id: 91, windowId: 4, lastAccessed: 1 } as chrome.tabs.Tab] : []
    ))
    create.mockImplementation(async () => {
      created = true
      return { id: 91, windowId: 4 }
    })
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await Promise.all([
      fetchUnfulfillableReport(sender),
      fetchFeedbackReport(sender),
      fetchStrandedReport(sender),
      fetchSuppressedReport(sender),
    ])

    expect(create).toHaveBeenCalledOnce()
  })

  it("forwards report progress to the palette tab that started the fetch", async () => {
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    get.mockResolvedValue({ id: 22, status: "complete", url: SELLER_CENTRAL_HOME_URL } as chrome.tabs.Tab)
    const sender = { id: 7, windowId: 4 } as chrome.tabs.Tab

    await fetchSuppressedReport(sender)
    sendMessage.mockClear()
    await relayReportProgress({ type: "REPORTS_PROGRESS", source: "suppressed", status: "active" })
    expect(sendMessage).toHaveBeenCalledWith(7, { type: "REPORTS_PROGRESS", source: "suppressed", status: "active" })
  })
})
