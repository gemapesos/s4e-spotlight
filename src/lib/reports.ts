import { dailyTasksSheetRows } from "./dailyTasks"
import type { SellerFeedback } from "./feedback"
import { strandedSheetRows, type StrandedListing } from "./stranded"
import { unfulfillableSheetRows, type UnfulfillableListing } from "./unfulfillable"
import { buildWorkbook, type WorkbookSheet } from "./xlsxWorkbook"

export const REPORT_SHEETS = [
  "Daily Tasks",
  "Unfulfillable",
  "Stranded",
  "Suppressed",
  "Shipping Queue",
] as const

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const UNSAFE_FILENAME_CHARS = /[/\\:*?"<>|]/g

export function formatReportDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = MONTHS[date.getMonth()]
  return `${day}-${month}-${date.getFullYear()}`
}

export function sanitizeStoreName(storeName: string): string {
  const cleaned = storeName.replace(UNSAFE_FILENAME_CHARS, " ").replace(/\s+/g, " ").trim()
  return cleaned || "Unknown"
}

export function reportFileName(storeName: string, date: Date = new Date()): string {
  return `${sanitizeStoreName(storeName)} - ${formatReportDate(date)}.xlsx`
}

export function reportWorkbookSheets(
  unfulfillableListings: readonly UnfulfillableListing[] = [],
  feedbacks: readonly SellerFeedback[] = [],
  strandedListings: readonly StrandedListing[] = [],
): WorkbookSheet[] {
  return REPORT_SHEETS.map((name) => {
    if (name === "Daily Tasks") return { name, rows: dailyTasksSheetRows(feedbacks) }
    if (name === "Unfulfillable") return { name, rows: unfulfillableSheetRows(unfulfillableListings) }
    if (name === "Stranded") return { name, rows: strandedSheetRows(strandedListings) }
    return { name }
  })
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
  targetDocument.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
