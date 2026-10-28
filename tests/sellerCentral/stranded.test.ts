import { describe, expect, it, vi } from "vitest"

import {
  STRANDED_INVENTORY_URL,
  STRANDED_SHEET_HEADERS,
  autoRemovalTypeLabel,
  fetchStrandedListings,
  formatStrandedDate,
  formatSupportedActions,
  parseStrandedHeaderCount,
  parseStrandedInventoryHtml,
  strandedSheetRows,
  type StrandedListing,
} from "../../src/sellerCentral/stranded"

const noPriceRow = {
  SKU: "2026-07-24-B0F2KGX1K3-15700",
  ASIN: "B0F2KGX1K3",
  FNSKU: "X0057P952X",
  ProductName: "HEYDUDE Wally Funk Jersey Jacquard - Black/Multi",
  Condition: "New",
  Status: "Incomplete",
  Price: "0.0",
  PriceUnit: "USD",
  Available: "1",
  TotalQuantity: "1",
  Reserved: "0",
  Inbound: "0",
  Unfulfillable: "0",
  DateAutoRemoval: "1787911200000",
  AutoRemovalType: "RETURN",
  DateStranded: "1786498521898",
  StrandedReason: "ERR_NO_PRICE",
  StrandedReasonCode: "ERR_NO_PRICE",
  FulfilledBy: "Amazon",
  Program: "",
  SupportedActions: "EditListing#RemovalOrder#RefreshSIRC#PostponeAutoRemoval",
}

const highPriceRow = {
  SKU: "20240925_17.00_Fortnum_74625",
  ASIN: "B07JGG47S8",
  FNSKU: "X004EPMZU1",
  ProductName: "Fortnum & Mason British, Piccadilly Chocolate Pear",
  Condition: "New",
  Status: "Inactive",
  StatusSecondary: "Blocked",
  Price: "31.0",
  PriceUnit: "USD",
  Available: "5",
  TotalQuantity: "5",
  Reserved: "0",
  Inbound: "0",
  Unfulfillable: "0",
  DateStranded: "1786728932585",
  StrandedReason: "ERR_PRICE_HIGH",
  StrandedReasonCode: "ERR_PRICE_HIGH",
  ErrorMessage: "Potential High Pricing Error",
  FulfilledBy: "Amazon",
  Program: "",
  SupportedActions: "FixInvalidPrice#RemovalOrder#RefreshSIRC",
}

function attrJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function strandedPageHtml(options: {
  count?: number | string
  rows?: unknown[]
  includeFilters?: boolean
} = {}): string {
  const rows = (options.rows ?? [noPriceRow, highPriceRow])
    .map((row) => `<tr class="mt-row" data-row-data="${attrJson(row)}"></tr>`)
    .join("")
  const count = options.count === undefined
    ? (options.rows ?? [noPriceRow, highPriceRow]).length
    : options.count
  const filters = options.includeFilters === false
    ? ""
    : `
<span data-stranded-filter-changed="${attrJson({
  filterId: "ERR_NO_PRICE",
  filterReadableValue: "Missing price",
  filterGroupId: "stranded_reason",
})}"></span>
<span data-stranded-filter-changed="${attrJson({
  filterId: "ERR_PRICE_HIGH",
  filterReadableValue: "Potential high pricing error",
  filterGroupId: "stranded_reason",
})}"></span>`
  return `<!doctype html><html><body>
<div class="mt-header-count"><span id="mt-header-count-value">${count}</span> product(s)</div>
${filters}
<table><tbody>${rows}</tbody></table>
</body></html>`
}

function htmlResponse(html: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => html,
  }
}

describe("stranded date helpers", () => {
  it("formats epoch milliseconds as America/New_York MM/DD/YYYY", () => {
    expect(formatStrandedDate("1786498521898")).toBe("08/11/2026")
    expect(formatStrandedDate("1786728932585")).toBe("08/14/2026")
    expect(formatStrandedDate("1787911200000")).toBe("08/28/2026")
    expect(formatStrandedDate(undefined)).toBe("")
    expect(formatStrandedDate("not-a-date")).toBe("not-a-date")
  })

  it("maps RETURN auto-removal to Return to seller", () => {
    expect(autoRemovalTypeLabel("RETURN")).toBe("Return to seller")
    expect(autoRemovalTypeLabel(undefined)).toBe("")
    expect(autoRemovalTypeLabel("LIQUIDATE")).toBe("LIQUIDATE")
  })

  it("joins supported actions with commas", () => {
    expect(formatSupportedActions(noPriceRow.SupportedActions)).toBe(
      "EditListing, RemovalOrder, RefreshSIRC, PostponeAutoRemoval",
    )
    expect(formatSupportedActions("")).toBe("")
  })
})

