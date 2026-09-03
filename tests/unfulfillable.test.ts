import { describe, expect, it, vi } from "vitest"

import {
  GET_LISTINGS_V2_QUERY,
  GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR,
  INVENTORY_MANAGE_URL,
  REMOVAL_STATUS_BY_CODE,
  REMOVAL_STATUS_ELIGIBLE,
  REMOVAL_STATUS_UNAVAILABLE,
  REMOVAL_STATUS_UNKNOWN,
  UNFULFILLABLE_GQL_URL,
  UNFULFILLABLE_INVENTORIES_BATCH_SIZE,
  UNFULFILLABLE_INVENTORIES_URL,
  UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE,
  UNFULFILLABLE_PAGE_SIZE,
  UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE,
  UNFULFILLABLE_SHEET_HEADERS,
  fetchUnfulfillableListings,
  formatListingStatus,
  formatRemovalStatus,
  isInvalidPaginationInput,
  isMissingCursorField,
  mergeRemovalStatus,
  parseListingsPage,
  parseRecoveryInventories,
  readAntiCsrfToken,
  readAntiCsrfTokenFromHtml,
  removalStatusFromLineItem,
  unfulfillableSheetRows,
  type RecoveryLineItem,
  type UnfulfillableListing,
} from "../src/lib/unfulfillable"

const expiredListing: UnfulfillableListing = {
  coreListingFields: {
    sku: "20231103_9.00_Sephora_67493",
    asin: "B00JJPVVYQ",
    fnSku: "X004110PZF",
  },
  listingData: {
    title: "Sephora Collection Colorful Waterproof Eyeliner",
    lastUpdated: "11/15/2024 15:18:56",
  },
  imageUrl: "https://m.media-amazon.com/images/I/01RmK+J4pJL._SS65_.gif",
  status: { status: "INACTIVE" },
  availability: {
    unfulfillable: 2,
    unfulfillableDetails: {
      expired: 2,
      damagedByCarrier: 0,
      damagedByCustomer: 0,
      damagedByDistributor: 0,
      damagedByWarehouse: 0,
      defective: 0,
    },
  },
  offers: [
    { price: { price: { amount: "21.75", currencyUnit: "USD" } } },
    { price: { price: { amount: "21.75", currencyUnit: "USD" } } },
  ],
}

const mixedListing: UnfulfillableListing = {
  coreListingFields: {
    sku: "MIXED-SKU",
    asin: "B0MIXED",
    fnSku: "X00MIXED",
  },
  listingData: {
    title: "Mixed damage SKU",
    lastUpdated: "08/12/2026 01:10:06",
  },
  imageUrl: "https://example.com/mixed.jpg",
  status: { status: "OUT_OF_STOCK" },
  availability: {
    unfulfillable: 3,
    unfulfillableDetails: {
      expired: 1,
      damagedByCarrier: 1,
      damagedByCustomer: 0,
      damagedByDistributor: 0,
      damagedByWarehouse: 0,
      defective: 1,
    },
  },
  offers: [{ price: { price: { amount: "19.99", currencyUnit: "USD" } } }],
}

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

function listingsPayload(listings: Array<UnfulfillableListing | null>, count = listings.filter(Boolean).length, cursor?: string | null) {
  return {
    data: {
      listingsV2: {
        listings,
        count,
        ...(cursor === undefined ? {} : { cursor }),
        debugInfo: null,
      },
    },
  }
}

function listingWithSkus(sku: string, fnSku: string): UnfulfillableListing {
  return {
    ...expiredListing,
    coreListingFields: {
      ...expiredListing.coreListingFields,
      sku,
      fnSku,
    },
  }
}

