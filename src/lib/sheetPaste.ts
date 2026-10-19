import { formatDayMonthYear, MONTH_ABBREVIATIONS } from "./dates"
import { FEEDBACK_SHEET_HEADERS, feedbackSheetRows, type SellerFeedback } from "./feedback"
import type { ReportSource } from "./reportProgress"
import { reportIncludes, sanitizeStoreName } from "./reports"
import {
  formatShippingQueueDate,
  oldestShipmentsFirst,
  requiredDocumentLabel,
  shippingQueueLineStatus,
  SHIPPING_STATUS_MONITORING,
  SHIPPING_STATUS_NEW,
  SHIPPING_STATUS_UNAVAILABLE,
  type ShippingQueueShipment,
} from "./shippingQueue"
import { STRANDED_SHEET_HEADERS, strandedSheetRows, type StrandedListing } from "./stranded"
import { SUPPRESSED_SHEET_HEADERS, suppressedSheetRows, type SuppressedListing } from "./suppressed"
import {
  REMOVAL_STATUS_BY_CODE,
  REMOVAL_STATUS_ELIGIBLE,
  UNFULFILLABLE_SHEET_HEADERS,
  unfulfillableSheetRows,
  type UnfulfillableListing,
} from "./unfulfillable"
import type { WorkbookCell, WorkbookSheet } from "./xlsxWorkbook"

export const SHEET_PASTE_SHEETS = [
  "UnfulfillableDisposals",
  "Stranded",
  "Feedback",
  "SuppressedLE",
  "Shipping Queue",
] as const

const JMG_OUTDOORS_STORE = "JMG Outdoors"

type PasteColumn = {
  header: string
  source?: string
  date?: boolean
}

const UNFULFILLABLE_COLUMNS: readonly PasteColumn[] = [
  { header: "Date" },
  { header: "MSKU", source: "SKU" },
  { header: "Product Name", source: "Title" },
  { header: "Carrier Damaged", source: "Carrier Damaged" },
  { header: "Customer Damaged", source: "Customer Damaged" },
  { header: "Defective", source: "Defective" },
  { header: "Expired", source: "Expired" },
  { header: "Warehouse Damaged", source: "Warehouse Damaged" },
  { header: "Total Quantity", source: "Unfulfillable" },
  { header: "Action" },
  { header: "Date of E-Mail" },
  { header: "Removal Order ID" },
  { header: "Case ID" },
  { header: "Case Status" },
  { header: "Additional Notes" },
]

const JMG_PRODUCT_COLUMN: PasteColumn = { header: "Product" }

const STRANDED_COLUMNS: readonly PasteColumn[] = [
  { header: "Date" },
  { header: "ASIN", source: "ASIN" },
  { header: "MSKU", source: "SKU" },
  { header: "Product Name", source: "Product Name" },
  { header: "Condition", source: "Condition" },
  { header: "Stranded Reason", source: "Stranded reason" },
  { header: "Action" },
  { header: "Other Actions" },
  { header: "Date of E-Mail" },
  { header: "Removal Order ID" },
  { header: "Case ID" },
  { header: "Case Status" },
]

const FEEDBACK_COLUMNS: readonly PasteColumn[] = [
  { header: "Date" },
  { header: "Feedback Date", source: "Date", date: true },
  { header: "Order ID", source: "Order ID" },
  { header: "Feedback Rating", source: "Rating" },
  { header: "Action" },
  { header: "Other Actions" },
  { header: "Date of E-Mail" },
  { header: "Case ID" },
  { header: "Case Status" },
]

const SUPPRESSED_COLUMNS: readonly PasteColumn[] = [
  { header: "Date" },
  { header: "MSKU", source: "SKU" },
  { header: "ASIN", source: "ASIN" },
  { header: "Product Name", source: "Title" },
  { header: "Reason for Suppressed/LE", source: "Issue" },
  { header: "Action" },
  { header: "Other Actions" },
  { header: "Date of E-Mail" },
  { header: "Removal Order ID" },
  { header: "Case ID" },
  { header: "Case Status" },
]