describe("parseStrandedInventoryHtml", () => {
  it("reads data-row-data listings and stranded reason labels", () => {
    const listings = parseStrandedInventoryHtml(strandedPageHtml())
    expect(listings).toHaveLength(2)
    expect(listings[0]).toMatchObject({
      SKU: noPriceRow.SKU,
      ASIN: noPriceRow.ASIN,
      FNSKU: noPriceRow.FNSKU,
      Status: "Incomplete",
      AutoRemovalType: "RETURN",
      StrandedReasonCode: "ERR_NO_PRICE",
      StrandedReasonLabel: "Missing price",
    })
    expect(listings[1]).toMatchObject({
      SKU: highPriceRow.SKU,
      Status: "Inactive",
      StatusSecondary: "Blocked",
      ErrorMessage: "Potential High Pricing Error",
      StrandedReasonLabel: "Potential high pricing error",
    })
    expect(parseStrandedHeaderCount(strandedPageHtml())).toBe(2)
  })

  it("throws when the header count is greater than parsed rows", () => {
    expect(() => parseStrandedInventoryHtml(strandedPageHtml({ count: 3 }))).toThrow(
      "Couldn’t load all stranded inventory (2 of 3 listings).",
    )
  })

  it("throws when the HTML is not the stranded inventory page", () => {
    expect(() => parseStrandedInventoryHtml("<html><body>Sign in</body></html>")).toThrow(
      "Couldn’t load stranded inventory.",
    )
  })

  it("returns an empty list when the page shows zero products", () => {
    expect(parseStrandedInventoryHtml(strandedPageHtml({ count: 0, rows: [] }))).toEqual([])
  })
})

describe("stranded sheet rows", () => {
  it("writes a header and one formatted row per listing", () => {
    const listings: StrandedListing[] = parseStrandedInventoryHtml(strandedPageHtml())
    const rows = strandedSheetRows(listings)
    expect(rows[0]).toEqual([...STRANDED_SHEET_HEADERS])
    expect(rows[1]).toEqual([
      "2026-07-24-B0F2KGX1K3-15700",
      "New",
      "HEYDUDE Wally Funk Jersey Jacquard - Black/Multi",
      "B0F2KGX1K3",
      "X0057P952X",
      "Incomplete",
      "",
      0,
      "USD",
      1,
      1,
      0,
      0,
      0,
      "08/28/2026",
      "Return to seller",
      "08/11/2026",
      "Missing price",
      "ERR_NO_PRICE",
      "",
      "Amazon",
      "",
      "EditListing, RemovalOrder, RefreshSIRC, PostponeAutoRemoval",
    ])
    expect(rows[2]).toEqual([
      "20240925_17.00_Fortnum_74625",
      "New",
      "Fortnum & Mason British, Piccadilly Chocolate Pear",
      "B07JGG47S8",
      "X004EPMZU1",
      "Inactive",
      "Blocked",
      31,
      "USD",
      5,
      5,
      0,
      0,
      0,
      "",
      "",
      "08/14/2026",
      "Potential high pricing error",
      "ERR_PRICE_HIGH",
      "Potential High Pricing Error",
      "Amazon",
      "",
      "FixInvalidPrice, RemovalOrder, RefreshSIRC",
    ])
  })
})

describe("fetchStrandedListings", () => {
  it("GETs the stranded inventory document and parses listings", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(strandedPageHtml()))
    await expect(fetchStrandedListings({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toMatchObject([
      { SKU: noPriceRow.SKU, StrandedReasonLabel: "Missing price" },
      { SKU: highPriceRow.SKU, StrandedReasonLabel: "Potential high pricing error" },
    ])
    expect(fetchImpl).toHaveBeenCalledWith(STRANDED_INVENTORY_URL, expect.objectContaining({
      method: "GET",
      credentials: "include",
      headers: expect.objectContaining({ accept: "text/html" }),
    }))
  })

  it("reports stranded fetch start and completion", async () => {
    const onProgress = vi.fn()
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse(strandedPageHtml()))
    await fetchStrandedListings({ fetch: fetchImpl as unknown as typeof fetch, onProgress })
    expect(onProgress).toHaveBeenNthCalledWith(1, { source: "stranded", status: "active" })
    expect(onProgress).toHaveBeenNthCalledWith(2, expect.objectContaining({
      source: "stranded",
      status: "complete",
      loaded: 2,
      total: 2,
    }))
  })

  it("throws when Seller Central returns a failed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(htmlResponse("nope", 403))
    await expect(fetchStrandedListings({ fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      "Couldn’t load stranded inventory (403).",
    )
  })
})
