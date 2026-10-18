import { formatUtcDateTime } from "./dates"
import { describeError, type Logger } from "./log"
import type { ReportProgressEvent } from "./reportProgress"

export const SHIPPING_QUEUE_URL = "https://sellercentral.amazon.com/fba/shippingqueue/api/v1/shipment/listShipments"
export const SHIPPING_QUEUE_REFERRER = "https://sellercentral.amazon.com/manage/shipments?ref=sc_shipments"
export const SHIPPING_QUEUE_DEFAULT_PAGE_SIZE = 250
export const SHIPPING_QUEUE_MAX_PAGES = 40
export const SHIPPING_QUEUE_ORDER_BY = "SHIPMENT_UPDATE_DATE"
export const SHIPMENT_ELIGIBILITY_URL = "https://sellercentral.amazon.com/fba/wmsr/eligibilities"
export const SHIPMENT_DOCUMENTS_URL = "https://sellercentral.amazon.com/fba/wmsr/document-requirements"
export const SHIPMENT_CLAIM_PAGE_URL = "https://sellercentral.amazon.com/fba/wmsr"
export const SHIPPING_STATUS_OUTSIDE_WINDOW = "Shipment ID - Outside Reconciliation Window"
export const SHIPPING_STATUS_MONITORING = "Shipment ID - For Monitoring (Automatically Closed After 90 Days)"
export const SHIPPING_STATUS_INVESTIGATION_COMPLETED = "Shipment ID - Investigation Completed - Contents Counted and Confirmed"
export const SHIPPING_STATUS_UNITS_LOCATED = "Shipment ID - Units Located - No Further Action Required"
export const SHIPPING_STATUS_RECEIVED_IN_FULL = "Received in Full - No Discrepancies Found"
export const SHIPPING_STATUS_NEW = "Shipment ID - New (Send List)"
export const SHIPPING_STATUS_OVERAGED = "Shipment ID - Overaged"
export const SHIPPING_STATUS_REVIEW = "Review Needed"
export const SHIPPING_STATUS_UNAVAILABLE = "N/A"
export const REQUIRED_DOCUMENT_INVOICE = "Proof of Inventory Ownership"
export const REQUIRED_DOCUMENT_DELIVERY = "Delivery"
export const SHIPMENT_DETAILS_CONCURRENCY = 40
export const SHIPMENT_DETAILS_MAX_ATTEMPTS = 3
export const SHIPMENT_DETAILS_RETRY_DELAY_MS = 500
export const SHIPMENT_DETAILS_SESSION_WAIT_MS = 60_000
export const SHIPMENT_DETAILS_SESSION_PAUSES = 3
export const SHIPPING_QUEUE_DETAILS_LOADED = "Loaded"
export const SHIPPING_QUEUE_DETAILS_UNAVAILABLE = "Couldn’t load shipment details"
export const SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE =
  "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable."
export const SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE =
  "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”."
export const SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE =
  "Some shipments have more SKU lines than Amazon returned in one response. Those shipments list only the SKU lines that were obtainable."

export const SHIPPING_QUEUE_SHIPMENT_HEADERS = [
  "Shipment Name",
  "Shipment ID",
  "Shipment URL",
  "Status",
  "Destination FC",
  "FC Country",
  "Ship From Address ID",
  "Created Date",
  "Last Updated Date",
  "MSKUs",
  "Shipped Quantity",
  "Received Quantity",
  "Expected Quantity",
  "Located Quantity",
  "Stowed Quantity",
  "Quantity Discrepancy",
  "Workflow ID",
  "Workflow Type",
  "PO ID",
  "Placement Status",
  "Window Type",
  "Window Start Date",
  "Window End Date",
  "Grace Period End Date",
  "Window Compliance Status",
  "Need By Date",
  "Reason Code",
  "Finalized",
  "Finalized Date",
  "Estimated Finalized Date UTC",
  "Former Estimated Finalized Date UTC",
  "Blocked",
  "Partnered Import",
  "Merchant Launched",
  "ISMS Details",
  "T2P Accelerate",
] as const

export const SHIPPING_QUEUE_DETAIL_HEADERS = [
  "Details Status",
  "Claim Page URL",
  "Reimbursement Eligible",
  "Ineligibility Reason",
  "Estimated Eligibility Date",
  "Former Estimated Eligibility Date",
  "Days To Wait",
  "Eligibility Details",
  "Inquiry Status",
  "Inquiry Text",
  "Inquiry Case ID",
  "Inquiry Case Created Date",
  "Inquiry Case Created By",
  "Has Discrepancy",
  "Retail Domain",
  "Claims Allowed",
  "SKU Lines",
  "Total Discrepancy Quantity",
] as const

export const SHIPPING_QUEUE_ITEM_HEADERS = [
  "SKU",
  "Title",
  "FNSKU",
  "ASIN",
  "ASIN URL",
  "UPC",
  "Barcode Type",
  "Barcode Value",
  "Condition",
  "Sortable",
  "Eligible For Research",
  "Item Expected Quantity",
  "Item Located Quantity",
  "Item Received Quantity",
  "Adjustment Quantity",
  "Reimbursed Quantity",
  "Clawback Quantity",
  "Acknowledged Quantity",
  "Denied Quantity",
  "Virtually Adjusted Quantity",
  "Other Received Quantity",
  "Other Receive Start Date",
  "Other Receive End Date",
  "IAR Auto Reconciliations",
  "Item Discrepancy Quantity",
  "Item Ineligibility Reason",
  "Item Case ID",
  "Item Reason Code",
] as const

