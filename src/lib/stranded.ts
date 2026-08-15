import type { ReportProgressEvent } from "./reportProgress"

export const STRANDED_INVENTORY_URL = "https://sellercentral.amazon.com/inventoryplanning/stranded-inventory"
export const STRANDED_DATE_TIME_ZONE = "America/New_York"

export const STRANDED_SHEET_HEADERS = [
  "SKU",
  "Condition",
  "Product Name",
  "ASIN",
  "FNSKU",
  "Status",
  "Status secondary",
  "Price",
  "Currency",
  "Available",
  "Total",
  "Reserved",
  "Inbound",
  "Unfulfillable",
  "Auto removal date",
  "Auto removal type",
  "Date stranded",
  "Stranded reason",
  "Stranded reason code",
  "Error message",
  "Fulfilled by",
  "Program",
  "Actions",
] as const

const AUTO_REMOVAL_TYPE_LABELS: Record<string, string> = {
  RETURN: "Return to seller",
}

export interface StrandedListing {
  SKU?: string
  ASIN?: string
  FNSKU?: string
  ProductName?: string
  Condition?: string
  Status?: string
  StatusSecondary?: string
  Price?: string
  PriceUnit?: string
  Available?: string
  TotalQuantity?: string
  Reserved?: string
  Inbound?: string
  Unfulfillable?: string
  DateAutoRemoval?: string
  AutoRemovalType?: string
  DateStranded?: string
  StrandedReason?: string
  StrandedReasonCode?: string
  StrandedReasonLabel?: string
  ErrorMessage?: string
  FulfilledBy?: string
  Program?: string
  SupportedActions?: string
}

export interface FetchStrandedListingsOptions {
  fetch?: typeof globalThis.fetch
  onProgress?: (event: ReportProgressEvent) => void
}

function strandedCell(value: string | number | null | undefined): string {
  if (value == null) return ""
  return String(value)
}

function strandedNumericCell(value: string | number | null | undefined): number | "" {
  if (value == null || value === "") return ""
  const amount = typeof value === "number" ? value : Number(value)
  return Number.isFinite(amount) ? amount : ""
}

function strandedQuantity(value: string | number | null | undefined): number {
  const amount = strandedNumericCell(value)
  return amount === "" ? 0 : amount
}

function strandedStringField(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  return value
}

