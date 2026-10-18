import { describe, expect, it, vi } from "vitest"

import { createLogger, setLogSink, type LogEntry } from "../src/lib/log"
import { INVENTORY_MANAGE_URL } from "../src/lib/unfulfillable"
import {
  GET_LISTING_ISSUES_QUERY,
  GET_SUPPRESSED_LISTINGS_QUERY,
  SUPPRESSED_GQL_URL,
  SUPPRESSED_ISSUE_UNAVAILABLE,
  SUPPRESSED_ISSUES_INCOMPLETE_NOTE,
  SUPPRESSED_FIRST_PAGE_SIZE,
  SUPPRESSED_LISTINGS_INCOMPLETE_NOTE,
  SUPPRESSED_PAGE_SIZE,
  SUPPRESSED_SHEET_HEADERS,
  fetchSuppressedListings,
  formatSuppressedIssues,
  parseListingIssues,
  parseSuppressedListingsPage,
  suppressedSheetRows,
  type ListingIssue,
  type SuppressedListing,
} from "../src/lib/suppressed"

const zeroQuantityListing: SuppressedListing = {
  coreListingFields: {
    asin: "B075LQDNFZ",
    sku: "1028963361",
    fnSku: "X002B74R0Z",
    fulfillmentChannel: "AFN",
  },
  listingData: {
    asin: "B075LQDNFZ",
    sku: "1028963361",
    fnSku: "X002B74R0Z",
    productType: "TOWEL",
    bundleStatus: "",
    dateCreated: "09/10/2019 19:26:22",
    lastUpdated: "07/09/2020 15:30:51",
    numberOfChildren: 0,
    listingType: "S",
    title: "Casaba If The Broom Fits Ride It - Halloween Witch Kitchen Towels, Set of Two",
    titleDifferentiation: "",
  },
  imageUrl: "https://m.media-amazon.com/images/I/51dXLC0IBSL._SS65_.jpg",
  detailPageUrl: "https://www.amazon.com/dp/B075LQDNFZ",
  skuCentralLink: "/skucentral?mSku=1028963361&condition=New",
  isCustomizable: false,
  isParentListing: false,
  shippingTemplate: { Legacy: true, TemplateName: "Migrated Template", TemplateId: "legacy-template-id" },
  marketplaceCount: 1,
  status: {
    status: "SEARCH_SUPPRESSED",
    statusText: "Search suppressed",
    redirectionLink: "/myinventory/actions?sku=1028963361&statusText=SEARCH_SUPPRESSED",
    inlineAction: "FIX_LISTING_SUPPRESSION",
    inlineActionText: "Fix listing suppression",
    highlightedState: "error",
  },
  actions: [{ type: "Edit" }, { type: "CloseListing" }],
  availability: {
    quantity: 0,
    isQuantityInfinite: false,
    inventoryAvailability: "L",
    unfulfillable: 0,
    inbound: 0,
    onHandQuantity: 0,
    reservedQuantity: 0,
  },
  offers: [
    {
      fulfillmentChannel: "AFN",
      businessProgram: { value: "ALL", valueLabel: "Sell on Amazon" },
      price: { price: { amount: "16.99", currencyUnit: "USD" } },
      businessPrice: { price: { amount: null, currencyUnit: "USD" } },
      salePrice: { price: { amount: null, currencyUnit: "USD" } },
      condition: { condition: "New", subCondition: "New" },
      points: "0",
      automatedPricing: { enrollmentStatus: "Not Enrolled" },
    },
    {
      fulfillmentChannel: "AFN",
      price: { price: { amount: "16.99", currencyUnit: "USD" } },
      condition: { condition: "New", subCondition: "New" },
    },
  ],
}

const inStockListing: SuppressedListing = {
  ...zeroQuantityListing,
  coreListingFields: {
    ...zeroQuantityListing.coreListingFields,
    sku: "STOCK-SKU",
    asin: "B0STOCK",
    fnSku: "X00STOCK",
  },
  listingData: {
    ...zeroQuantityListing.listingData,
    sku: "STOCK-SKU",
    asin: "B0STOCK",
    title: "In-stock suppressed towel",
  },
  skuCentralLink: "/skucentral?mSku=STOCK-SKU&condition=New",
  detailPageUrl: "https://www.amazon.com/dp/B0STOCK",
  status: {
    ...zeroQuantityListing.status,
    redirectionLink: "/myinventory/actions?sku=STOCK-SKU&statusText=SEARCH_SUPPRESSED",
  },
  availability: {
    ...zeroQuantityListing.availability,
    quantity: 12,
    onHandQuantity: 12,
  },
}