describe("unfulfillable sheet rows", () => {
  it("writes a header and one row per SKU with damage-type columns", () => {
    const rows = unfulfillableSheetRows([expiredListing, mixedListing])
    expect(rows[0]).toEqual([...UNFULFILLABLE_SHEET_HEADERS])
    expect(rows[1]).toEqual([
      "20231103_9.00_Sephora_67493",
      "B00JJPVVYQ",
      "X004110PZF",
      "Sephora Collection Colorful Waterproof Eyeliner",
      "Inactive",
      21.75,
      "USD",
      2,
      0,
      0,
      0,
      2,
      0,
      0,
      "",
      "11/15/2024 15:18:56",
      "https://m.media-amazon.com/images/I/01RmK+J4pJL._SS65_.gif",
    ])
    expect(rows[2]).toEqual([
      "MIXED-SKU",
      "B0MIXED",
      "X00MIXED",
      "Mixed damage SKU",
      "Out Of Stock",
      19.99,
      "USD",
      3,
      1,
      0,
      1,
      1,
      0,
      0,
      "",
      "08/12/2026 01:10:06",
      "https://example.com/mixed.jpg",
    ])
  })

  it("notes incomplete listing and removal fetches on the sheet", () => {
    const rows = unfulfillableSheetRows([
      { ...expiredListing, listingsIncomplete: true, removalFetchFailed: true },
      { ...mixedListing, listingsIncomplete: true, removal: [{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }] },
    ])
    expect(rows[0]).toEqual([UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE])
    expect(rows[1]).toEqual([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE])
    expect(rows[2]).toEqual([])
    expect(rows[3]).toEqual([...UNFULFILLABLE_SHEET_HEADERS])
    expect(rows[4]?.[14]).toBe(REMOVAL_STATUS_UNAVAILABLE)
    expect(rows[5]?.[14]).toBe(`${REMOVAL_STATUS_ELIGIBLE} - 1 unit`)
  })

  it("humanizes listing statuses", () => {
    expect(formatListingStatus("ACTIVE")).toBe("Active")
    expect(formatListingStatus("OUT_OF_STOCK")).toBe("Out Of Stock")
    expect(formatListingStatus(undefined)).toBe("")
  })
})

describe("anti-csrf token", () => {
  it("prefers the meta tag over the cookie", () => {
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content=" from-meta ">'
    expect(readAntiCsrfToken(root, "anti-csrftoken-a2z=from-cookie")).toBe("from-meta")
  })

  it("reads the cookie when the meta tag is missing", () => {
    const root = document.implementation.createHTMLDocument()
    expect(readAntiCsrfToken(root, "session=1; anti-csrftoken-a2z=cookie%2Ftoken; other=2")).toBe("cookie/token")
  })
})

describe("GetListingsV2 parsing", () => {
  it("reads listings, count, and cursor", () => {
    expect(parseListingsPage(listingsPayload([expiredListing], 12, "page-2"))).toEqual({
      listings: [expiredListing],
      count: 12,
      cursor: "page-2",
    })
  })

  it("surfaces GraphQL errors when listings are missing", () => {
    expect(() => parseListingsPage({ errors: [{ message: "Not authorized" }] })).toThrow("Not authorized")
  })

  it("keeps valid listings when a page mixes objects, nulls, and errors", () => {
    expect(parseListingsPage({
      errors: [{ message: "Inaccessible listing" }],
      ...listingsPayload([expiredListing, null], 2),
    })).toEqual({
      listings: [expiredListing],
      count: 2,
      cursor: undefined,
    })
  })

  it("detects an unknown cursor field", () => {
    expect(isMissingCursorField(['Cannot query field "cursor" on type "ListingsV2".'])).toBe(true)
    expect(isMissingCursorField(["Validation error of type FieldUndefined: Field 'cursor' in type 'ListingsV2' is undefined @ 'listingsV2/cursor'"])).toBe(true)
    expect(isMissingCursorField(["Not authorized"])).toBe(false)
  })

  it("detects an invalid PaginationInput field", () => {
    expect(isInvalidPaginationInput(["The variables input contains a field that is not defined for input object type 'PaginationInput' "])).toBe(true)
    expect(isInvalidPaginationInput(["Not authorized"])).toBe(false)
  })
})