const SHIPPING_COLUMNS: readonly PasteColumn[] = [
  { header: "Date of Reconciliation" },
  { header: "Shipment Date", source: "Created Date", date: true },
  { header: "Shipment ID", source: "Shipment ID" },
  { header: "SKU", source: "SKU" },
  { header: "Discrepancy", source: "Item Discrepancy Quantity" },
  { header: "Required Document" },
  { header: "Status" },
  { header: "Action" },
  { header: "Date of E-Mail" },
  { header: "Reimbursement ID" },
  { header: "Amount / Unit" },
  { header: "Case ID" },
  { header: "Case Status" },
]

const SHEET_MONTH_BY_NAME: Record<string, string> = Object.fromEntries(
  MONTH_ABBREVIATIONS.map((month) => [month.toLowerCase(), month]),
)

const SHEET_MONTH_BY_NUMBER: Record<string, string> = Object.fromEntries(
  MONTH_ABBREVIATIONS.map((month, index) => [String(index + 1).padStart(2, "0"), month]),
)

const SHEET_DATE_TEXT = /^(\d{2})-([A-Za-z]{3}|\d{2})-(\d{4})/
const ACTION_MULTIPLE = "Multiple Actions Applicable - Refer to Additional Notes for Details"
const ACTION_MANUAL = "Manual Removal Order Created"
const ACTION_SCHEDULED = "Scheduled for Removal"
const ACTION_TEMPORARY = "Temporarily Unavailable for Removal"
const ACTION_MANUAL_AND_TEMPORARY = "Manual Removal Created and Temporarily Unavailable"
const ACTION_MANUAL_AND_SCHEDULED = "Manual Removal Order Created and Scheduled for Removal"
const ACTION_SCHEDULED_AND_TEMPORARY = "Scheduled for Removal and Temporarily Unavailable"
const ACTION_DAMAGED = "Damaged at the FC - For Monitoring"
const ACTION_UNSUPPORTED = "Temporarily Unavailable"
const NOT_APPLICABLE = "N/A"
const CASE_STATUS_NOT_APPLICABLE = "Not Applicable"
const WORKFLOW_NA_HEADERS = ["Action", "Other Actions", "Date of E-Mail", "Removal Order ID", "Case ID"] as const
/** The only line statuses the Shipping Queue tab keeps. */
const SHIPPING_PASTE_STATUSES: ReadonlySet<string> = new Set([SHIPPING_STATUS_MONITORING, SHIPPING_STATUS_NEW])

const UNFULFILLABLE_FIXED_WIDTH_HEADERS = new Set([
  "Carrier Damaged",
  "Customer Damaged",
  "Defective",
  "Expired",
  "Warehouse Damaged",
  "Total Quantity",
])
const UNFULFILLABLE_FIXED_WIDTH_PX = 70
const UNFULFILLABLE_HEADER_HEIGHT_PX = 32

const REMOVAL_AVAILABLE = [REMOVAL_STATUS_ELIGIBLE, "Available for Removal"]
const REMOVAL_SCHEDULED = [REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest, "Scheduled for Removal"]
const REMOVAL_TEMPORARY = [REMOVAL_STATUS_BY_CODE.InventoryIsBound, "Temporarily Unavailable for Removal"]
const REMOVAL_DAMAGED = [REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged, "Damaged in the Fulfillment Center"]
const REMOVAL_UNSUPPORTED = [
  REMOVAL_STATUS_BY_CODE.InventoryInUnsupportedFc,
  REMOVAL_STATUS_BY_CODE.InventoryInUnsupportedBzFc,
  REMOVAL_STATUS_BY_CODE.InventoryInPickupRemovalUnsupportedFc,
  "In location that can not process Removal",
]

export interface SheetPasteInput {
  storeName: string
  generatedAt: Date
  /** The sections chosen for this report; all of them when absent. */
  sections?: readonly ReportSource[]
  unfulfillableListings: readonly UnfulfillableListing[]
  feedbacks: readonly SellerFeedback[]
  strandedListings: readonly StrandedListing[]
  suppressedListings: readonly SuppressedListing[]
  shipments: readonly ShippingQueueShipment[]
  nextRemovalOrderId?: string | null
}

