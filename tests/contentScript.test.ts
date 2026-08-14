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
      }))
      expect(fetchImpl).toHaveBeenCalledTimes(2)
    } finally {
      document.querySelectorAll('meta[name="anti-csrftoken-a2z"]').forEach((node) => node.remove())
      vi.unstubAllGlobals()
    }
  })
})