const secondInStockListing: SuppressedListing = {
  ...inStockListing,
  coreListingFields: {
    asin: "B01DEAAAXY",
    sku: "1026493561",
    fnSku: "X0025KM98Z",
    fulfillmentChannel: "AFN",
  },
  listingData: {
    ...inStockListing.listingData,
    asin: "B01DEAAAXY",
    sku: "1026493561",
    title: "Country House Collection Primitive Cotton Flax Hand Towel",
  },
  offers: [{ price: { price: { amount: "13.99", currencyUnit: "USD" } }, condition: { condition: "New", subCondition: "New" } }],
  availability: { quantity: 3, isQuantityInfinite: false, onHandQuantity: 3 },
}

const missingDescriptionIssue: ListingIssue = {
  localizedIssueMessage: "'Product Description' is required but missing.",
  type: "CVS_MISSING_REQUIRED_ATTRIBUTE",
  tags: ["MISSING_PRODUCT_ATTRIBUTE", "SELLER_FIXABLE", "ATTRIBUTE", "MISSING_ATTRIBUTE"],
  enforcementActions: ["index_suppressed", "quarantined"],
  issueSource: "Item",
  parameters: [
    { key: "v3_flat_attribute_name", value: "product_description" },
    { key: "attribute_name", value: "[product_description]" },
  ],
  issuePathForwards: [{ type: "ProvideAttribute", attributes: [{ v3FlatPath: "product_description" }] }],
}

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

function listingsPayload(listings: Array<SuppressedListing | null>, count = listings.filter(Boolean).length) {
  return {
    data: {
      listingsV2: {
        listings,
        count,
      },
    },
  }
}

function issuesPayload(issues: ListingIssue[] = [missingDescriptionIssue]) {
  return {
    data: {
      listingIssuesActions: {
        issues,
      },
    },
  }
}

function fetchByOperation(listingPayloads: unknown[]) {
  const remaining = [...listingPayloads]
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? "{}")) as { operationName?: string }
    if (body.operationName === "getListingIssuesActionsForSku") return jsonResponse(issuesPayload())
    const next = remaining.shift() ?? listingsPayload([], 0)
    return jsonResponse(next)
  })
}

function listingRequestBodies(fetchImpl: { mock: { calls: unknown[][] } }) {
  return fetchImpl.mock.calls
    .map((call) => JSON.parse(String((call[1] as RequestInit | undefined)?.body ?? "{}")) as {
      operationName?: string
      variables?: { pagination?: { from?: number } }
    })
    .filter((body) => body.operationName === "getListingsV2")
}

function column(header: (typeof SUPPRESSED_SHEET_HEADERS)[number]): number {
  return SUPPRESSED_SHEET_HEADERS.indexOf(header)
}

function dataRow(rows: Array<Array<string | number>>, index = 0): Array<string | number> {
  const headerIndex = rows.findIndex((row) => row[0] === "SKU")
  return rows[headerIndex + 1 + index] ?? []
}