const sephoraLineItem: RecoveryLineItem = {
  merchantSku: "20231103_9.00_Sephora_67493",
  fulfillmentNetworkSku: "X004110PZF",
  totalSellableQuantity: 0,
  totalUnsellableQuantity: 2,
  unsellableIneligibleQuantity: 2,
  unsellableIneligibleQuantities: [{ quantity: 2, unfulfillableErrorCode: "InventoryIsBound" }],
}

const fortnumLineItem: RecoveryLineItem = {
  merchantSku: "20241028_19.00_Fortnum_75287",
  fulfillmentNetworkSku: "X004GB1BUX",
  totalSellableQuantity: 0,
  totalUnsellableQuantity: 1,
  unsellableIneligibleQuantity: 1,
  unsellableIneligibleQuantities: [{ quantity: 1, unfulfillableErrorCode: "InventoryInPendingRequest" }],
}

const altraLineItem: RecoveryLineItem = {
  merchantSku: "2026-03-19-B0DMFX4SPP-15126-80.00",
  fulfillmentNetworkSku: "X0051JSHCJ",
  totalSellableQuantity: 0,
  totalUnsellableQuantity: 1,
  unsellableIneligibleQuantity: 0,
  unsellableIneligibleQuantities: [],
}

const vionicLineItem: RecoveryLineItem = {
  merchantSku: "2025-07-31-B0DBJYQKBY-13319",
  fulfillmentNetworkSku: "X004S6YD0B",
  totalSellableQuantity: 5,
  totalUnsellableQuantity: 1,
  unsellableIneligibleQuantity: 0,
  unsellableIneligibleQuantities: [],
}