export const SHIPPING_QUEUE_SHEET_HEADERS = [
  ...SHIPPING_QUEUE_SHIPMENT_HEADERS,
  ...SHIPPING_QUEUE_DETAIL_HEADERS,
  ...SHIPPING_QUEUE_ITEM_HEADERS,
] as const

type DateValue = number | string | null | undefined

export interface ShipOrDeliveryWindow {
  windowStartDate?: DateValue
  windowEndDate?: DateValue
  windowType?: string | null
  gracePeriodEndDate?: DateValue
}

export interface ShipmentInquiry {
  inquiryText?: string | null
  inquiryStatus?: string | null
  caseId?: string | null
  caseCreationDate?: DateValue
  caseCreatedBy?: string | null
}

export interface ShipmentDiscrepancyItem {
  merchantSKU?: string | null
  title?: string | null
  fnsku?: string | null
  asin?: string | null
  upc?: string | null
  barcodeType?: string | null
  barcodeValue?: string | null
  isSortable?: boolean | null
  eligibleForResearch?: boolean | null
  expectedQuantity?: number | null
  totalLocatedQuantity?: number | null
  totalReceivedQuantity?: number | null
  totalAdjustmentQuantity?: number | null
  totalReimbursedQuantity?: number | null
  totalClawbackQuantity?: number | null
  totalAcknowledgedQuantity?: number | null
  totalDeniedQuantity?: number | null
  totalVirtuallyAdjustedQuantity?: number | null
  otherReceivedQuantity?: number | null
  otherReceiveStartDate?: DateValue
  otherReceiveEndDate?: DateValue
  iarAutoReconciliations?: unknown | null
  totalDiscrepancyQuantity?: number | null
  ineligibilityReason?: string | null
  caseId?: string | null
  itemCondition?: string | null
  reasonCode?: string | null
}

export interface ShipmentDetails {
  eligible?: boolean | null
  ineligibilityReason?: string | null
  estimatedTimestamp?: DateValue
  formerEstimatedTimestamp?: DateValue
  daysToWait?: number | null
  details?: Record<string, unknown> | null
  inquiry?: ShipmentInquiry | null
  hasDiscrepancy?: boolean | null
  retailDomainName?: string | null
  wmsrAllowed?: boolean | null
  discrepancyTotalRecords?: number | null
  items: ShipmentDiscrepancyItem[]
}

export interface ShippingQueueShipment {
  shipmentName?: string | null
  shipmentId?: string | null
  destinationFC?: string | null
  shipFromAddressId?: string | null
  shipmentStatus?: string | null
  createdDate?: DateValue
  lastUpdatedDate?: DateValue
  mskus?: number | null
  shippedQuantity?: number | null
  receivedQuantity?: number | null
  expectedQuantity?: number | null
  locatedQuantity?: number | null
  stowedQuantity?: number | null
  workflowId?: string | null
  workflowType?: string | null
  poId?: string | null
  needByDate?: DateValue
  placementStatus?: string | null
  fcAddress?: string | null
  reasonCode?: string | null
  finalizedDate?: DateValue
  estimatedFinalizedDateUTC?: DateValue
  formerEstimatedFinalizedDateUTC?: DateValue
  shipOrDeliveryWindow?: ShipOrDeliveryWindow | null
  shipOrDeliveryWindowComplianceStatus?: string | null
  ismsDetails?: unknown | null
  t2pAccelerate?: unknown | null
  blocked?: boolean | null
  partneredImport?: boolean | null
  merchantLaunched?: boolean | null
  finalized?: boolean | null
  details?: ShipmentDetails
  detailsFetchFailed?: boolean
  documentTypes?: string[]
  documentsFetchFailed?: boolean
  listingsIncomplete?: boolean
}

export interface FetchShippingQueueOptions {
  fetch?: typeof globalThis.fetch
  onProgress?: (event: ReportProgressEvent) => void
  pageSize?: number
  cutoffDate?: Date | number
  referenceDate?: Date
  sleep?: (ms: number) => Promise<void>
  log?: Logger
}

interface ShipmentCursor {
  lastShipmentId: string
  createdDate: string
  lastUpdatedDate: string
}

export function calculateShippingQueueCutoffDate(referenceDate: Date = new Date()): Date {
  const year = referenceDate.getUTCFullYear()
  const month = referenceDate.getUTCMonth()
  const day = referenceDate.getUTCDate() - 1

  const yesterday = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))
  const targetYear = yesterday.getUTCFullYear()
  const targetMonth = yesterday.getUTCMonth() - 9
  const targetDay = yesterday.getUTCDate()

  const cutoff = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0))
  const daysInTargetMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate()
  cutoff.setUTCDate(Math.min(targetDay, daysInTargetMonth))
  return cutoff
}

