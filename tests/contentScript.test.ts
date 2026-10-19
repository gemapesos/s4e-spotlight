import { afterEach, describe, expect, it, vi } from "vitest"

import { canHostPalette, handleContentKeyDown, handleContentMessage, loadPalette } from "../src/content"
import { setLogSink, type LogEntry } from "../src/lib/log"

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

  it("warms the palette on a modifier key without opening", () => {
    const setOpen = vi.fn()
    const load = vi.fn(async () => ({ setOpen }))

    handleContentKeyDown(
      new KeyboardEvent("keydown", { key: "Meta", metaKey: true }),
      load,
    )

    expect(load).toHaveBeenCalledOnce()
    expect(setOpen).not.toHaveBeenCalled()
  })

  it("swallows a palette warm after the extension context is invalidated", async () => {
    const load = vi.fn().mockRejectedValue(new Error("Extension context invalidated."))

    handleContentKeyDown(
      new KeyboardEvent("keydown", { key: "Meta", metaKey: true }),
      load,
    )

    await vi.waitFor(() => expect(load).toHaveBeenCalledOnce())
  })

  it("opens the palette on the shortcut after warming", async () => {
    const setOpen = vi.fn()
    const load = vi.fn(async () => ({ setOpen }))

    handleContentKeyDown(
      new KeyboardEvent("keydown", { key: "Meta", metaKey: true }),
      load,
    )
    handleContentKeyDown(
      new KeyboardEvent("keydown", { code: "Slash", key: "/", metaKey: true, cancelable: true }),
      load,
    )

    expect(load).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => expect(setOpen).toHaveBeenCalledWith(true))
  })

  it("fetches unfulfillable listings from Seller Central", async () => {
    document.head.insertAdjacentHTML("beforeend", '<meta name="anti-csrftoken-a2z" content="csrf-token">')
    const listing = {
      coreListingFields: { sku: "ABC-123", asin: "B00TEST", fnSku: "X00TEST" },
      listingData: { title: "Test listing", lastUpdated: "08/15/2026 01:00:00" },
      status: { status: "ACTIVE" },
      availability: {
        unfulfillable: 1,
        unfulfillableDetails: {
          expired: 0,
          damagedByCarrier: 1,
          damagedByCustomer: 0,
          damagedByDistributor: 0,
          damagedByWarehouse: 0,
          defective: 0,
        },
      },
      offers: [{ price: { price: { amount: "9.99", currencyUnit: "USD" } } }],
    }
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/recovery/inventories")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            lineItems: [{
              merchantSku: "ABC-123",
              fulfillmentNetworkSku: "X00TEST",
              totalUnsellableQuantity: 1,
              unsellableIneligibleQuantity: 0,
              unsellableIneligibleQuantities: [],
            }],
          }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { listingsV2: { listings: [listing], count: 1, cursor: null } } }),
      }
    })
    vi.stubGlobal("fetch", fetchImpl)
    const sendResponse = vi.fn()

    try {
      expect(handleContentMessage(
        { type: "REPORTS_FETCH_UNFULFILLABLE" },
        {} as chrome.runtime.MessageSender,
        sendResponse,
      )).toBe(true)

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        listings: [{
          ...listing,
          removal: [{ label: "Total available for removal", quantity: 1 }],
        }],
        nextRemovalOrderId: null,
      }))
      expect(fetchImpl).toHaveBeenCalledTimes(3)
    } finally {
      document.querySelectorAll('meta[name="anti-csrftoken-a2z"]').forEach((node) => node.remove())
      vi.unstubAllGlobals()
    }
  })

  it("fetches neutral and negative seller feedback from Seller Central", async () => {
    const feedback = {
      feedbackId: "A1JYWNJI6O4TQ1",
      orderId: "112-6224287-0679468",
      numericRating: 1,
      feedbackText: "Why has it not been credited?",
      feedbackDate: "2026-08-03T19:22:21.216Z",
      suppressed: false,
      partiallySuppressed: false,
    }
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ feedbacks: [feedback], lastPage: true, pageNumber: 0 }),
    }))
    vi.stubGlobal("fetch", fetchImpl)
    const sendResponse = vi.fn()

    try {
      expect(handleContentMessage(
        { type: "REPORTS_FETCH_FEEDBACK" },
        {} as chrome.runtime.MessageSender,
        sendResponse,
      )).toBe(true)

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        feedbacks: [feedback],
      }))
      // The newest page, and the oldest-first page asked for alongside it.
      expect(fetchImpl).toHaveBeenCalledTimes(2)
      expect(fetchImpl).toHaveBeenCalledWith(
        expect.stringContaining("/fbmapi/v1/feedbacks"),
        expect.objectContaining({ method: "GET", credentials: "include" }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("fetches stranded listings from Seller Central HTML", async () => {
    const html = `<!doctype html><html><body>
<div class="mt-header-count"><span id="mt-header-count-value">1</span> product(s)</div>
<span data-stranded-filter-changed="{&quot;filterId&quot;:&quot;ERR_NO_PRICE&quot;,&quot;filterReadableValue&quot;:&quot;Missing price&quot;,&quot;filterGroupId&quot;:&quot;stranded_reason&quot;}"></span>
<table><tbody><tr class="mt-row" data-row-data="{&quot;SKU&quot;:&quot;ABC-123&quot;,&quot;ASIN&quot;:&quot;B00TEST&quot;,&quot;FNSKU&quot;:&quot;X00TEST&quot;,&quot;ProductName&quot;:&quot;Test listing&quot;,&quot;Condition&quot;:&quot;New&quot;,&quot;Status&quot;:&quot;Incomplete&quot;,&quot;Price&quot;:&quot;0.0&quot;,&quot;PriceUnit&quot;:&quot;USD&quot;,&quot;Available&quot;:&quot;1&quot;,&quot;TotalQuantity&quot;:&quot;1&quot;,&quot;Reserved&quot;:&quot;0&quot;,&quot;Inbound&quot;:&quot;0&quot;,&quot;Unfulfillable&quot;:&quot;0&quot;,&quot;DateStranded&quot;:&quot;1786498521898&quot;,&quot;StrandedReason&quot;:&quot;ERR_NO_PRICE&quot;,&quot;StrandedReasonCode&quot;:&quot;ERR_NO_PRICE&quot;,&quot;FulfilledBy&quot;:&quot;Amazon&quot;,&quot;Program&quot;:&quot;&quot;,&quot;SupportedActions&quot;:&quot;EditListing#RemovalOrder&quot;}"></tr></tbody></table>
</body></html>`
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => html,
    }))
    vi.stubGlobal("fetch", fetchImpl)
    const sendResponse = vi.fn()

    try {
      expect(handleContentMessage(
        { type: "REPORTS_FETCH_STRANDED" },
        {} as chrome.runtime.MessageSender,
        sendResponse,
      )).toBe(true)

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        listings: [expect.objectContaining({
          SKU: "ABC-123",
          ASIN: "B00TEST",
          StrandedReasonCode: "ERR_NO_PRICE",
          StrandedReasonLabel: "Missing price",
        })],
      }))
      expect(fetchImpl).toHaveBeenCalledWith(
        "https://sellercentral.amazon.com/inventoryplanning/stranded-inventory",
        expect.objectContaining({ method: "GET", credentials: "include" }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("fetches search-suppressed listings from Seller Central", async () => {
    document.head.insertAdjacentHTML("beforeend", '<meta name="anti-csrftoken-a2z" content="csrf-token">')
    const listing = {
      coreListingFields: { sku: "STOCK-SKU", asin: "B0STOCK", fnSku: "X00STOCK" },
      listingData: { title: "In-stock suppressed towel" },
      status: { status: "SEARCH_SUPPRESSED", inlineAction: "FIX_LISTING_SUPPRESSION" },
      availability: { quantity: 12 },
      offers: [{ price: { price: { amount: "16.99", currencyUnit: "USD" } } }],
    }
    const issue = {
      localizedIssueMessage: "'Product Description' is required but missing.",
      type: "CVS_MISSING_REQUIRED_ATTRIBUTE",
      tags: ["MISSING_PRODUCT_ATTRIBUTE"],
      enforcementActions: ["index_suppressed", "quarantined"],
      issueSource: "Item",
      parameters: [{ key: "v3_flat_attribute_name", value: "product_description" }],
    }
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = typeof init?.body === "string" ? JSON.parse(init.body) as { operationName?: string } : {}
      if (body.operationName === "getListingIssuesActionsForSku") {
        return {
          ok: true,
          status: 200,
          json: async () => ({ data: { listingIssuesActions: { issues: [issue] } } }),
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { listingsV2: { listings: [listing, { ...listing, coreListingFields: { sku: "ZERO-SKU" }, availability: { quantity: 0 } }], count: 2 } } }),
      }
    })
    vi.stubGlobal("fetch", fetchImpl)
    const sendResponse = vi.fn()

    try {
      expect(handleContentMessage(
        { type: "REPORTS_FETCH_SUPPRESSED" },
        {} as chrome.runtime.MessageSender,
        sendResponse,
      )).toBe(true)

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        listings: [{ ...listing, issues: [issue] }],
      }))
      expect(fetchImpl).toHaveBeenCalledWith(
        "https://sellercentral.amazon.com/myinventory/gql",
        expect.objectContaining({ method: "POST", credentials: "include" }),
      )
    } finally {
      document.querySelectorAll('meta[name="anti-csrftoken-a2z"]').forEach((node) => node.remove())
      vi.unstubAllGlobals()
    }
  })

  it("fetches shipments from Seller Central shipping queue API", async () => {
    const rawShipments = [
      {
        shipmentName: "FBA STA (09/29/2026 15:25)-HGR6",
        shipmentId: "FBA19RKC646S",
        destinationFC: "HGR6",
        shipmentStatus: "CLOSED",
        createdDate: 1790695510000,
        lastUpdatedDate: 1791563619000,
      },
    ]
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => rawShipments,
    }))
    vi.stubGlobal("fetch", fetchImpl)
    const sendResponse = vi.fn()

    try {
      expect(handleContentMessage(
        { type: "REPORTS_FETCH_SHIPPING_QUEUE" },
        {} as chrome.runtime.MessageSender,
        sendResponse,
      )).toBe(true)

      await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
        ok: true,
        shipments: [expect.objectContaining({
          shipmentName: "FBA STA (09/29/2026 15:25)-HGR6",
          shipmentId: "FBA19RKC646S",
          destinationFC: "HGR6",
          shipmentStatus: "CLOSED",
        })],
      }))
      expect(fetchImpl).toHaveBeenCalledWith(
        expect.stringContaining("https://sellercentral.amazon.com/fba/shippingqueue/api/v1/shipment/listShipments"),
        expect.objectContaining({ method: "GET", credentials: "include" }),
      )
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("content script report logging", () => {
  afterEach(() => {
    setLogSink(null)
    vi.unstubAllGlobals()
  })

  it("logs each source with its run, item count, and request timings", async () => {
    const entries: LogEntry[] = []
    setLogSink((entry) => entries.push(entry))
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503, text: async () => "" })))
    const sendResponse = vi.fn()

    handleContentMessage({ type: "REPORTS_FETCH_STRANDED", runId: "report-7" }, {} as chrome.runtime.MessageSender, sendResponse)

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({
      ok: false,
      error: "Couldn’t load stranded inventory (503).",
    }))
    const fetchEntry = entries.find((entry) => entry.event === "report.fetch")
    expect(fetchEntry).toMatchObject({
      level: "error",
      ctx: "content",
      run: "report-7",
      data: {
        source: "stranded",
        requests: { "GET /inventoryplanning/stranded-inventory": expect.objectContaining({ n: 1, failed: 1 }) },
      },
    })
    expect(fetchEntry?.ms).toBeTypeOf("number")
  })
})