describe("recovery inventories mapping", () => {
  it("maps HAR unsellable ineligible codes and ignores sellable units", () => {
    expect(removalStatusFromLineItem(sephoraLineItem)).toEqual([
      { label: REMOVAL_STATUS_BY_CODE.InventoryIsBound, quantity: 2 },
    ])
    expect(removalStatusFromLineItem(fortnumLineItem)).toEqual([
      { label: REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest, quantity: 1 },
    ])
    expect(removalStatusFromLineItem(altraLineItem)).toEqual([
      { label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 },
    ])
    expect(removalStatusFromLineItem(vionicLineItem)).toEqual([
      { label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 },
    ])
  })

  it("uses Amazon copy, unit vs units, and joins mixed statuses", () => {
    expect(formatRemovalStatus(removalStatusFromLineItem(fortnumLineItem))).toBe(
      `${REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest} - 1 unit`,
    )
    expect(formatRemovalStatus(removalStatusFromLineItem(sephoraLineItem))).toBe(
      `${REMOVAL_STATUS_BY_CODE.InventoryIsBound} - 2 units`,
    )
    expect(formatRemovalStatus([
      { label: REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest, quantity: 1 },
      { label: REMOVAL_STATUS_BY_CODE.InventoryIsInBoundProcessing, quantity: 5 },
    ])).toBe(
      `${REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest} - 1 unit || ${REMOVAL_STATUS_BY_CODE.InventoryIsInBoundProcessing} - 5 units`,
    )
  })

  it("counts warehouse-damaged and unknown codes separately", () => {
    expect(removalStatusFromLineItem({
      totalUnsellableQuantity: 3,
      unsellableIneligibleQuantity: 3,
      unsellableIneligibleQuantities: [
        { quantity: 1, unfulfillableErrorCode: "InventoryIsWarehouseDamaged" },
        { quantity: 2, unfulfillableErrorCode: "InventoryIsHazmatItem" },
      ],
    })).toEqual([
      { label: REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged, quantity: 1 },
      { label: REMOVAL_STATUS_BY_CODE.InventoryIsHazmatItem, quantity: 2 },
    ])
    expect(removalStatusFromLineItem({
      totalUnsellableQuantity: 1,
      unsellableIneligibleQuantity: 1,
      unsellableIneligibleQuantities: [{ quantity: 1, unfulfillableErrorCode: "NotARealCode" }],
    })).toEqual([{ label: REMOVAL_STATUS_UNKNOWN, quantity: 1 }])
  })

  it("parses lineItems and merges onto listings by MSKU and FNSKU", () => {
    const payload = { lineItems: [sephoraLineItem, fortnumLineItem, altraLineItem, vionicLineItem] }
    expect(parseRecoveryInventories(payload)).toHaveLength(4)

    const merged = mergeRemovalStatus(
      [
        expiredListing,
        { coreListingFields: { sku: "20241028_19.00_Fortnum_75287", fnSku: "X004GB1BUX" } },
        { coreListingFields: { sku: "2026-03-19-B0DMFX4SPP-15126-80.00", fnSku: "X0051JSHCJ" } },
        { coreListingFields: { sku: "2025-07-31-B0DBJYQKBY-13319", fnSku: "X004S6YD0B" } },
      ],
      parseRecoveryInventories(payload),
    )
    expect(merged[0].removal).toEqual([{ label: REMOVAL_STATUS_BY_CODE.InventoryIsBound, quantity: 2 }])
    expect(merged[1].removal).toEqual([{ label: REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest, quantity: 1 }])
    expect(merged[2].removal).toEqual([{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }])
    expect(merged[3].removal).toEqual([{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }])
    expect(unfulfillableSheetRows([merged[0]])[1][14]).toBe(`${REMOVAL_STATUS_BY_CODE.InventoryIsBound} - 2 units`)
  })

  it("marks SKUs whose removal batch failed instead of leaving Removal Status blank", () => {
    const merged = mergeRemovalStatus(
      [expiredListing, mixedListing],
      [sephoraLineItem],
      new Set(["MIXED-SKU\0X00MIXED"]),
    )
    expect(merged[0].removalFetchFailed).toBeUndefined()
    expect(merged[1]).toEqual({ ...mixedListing, removal: [], removalFetchFailed: true })
    expect(unfulfillableSheetRows(merged)[0]).toEqual([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE])
    expect(unfulfillableSheetRows(merged)[4][14]).toBe(REMOVAL_STATUS_UNAVAILABLE)
  })
})