export function getShipmentLastUpdatedMs(shipment: ShippingQueueShipment): number | null {
  const value = shipment.lastUpdatedDate ?? shipment.createdDate
  if (value == null || value === "") return null
  const ms = typeof value === "number" ? value : Number(value)
  if (Number.isFinite(ms)) return ms
  const parsed = Date.parse(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

export function formatShippingQueueDate(value: DateValue): string {
  if (value == null || value === "") return ""
  const ms = typeof value === "number" ? value : Number(value)
  const date = Number.isFinite(ms) ? new Date(ms) : new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return formatUtcDateTime(date)
}

/** Amazon reports "no estimate" as 0; show those as blank rather than 01-Jan-1970. */
function formatEligibilityDate(value: DateValue): string {
  if (value === 0 || value === "0") return ""
  return formatShippingQueueDate(value)
}

function shippingQueueCell(value: unknown): string {
  if (value == null) return ""
  return String(value)
}

export function shippingQueueNumericCell(value: unknown): number | "" {
  if (value == null || value === "") return ""
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : ""
}

export function shippingQueueYesNo(value: boolean | null | undefined): string {
  if (value === true) return "Yes"
  if (value === false) return "No"
  return ""
}

export function calculateDiscrepancyQuantity(
  receivedQuantity: unknown,
  shippedQuantity: unknown,
): number | "" {
  const received = shippingQueueNumericCell(receivedQuantity)
  const shipped = shippingQueueNumericCell(shippedQuantity)
  if (received === "" || shipped === "") return ""
  return received - shipped
}

export function buildShipmentUrl(shipmentId?: string | null): string {
  const trimmed = shipmentId?.trim()
  return trimmed
    ? `https://sellercentral.amazon.com/fba/inbound-shipment/summary/${encodeURIComponent(trimmed)}/contents`
    : ""
}

export function buildShipmentClaimUrl(shipmentId?: string | null): string {
  const trimmed = shipmentId?.trim()
  return trimmed ? `${SHIPMENT_CLAIM_PAGE_URL}/${encodeURIComponent(trimmed)}` : ""
}

export function buildAsinUrl(asin?: string | null): string {
  const trimmed = asin?.trim()
  return trimmed ? `https://www.amazon.com/dp/${encodeURIComponent(trimmed)}` : ""
}

function shippingQueueFormatComplexField(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "boolean") return shippingQueueYesNo(value)
  if (typeof value === "object") {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function formatEligibilityDetails(details: Record<string, unknown> | null | undefined): string {
  if (!details) return ""
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${shippingQueueFormatComplexField(value)}`)
    .join("; ")
}

function optString(value: unknown): string | null | undefined {
  if (value == null) return undefined
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return undefined
}

function optNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

function optBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function optDate(value: unknown): DateValue {
  if (typeof value === "number" || typeof value === "string") return value
  return undefined
}

function assignDefined<T extends object>(target: T, values: Partial<Record<keyof T, unknown>>): T {
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) (target as Record<string, unknown>)[key] = value
  }
  return target
}

export function asShippingQueueShipment(value: unknown): ShippingQueueShipment | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const shipment: ShippingQueueShipment = {}

  assignDefined(shipment, {
    shipmentName: typeof record.shipmentName === "string" ? record.shipmentName : undefined,
    shipmentId: typeof record.shipmentId === "string" ? record.shipmentId : undefined,
    destinationFC: typeof record.destinationFC === "string" ? record.destinationFC : undefined,
    shipFromAddressId: typeof record.shipFromAddressId === "string" ? record.shipFromAddressId : undefined,
    shipmentStatus: typeof record.shipmentStatus === "string" ? record.shipmentStatus : undefined,
    createdDate: optDate(record.createdDate),
    lastUpdatedDate: optDate(record.lastUpdatedDate),
    mskus: optNumber(record.mskus),
    shippedQuantity: optNumber(record.shippedQuantity),
    receivedQuantity: optNumber(record.receivedQuantity),
    expectedQuantity: optNumber(record.expectedQuantity),
    locatedQuantity: optNumber(record.locatedQuantity),
    stowedQuantity: optNumber(record.stowedQuantity),
    workflowId: typeof record.workflowId === "string" ? record.workflowId : undefined,
    workflowType: typeof record.workflowType === "string" ? record.workflowType : undefined,
    poId: typeof record.poId === "string" ? record.poId : undefined,
    needByDate: optDate(record.needByDate),
    placementStatus: typeof record.placementStatus === "string" ? record.placementStatus : undefined,
    fcAddress: typeof record.fcAddress === "string" ? record.fcAddress : undefined,
    reasonCode: optString(record.reasonCode),
    finalizedDate: optDate(record.finalizedDate),
    estimatedFinalizedDateUTC: optDate(record.estimatedFinalizedDateUTC),
    formerEstimatedFinalizedDateUTC: optDate(record.formerEstimatedFinalizedDateUTC),
    shipOrDeliveryWindowComplianceStatus: optString(record.shipOrDeliveryWindowComplianceStatus),
    ismsDetails: record.ismsDetails,
    t2pAccelerate: record.t2pAccelerate,
    blocked: optBoolean(record.blocked),
    partneredImport: optBoolean(record.partneredImport),
    merchantLaunched: optBoolean(record.merchantLaunched),
    finalized: optBoolean(record.finalized),
  })

  if (record.shipOrDeliveryWindow && typeof record.shipOrDeliveryWindow === "object") {
    const window = record.shipOrDeliveryWindow as Record<string, unknown>
    shipment.shipOrDeliveryWindow = {
      windowStartDate: optDate(window.windowStartDate),
      windowEndDate: optDate(window.windowEndDate),
      windowType: typeof window.windowType === "string" ? window.windowType : null,
      gracePeriodEndDate: optDate(window.gracePeriodEndDate),
    }
  }

  return shipment
}

export function parseShippingQueueResponse(payload: unknown): ShippingQueueShipment[] {
  if (!payload) {
    throw new Error("Couldn’t load shipping queue.")
  }
  let items: unknown[] | undefined
  if (Array.isArray(payload)) {
    items = payload
  } else if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.shipments)) items = record.shipments
    else if (Array.isArray(record.data)) items = record.data
    else if (Array.isArray(record.shipmentList)) items = record.shipmentList
    else if (Array.isArray(record.items)) items = record.items
    else if (Array.isArray(record.payload)) items = record.payload
  }
  if (!items) {
    throw new Error("Couldn’t load shipping queue.")
  }
  return items
    .map(asShippingQueueShipment)
    .filter((s): s is ShippingQueueShipment => s !== undefined)
}

export function asShipmentDiscrepancyItem(value: unknown): ShipmentDiscrepancyItem | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  return assignDefined<ShipmentDiscrepancyItem>({}, {
    merchantSKU: optString(record.merchantSKU),
    title: optString(record.title),
    fnsku: optString(record.fnsku),
    asin: optString(record.asin),
    upc: optString(record.upc),
    barcodeType: optString(record.barcodeType),
    barcodeValue: optString(record.barcodeValue),
    isSortable: optBoolean(record.isSortable),
    eligibleForResearch: optBoolean(record.eligibleForResearch),
    expectedQuantity: optNumber(record.expectedQuantity),
    totalLocatedQuantity: optNumber(record.totalLocatedQuantity),
    totalReceivedQuantity: optNumber(record.totalReceivedQuantity),
    totalAdjustmentQuantity: optNumber(record.totalAdjustmentQuantity),
    totalReimbursedQuantity: optNumber(record.totalReimbursedQuantity),
    totalClawbackQuantity: optNumber(record.totalClawbackQuantity),
    totalAcknowledgedQuantity: optNumber(record.totalAcknowledgedQuantity),
    totalDeniedQuantity: optNumber(record.totalDeniedQuantity),
    totalVirtuallyAdjustedQuantity: optNumber(record.totalVirtuallyAdjustedQuantity),
    otherReceivedQuantity: optNumber(record.otherReceivedQuantity),
    otherReceiveStartDate: optDate(record.otherReceiveStartDate),
    otherReceiveEndDate: optDate(record.otherReceiveEndDate),
    iarAutoReconciliations: record.iarAutoReconciliations ?? undefined,
    totalDiscrepancyQuantity: optNumber(record.totalDiscrepancyQuantity),
    ineligibilityReason: optString(record.ineligibilityReason),
    caseId: optString(record.caseId),
    itemCondition: optString(record.itemCondition),
    reasonCode: optString(record.reasonCode),
  })
}

export function parseShipmentDetails(payload: unknown): ShipmentDetails {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Couldn’t load shipment details.")
  }
  const record = payload as Record<string, unknown>
  const details: ShipmentDetails = { items: [] }

  assignDefined(details, {
    eligible: optBoolean(record.eligible),
    ineligibilityReason: optString(record.ineligibilityReason),
    estimatedTimestamp: optDate(record.estimatedTimestamp),
    formerEstimatedTimestamp: optDate(record.formerEstimatedTimestamp),
    daysToWait: optNumber(record.daysToWait),
    hasDiscrepancy: optBoolean(record.hasDiscrepancy),
    retailDomainName: optString(record.retailDomainName),
    wmsrAllowed: optBoolean(record.wmsrAllowed),
  })
  if (record.details && typeof record.details === "object" && !Array.isArray(record.details)) {
    details.details = record.details as Record<string, unknown>
  }

  if (record.inquiry && typeof record.inquiry === "object") {
    const inquiry = record.inquiry as Record<string, unknown>
    details.inquiry = assignDefined<ShipmentInquiry>({}, {
      inquiryText: optString(inquiry.inquiryText),
      inquiryStatus: optString(inquiry.inquiryStatus),
      caseId: optString(inquiry.caseId),
      caseCreationDate: optDate(inquiry.caseCreationDate),
      caseCreatedBy: optString(inquiry.caseCreatedBy),
    })
  }

  if (record.discrepancies && typeof record.discrepancies === "object") {
    const discrepancies = record.discrepancies as Record<string, unknown>
    details.discrepancyTotalRecords = optNumber(discrepancies.totalRecords)
    if (Array.isArray(discrepancies.items)) {
      details.items = discrepancies.items
        .map(asShipmentDiscrepancyItem)
        .filter((item): item is ShipmentDiscrepancyItem => item !== undefined)
    }
  }

  return details
}

export function shipmentDetailsIncomplete(details: ShipmentDetails | undefined): boolean {
  const total = details?.discrepancyTotalRecords
  return typeof total === "number" && total > (details?.items.length ?? 0)
}

function totalDiscrepancyQuantity(details: ShipmentDetails): number | "" {
  let total = 0
  let seen = false
  for (const item of details.items) {
    if (typeof item.totalDiscrepancyQuantity === "number") {
      total += item.totalDiscrepancyQuantity
      seen = true
    }
  }
  return seen ? total : ""
}

const BLANK_DETAIL_CELLS = SHIPPING_QUEUE_DETAIL_HEADERS.map(() => "")
const BLANK_ITEM_CELLS = SHIPPING_QUEUE_ITEM_HEADERS.map(() => "")

function shipmentListCells(shipment: ShippingQueueShipment): Array<string | number> {
  const window = shipment.shipOrDeliveryWindow
  return [
    shippingQueueCell(shipment.shipmentName),
    shippingQueueCell(shipment.shipmentId),
    buildShipmentUrl(shipment.shipmentId),
    shippingQueueCell(shipment.shipmentStatus),
    shippingQueueCell(shipment.destinationFC),
    shippingQueueCell(shipment.fcAddress),
    shippingQueueCell(shipment.shipFromAddressId),
    formatShippingQueueDate(shipment.createdDate),
    formatShippingQueueDate(shipment.lastUpdatedDate),
    shippingQueueNumericCell(shipment.mskus),
    shippingQueueNumericCell(shipment.shippedQuantity),
    shippingQueueNumericCell(shipment.receivedQuantity),
    shippingQueueNumericCell(shipment.expectedQuantity),
    shippingQueueNumericCell(shipment.locatedQuantity),
    shippingQueueNumericCell(shipment.stowedQuantity),
    calculateDiscrepancyQuantity(shipment.receivedQuantity, shipment.shippedQuantity),
    shippingQueueCell(shipment.workflowId),
    shippingQueueCell(shipment.workflowType),
    shippingQueueCell(shipment.poId),
    shippingQueueCell(shipment.placementStatus),
    shippingQueueCell(window?.windowType),
    formatShippingQueueDate(window?.windowStartDate),
    formatShippingQueueDate(window?.windowEndDate),
    formatShippingQueueDate(window?.gracePeriodEndDate),
    shippingQueueCell(shipment.shipOrDeliveryWindowComplianceStatus),
    formatShippingQueueDate(shipment.needByDate),
    shippingQueueCell(shipment.reasonCode),
    shippingQueueYesNo(shipment.finalized),
    formatShippingQueueDate(shipment.finalizedDate),
    formatShippingQueueDate(shipment.estimatedFinalizedDateUTC),
    formatShippingQueueDate(shipment.formerEstimatedFinalizedDateUTC),
    shippingQueueYesNo(shipment.blocked),
    shippingQueueYesNo(shipment.partneredImport),
    shippingQueueYesNo(shipment.merchantLaunched),
    shippingQueueFormatComplexField(shipment.ismsDetails),
    shippingQueueFormatComplexField(shipment.t2pAccelerate),
  ]
}

function shipmentDetailCells(shipment: ShippingQueueShipment): Array<string | number> {
  const details = shipment.details
  if (!details) {
    const status = shipment.detailsFetchFailed ? SHIPPING_QUEUE_DETAILS_UNAVAILABLE : ""
    return [status, ...BLANK_DETAIL_CELLS.slice(1)]
  }
  const inquiry = details.inquiry
  return [
    SHIPPING_QUEUE_DETAILS_LOADED,
    buildShipmentClaimUrl(shipment.shipmentId),
    shippingQueueYesNo(details.eligible),
    shippingQueueCell(details.ineligibilityReason),
    formatEligibilityDate(details.estimatedTimestamp),
    formatEligibilityDate(details.formerEstimatedTimestamp),
    shippingQueueNumericCell(details.daysToWait),
    formatEligibilityDetails(details.details),
    shippingQueueCell(inquiry?.inquiryStatus),
    shippingQueueCell(inquiry?.inquiryText),
    shippingQueueCell(inquiry?.caseId),
    formatShippingQueueDate(inquiry?.caseCreationDate),
    shippingQueueCell(inquiry?.caseCreatedBy),
    shippingQueueYesNo(details.hasDiscrepancy),
    shippingQueueCell(details.retailDomainName),
    shippingQueueYesNo(details.wmsrAllowed),
    shippingQueueNumericCell(details.discrepancyTotalRecords ?? details.items.length),
    totalDiscrepancyQuantity(details),
  ]
}

function shipmentItemCells(item: ShipmentDiscrepancyItem | undefined): Array<string | number> {
  if (!item) return [...BLANK_ITEM_CELLS]
  return [
    shippingQueueCell(item.merchantSKU),
    shippingQueueCell(item.title),
    shippingQueueCell(item.fnsku),
    shippingQueueCell(item.asin),
    buildAsinUrl(item.asin),
    shippingQueueCell(item.upc),
    shippingQueueCell(item.barcodeType),
    shippingQueueCell(item.barcodeValue),
    shippingQueueCell(item.itemCondition),
    shippingQueueYesNo(item.isSortable),
    shippingQueueYesNo(item.eligibleForResearch),
    shippingQueueNumericCell(item.expectedQuantity),
    shippingQueueNumericCell(item.totalLocatedQuantity),
    shippingQueueNumericCell(item.totalReceivedQuantity),
    shippingQueueNumericCell(item.totalAdjustmentQuantity),
    shippingQueueNumericCell(item.totalReimbursedQuantity),
    shippingQueueNumericCell(item.totalClawbackQuantity),
    shippingQueueNumericCell(item.totalAcknowledgedQuantity),
    shippingQueueNumericCell(item.totalDeniedQuantity),
    shippingQueueNumericCell(item.totalVirtuallyAdjustedQuantity),
    shippingQueueNumericCell(item.otherReceivedQuantity),
    formatShippingQueueDate(item.otherReceiveStartDate),
    formatShippingQueueDate(item.otherReceiveEndDate),
    shippingQueueFormatComplexField(item.iarAutoReconciliations),
    shippingQueueNumericCell(item.totalDiscrepancyQuantity),
    shippingQueueCell(item.ineligibilityReason),
    shippingQueueCell(item.caseId),
    shippingQueueCell(item.reasonCode),
  ]
}

/** One sheet row: the shipment's list and eligibility columns plus one SKU line (blank when there is none). */
export function shippingQueueSheetRow(
  shipment: ShippingQueueShipment,
  item?: ShipmentDiscrepancyItem,
): Array<string | number> {
  return [...shipmentListCells(shipment), ...shipmentDetailCells(shipment), ...shipmentItemCells(item)]
}

/** A shipment becomes one row per SKU line, or a single row when it has none. */
export function shippingQueueShipmentRows(shipment: ShippingQueueShipment): Array<Array<string | number>> {
  const items = shipment.details?.items ?? []
  if (items.length === 0) return [shippingQueueSheetRow(shipment)]
  return items.map((item) => shippingQueueSheetRow(shipment, item))
}

function shippingQueueSheetNotes(shipments: readonly ShippingQueueShipment[]): Array<Array<string | number>> {
  const notes: Array<Array<string | number>> = []
  if (shipments.some((shipment) => shipment.listingsIncomplete)) notes.push([SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE])
  if (shipments.some((shipment) => shipment.detailsFetchFailed)) notes.push([SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE])
  if (shipments.some((shipment) => shipmentDetailsIncomplete(shipment.details))) {
    notes.push([SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE])
  }
  if (notes.length) notes.push([])
  return notes
}

export function shippingQueueSheetRows(
  shipments: readonly ShippingQueueShipment[],
): Array<Array<string | number>> {
  return [
    ...shippingQueueSheetNotes(shipments),
    [...SHIPPING_QUEUE_SHEET_HEADERS],
    ...shipments.flatMap(shippingQueueShipmentRows),
  ]
}

function shippingQueueCursor(shipment: ShippingQueueShipment | undefined): ShipmentCursor | undefined {
  const id = shipment?.shipmentId?.trim()
  if (!shipment || !id || shipment.createdDate == null || shipment.lastUpdatedDate == null) return undefined
  return {
    lastShipmentId: id,
    createdDate: String(shipment.createdDate),
    lastUpdatedDate: String(shipment.lastUpdatedDate),
  }
}

export function shippingQueueUrl(
  pageSize = SHIPPING_QUEUE_DEFAULT_PAGE_SIZE,
  cursor?: ShipmentCursor,
): string {
  const params = new URLSearchParams({
    pageSize: String(pageSize),
    orderBy: SHIPPING_QUEUE_ORDER_BY,
    isOrderAscending: "false",
  })
  if (cursor) {
    params.set("lastShipmentId", cursor.lastShipmentId)
    params.set("createdDate", cursor.createdDate)
    params.set("lastUpdatedDate", cursor.lastUpdatedDate)
  }
  params.set("t2pLaunched", "true")
  return `${SHIPPING_QUEUE_URL}?${params.toString()}`
}

export function shipmentDetailsUrl(shipmentId: string): string {
  return `${SHIPMENT_ELIGIBILITY_URL}/${encodeURIComponent(shipmentId)}?withInquiry=true&withDiscrepancies=true`
}

export function shipmentDocumentsUrl(shipmentId: string): string {
  return `${SHIPMENT_DOCUMENTS_URL}/${encodeURIComponent(shipmentId)}?evaluateOption=DOCUMENT`
}

export function parseDocumentTypes(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("documents" in payload)) return []
  const documents = (payload as { documents?: unknown }).documents
  if (!Array.isArray(documents)) return []
  const types: string[] = []
  for (const document of documents) {
    if (!document || typeof document !== "object" || !("documentType" in document)) continue
    const type = (document as { documentType?: unknown }).documentType
    if (typeof type !== "string") continue
    const trimmed = type.trim()
    if (trimmed) types.push(trimmed)
  }
  return types
}

export function shippingQueueLineStatus(input: {
  detailsFailed?: boolean
  shipmentIneligibilityReason?: string | null
  itemIneligibilityReason?: string | null
  discrepancy?: number | null
  eligible?: boolean | null
}): string {
  if (input.detailsFailed) return SHIPPING_STATUS_UNAVAILABLE
  const shipmentReason = input.shipmentIneligibilityReason ?? ""
  const itemReason = input.itemIneligibilityReason ?? ""
  const discrepancy = input.discrepancy
  if (shipmentReason === "NINE_MONTH_STATUTE_OF_LIMITATIONS") return SHIPPING_STATUS_OUTSIDE_WINDOW
  if (shipmentReason === "NOT_ALL_SHIPPED") return SHIPPING_STATUS_MONITORING
  if (itemReason === "ITEM_LEVEL_AUTHORITATIVE_RECEIVE") return SHIPPING_STATUS_INVESTIGATION_COMPLETED
  if (itemReason === "RESEARCHED") return SHIPPING_STATUS_UNITS_LOCATED
  if (discrepancy === 0) return SHIPPING_STATUS_RECEIVED_IN_FULL
  if (input.eligible === true) {
    if (typeof discrepancy === "number" && discrepancy < 0) return SHIPPING_STATUS_NEW
    if (typeof discrepancy === "number" && discrepancy > 0) return SHIPPING_STATUS_OVERAGED
  }
  if (shipmentReason && shipmentReason !== "NONE") return shipmentReason
  return SHIPPING_STATUS_REVIEW
}

export function requiredDocumentLabel(
  documentTypes: readonly string[] | null | undefined,
  status: string,
): string {
  if (status !== SHIPPING_STATUS_NEW) return SHIPPING_STATUS_UNAVAILABLE
  const documents: string[] = []
  if (documentTypes?.includes("INVOICE")) documents.push(REQUIRED_DOCUMENT_INVOICE)
  if (documentTypes?.includes("POD")) documents.push(REQUIRED_DOCUMENT_DELIVERY)
  return documents.length > 0 ? documents.join(" AND ") : SHIPPING_STATUS_UNAVAILABLE
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

class SessionInterrupted extends Error {
  constructor() {
    super("Shipment details session interrupted.")
    this.name = "SessionInterrupted"
  }
}

function isSessionResponse(response: Response): boolean {
  if (response.status === 401 || response.status === 403) return true
  const type = response.headers?.get("content-type") ?? ""
  return /text\/html/i.test(type)
}

async function fetchShippingQueuePage(
  fetchImpl: typeof globalThis.fetch,
  url: string,
): Promise<ShippingQueueShipment[]> {
  const response = await fetchImpl(url, {
    method: "GET",
    mode: "cors",
    credentials: "include",
    referrer: SHIPPING_QUEUE_REFERRER,
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
    },
  })
  if (!response.ok) throw new Error(`Couldn’t load shipping queue (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load shipping queue.")
  }
  return parseShippingQueueResponse(payload)
}

async function fetchShipmentDetails(
  fetchImpl: typeof globalThis.fetch,
  shipmentId: string,
  sleep: (ms: number) => Promise<void>,
  onSession?: () => void,
): Promise<ShipmentDetails> {
  let lastError = new Error("Couldn’t load shipment details.")
  for (let attempt = 1; attempt <= SHIPMENT_DETAILS_MAX_ATTEMPTS; attempt += 1) {
    if (attempt > 1) await sleep(SHIPMENT_DETAILS_RETRY_DELAY_MS * (attempt - 1))

    let response: Response
    try {
      response = await fetchImpl(shipmentDetailsUrl(shipmentId), {
        method: "GET",
        mode: "cors",
        credentials: "include",
        referrer: buildShipmentClaimUrl(shipmentId),
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9",
        },
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }

    if (isSessionResponse(response)) {
      onSession?.()
      throw new SessionInterrupted()
    }

    if (!response.ok) {
      lastError = new Error(`Couldn’t load shipment details (${response.status}).`)
      if (response.status === 429 || response.status >= 500) continue
      throw lastError
    }

    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error("Couldn’t load shipment details.")
    }
    return parseShipmentDetails(payload)
  }
  throw lastError
}

/**
 * Required documents only matter for lines that can be "Shipment ID - New (Send List)": an
 * eligible shipment with a negative discrepancy. Other shipments skip that request.
 */
export function shipmentNeedsDocumentTypes(details: ShipmentDetails): boolean {
  if (details.eligible !== true) return false
  return details.items.some((item) => typeof item.totalDiscrepancyQuantity === "number" && item.totalDiscrepancyQuantity < 0)
}

async function fetchShipmentDocumentTypes(
  fetchImpl: typeof globalThis.fetch,
  shipmentId: string,
): Promise<Pick<ShippingQueueShipment, "documentTypes" | "documentsFetchFailed">> {
  try {
    const response = await fetchImpl(shipmentDocumentsUrl(shipmentId), {
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: buildShipmentClaimUrl(shipmentId),
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
      },
    })
    if (!response.ok || isSessionResponse(response)) return { documentsFetchFailed: true }
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return { documentsFetchFailed: true }
    }
    return { documentTypes: parseDocumentTypes(payload) }
  } catch {
    return { documentsFetchFailed: true }
  }
}

interface ShipmentDetailsLoader {
  /** Queues shipments from a list page; their details start loading right away. */
  add: (shipments: readonly ShippingQueueShipment[]) => void
  /** Call after the last list page. Resolves with every shipment, in list order. */
  finish: () => Promise<ShippingQueueShipment[]>
}

/**
 * Loads eligibility details SHIPMENT_DETAILS_CONCURRENCY at a time while list pages are still
 * arriving. A session response stops new requests, waits, checks that the list still loads, and
 * resumes; after SHIPMENT_DETAILS_SESSION_PAUSES pauses the remaining shipments are marked failed.
 */
function createShipmentDetailsLoader(
  fetchImpl: typeof globalThis.fetch,
  sleep: (ms: number) => Promise<void>,
  onProgress?: (event: ReportProgressEvent) => void,
  log?: Logger,
): ShipmentDetailsLoader {
  const shipments: ShippingQueueShipment[] = []
  const results: ShippingQueueShipment[] = []
  let next = 0
  let inFlight = 0
  let processed = 0
  let listDone = false
  let pausePromise: Promise<boolean> | null = null
  let pauseCount = 0
  let holdLaunch = false
  let halt = false
  let documentsSkipped = 0
  const failedSample: string[] = []
  let settle: () => void = () => undefined
  const settled = new Promise<void>((resolve) => { settle = resolve })

  /** Details progress starts once the list is complete, so its total never shrinks the bar. */
  function reportProgress() {
    if (!listDone) return
    onProgress?.({
      source: "shippingQueue",
      status: "active",
      loaded: processed,
      total: shipments.length,
      phase: "details",
    })
  }

  function abandonQueued() {
    if (next >= shipments.length) return
    while (next < shipments.length) {
      results[next] = { ...shipments[next], detailsFetchFailed: true }
      next += 1
      processed += 1
    }
    reportProgress()
  }

  function startPause(): Promise<boolean> {
    if (halt) return Promise.resolve(false)
    if (pausePromise) return pausePromise
    if (pauseCount >= SHIPMENT_DETAILS_SESSION_PAUSES) {
      halt = true
      log?.error("shippingQueue.detailsHalted", { pauses: pauseCount, processed, total: shipments.length })
      return Promise.resolve(false)
    }
    pauseCount += 1
    let current!: Promise<boolean>
    current = (async () => {
      log?.warn("shippingQueue.sessionPause", { pause: pauseCount, waitMs: SHIPMENT_DETAILS_SESSION_WAIT_MS, processed })
      try {
        await sleep(SHIPMENT_DETAILS_SESSION_WAIT_MS)
        await fetchShippingQueuePage(fetchImpl, shippingQueueUrl())
        return true
      } catch (error) {
        log?.error("shippingQueue.sessionCheckFailed", { error: describeError(error) })
        halt = true
        return false
      } finally {
        if (pausePromise === current) pausePromise = null
        if (!halt) holdLaunch = false
      }
    })()
    pausePromise = current
    return current
  }

  function markFailed(shipment: ShippingQueueShipment, id: string, error: unknown): ShippingQueueShipment {
    if (failedSample.length < 3) {
      failedSample.push(id)
      log?.warn("shippingQueue.detailsFailed", { shipmentId: id, error: describeError(error) })
    }
    return { ...shipment, detailsFetchFailed: true }
  }

  async function loadDetails(shipment: ShippingQueueShipment, id: string, onSession?: () => void) {
    const details = await fetchShipmentDetails(fetchImpl, id, sleep, onSession)
    if (!shipmentNeedsDocumentTypes(details)) {
      documentsSkipped += 1
      return { ...shipment, details }
    }
    return { ...shipment, details, ...await fetchShipmentDocumentTypes(fetchImpl, id) }
  }

  async function loadOne(shipment: ShippingQueueShipment): Promise<ShippingQueueShipment> {
    const id = shipment.shipmentId?.trim()
    if (!id) return { ...shipment, detailsFetchFailed: true }
    const onSession = () => {
      if (!halt) holdLaunch = true
    }
    try {
      return await loadDetails(shipment, id, onSession)
    } catch (error) {
      if (!(error instanceof SessionInterrupted) || halt) return markFailed(shipment, id, error)
      const resumed = await startPause()
      if (!resumed) return { ...shipment, detailsFetchFailed: true }
      try {
        return await loadDetails(shipment, id)
      } catch (retryError) {
        return markFailed(shipment, id, retryError)
      }
    }
  }

  function pump() {
    if (halt && inFlight === 0) abandonQueued()
    if (listDone && next >= shipments.length && inFlight === 0) {
      settle()
      return
    }
    if (holdLaunch || pausePromise || halt) return
    while (inFlight < SHIPMENT_DETAILS_CONCURRENCY && next < shipments.length) {
      const index = next
      next += 1
      inFlight += 1
      void loadOne(shipments[index]).then((shipment) => {
        results[index] = shipment
        inFlight -= 1
        processed += 1
        reportProgress()
        pump()
      })
    }
  }

  return {
    add: (batch) => {
      shipments.push(...batch)
      pump()
    },
    finish: async () => {
      listDone = true
      if (shipments.length === 0) return []
      reportProgress()
      pump()
      await settled
      log?.info("shippingQueue.details", {
        shipments: shipments.length,
        failed: results.filter((shipment) => shipment.detailsFetchFailed).length,
        documentsSkipped,
        pauses: pauseCount,
        ...(failedSample.length ? { failedSample } : {}),
      })
      return results
    },
  }
}

export async function fetchShippingQueueShipments(
  options: FetchShippingQueueOptions = {},
): Promise<ShippingQueueShipment[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const onProgress = options.onProgress
  const log = options.log
  const sleep = options.sleep ?? defaultSleep
  const pageSize = options.pageSize ?? SHIPPING_QUEUE_DEFAULT_PAGE_SIZE
  const cutoffTimestamp =
    options.cutoffDate != null
      ? (options.cutoffDate instanceof Date ? options.cutoffDate.getTime() : Number(options.cutoffDate))
      : calculateShippingQueueCutoffDate(options.referenceDate).getTime()

  onProgress?.({ source: "shippingQueue", status: "active", loaded: 0, phase: "listings" })

  const details = createShipmentDetailsLoader(fetchImpl, sleep, onProgress, log)
  const seenIds = new Set<string>()
  let listed = 0
  let cursor: ShipmentCursor | undefined
  let listingsIncomplete = false

  for (let page = 1; page <= SHIPPING_QUEUE_MAX_PAGES; page += 1) {
    const pageDone = log?.time("shippingQueue.listPage", { page })
    let pageShipments: ShippingQueueShipment[]
    try {
      pageShipments = await fetchShippingQueuePage(fetchImpl, shippingQueueUrl(pageSize, cursor))
    } catch (error) {
      if (page > 1) {
        log?.warn("shippingQueue.listStopped", { page, loaded: listed, error: describeError(error) })
        listingsIncomplete = true
        break
      }
      throw error
    }

    // Amazon orders by an index that can lag the real update time, so an older-looking
    // row may still be recent. Only stop once a whole page falls before the cutoff.
    let inWindow = 0
    const added: ShippingQueueShipment[] = []
    for (const shipment of pageShipments) {
      const updatedMs = getShipmentLastUpdatedMs(shipment)
      if (updatedMs != null && updatedMs < cutoffTimestamp) continue
      inWindow += 1
      const id = shipment.shipmentId?.trim()
      if (id && seenIds.has(id)) continue
      if (id) seenIds.add(id)
      added.push(shipment)
    }
    pageDone?.({ rows: pageShipments.length, inWindow, added: added.length })
    if (pageShipments.length === 0) break

    details.add(added)
    listed += added.length
    onProgress?.({ source: "shippingQueue", status: "active", loaded: listed, phase: "listings" })

    cursor = shippingQueueCursor(pageShipments[pageShipments.length - 1])
    if (inWindow === 0 || added.length === 0 || pageShipments.length < pageSize || !cursor) break
  }

  const loaded = await details.finish()
  const withDetails = listingsIncomplete ? loaded.map((shipment) => ({ ...shipment, listingsIncomplete: true })) : loaded

  onProgress?.({
    source: "shippingQueue",
    status: "complete",
    loaded: withDetails.length,
    total: withDetails.length,
    phase: withDetails.length > 0 ? "details" : "listings",
  })

  return withDetails
}