export function formatStrandedDate(value: string | null | undefined): string {
  if (!value) return ""
  const ms = Number(value)
  if (!Number.isFinite(ms)) return value
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("en-US", {
    timeZone: STRANDED_DATE_TIME_ZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date)
}

export function autoRemovalTypeLabel(value: string | null | undefined): string {
  if (!value) return ""
  return AUTO_REMOVAL_TYPE_LABELS[value] ?? value
}

export function formatSupportedActions(value: string | null | undefined): string {
  if (!value) return ""
  return value.split("#").map((action) => action.trim()).filter(Boolean).join(", ")
}

export function parseStrandedHeaderCount(html: string): number | undefined {
  const match = html.match(/id=["']mt-header-count-value["'][^>]*>([^<]*)/i)
  if (!match) return undefined
  const count = Number(match[1].replace(/,/g, "").trim())
  return Number.isFinite(count) ? count : undefined
}

function parseFilterLabelMap(root: ParentNode): Map<string, string> {
  const labels = new Map<string, string>()
  for (const node of root.querySelectorAll("[data-stranded-filter-changed]")) {
    const raw = node.getAttribute("data-stranded-filter-changed")
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as {
        filterId?: unknown
        filterReadableValue?: unknown
        filterGroupId?: unknown
      }
      if (parsed.filterGroupId !== "stranded_reason") continue
      const id = typeof parsed.filterId === "string" ? parsed.filterId.trim() : ""
      if (!id || id === "All") continue
      const label = typeof parsed.filterReadableValue === "string" ? parsed.filterReadableValue.trim() : ""
      if (label) labels.set(id, label)
    } catch {
      /* ignore malformed filter metadata */
    }
  }
  return labels
}

function asStrandedListing(value: unknown, labels: ReadonlyMap<string, string>): StrandedListing | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const listing: StrandedListing = {}
  const sku = strandedStringField(record.SKU)
  const asin = strandedStringField(record.ASIN)
  const fnsku = strandedStringField(record.FNSKU)
  const productName = strandedStringField(record.ProductName)
  const condition = strandedStringField(record.Condition)
  const status = strandedStringField(record.Status)
  const statusSecondary = strandedStringField(record.StatusSecondary)
  const price = strandedStringField(record.Price)
  const priceUnit = strandedStringField(record.PriceUnit)
  const available = strandedStringField(record.Available)
  const totalQuantity = strandedStringField(record.TotalQuantity)
  const reserved = strandedStringField(record.Reserved)
  const inbound = strandedStringField(record.Inbound)
  const unfulfillable = strandedStringField(record.Unfulfillable)
  const dateAutoRemoval = strandedStringField(record.DateAutoRemoval)
  const autoRemovalType = strandedStringField(record.AutoRemovalType)
  const dateStranded = strandedStringField(record.DateStranded)
  const strandedReason = strandedStringField(record.StrandedReason)
  const strandedReasonCode = strandedStringField(record.StrandedReasonCode)
  const errorMessage = strandedStringField(record.ErrorMessage)
  const fulfilledBy = strandedStringField(record.FulfilledBy)
  const program = strandedStringField(record.Program)
  const supportedActions = strandedStringField(record.SupportedActions)
  if (sku !== undefined) listing.SKU = sku
  if (asin !== undefined) listing.ASIN = asin
  if (fnsku !== undefined) listing.FNSKU = fnsku
  if (productName !== undefined) listing.ProductName = productName
  if (condition !== undefined) listing.Condition = condition
  if (status !== undefined) listing.Status = status
  if (statusSecondary !== undefined) listing.StatusSecondary = statusSecondary
  if (price !== undefined) listing.Price = price
  if (priceUnit !== undefined) listing.PriceUnit = priceUnit
  if (available !== undefined) listing.Available = available
  if (totalQuantity !== undefined) listing.TotalQuantity = totalQuantity
  if (reserved !== undefined) listing.Reserved = reserved
  if (inbound !== undefined) listing.Inbound = inbound
  if (unfulfillable !== undefined) listing.Unfulfillable = unfulfillable
  if (dateAutoRemoval !== undefined) listing.DateAutoRemoval = dateAutoRemoval
  if (autoRemovalType !== undefined) listing.AutoRemovalType = autoRemovalType
  if (dateStranded !== undefined) listing.DateStranded = dateStranded
  if (strandedReason !== undefined) listing.StrandedReason = strandedReason
  if (strandedReasonCode !== undefined) listing.StrandedReasonCode = strandedReasonCode
  if (errorMessage !== undefined) listing.ErrorMessage = errorMessage
  if (fulfilledBy !== undefined) listing.FulfilledBy = fulfilledBy
  if (program !== undefined) listing.Program = program
  if (supportedActions !== undefined) listing.SupportedActions = supportedActions
  const reasonCode = (listing.StrandedReasonCode || listing.StrandedReason || "").trim()
  const reasonLabel = (reasonCode && labels.get(reasonCode)) || listing.ErrorMessage?.trim() || reasonCode
  if (reasonLabel) listing.StrandedReasonLabel = reasonLabel
  return listing
}

export function parseStrandedInventoryHtml(html: string): StrandedListing[] {
  const root = new DOMParser().parseFromString(html, "text/html")
  const labels = parseFilterLabelMap(root)
  const listings: StrandedListing[] = []
  for (const row of root.querySelectorAll("tr[data-row-data]")) {
    const raw = row.getAttribute("data-row-data")
    if (!raw) continue
    try {
      const listing = asStrandedListing(JSON.parse(raw), labels)
      if (listing) listings.push(listing)
    } catch {
      /* ignore malformed row payloads */
    }
  }
  const count = parseStrandedHeaderCount(html)
  if (count === undefined && listings.length === 0) {
    throw new Error("Couldn’t load stranded inventory.")
  }
  if (count !== undefined && count > listings.length) {
    throw new Error(`Couldn’t load all stranded inventory (${listings.length} of ${count} listings).`)
  }
  return listings
}

export function strandedSheetRow(listing: StrandedListing): Array<string | number> {
  return [
    strandedCell(listing.SKU),
    strandedCell(listing.Condition),
    strandedCell(listing.ProductName),
    strandedCell(listing.ASIN),
    strandedCell(listing.FNSKU),
    strandedCell(listing.Status),
    strandedCell(listing.StatusSecondary),
    strandedNumericCell(listing.Price),
    strandedCell(listing.PriceUnit),
    strandedQuantity(listing.Available),
    strandedQuantity(listing.TotalQuantity),
    strandedQuantity(listing.Reserved),
    strandedQuantity(listing.Inbound),
    strandedQuantity(listing.Unfulfillable),
    formatStrandedDate(listing.DateAutoRemoval),
    autoRemovalTypeLabel(listing.AutoRemovalType),
    formatStrandedDate(listing.DateStranded),
    strandedCell(listing.StrandedReasonLabel || listing.ErrorMessage || listing.StrandedReasonCode || listing.StrandedReason),
    strandedCell(listing.StrandedReasonCode || listing.StrandedReason),
    strandedCell(listing.ErrorMessage),
    strandedCell(listing.FulfilledBy),
    strandedCell(listing.Program),
    formatSupportedActions(listing.SupportedActions),
  ]
}

export function strandedSheetRows(listings: readonly StrandedListing[]): Array<Array<string | number>> {
  return [[...STRANDED_SHEET_HEADERS], ...listings.map(strandedSheetRow)]
}

export async function fetchStrandedListings(
  options: FetchStrandedListingsOptions = {},
): Promise<StrandedListing[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  options.onProgress?.({ source: "stranded", status: "active" })
  const response = await fetchImpl(STRANDED_INVENTORY_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      accept: "text/html",
    },
  })

  if (!response.ok) throw new Error(`Couldn’t load stranded inventory (${response.status}).`)

  let html: string
  try {
    html = await response.text()
  } catch {
    throw new Error("Couldn’t load stranded inventory.")
  }

  const listings = parseStrandedInventoryHtml(html)
  options.onProgress?.({ source: "stranded", status: "complete", loaded: listings.length, total: listings.length })
  return listings
}