describe("suppressed sheet rows", () => {
  it("writes in-stock rows and omits zero-quantity listings", () => {
    const rows = suppressedSheetRows([zeroQuantityListing, inStockListing])
    expect(rows[0]).toEqual([...SUPPRESSED_SHEET_HEADERS])
    expect(rows).toHaveLength(2)
    const row = dataRow(rows)
    expect(row[column("SKU")]).toBe("STOCK-SKU")
    expect(row[column("ASIN")]).toBe("B0STOCK")
    expect(row[column("FNSKU")]).toBe("X00STOCK")
    expect(row[column("Title")]).toBe("In-stock suppressed towel")
    expect(row[column("Status")]).toBe("Search Suppressed")
    expect(row[column("Status text")]).toBe("Search suppressed")
    expect(row[column("Inline action")]).toBe("FIX_LISTING_SUPPRESSION")
    expect(row[column("Inline action text")]).toBe("Fix listing suppression")
    expect(row[column("Fix listing URL")]).toBe("/myinventory/actions?sku=STOCK-SKU&statusText=SEARCH_SUPPRESSED")
    expect(row[column("Issue")]).toBe("")
    expect(row[column("Available")]).toBe(12)
    expect(row[column("Price")]).toBe(16.99)
    expect(row[column("Currency")]).toBe("USD")
    expect(row[column("Condition")]).toBe("New")
    expect(row[column("Fulfillment channel")]).toBe("AFN")
    expect(row[column("Business program")]).toBe("Sell on Amazon")
    expect(row[column("Actions")]).toBe("Edit, CloseListing")
    expect(rows.flat().join("\n")).not.toContain("1028963361")
  })

  it("keeps infinite-quantity listings", () => {
    const rows = suppressedSheetRows([{
      ...zeroQuantityListing,
      availability: { quantity: 0, isQuantityInfinite: true },
    }])
    expect(dataRow(rows)[column("SKU")]).toBe("1028963361")
    expect(dataRow(rows)[column("Infinite quantity")]).toBe("Yes")
  })

  it("notes incomplete listing fetches on the sheet", () => {
    const rows = suppressedSheetRows([{ ...inStockListing, listingsIncomplete: true }])
    expect(rows[0]).toEqual([SUPPRESSED_LISTINGS_INCOMPLETE_NOTE])
    expect(rows[1]).toEqual([])
    expect(rows[2]).toEqual([...SUPPRESSED_SHEET_HEADERS])
    expect(dataRow(rows)[column("SKU")]).toBe("STOCK-SKU")
  })

  it("writes suppression reasons from listing issues", () => {
    const rows = suppressedSheetRows([{ ...inStockListing, issues: [missingDescriptionIssue] }])
    const row = dataRow(rows)
    expect(row[column("Issue")]).toBe("'Product Description' is required but missing.")
    expect(row[column("Issue type")]).toBe("CVS_MISSING_REQUIRED_ATTRIBUTE")
    expect(row[column("Issue attribute")]).toBe("product_description")
    expect(row[column("Enforcement")]).toBe("index_suppressed, quarantined")
    expect(row[column("Issue source")]).toBe("Item")
    expect(row[column("Issue tags")]).toContain("MISSING_PRODUCT_ATTRIBUTE")
  })

  it("marks SKUs whose issue fetch failed", () => {
    const rows = suppressedSheetRows([{ ...inStockListing, issuesFetchFailed: true }])
    expect(rows[0]).toEqual([SUPPRESSED_ISSUES_INCOMPLETE_NOTE])
    expect(dataRow(rows)[column("Issue")]).toBe(SUPPRESSED_ISSUE_UNAVAILABLE)
  })
})

describe("getListingsV2 suppressed parsing", () => {
  it("reads listings and count from the captured payload shape", () => {
    expect(parseSuppressedListingsPage(listingsPayload([zeroQuantityListing, secondInStockListing], 2))).toEqual({
      listings: [zeroQuantityListing, secondInStockListing],
      count: 2,
      rows: 2,
    })
  })

  it("surfaces GraphQL errors when listings are missing", () => {
    expect(() => parseSuppressedListingsPage({ errors: [{ message: "Not authorized" }] })).toThrow("Not authorized")
  })

  it("keeps valid listings when a page mixes objects, nulls, and errors", () => {
    expect(parseSuppressedListingsPage({
      errors: [{ message: "Inaccessible listing" }],
      ...listingsPayload([inStockListing, null], 2),
    })).toEqual({
      listings: [inStockListing],
      count: 2,
      rows: 2,
    })
  })
})

