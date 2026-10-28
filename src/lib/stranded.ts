import type { ReportProgressEvent } from "./reportProgress"
import { numberCell, quantityCell, textCell } from "@/shared/format"

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

/** String fields copied as-is from each row's data-row-data JSON. */
const STRANDED_ROW_FIELDS = [
  "SKU",
  "ASIN",
  "FNSKU",
  "ProductName",
  "Condition",
  "Status",
  "StatusSecondary",
  "Price",
  "PriceUnit",
  "Available",
  "TotalQuantity",
  "Reserved",
  "Inbound",
  "Unfulfillable",
  "DateAutoRemoval",
  "AutoRemovalType",
  "DateStranded",
  "StrandedReason",
  "StrandedReasonCode",
  "ErrorMessage",
  "FulfilledBy",
  "Program",
  "SupportedActions",
] as const satisfies ReadonlyArray<Exclude<keyof StrandedListing, "StrandedReasonLabel">>

function asStrandedListing(value: unknown, labels: ReadonlyMap<string, string>): StrandedListing | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const listing: StrandedListing = {}
  for (const field of STRANDED_ROW_FIELDS) {
    const fieldValue = record[field]
    if (typeof fieldValue === "string") listing[field] = fieldValue
  }
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
    textCell(listing.SKU),
    textCell(listing.Condition),
    textCell(listing.ProductName),
    textCell(listing.ASIN),
    textCell(listing.FNSKU),
    textCell(listing.Status),
    textCell(listing.StatusSecondary),
    numberCell(listing.Price),
    textCell(listing.PriceUnit),
    quantityCell(listing.Available),
    quantityCell(listing.TotalQuantity),
    quantityCell(listing.Reserved),
    quantityCell(listing.Inbound),
    quantityCell(listing.Unfulfillable),
    formatStrandedDate(listing.DateAutoRemoval),
    autoRemovalTypeLabel(listing.AutoRemovalType),
    formatStrandedDate(listing.DateStranded),
    textCell(listing.StrandedReasonLabel || listing.ErrorMessage || listing.StrandedReasonCode || listing.StrandedReason),
    textCell(listing.StrandedReasonCode || listing.StrandedReason),
    textCell(listing.ErrorMessage),
    textCell(listing.FulfilledBy),
    textCell(listing.Program),
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
