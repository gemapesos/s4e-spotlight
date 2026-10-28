import { describe, expect, it, vi } from "vitest"

import { BULK_REMOVAL_URL, buildBulkRemovalUrl } from "../src/background"
import { BULK_REMOVAL_NOT_FOUND, resolveRemovalSkus } from "../src/lib/bulkRemoval"
import {
  REMOVAL_ORDER_REPORT_URL,
  REMOVAL_STATUS_BY_CODE,
  UNFULFILLABLE_GQL_URL,
  UNFULFILLABLE_INVENTORIES_URL,
  type RecoveryLineItem,
} from "../src/lib/unfulfillable"

function listing(sku: string, asin: string, fnSku: string) {
  return { coreListingFields: { sku, asin, fnSku } }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })
}

const tokenRoot = (() => {
  const doc = document.implementation.createHTMLDocument("")
  doc.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="token-1">'
  return doc
})()

interface FakeAmazon {
  multiSku?: (skus: string[]) => Response
  pages?: unknown[][]
  lineItems?: RecoveryLineItem[] | Error
  latestOrderId?: string
}

function fakeFetch(amazon: FakeAmazon) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === REMOVAL_ORDER_REPORT_URL) {
      return json({ columnData: amazon.latestOrderId ? [["", amazon.latestOrderId]] : [] })
    }
    const body = JSON.parse(String(init?.body ?? "{}"))
    if (url === UNFULFILLABLE_GQL_URL) {
      if (body.variables.multiSKUList) {
        if (amazon.multiSku) return amazon.multiSku(body.variables.multiSKUList)
        throw new Error("unexpected multi-SKU lookup")
      }
      const pages = amazon.pages ?? []
      const page = pages[Math.floor((body.variables.pagination?.from ?? 0) / 250)] ?? []
      const count = pages.reduce((total, rows) => total + rows.length, 0)
      return json({ data: { listingsV2: { listings: page, count } } })
    }
    if (url === UNFULFILLABLE_INVENTORIES_URL) {
      if (amazon.lineItems instanceof Error) return json({}, 500)
      const wanted = new Set(body.matchedMskusAndFnskus.map((pair: { merchantSku: string }) => pair.merchantSku))
      return json({ lineItems: (amazon.lineItems ?? []).filter((item) => wanted.has(item.merchantSku)) })
    }
    throw new Error(`unexpected ${url}`)
  })
}

const eligible = (merchantSku: string, fulfillmentNetworkSku: string, units: number): RecoveryLineItem => ({
  merchantSku,
  fulfillmentNetworkSku,
  totalUnsellableQuantity: units,
  unsellableIneligibleQuantity: 0,
  unsellableIneligibleQuantities: [],
})

describe("buildBulkRemovalUrl", () => {
  it("lists each SKU's identifiers by index, as Amazon's bulk create removal link does", () => {
    const url = new URL(buildBulkRemovalUrl([
      { sku: "CC 10&1", asin: "B000EH2I5O", fnSku: "X001" },
      { sku: "CC20", asin: "B000000002", fnSku: "X002" },
    ]))
    expect(`${url.origin}${url.pathname}`).toBe(BULK_REMOVAL_URL)
    expect([...url.searchParams]).toEqual([
      ["mSku.0", "CC 10&1"], ["fnSku.0", "X001"], ["asin.0", "B000EH2I5O"],
      ["mSku.1", "CC20"], ["fnSku.1", "X002"], ["asin.1", "B000000002"],
      ["ref_", "myij_unf_cro_bulk_bktsz_1"],
    ])
  })
})

describe("resolveRemovalSkus", () => {
  it("looks up just the pasted SKUs and keeps the removable ones in the order given", async () => {
    const fetch = fakeFetch({
      multiSku: () => json({ data: { listingsV2: { listings: [listing("CC20", "A2", "F2"), listing("CC10", "A1", "F1")], count: 2 } } }),
      lineItems: [eligible("CC10", "F1", 3), eligible("CC20", "F2", 1)],
      latestOrderId: "S4EJM0012",
    })

    const result = await resolveRemovalSkus(["cc10", "CC20", "TYPO"], { fetch, root: tokenRoot, cookie: "" })

    expect(result).toEqual({
      items: [
        { sku: "CC10", asin: "A1", fnSku: "F1", removableUnits: 3 },
        { sku: "CC20", asin: "A2", fnSku: "F2", removableUnits: 1 },
      ],
      skipped: [{ sku: "TYPO", reason: BULK_REMOVAL_NOT_FOUND }],
      nextRemovalOrderId: "S4EJM0013",
      eligibilityUnknown: false,
    })
    const gqlCalls = fetch.mock.calls.filter(([url]) => url === UNFULFILLABLE_GQL_URL)
    expect(gqlCalls).toHaveLength(1)
    expect(JSON.parse(String(gqlCalls[0][1]?.body)).variables.multiSKUList).toEqual(["cc10", "CC20", "TYPO"])
  })

  it("skips SKUs with no units available for removal, giving Amazon's reason", async () => {
    const fetch = fakeFetch({
      multiSku: () => json({ data: { listingsV2: { listings: [listing("CC10", "A1", "F1")], count: 1 } } }),
      lineItems: [{
        merchantSku: "CC10",
        fulfillmentNetworkSku: "F1",
        totalUnsellableQuantity: 2,
        unsellableIneligibleQuantity: 2,
        unsellableIneligibleQuantities: [{ quantity: 2, unfulfillableErrorCode: "InventoryInPendingRequest" }],
      }],
    })

    const result = await resolveRemovalSkus(["CC10"], { fetch, root: tokenRoot, cookie: "" })

    expect(result.items).toEqual([])
    expect(result.skipped).toEqual([{ sku: "CC10", reason: REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest }])
  })

  it("includes matched SKUs unchecked when removal eligibility can't be loaded", async () => {
    const fetch = fakeFetch({
      multiSku: () => json({ data: { listingsV2: { listings: [listing("CC10", "A1", "F1")], count: 1 } } }),
      lineItems: new Error("down"),
    })

    const result = await resolveRemovalSkus(["CC10"], { fetch, root: tokenRoot, cookie: "" })

    expect(result.items).toEqual([{ sku: "CC10", asin: "A1", fnSku: "F1", removableUnits: null }])
    expect(result.eligibilityUnknown).toBe(true)
    expect(result.nextRemovalOrderId).toBeNull()
  })

  it.each([
    ["rejects the SKU list", () => json({ errors: [{ message: "Unknown argument multiSKUList" }] })],
    ["ignores the SKU list", () => json({ data: { listingsV2: { listings: [listing("OTHER", "A9", "F9")], count: 900 } } })],
  ])("scans the unfulfillable list when Amazon %s", async (_, multiSku) => {
    const fetch = fakeFetch({
      multiSku,
      pages: [
        Array.from({ length: 250 }, (_, index) => listing(`SKU${index}`, `A${index}`, `F${index}`)),
        [listing("CC10", "A1", "F1")],
        [listing("NEVER-READ", "A2", "F2")],
      ],
      lineItems: [eligible("CC10", "F1", 4)],
    })

    const result = await resolveRemovalSkus(["CC10"], { fetch, root: tokenRoot, cookie: "" })

    expect(result.items).toEqual([{ sku: "CC10", asin: "A1", fnSku: "F1", removableUnits: 4 }])
    // The scan stops once every SKU is found.
    const scanned = fetch.mock.calls.filter(([url, init]) => url === UNFULFILLABLE_GQL_URL && !JSON.parse(String(init?.body)).variables.multiSKUList)
    expect(scanned).toHaveLength(2)
  })
})