describe("listing issues parsing", () => {
  it("reads the captured missing-attribute issue", () => {
    expect(parseListingIssues(issuesPayload())).toEqual([missingDescriptionIssue])
    expect(formatSuppressedIssues([missingDescriptionIssue])).toEqual({
      message: "'Product Description' is required but missing.",
      type: "CVS_MISSING_REQUIRED_ATTRIBUTE",
      attribute: "product_description",
      enforcement: "index_suppressed, quarantined",
      source: "Item",
      tags: "MISSING_PRODUCT_ATTRIBUTE, SELLER_FIXABLE, ATTRIBUTE, MISSING_ATTRIBUTE",
    })
  })

  it("surfaces GraphQL errors when listing issues are missing", () => {
    expect(() => parseListingIssues({ errors: [{ message: "Not authorized" }] })).toThrow("Not authorized")
  })
})

describe("fetchSuppressedListings", () => {
  it("paginates with from/size until count is reached and keeps in-stock listings", async () => {
    const fetchImpl = fetchByOperation([
      listingsPayload([inStockListing], 2),
      listingsPayload([secondInStockListing], 2),
    ])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...inStockListing, issues: [missingDescriptionIssue] },
      { ...secondInStockListing, issues: [missingDescriptionIssue] },
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    expect(fetchImpl).toHaveBeenNthCalledWith(1, SUPPRESSED_GQL_URL, expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({ "anti-csrftoken-a2z": "csrf-token" }),
    }))
    const firstBody = JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string) as {
      operationName: string
      query: string
      variables: {
        pagination: { from: number; size: number }
        sortRequest: { key: string; order: string }
        multiSelectFilters: Array<{ key: string; values: string[] }>
      }
    }
    expect(firstBody.operationName).toBe("getListingsV2")
    expect(firstBody.query).toBe(GET_SUPPRESSED_LISTINGS_QUERY)
    expect(firstBody.query).toContain("MANAGE_INVENTORY_VIEW")
    expect(firstBody.query).toContain("EML_CDQ_ENABLED")
    expect(firstBody.variables.pagination).toEqual({ from: 0, size: SUPPRESSED_FIRST_PAGE_SIZE })
    expect(firstBody.variables.sortRequest).toEqual({ key: "QUANTITY_AVAILABLE", order: "DESCENDING" })
    expect(firstBody.variables.multiSelectFilters).toEqual([
      { key: "LISTING_STATUS", values: ["SearchSuppressed"] },
      { key: "FULFILLMENT", values: ["AllChannels"] },
      { key: "CONDITION", values: [] },
    ])
    const secondBody = JSON.parse((fetchImpl.mock.calls[1][1] as RequestInit).body as string) as {
      variables: { pagination: { from: number; size: number } }
    }
    expect(secondBody.variables.pagination).toEqual({ from: 1, size: SUPPRESSED_PAGE_SIZE })
    const issueBodies = fetchImpl.mock.calls.slice(2).map((call) => JSON.parse((call[1] as RequestInit).body as string) as {
      operationName: string
      query: string
      variables: { sku: string; contributorToken: string }
    })
    expect(issueBodies).toEqual([
      {
        operationName: "getListingIssuesActionsForSku",
        query: GET_LISTING_ISSUES_QUERY,
        variables: { sku: "STOCK-SKU", contributorToken: "" },
      },
      {
        operationName: "getListingIssuesActionsForSku",
        query: GET_LISTING_ISSUES_QUERY,
        variables: { sku: "1026493561", contributorToken: "" },
      },
    ])
  })

  it("stops at the first zero-available listing and does not mark the sheet incomplete", async () => {
    const fetchImpl = fetchByOperation([
      listingsPayload([inStockListing, secondInStockListing, zeroQuantityListing], 5000),
      listingsPayload([zeroQuantityListing], 5000),
    ])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...inStockListing, issues: [missingDescriptionIssue] },
      { ...secondInStockListing, issues: [missingDescriptionIssue] },
    ])
    expect(listingRequestBodies(fetchImpl).map((body) => body.variables?.pagination)).toEqual([
      { from: 0, size: SUPPRESSED_FIRST_PAGE_SIZE },
    ])
  })

  it("stops when a later page starts at zero available", async () => {
    const fetchImpl = fetchByOperation([
      listingsPayload([inStockListing], 5000),
      listingsPayload([zeroQuantityListing, secondInStockListing], 5000),
      listingsPayload([secondInStockListing], 5000),
    ])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...inStockListing, issues: [missingDescriptionIssue] },
    ])
    expect(listingRequestBodies(fetchImpl).map((body) => body.variables?.pagination?.from)).toEqual([0, 1])
  })

  it("reports listing count and issue-fetch progress", async () => {
    const onProgress = vi.fn()
    const fetchImpl = fetchByOperation([
      listingsPayload([inStockListing], 2),
      listingsPayload([secondInStockListing], 2),
    ])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root, onProgress })
    expect(onProgress).toHaveBeenCalledWith({ source: "suppressed", status: "active", loaded: 0, phase: "listings" })
    expect(onProgress).toHaveBeenCalledWith({
      source: "suppressed",
      status: "active",
      loaded: 1,
      total: 2,
      phase: "listings",
    })
    expect(onProgress).toHaveBeenCalledWith({
      source: "suppressed",
      status: "active",
      loaded: 2,
      total: 2,
      phase: "listings",
    })
    expect(onProgress).toHaveBeenCalledWith({
      source: "suppressed",
      status: "active",
      loaded: 0,
      total: 2,
      phase: "issues",
    })
    expect(onProgress).toHaveBeenCalledWith({
      source: "suppressed",
      status: "complete",
      loaded: 2,
      total: 2,
      phase: "issues",
    })
  })

  it("marks remaining in-stock rows incomplete when count is not reached", async () => {
    const fetchImpl = fetchByOperation([
      listingsPayload([inStockListing], 5),
      listingsPayload([], 5),
    ])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...inStockListing, listingsIncomplete: true, issues: [missingDescriptionIssue] },
    ])
  })

  it("throws when the security token is missing", async () => {
    const root = document.implementation.createHTMLDocument()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "<html></html>" })
    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root, cookie: "" })).rejects.toThrow(
      "Couldn’t read the Seller Central security token.",
    )
  })

  it("reads the security token from Manage Inventory HTML when the page has none", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url === INVENTORY_MANAGE_URL) {
        return { ok: true, status: 200, text: async () => '<html><meta name="anti-csrftoken-a2z" content="html-csrf"></html>' }
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as { operationName?: string }
      if (body.operationName === "getListingIssuesActionsForSku") return jsonResponse(issuesPayload())
      return jsonResponse(listingsPayload([inStockListing], 1))
    })
    const root = document.implementation.createHTMLDocument()

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root, cookie: "" })).resolves.toEqual([
      { ...inStockListing, issues: [missingDescriptionIssue] },
    ])
    expect(fetchImpl).toHaveBeenCalledWith(INVENTORY_MANAGE_URL, expect.objectContaining({
      method: "GET",
      credentials: "include",
    }))
    expect(fetchImpl).toHaveBeenCalledWith(SUPPRESSED_GQL_URL, expect.objectContaining({
      headers: expect.objectContaining({ "anti-csrftoken-a2z": "html-csrf" }),
    }))
  })

  it("throws when Seller Central returns a failed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'
    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).rejects.toThrow(
      "Couldn’t load search-suppressed inventory (403).",
    )
  })

  it("returns an empty list when every suppressed listing has zero quantity", async () => {
    const fetchImpl = fetchByOperation([listingsPayload([zeroQuantityListing], 1)])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'
    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("keeps in-stock rows when a suppression-reason fetch fails", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as { operationName?: string }
      if (body.operationName === "getListingIssuesActionsForSku") return jsonResponse({}, 500)
      return jsonResponse(listingsPayload([inStockListing], 1))
    })
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...inStockListing, issues: [], issuesFetchFailed: true },
    ])
  })

  it("logs each listings page with rows, in-stock count, and Seller Central's total", async () => {
    const fetchImpl = fetchByOperation([listingsPayload([inStockListing, zeroQuantityListing], 7)])
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'
    const entries: LogEntry[] = []
    setLogSink((entry) => entries.push(entry))

    try {
      await fetchSuppressedListings({ fetch: fetchImpl as unknown as typeof fetch, root, log: createLogger("content") })
      expect(entries.find((entry) => entry.event === "suppressed.page")?.data).toEqual({
        page: 0,
        from: 0,
        size: SUPPRESSED_FIRST_PAGE_SIZE,
        rows: 2,
        inStock: 1,
        reported: 7,
      })
    } finally {
      setLogSink(null)
    }
  })
})