function unfulfillablePasteColumns(storeName: string): readonly PasteColumn[] {
  if (sanitizeStoreName(storeName) !== JMG_OUTDOORS_STORE) return UNFULFILLABLE_COLUMNS
  return [UNFULFILLABLE_COLUMNS[0], JMG_PRODUCT_COLUMN, ...UNFULFILLABLE_COLUMNS.slice(1)]
}

function unfulfillableFixedColumns(header: readonly WorkbookCell[]): NonNullable<WorkbookSheet["fixedColumns"]> {
  return header.flatMap((cell, index) => (
    typeof cell === "string" && UNFULFILLABLE_FIXED_WIDTH_HEADERS.has(cell)
      ? [{ index, widthPx: UNFULFILLABLE_FIXED_WIDTH_PX, wrapHeader: true }]
      : []
  ))
}

function yesterdaySheetDate(generatedAt: Date): string {
  return formatDayMonthYear(new Date(generatedAt.getFullYear(), generatedAt.getMonth(), generatedAt.getDate() - 1))
}

function toSheetDateText(value: WorkbookCell): WorkbookCell {
  if (typeof value !== "string") return value
  const match = SHEET_DATE_TEXT.exec(value)
  if (!match) return value
  const month = SHEET_MONTH_BY_NAME[match[2].toLowerCase()] ?? SHEET_MONTH_BY_NUMBER[match[2]]
  if (!month) return value
  return `${match[1]}-${month}-${match[3]}`
}

function sourceHeaderIndex(
  rows: readonly (readonly (string | number)[])[],
  sourceHeaders: readonly string[],
): number {
  return rows.findIndex((row) => sourceHeaders.every((header, index) => row[index] === header))
}

function sourceDataColumn(
  rows: readonly (readonly (string | number)[])[],
  sourceHeaders: readonly string[],
  header: string,
): WorkbookCell[] {
  const headerIndex = sourceHeaderIndex(rows, sourceHeaders)
  if (headerIndex < 0) return []
  const column = rows[headerIndex].findIndex((cell) => cell === header)
  if (column < 0) return []
  return rows.slice(headerIndex + 1).map((row) => {
    const value = row[column]
    return value == null || value === "" ? "" : value
  })
}

function withFirstColumnDate(rows: WorkbookCell[][], date: string): WorkbookCell[][] {
  return rows.map((row, index) => {
    if (index === 0) return row
    const next = [...row]
    next[0] = date
    return next
  })
}

function removalSegments(removalStatus: string): string[] {
  return removalStatus.split(/\s*\|\|\s*/).map((segment) => segment.trim()).filter(Boolean)
}

function segmentIncludes(segment: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => segment.includes(phrase))
}

function unfulfillableAction(removalStatus: string): string {
  const segments = removalSegments(removalStatus)
  const available = segments.some((segment) => segmentIncludes(segment, REMOVAL_AVAILABLE))
  const scheduled = segments.some((segment) => segmentIncludes(segment, REMOVAL_SCHEDULED))
  const temporary = segments.some((segment) => segmentIncludes(segment, REMOVAL_TEMPORARY))
  const damaged = segments.some((segment) => segmentIncludes(segment, REMOVAL_DAMAGED))
  const unsupported = segments.some((segment) => segmentIncludes(segment, REMOVAL_UNSUPPORTED))
  if (segments.length > 2) return ACTION_MULTIPLE
  if (damaged && segments.length > 1) return ACTION_MULTIPLE
  if (available && temporary) return ACTION_MANUAL_AND_TEMPORARY
  if (available && scheduled) return ACTION_MANUAL_AND_SCHEDULED
  if (scheduled && temporary) return ACTION_SCHEDULED_AND_TEMPORARY
  if (available) return ACTION_MANUAL
  if (scheduled) return ACTION_SCHEDULED
  if (temporary) return ACTION_TEMPORARY
  if (unsupported) return ACTION_UNSUPPORTED
  if (damaged) return ACTION_DAMAGED
  return ACTION_MULTIPLE
}