describe("fetchUnfulfillableListings", () => {
  it("paginates until count is reached", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 2, "page-2")))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([mixedListing], 2, null)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [] },
      { ...mixedListing, removal: [] },
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(fetchImpl).toHaveBeenNthCalledWith(1, UNFULFILLABLE_GQL_URL, expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({ "anti-csrftoken-a2z": "csrf-token" }),
    }))
    const firstBody = JSON.parse((fetchImpl.mock.calls[0][1] as RequestInit).body as string) as {
      query: string
      variables: { pagination: { pageSize: number; cursor?: string } }
    }
    expect(firstBody.query).toContain("cursor")
    expect(firstBody.variables.pagination).toEqual({ pageSize: UNFULFILLABLE_PAGE_SIZE })
    const secondBody = JSON.parse((fetchImpl.mock.calls[1][1] as RequestInit).body as string) as {
      variables: { pagination: { pageSize: number; cursor?: string } }
    }
    expect(secondBody.variables.pagination).toEqual({ pageSize: UNFULFILLABLE_PAGE_SIZE, cursor: "page-2" })
  })

  it("reports listing count and removal-batch progress", async () => {
    const onProgress = vi.fn()
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 2, "page-2")))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([mixedListing], 2, null)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root, onProgress })
    expect(onProgress).toHaveBeenCalledWith({
      source: "unfulfillable",
      status: "active",
      loaded: 0,
      phase: "listings",
    })
    expect(onProgress).toHaveBeenCalledWith({
      source: "unfulfillable",
      status: "active",
      loaded: 1,
      total: 2,
      phase: "listings",
    })
    expect(onProgress).toHaveBeenCalledWith({
      source: "unfulfillable",
      status: "active",
      loaded: 2,
      total: 2,
      phase: "listings",
    })
    expect(onProgress).toHaveBeenCalledWith(expect.objectContaining({
      source: "unfulfillable",
      status: "complete",
    }))
  })

  it("retries without cursor when the schema rejects that field", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Validation error of type FieldUndefined: Field 'cursor' in type 'ListingsV2' is undefined @ 'listingsV2/cursor'" }] }))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 1)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [] },
    ])
    const retryBody = JSON.parse((fetchImpl.mock.calls[1][1] as RequestInit).body as string) as { query: string }
    expect(retryBody.query).toBe(GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR)
    expect(retryBody.query).not.toContain("\n    cursor\n")
    expect(GET_LISTINGS_V2_QUERY).toContain("\n    cursor\n")
  })

  it("retries without pagination when PaginationInput rejects pageSize", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "Validation error of type FieldUndefined: Field 'cursor' in type 'ListingsV2' is undefined @ 'listingsV2/cursor'" }] }))
      .mockResolvedValueOnce(jsonResponse({ errors: [{ message: "The variables input contains a field that is not defined for input object type 'PaginationInput' " }] }))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 1)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [] },
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    const omitted = JSON.parse((fetchImpl.mock.calls[2][1] as RequestInit).body as string) as {
      query: string
      variables: { pagination?: unknown }
    }
    expect(omitted.query).toBe(GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR)
    expect(omitted.variables.pagination).toBeUndefined()
  })

  it("stops when a cursor repeats", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 4, "loop")))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 4, "loop")))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [], listingsIncomplete: true },
      { ...expiredListing, removal: [], listingsIncomplete: true },
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it("posts MSKU/FNSKU pairs to recovery inventories and merges removal status", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 1)))
      .mockResolvedValueOnce(jsonResponse({ lineItems: [sephoraLineItem] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      {
        ...expiredListing,
        removal: [{ label: REMOVAL_STATUS_BY_CODE.InventoryIsBound, quantity: 2 }],
      },
    ])
    expect(fetchImpl).toHaveBeenNthCalledWith(2, UNFULFILLABLE_INVENTORIES_URL, expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: expect.objectContaining({
        "content-type": "application/json",
        "anti-csrftoken-a2z": "csrf-token",
      }),
    }))
    const inventoriesBody = JSON.parse((fetchImpl.mock.calls[1][1] as RequestInit).body as string) as {
      matchedMskusAndFnskus: Array<{ merchantSku: string; fulfillmentNetworkSku: string }>
      fulfillmentChannel: string
      inventoryCategory: string
    }
    expect(inventoriesBody).toEqual({
      matchedMskusAndFnskus: [{ merchantSku: "20231103_9.00_Sephora_67493", fulfillmentNetworkSku: "X004110PZF" }],
      fulfillmentChannel: "RETURN",
      inventoryCategory: "STANDARD",
    })
  })

  it("throws when the security token is missing", async () => {
    const root = document.implementation.createHTMLDocument()
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "<html></html>" })
    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root, cookie: "" })).rejects.toThrow(
      "Couldn’t read the Seller Central security token.",
    )
  })

  it("reads the security token from Manage Inventory HTML when the page has none", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === INVENTORY_MANAGE_URL) {
        return { ok: true, status: 200, text: async () => '<html><meta name="anti-csrftoken-a2z" content="html-csrf"></html>' }
      }
      if (url.includes("/recovery/inventories")) return jsonResponse({ lineItems: [] })
      return jsonResponse(listingsPayload([expiredListing], 1))
    })
    const root = document.implementation.createHTMLDocument()

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root, cookie: "" })).resolves.toEqual([
      { ...expiredListing, removal: [] },
    ])
    expect(fetchImpl).toHaveBeenCalledWith(INVENTORY_MANAGE_URL, expect.objectContaining({
      method: "GET",
      credentials: "include",
    }))
    expect(fetchImpl).toHaveBeenCalledWith(UNFULFILLABLE_GQL_URL, expect.objectContaining({
      headers: expect.objectContaining({ "anti-csrftoken-a2z": "html-csrf" }),
    }))
  })

  it("parses either meta attribute order", () => {
    expect(readAntiCsrfTokenFromHtml('<meta content="token-a" name="anti-csrftoken-a2z">')).toBe("token-a")
    expect(readAntiCsrfTokenFromHtml('<meta name="anti-csrftoken-a2z" content="token-b">')).toBe("token-b")
  })

  it("throws when Seller Central returns a failed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'
    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).rejects.toThrow(
      "Couldn’t load unfulfillable inventory (403).",
    )
  })

  it("returns an empty list when the store has no unfulfillable inventory", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([], 0)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("keeps page-1 listings when a later GraphQL page fails", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing], 2, "page-2")))
      .mockResolvedValueOnce(jsonResponse({}, 403))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [], listingsIncomplete: true },
    ])
  })

  it("keeps valid SKUs when a page includes null listings and GraphQL errors", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        errors: [{ message: "Inaccessible listing" }],
        ...listingsPayload([expiredListing, null], 2),
      }))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [], listingsIncomplete: true },
    ])
  })

  it("continues paging when an empty page still reports remaining listings", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([], 1, "page-2")))
      .mockResolvedValueOnce(jsonResponse(listingsPayload([mixedListing], 1, null)))
      .mockResolvedValue(jsonResponse({ lineItems: [] }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...mixedListing, removal: [] },
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it("keeps listings when a removal-status batch fails", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload([expiredListing, mixedListing], 2)))
      .mockResolvedValueOnce(jsonResponse({}, 400))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    await expect(fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })).resolves.toEqual([
      { ...expiredListing, removal: [], removalFetchFailed: true },
      { ...mixedListing, removal: [], removalFetchFailed: true },
    ])
    expect(unfulfillableSheetRows([
      { ...expiredListing, removal: [], removalFetchFailed: true },
      { ...mixedListing, removal: [], removalFetchFailed: true },
    ])[0]).toEqual([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE])
  })

  it("merges successful removal batches and skips a failed batch", async () => {
    const listings = Array.from({ length: UNFULFILLABLE_INVENTORIES_BATCH_SIZE + 1 }, (_, index) => (
      listingWithSkus(`SKU-${index}`, `FN-${index}`)
    ))
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(listingsPayload(listings, listings.length)))
      .mockResolvedValueOnce(jsonResponse({
        lineItems: [{
          merchantSku: "SKU-0",
          fulfillmentNetworkSku: "FN-0",
          totalSellableQuantity: 0,
          totalUnsellableQuantity: 2,
          unsellableIneligibleQuantity: 0,
          unsellableIneligibleQuantities: [],
        }],
      }))
      .mockResolvedValueOnce(jsonResponse({ message: "inaccessible" }))
    const root = document.implementation.createHTMLDocument()
    root.head.innerHTML = '<meta name="anti-csrftoken-a2z" content="csrf-token">'

    const result = await fetchUnfulfillableListings({ fetch: fetchImpl as unknown as typeof fetch, root })
    expect(result).toHaveLength(listings.length)
    expect(result[0]?.removal).toEqual([{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 2 }])
    expect(result[0]?.removalFetchFailed).toBeUndefined()
    expect(result[UNFULFILLABLE_INVENTORIES_BATCH_SIZE]?.removal).toEqual([])
    expect(result[UNFULFILLABLE_INVENTORIES_BATCH_SIZE]?.removalFetchFailed).toBe(true)
    expect(unfulfillableSheetRows(result)[0]).toEqual([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE])
    expect(unfulfillableSheetRows(result).at(-1)?.[14]).toBe(REMOVAL_STATUS_UNAVAILABLE)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })
})
