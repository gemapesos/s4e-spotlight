import { dailyTasksSheetRows } from "./dailyTasks"
import { formatDayMonthYear } from "./dates"
import type { SellerFeedback } from "./feedback"
import { shippingQueueSheetRows, type ShippingQueueShipment } from "./shippingQueue"
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