describe("palette host page", () => {
  afterEach(() => {
    setLogSink(null)
    vi.unstubAllGlobals()
  })

  it("hosts the palette only on HTML documents", () => {
    const parser = new DOMParser()
    expect(canHostPalette(document)).toBe(true)
    expect(canHostPalette(parser.parseFromString("<rss><channel/></rss>", "application/xml"))).toBe(false)
    expect(canHostPalette(parser.parseFromString('<svg xmlns="http://www.w3.org/2000/svg"/>', "image/svg+xml"))).toBe(false)
  })

  it("refuses to load the palette on an XML page without importing it", async () => {
    const getURL = vi.fn()
    vi.stubGlobal("chrome", { runtime: { id: "extension", getURL } })
    const feed = new DOMParser().parseFromString("<rss/>", "application/xml")

    await expect(loadPalette(feed)).rejects.toThrow("The command palette can’t open on this page.")
    expect(getURL).not.toHaveBeenCalled()
  })

  it("logs the page's content type when the palette fails to load", async () => {
    const entries: LogEntry[] = []
    setLogSink((entry) => entries.push(entry))
    vi.stubGlobal("chrome", { runtime: { id: "extension", getURL: (path: string) => `/__missing__/${path}` } })

    await expect(loadPalette()).rejects.toThrow()
    expect(entries).toContainEqual(expect.objectContaining({
      level: "error",
      event: "palette.loadFailed",
      data: expect.objectContaining({ contentType: "text/html" }),
    }))
  })
})