function removalOrderIdForStatus(removalStatus: string, nextRemovalOrderId: string | null | undefined): string {
  const available = removalSegments(removalStatus).some((segment) => segmentIncludes(segment, REMOVAL_AVAILABLE))
  return available && nextRemovalOrderId ? nextRemovalOrderId : NOT_APPLICABLE
}

function finishUnfulfillableRows(
  rows: WorkbookCell[][],
  removalStatuses: readonly WorkbookCell[],
  nextRemovalOrderId: string | null | undefined,
): WorkbookCell[][] {
  if (rows.length === 0) return rows
  const header = rows[0]
  const action = header.indexOf("Action")
  const email = header.indexOf("Date of E-Mail")
  const removalOrder = header.indexOf("Removal Order ID")
  const caseId = header.indexOf("Case ID")
  const caseStatus = header.indexOf("Case Status")
  const notes = header.indexOf("Additional Notes")
  return rows.map((row, index) => {
    if (index === 0) return row
    const next = [...row]
    const status = String(removalStatuses[index - 1] ?? "")
    if (action >= 0) next[action] = unfulfillableAction(status)
    if (email >= 0) next[email] = NOT_APPLICABLE
    if (removalOrder >= 0) next[removalOrder] = removalOrderIdForStatus(status, nextRemovalOrderId)
    if (caseId >= 0) next[caseId] = NOT_APPLICABLE
    if (caseStatus >= 0) next[caseStatus] = CASE_STATUS_NOT_APPLICABLE
    if (notes >= 0) next[notes] = status
    return next
  })
}

function fillWorkflowDefaults(rows: WorkbookCell[][]): WorkbookCell[][] {
  if (rows.length === 0) return rows
  const header = rows[0]
  const naColumns = WORKFLOW_NA_HEADERS.map((name) => header.indexOf(name)).filter((index) => index >= 0)
  const caseStatus = header.indexOf("Case Status")
  return rows.map((row, index) => {
    if (index === 0) return row
    const next = [...row]
    for (const column of naColumns) next[column] = NOT_APPLICABLE
    if (caseStatus >= 0) next[caseStatus] = CASE_STATUS_NOT_APPLICABLE
    return next
  })
}

function shippingPasteRows(shipments: readonly ShippingQueueShipment[], reconciliationDate: string): WorkbookCell[][] {
  const rows: WorkbookCell[][] = [SHIPPING_COLUMNS.map((column) => column.header)]
  let previousId = ""
  for (const shipment of oldestShipmentsFirst(shipments)) {
    const items = (shipment.details?.items ?? []).filter((item) => (
      typeof item.totalDiscrepancyQuantity === "number" && item.totalDiscrepancyQuantity < 0
    ))
    const detailsFailed = shipment.detailsFetchFailed === true || !shipment.details
    for (const item of items) {
      const shipmentId = shipment.shipmentId?.trim() ?? ""
      const duplicate = shipmentId !== "" && shipmentId === previousId
      const discrepancy = item.totalDiscrepancyQuantity ?? 0
      const status = shippingQueueLineStatus({
        detailsFailed,
        shipmentIneligibilityReason: shipment.details?.ineligibilityReason,
        itemIneligibilityReason: item.ineligibilityReason,
        discrepancy,
        eligible: shipment.details?.eligible,
      })
      // Failed details read N/A, so every line kept here has its details.
      if (!SHIPPING_PASTE_STATUSES.has(status)) continue
      const caseId = item.caseId?.trim() || NOT_APPLICABLE
      const sku = item.merchantSKU?.trim() || NOT_APPLICABLE
      const shipmentDate = duplicate ? "" : toSheetDateText(formatShippingQueueDate(shipment.createdDate))
      const shipmentIdCell = duplicate ? "" : shipmentId
      // A line without its own shipment date and ID is not reconciled separately.
      const lineReconciliationDate = shipmentDate === "" && shipmentIdCell === "" ? "" : reconciliationDate
      rows.push([
        lineReconciliationDate,
        shipmentDate,
        shipmentIdCell,
        sku,
        discrepancy,
        shipment.documentsFetchFailed
          ? SHIPPING_STATUS_UNAVAILABLE
          : requiredDocumentLabel(shipment.documentTypes, status),
        status,
        NOT_APPLICABLE,
        reconciliationDate,
        NOT_APPLICABLE,
        NOT_APPLICABLE,
        caseId,
        CASE_STATUS_NOT_APPLICABLE,
      ])
      if (shipmentId) previousId = shipmentId
    }
  }
  return rows
}

