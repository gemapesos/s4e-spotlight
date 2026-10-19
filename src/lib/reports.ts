import { dailyTasksSheetRows } from "./dailyTasks"
import { formatDayMonthYear } from "./dates"
import type { SellerFeedback } from "./feedback"
import type { ReportSource } from "./reportProgress"
import { shipmentDetailsIncomplete, shippingQueueSheetRows, type ShippingQueueShipment } from "./shippingQueue"
import { strandedSheetRows, type StrandedListing } from "./stranded"
import { suppressedSheetRows, type SuppressedListing } from "./suppressed"
import { unfulfillableSheetRows, type UnfulfillableListing } from "./unfulfillable"
import { buildWorkbook, type WorkbookSheet } from "./xlsxWorkbook"

export const REPORT_SHEETS = [
  "Daily Tasks",
  "Unfulfillable",
  "Stranded",
  "Suppressed",
  "Shipping Queue",
] as const

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g

export function formatReportDate(date: Date): string {
  return formatDayMonthYear(date)
}

export function sanitizeStoreName(storeName: string): string {
  const cleaned = storeName.replace(UNSAFE_FILENAME_CHARS, " ").replace(/\s+/g, " ").trim()
  return cleaned || "Unknown"
}

export function reportFileName(storeName: string, date: Date = new Date()): string {
  return `${sanitizeStoreName(storeName)} - ${formatReportDate(date)}.xlsx`
}

export function sheetsReportFileName(storeName: string, date: Date = new Date()): string {
  return `${sanitizeStoreName(storeName)} - ${formatReportDate(date)} - Sheets.xlsx`
}

export interface GeneratedReport {
  storeName: string
  generatedAt: Date
  unfulfillableListings: readonly UnfulfillableListing[]
  nextRemovalOrderId?: string | null
  feedbacks: readonly SellerFeedback[]
  strandedListings: readonly StrandedListing[]
  suppressedListings: readonly SuppressedListing[]
  shipments: readonly ShippingQueueShipment[]
}

export type ReportDownloadFormat = "raw" | "sheets"

export interface ReportWarning {
  source: ReportSource
  text: string
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

/**
 * Sections that loaded only partly. The Raw workbook notes these above each sheet, but the
 * Sheets download has no room for notes, so the palette shows them instead.
 */
export function reportWarnings(report: GeneratedReport): ReportWarning[] {
  const warnings: ReportWarning[] = []
  const add = (source: ReportSource, text: string) => warnings.push({ source, text })
  const countWhere = <T>(items: readonly T[], test: (item: T) => unknown) => items.filter(test).length
  const { unfulfillableListings: unfulfillable, feedbacks, suppressedListings: suppressed, shipments } = report

  if (unfulfillable.some((listing) => listing.listingsIncomplete)) {
    add("unfulfillable", `Only ${plural(unfulfillable.length, "unfulfillable listing")} loaded; Seller Central lists more.`)
  }
  const removalMissing = countWhere(unfulfillable, (listing) => listing.removalFetchFailed)
  if (removalMissing) add("unfulfillable", `Removal status is missing for ${plural(removalMissing, "SKU")}.`)
  if (feedbacks.some((feedback) => feedback.feedbackIncomplete)) {
    add("feedback", `Only ${plural(feedbacks.length, "feedback entry", "feedback entries")} loaded; Seller Central has more.`)
  }
  if (suppressed.some((listing) => listing.listingsIncomplete)) {
    add("suppressed", "Some search-suppressed listings couldn’t be loaded.")
  }
  const issuesMissing = countWhere(suppressed, (listing) => listing.issuesFetchFailed)
  if (issuesMissing) add("suppressed", `Suppression reasons are missing for ${plural(issuesMissing, "SKU")}.`)
  if (shipments.some((shipment) => shipment.listingsIncomplete)) add("shippingQueue", "Some shipments couldn’t be listed.")
  const detailsMissing = countWhere(shipments, (shipment) => shipment.detailsFetchFailed)
  if (detailsMissing) add("shippingQueue", `Details are missing for ${plural(detailsMissing, "shipment")}.`)
  const linesMissing = countWhere(shipments, (shipment) => shipmentDetailsIncomplete(shipment.details))
  if (linesMissing) add("shippingQueue", `SKU lines are incomplete for ${plural(linesMissing, "shipment")}.`)
  return warnings
}

export function reportWorkbookSheets(report: Partial<Pick<
  GeneratedReport,
  "unfulfillableListings" | "feedbacks" | "strandedListings" | "suppressedListings" | "shipments"
>> = {}): WorkbookSheet[] {
  const rowsBySheet: Record<(typeof REPORT_SHEETS)[number], () => WorkbookSheet["rows"]> = {
    "Daily Tasks": () => dailyTasksSheetRows(report.feedbacks ?? []),
    Unfulfillable: () => unfulfillableSheetRows(report.unfulfillableListings ?? []),
    Stranded: () => strandedSheetRows(report.strandedListings ?? []),
    Suppressed: () => suppressedSheetRows(report.suppressedListings ?? []),
    "Shipping Queue": () => shippingQueueSheetRows(report.shipments ?? []),
  }
  return REPORT_SHEETS.map((name) => ({ name, rows: rowsBySheet[name]() }))
}

export function buildReportWorkbook(sheets: readonly WorkbookSheet[] = REPORT_SHEETS.map((name) => ({ name }))): Uint8Array {
  return buildWorkbook(sheets)
}

export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  targetDocument: Document = document,
): void {
  const payload = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(payload).set(bytes)
  const blob = new Blob([payload], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const anchor = targetDocument.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.tabIndex = -1
  anchor.setAttribute("aria-hidden", "true")
  anchor.style.position = "fixed"
  anchor.style.left = "-9999px"
  anchor.style.top = "0"
  targetDocument.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