function projectRows(
  rows: readonly (readonly (string | number)[])[],
  sourceHeaders: readonly string[],
  columns: readonly PasteColumn[],
): WorkbookCell[][] {
  const headerIndex = sourceHeaderIndex(rows, sourceHeaders)
  const headerRow = headerIndex >= 0 ? rows[headerIndex] : sourceHeaders
  const sourceIndex = new Map<string, number>()
  headerRow.forEach((cell, index) => {
    if (typeof cell === "string" && !sourceIndex.has(cell)) sourceIndex.set(cell, index)
  })
  const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1) : []
  return [
    columns.map((column) => column.header),
    ...dataRows.map((row) => columns.map((column) => {
      if (!column.source) return ""
      const index = sourceIndex.get(column.source)
      if (index == null) return ""
      const value = row[index]
      const cell = value == null || value === "" ? "" : value
      return column.date ? toSheetDateText(cell) : cell
    })),
  ]
}

export function sheetPasteSheets(input: SheetPasteInput): WorkbookSheet[] {
  const yesterday = yesterdaySheetDate(input.generatedAt)
  const dated = (rows: WorkbookCell[][]) => withFirstColumnDate(rows, yesterday)
  const tabs: ReadonlyArray<{ source: ReportSource; sheet: () => WorkbookSheet }> = [
    {
      source: "unfulfillable",
      sheet: () => {
        const unfulfillableSource = unfulfillableSheetRows(input.unfulfillableListings)
        const rows = dated(finishUnfulfillableRows(
          projectRows(unfulfillableSource, UNFULFILLABLE_SHEET_HEADERS, unfulfillablePasteColumns(input.storeName)),
          sourceDataColumn(unfulfillableSource, UNFULFILLABLE_SHEET_HEADERS, "Removal Status"),
          input.nextRemovalOrderId,
        ))
        return {
          name: "UnfulfillableDisposals",
          rows,
          fixedColumns: unfulfillableFixedColumns(rows[0] ?? []),
          headerRowHeightPx: UNFULFILLABLE_HEADER_HEIGHT_PX,
        }
      },
    },
    {
      source: "stranded",
      sheet: () => ({
        name: "Stranded",
        rows: dated(fillWorkflowDefaults(projectRows(strandedSheetRows(input.strandedListings), STRANDED_SHEET_HEADERS, STRANDED_COLUMNS))),
      }),
    },
    {
      source: "feedback",
      sheet: () => ({
        name: "Feedback",
        rows: dated(fillWorkflowDefaults(projectRows(
          feedbackSheetRows(input.feedbacks.filter((feedback) => feedback.suppressed === false)),
          FEEDBACK_SHEET_HEADERS,
          FEEDBACK_COLUMNS,
        ))),
      }),
    },
    {
      source: "suppressed",
      sheet: () => ({
        name: "SuppressedLE",
        rows: dated(fillWorkflowDefaults(projectRows(suppressedSheetRows(input.suppressedListings), SUPPRESSED_SHEET_HEADERS, SUPPRESSED_COLUMNS))),
      }),
    },
    {
      source: "shippingQueue",
      sheet: () => ({
        name: "Shipping Queue",
        rows: shippingPasteRows(input.shipments, yesterday),
      }),
    },
  ]
  return tabs.filter(({ source }) => reportIncludes(input, source)).map(({ sheet }) => sheet())
}
