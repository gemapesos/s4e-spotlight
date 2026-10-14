import { describe, expect, it, vi } from "vitest"

import {
  asShippingQueueShipment,
  buildAsinUrl,
  buildShipmentClaimUrl,
  buildShipmentUrl,
  calculateDiscrepancyQuantity,
  calculateShippingQueueCutoffDate,
  fetchShippingQueueShipments,
  formatShippingQueueDate,
  getShipmentLastUpdatedMs,
  parseShipmentDetails,
  parseShippingQueueResponse,
  SHIPMENT_DETAILS_CONCURRENCY,
  SHIPMENT_DETAILS_MAX_ATTEMPTS,
  SHIPMENT_DETAILS_SESSION_PAUSES,
  SHIPMENT_DETAILS_SESSION_WAIT_MS,
  SHIPPING_QUEUE_DEFAULT_PAGE_SIZE,
  SHIPPING_QUEUE_DETAIL_HEADERS,
  SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE,
  SHIPPING_QUEUE_DETAILS_UNAVAILABLE,
  SHIPPING_QUEUE_ITEM_HEADERS,
  SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE,
  SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE,
  SHIPPING_QUEUE_ORDER_BY,
  SHIPPING_QUEUE_REFERRER,
  SHIPPING_QUEUE_SHEET_HEADERS,
  SHIPPING_QUEUE_SHIPMENT_HEADERS,
  SHIPPING_QUEUE_URL,
  shipmentDetailsUrl,
  shippingQueueNumericCell,
  shippingQueueSheetRow,
  shippingQueueSheetRows,
  shippingQueueShipmentRows,
  shippingQueueUrl,
  shippingQueueYesNo,
  type ShippingQueueShipment,
} from "../src/lib/shippingQueue"
import type { ReportProgressEvent } from "../src/lib/reportProgress"

const SAMPLE_RAW_SHIPMENT = {
  shipmentName: "FBA STA (09/29/2026 15:25)-HGR6",
  shipmentId: "FBA19RKC646S",
  destinationFC: "HGR6",
  shipFromAddressId: "UZOIHKA45SMUPD5MGWZQG13KZ56YNR7RC5A5CR7RNY65ZKMPXTQ2EIA2OXQJ3DNC",
  shipmentStatus: "CLOSED",
  createdDate: 1790695510000,
  lastUpdatedDate: 1791563619000,
  mskus: 9,
  shippedQuantity: 26,
  receivedQuantity: 24,
  expectedQuantity: 26,
  locatedQuantity: 24,
  stowedQuantity: 24,
  workflowId: "wff782a6b5-8e13-47a0-9e82-417a9c198772",
  workflowType: "SEND_TO_AMAZON",
  poId: "67ZEINCX",
  needByDate: null,
  placementStatus: "NORMAL_SHIPMENT",
  fcAddress: "US",
  reasonCode: null,
  finalizedDate: null,
  estimatedFinalizedDateUTC: null,
  formerEstimatedFinalizedDateUTC: null,
  shipOrDeliveryWindow: {
    windowStartDate: 1791072000000,
    windowEndDate: 1791676799000,
    windowType: "DELIVERY",
    gracePeriodEndDate: 1791072000000,
  },
  shipOrDeliveryWindowComplianceStatus: null,
  ismsDetails: null,
  t2pAccelerate: null,
  blocked: false,
  partneredImport: false,
  merchantLaunched: false,
  finalized: false,
}
const SAMPLE_DETAILS_RESPONSE = {
  shipmentId: "FBA19RKC646S",
  eligible: false,
  ineligibilityReason: "NINE_MONTH_STATUTE_OF_LIMITATIONS",
  estimatedTimestamp: 0,
  formerEstimatedTimestamp: 0,
  daysToWait: 0,
  details: { FINALIZED: "FINALIZED" },
  shipmentStatus: "CLOSED",
  inquiry: {
    shipmentId: "FBA19RKC646S",
    inquiryText: "",
    inquiryStatus: "WAITING",
    caseId: null,
    caseCreationDate: null,
    caseCreatedBy: null,
  },
  hasDiscrepancy: null,
  retailDomainName: "www.amazon.com",
  discrepancies: {
    totalRecords: 2,
    pageSize: 50,
    items: [
      {
        merchantSKU: "1065261408",
        title: "Bath and Body Works BAHAMAS Ultra Shea Body Cream 8 Ounce",
        fnsku: "X0049ZY5F9",
        asin: "B085HNC5QJ",
        upc: "667552188299",
        barcodeType: "EAN",
        barcodeValue: "0667552188299",
        isSortable: true,
        eligibleForResearch: false,
        expectedQuantity: 25,
        totalLocatedQuantity: 24,
        totalReceivedQuantity: 24,
        totalAdjustmentQuantity: 1,
        totalReimbursedQuantity: 2,
        totalClawbackQuantity: 3,
        totalAcknowledgedQuantity: 4,
        totalDeniedQuantity: 5,
        totalVirtuallyAdjustedQuantity: 6,
        otherReceivedQuantity: 7,
        otherReceiveStartDate: 1790695510000,
        otherReceiveEndDate: 1790699110000,
        iarAutoReconciliations: [{ id: "iar-1" }],
        totalDiscrepancyQuantity: -1,
        ineligibilityReason: "NO_DISCREPANCY",
        caseId: "1234567",
        itemCondition: "NewItem",
        reasonCode: "LOST",
      },
      {
        merchantSKU: "1066915973 - WTube",
        title: "Bath and Body Works Moisturizing Body Wash 10 oz",
        fnsku: "X004EW8459",
        asin: "B0D12X3464",
        upc: "",
        barcodeType: "",
        barcodeValue: "",
        isSortable: true,
        eligibleForResearch: false,
        expectedQuantity: 25,
        totalLocatedQuantity: 25,
        totalReceivedQuantity: 25,
        totalAdjustmentQuantity: 0,
        totalReimbursedQuantity: 0,
        totalClawbackQuantity: 0,
        totalAcknowledgedQuantity: 0,
        totalDeniedQuantity: 0,
        totalVirtuallyAdjustedQuantity: 0,
        otherReceivedQuantity: 0,
        otherReceiveStartDate: null,
        otherReceiveEndDate: null,
        iarAutoReconciliations: null,
        totalDiscrepancyQuantity: 0,
        ineligibilityReason: "NO_DISCREPANCY",
        caseId: null,
        itemCondition: "NewItem",
        reasonCode: null,
      },
    ],
    workflowType: "SEND_TO_AMAZON",
  },
  merchantLaunched: false,
  wmsrAllowed: true,
}

const response = (payload: unknown, status = 200, contentType?: string) => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: "",
  headers: {
    get: (name: string) => (name.toLowerCase() === "content-type" ? contentType ?? null : null),
  },
  json: async () => payload,
}) as unknown as Response

interface RouteOptions {
  pages?: unknown[]
  details?: Record<string, unknown | number | Error>
}

/** Serves list pages in order and eligibility details by shipment ID. */
function routedFetch({ pages = [], details = {} }: RouteOptions) {
  let pageIndex = 0
  return vi.fn(async (input: unknown, _init?: unknown) => {
    const url = String(input)
    if (url.startsWith(SHIPPING_QUEUE_URL)) {
      const page = pages[pageIndex]
      pageIndex += 1
      if (page instanceof Error) throw page
      if (typeof page === "number") return response({}, page)
      return response(page ?? [])
    }
    const id = decodeURIComponent(url.split("/eligibilities/")[1].split("?")[0])
    const result = id in details ? details[id] : { ...SAMPLE_DETAILS_RESPONSE, shipmentId: id }
    if (result instanceof Error) throw result
    if (typeof result === "number") return response({}, result)
    return response(result)
  })
}

const noSleep = async () => {}
const NO_CUTOFF = { cutoffDate: 0, sleep: noSleep }

describe("shippingQueue URL generation", () => {
  it("builds the first-page URL exactly like Seller Central", () => {
    expect(shippingQueueUrl()).toBe(
      `${SHIPPING_QUEUE_URL}?pageSize=${SHIPPING_QUEUE_DEFAULT_PAGE_SIZE}&orderBy=${SHIPPING_QUEUE_ORDER_BY}&isOrderAscending=false&t2pLaunched=true`,
    )
  })

  it("pages with the last shipment's ID, created date, and last updated date", () => {
    const url = new URL(
      shippingQueueUrl(250, { lastShipmentId: "FBA195KBYDSS", createdDate: "1767122910000", lastUpdatedDate: "1768331292000" }),
    )
    expect(url.searchParams.get("lastShipmentId")).toBe("FBA195KBYDSS")
    expect(url.searchParams.get("createdDate")).toBe("1767122910000")
    expect(url.searchParams.get("lastUpdatedDate")).toBe("1768331292000")
    expect(url.searchParams.get("t2pLaunched")).toBe("true")
    expect(url.searchParams.has("pageNumber")).toBe(false)
  })

  it("builds the eligibility URL with inquiry and discrepancies", () => {
    expect(shipmentDetailsUrl("FBA18TNH8GWF")).toBe(
      "https://sellercentral.amazon.com/fba/wmsr/eligibilities/FBA18TNH8GWF?withInquiry=true&withDiscrepancies=true",
    )
  })
})

describe("shippingQueue helpers", () => {
  it("formats dates into unambiguous UTC DD-MMM-YYYY HH:mm:ss", () => {
    // 1790695510000 = 2026-09-29T15:25:10.000Z
    expect(formatShippingQueueDate(1790695510000)).toBe("29-Sep-2026 15:25:10")
    expect(formatShippingQueueDate("2026-10-04T00:00:00.000Z")).toBe("04-Oct-2026 00:00:00")
    expect(formatShippingQueueDate(null)).toBe("")
    expect(formatShippingQueueDate(undefined)).toBe("")
    expect(formatShippingQueueDate("")).toBe("")
    expect(formatShippingQueueDate("not-a-date")).toBe("not-a-date")
  })

  it("handles numeric cells and preservation of numbers", () => {
    expect(shippingQueueNumericCell(0)).toBe(0)
    expect(shippingQueueNumericCell(26)).toBe(26)
    expect(shippingQueueNumericCell("42")).toBe(42)
    expect(shippingQueueNumericCell(null)).toBe("")
    expect(shippingQueueNumericCell(undefined)).toBe("")
    expect(shippingQueueNumericCell("")).toBe("")
    expect(shippingQueueNumericCell("abc")).toBe("")
  })

  it("formats booleans as Yes / No", () => {
    expect(shippingQueueYesNo(true)).toBe("Yes")
    expect(shippingQueueYesNo(false)).toBe("No")
    expect(shippingQueueYesNo(null)).toBe("")
    expect(shippingQueueYesNo(undefined)).toBe("")
  })

  it("calculates discrepancy quantity accurately", () => {
    expect(calculateDiscrepancyQuantity(24, 26)).toBe(-2)
    expect(calculateDiscrepancyQuantity(28, 26)).toBe(2)
    expect(calculateDiscrepancyQuantity(26, 26)).toBe(0)
    expect(calculateDiscrepancyQuantity(null, 26)).toBe("")
    expect(calculateDiscrepancyQuantity(26, undefined)).toBe("")
  })

  it("builds the direct Seller Central shipment contents URL", () => {
    expect(buildShipmentUrl("FBA19RKC646S")).toBe(
      "https://sellercentral.amazon.com/fba/inbound-shipment/summary/FBA19RKC646S/contents",
    )
    expect(buildShipmentUrl("")).toBe("")
    expect(buildShipmentUrl(null)).toBe("")
  })
})

describe("shippingQueue parsing and mapping", () => {
  it("maps raw shipment record into ShippingQueueShipment", () => {
    const shipment = asShippingQueueShipment(SAMPLE_RAW_SHIPMENT)
    expect(shipment).toBeDefined()
    expect(shipment?.shipmentName).toBe("FBA STA (09/29/2026 15:25)-HGR6")
    expect(shipment?.shipmentId).toBe("FBA19RKC646S")
    expect(shipment?.destinationFC).toBe("HGR6")
    expect(shipment?.mskus).toBe(9)
    expect(shipment?.shippedQuantity).toBe(26)
    expect(shipment?.receivedQuantity).toBe(24)
    expect(shipment?.blocked).toBe(false)
    expect(shipment?.shipOrDeliveryWindow?.windowType).toBe("DELIVERY")
  })

  it("parses JSON array payload", () => {
    const parsed = parseShippingQueueResponse([SAMPLE_RAW_SHIPMENT])
    expect(parsed).toHaveLength(1)
    expect(parsed[0].shipmentId).toBe("FBA19RKC646S")
  })

  it("parses wrapped object payloads (shipments, data, shipmentList, items, payload)", () => {
    expect(parseShippingQueueResponse({ shipments: [SAMPLE_RAW_SHIPMENT] })).toHaveLength(1)
    expect(parseShippingQueueResponse({ data: [SAMPLE_RAW_SHIPMENT] })).toHaveLength(1)
    expect(parseShippingQueueResponse({ shipmentList: [SAMPLE_RAW_SHIPMENT] })).toHaveLength(1)
    expect(parseShippingQueueResponse({ items: [SAMPLE_RAW_SHIPMENT] })).toHaveLength(1)
    expect(parseShippingQueueResponse({ payload: [SAMPLE_RAW_SHIPMENT] })).toHaveLength(1)
  })

  it("throws when payload has no recognizable shipments array", () => {
    expect(() => parseShippingQueueResponse(null)).toThrow("Couldn’t load shipping queue.")
    expect(() => parseShippingQueueResponse({})).toThrow("Couldn’t load shipping queue.")
    expect(() => parseShippingQueueResponse({ other: [SAMPLE_RAW_SHIPMENT] })).toThrow("Couldn’t load shipping queue.")
  })
})
describe("shippingQueue link builders", () => {
  it("builds claim page and ASIN URLs", () => {
    expect(buildShipmentClaimUrl("FBA18TNH8GWF")).toBe("https://sellercentral.amazon.com/fba/wmsr/FBA18TNH8GWF")
    expect(buildShipmentClaimUrl(" ")).toBe("")
    expect(buildAsinUrl("B085HNC5QJ")).toBe("https://www.amazon.com/dp/B085HNC5QJ")
    expect(buildAsinUrl(null)).toBe("")
  })
})

describe("parseShipmentDetails", () => {
  it("maps eligibility, inquiry, and every discrepancy field", () => {
    const details = parseShipmentDetails(SAMPLE_DETAILS_RESPONSE)
    expect(details).toMatchObject({
      eligible: false,
      ineligibilityReason: "NINE_MONTH_STATUTE_OF_LIMITATIONS",
      estimatedTimestamp: 0,
      daysToWait: 0,
      details: { FINALIZED: "FINALIZED" },
      inquiry: { inquiryStatus: "WAITING", inquiryText: "" },
      retailDomainName: "www.amazon.com",
      wmsrAllowed: true,
      discrepancyTotalRecords: 2,
    })
    expect(details.hasDiscrepancy).toBeUndefined()
    expect(details.items).toHaveLength(2)
    expect(details.items[0]).toMatchObject({
      merchantSKU: "1065261408",
      fnsku: "X0049ZY5F9",
      asin: "B085HNC5QJ",
      barcodeType: "EAN",
      totalReimbursedQuantity: 2,
      totalVirtuallyAdjustedQuantity: 6,
      otherReceiveStartDate: 1790695510000,
      iarAutoReconciliations: [{ id: "iar-1" }],
      caseId: "1234567",
      reasonCode: "LOST",
    })
  })

  it("tolerates a response without discrepancies", () => {
    expect(parseShipmentDetails({ eligible: true })).toEqual({ eligible: true, items: [] })
  })

  it("rejects non-object payloads", () => {
    expect(() => parseShipmentDetails(null)).toThrow("Couldn’t load shipment details.")
    expect(() => parseShipmentDetails([])).toThrow("Couldn’t load shipment details.")
  })
})

describe("shippingQueue sheet generation", () => {
  const shipment = (): ShippingQueueShipment => asShippingQueueShipment(SAMPLE_RAW_SHIPMENT)!
  const withDetails = (): ShippingQueueShipment => ({ ...shipment(), details: parseShipmentDetails(SAMPLE_DETAILS_RESPONSE) })
  const column = (header: (typeof SHIPPING_QUEUE_SHEET_HEADERS)[number]) => SHIPPING_QUEUE_SHEET_HEADERS.indexOf(header)

  it("combines shipment, eligibility, and SKU-line columns", () => {
    expect(SHIPPING_QUEUE_SHIPMENT_HEADERS).toHaveLength(36)
    expect(SHIPPING_QUEUE_SHEET_HEADERS).toHaveLength(
      SHIPPING_QUEUE_SHIPMENT_HEADERS.length + SHIPPING_QUEUE_DETAIL_HEADERS.length + SHIPPING_QUEUE_ITEM_HEADERS.length,
    )
    expect(new Set(SHIPPING_QUEUE_SHEET_HEADERS).size).toBe(SHIPPING_QUEUE_SHEET_HEADERS.length)
  })

  it("fills the shipment list columns", () => {
    const row = shippingQueueSheetRow(shipment())
    expect(row).toHaveLength(SHIPPING_QUEUE_SHEET_HEADERS.length)
    expect(row[0]).toBe("FBA STA (09/29/2026 15:25)-HGR6")
    expect(row[1]).toBe("FBA19RKC646S")
    expect(row[2]).toBe("https://sellercentral.amazon.com/fba/inbound-shipment/summary/FBA19RKC646S/contents")
    expect(row[3]).toBe("CLOSED")
    expect(row[4]).toBe("HGR6")
    expect(row[5]).toBe("US")
    expect(row[7]).toBe("29-Sep-2026 15:25:10")
    expect(row[8]).toBe("09-Oct-2026 16:33:39")
    expect(row[9]).toBe(9)
    expect(row[10]).toBe(26)
    expect(row[11]).toBe(24)
    expect(row[15]).toBe(-2)
    expect(row[21]).toBe("04-Oct-2026 00:00:00")
    expect(row[22]).toBe("10-Oct-2026 23:59:59")
    expect(row[27]).toBe("No")
    expect(row[31]).toBe("No")
  })

  it("leaves detail and SKU columns blank when details were never requested", () => {
    const row = shippingQueueSheetRow(shipment())
    expect(row.slice(SHIPPING_QUEUE_SHIPMENT_HEADERS.length).every((cell) => cell === "")).toBe(true)
  })

  it("writes one row per SKU line with the shipment columns repeated", () => {
    const rows = shippingQueueShipmentRows(withDetails())
    expect(rows).toHaveLength(2)
    expect(rows[0][1]).toBe("FBA19RKC646S")
    expect(rows[1][1]).toBe("FBA19RKC646S")

    const first = rows[0]
    expect(first[column("Details Status")]).toBe("Loaded")
    expect(first[column("Claim Page URL")]).toBe("https://sellercentral.amazon.com/fba/wmsr/FBA19RKC646S")
    expect(first[column("Reimbursement Eligible")]).toBe("No")
    expect(first[column("Ineligibility Reason")]).toBe("NINE_MONTH_STATUTE_OF_LIMITATIONS")
    expect(first[column("Estimated Eligibility Date")]).toBe("")
    expect(first[column("Days To Wait")]).toBe(0)
    expect(first[column("Eligibility Details")]).toBe("FINALIZED: FINALIZED")
    expect(first[column("Inquiry Status")]).toBe("WAITING")
    expect(first[column("Has Discrepancy")]).toBe("")
    expect(first[column("Retail Domain")]).toBe("www.amazon.com")
    expect(first[column("Claims Allowed")]).toBe("Yes")
    expect(first[column("SKU Lines")]).toBe(2)
    expect(first[column("Total Discrepancy Quantity")]).toBe(-1)

    expect(first[column("SKU")]).toBe("1065261408")
    expect(first[column("FNSKU")]).toBe("X0049ZY5F9")
    expect(first[column("ASIN URL")]).toBe("https://www.amazon.com/dp/B085HNC5QJ")
    expect(first[column("Barcode Type")]).toBe("EAN")
    expect(first[column("Condition")]).toBe("NewItem")
    expect(first[column("Sortable")]).toBe("Yes")
    expect(first[column("Eligible For Research")]).toBe("No")
    expect(first[column("Item Expected Quantity")]).toBe(25)
    expect(first[column("Adjustment Quantity")]).toBe(1)
    expect(first[column("Reimbursed Quantity")]).toBe(2)
    expect(first[column("Clawback Quantity")]).toBe(3)
    expect(first[column("Acknowledged Quantity")]).toBe(4)
    expect(first[column("Denied Quantity")]).toBe(5)
    expect(first[column("Virtually Adjusted Quantity")]).toBe(6)
    expect(first[column("Other Received Quantity")]).toBe(7)
    expect(first[column("Other Receive Start Date")]).toBe("29-Sep-2026 15:25:10")
    expect(first[column("IAR Auto Reconciliations")]).toBe('[{"id":"iar-1"}]')
    expect(first[column("Item Discrepancy Quantity")]).toBe(-1)
    expect(first[column("Item Case ID")]).toBe("1234567")
    expect(first[column("Item Reason Code")]).toBe("LOST")

    expect(rows[1][column("SKU")]).toBe("1066915973 - WTube")
    expect(rows[1][column("Other Receive Start Date")]).toBe("")
    expect(rows[1][column("Item Discrepancy Quantity")]).toBe(0)
  })

  it("keeps a single row for a shipment with no SKU lines", () => {
    const empty: ShippingQueueShipment = { ...shipment(), details: { eligible: true, items: [] } }
    const rows = shippingQueueShipmentRows(empty)
    expect(rows).toHaveLength(1)
    expect(rows[0][column("Details Status")]).toBe("Loaded")
    expect(rows[0][column("SKU")]).toBe("")
  })

  it("marks shipments whose details could not be loaded", () => {
    const rows = shippingQueueSheetRows([{ ...shipment(), detailsFetchFailed: true }])
    expect(rows[0]).toEqual([SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE])
    expect(rows[1]).toEqual([])
    expect(rows[2]).toEqual([...SHIPPING_QUEUE_SHEET_HEADERS])
    expect(rows[3][column("Details Status")]).toBe(SHIPPING_QUEUE_DETAILS_UNAVAILABLE)
    expect(rows[3][column("SKU")]).toBe("")
  })

  it("adds notes for incomplete lists and truncated SKU lines", () => {
    const truncated: ShippingQueueShipment = {
      ...shipment(),
      listingsIncomplete: true,
      details: { items: [{ merchantSKU: "A" }], discrepancyTotalRecords: 60 },
    }
    const rows = shippingQueueSheetRows([truncated])
    expect(rows[0]).toEqual([SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE])
    expect(rows[1]).toEqual([SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE])
    expect(rows[2]).toEqual([])
    expect(rows[3]).toEqual([...SHIPPING_QUEUE_SHEET_HEADERS])
  })

  it("still outputs headers when there are no shipments", () => {
    expect(shippingQueueSheetRows([])).toEqual([[...SHIPPING_QUEUE_SHEET_HEADERS]])
  })
})

describe("fetchShippingQueueShipments", () => {
  it("loads the list, then each shipment's details, and reports progress", async () => {
    const fetchImpl = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT]] })
    const events: ReportProgressEvent[] = []

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl, onProgress: (e) => events.push(e) })

    expect(shipments).toHaveLength(1)
    expect(shipments[0].shipmentId).toBe("FBA19RKC646S")
    expect(shipments[0].details?.items).toHaveLength(2)
    expect(shipments[0].detailsFetchFailed).toBeUndefined()
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(events).toContainEqual({ source: "shippingQueue", status: "active", loaded: 0, phase: "listings" })
    expect(events).toContainEqual({ source: "shippingQueue", status: "active", loaded: 1, phase: "listings" })
    expect(events).toContainEqual({ source: "shippingQueue", status: "active", loaded: 0, total: 1, phase: "details" })
    expect(events).toContainEqual({ source: "shippingQueue", status: "active", loaded: 1, total: 1, phase: "details" })
    expect(events.at(-1)).toEqual({ source: "shippingQueue", status: "complete", loaded: 1, total: 1, phase: "details" })
  })

  it("sends the same requests Seller Central does", async () => {
    const fetchImpl = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT]] })
    await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl })

    const [listUrl, listInit] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(listUrl).toBe(shippingQueueUrl())
    expect(listInit).toMatchObject({
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: SHIPPING_QUEUE_REFERRER,
      headers: { accept: "*/*", "accept-language": "en-US,en;q=0.9" },
    })

    const [detailsUrl, detailsInit] = fetchImpl.mock.calls[1] as unknown as [string, RequestInit]
    expect(detailsUrl).toBe(shipmentDetailsUrl("FBA19RKC646S"))
    expect(detailsInit).toMatchObject({
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: "https://sellercentral.amazon.com/fba/wmsr/FBA19RKC646S",
    })
  })

  it("pages with the cursor from the last shipment of the previous page", async () => {
    const page1 = [
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_P1_0" },
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_P1_1", createdDate: 1767122910000, lastUpdatedDate: 1768331292000 },
    ]
    const page2 = [{ ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_P2_0" }]
    const fetchImpl = routedFetch({ pages: [page1, page2] })

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl, pageSize: 2 })

    expect(shipments.map((s) => s.shipmentId)).toEqual(["FBA_P1_0", "FBA_P1_1", "FBA_P2_0"])
    const listCalls = fetchImpl.mock.calls.map(([url]) => String(url)).filter((url) => url.startsWith(SHIPPING_QUEUE_URL))
    expect(listCalls).toHaveLength(2)
    const second = new URL(listCalls[1])
    expect(second.searchParams.get("lastShipmentId")).toBe("FBA_P1_1")
    expect(second.searchParams.get("createdDate")).toBe("1767122910000")
    expect(second.searchParams.get("lastUpdatedDate")).toBe("1768331292000")
  })

  it("stops when a page is short, empty, or only repeats shipments", async () => {
    const short = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT]] })
    await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: short, pageSize: 2 })
    expect(short.mock.calls.filter(([url]) => String(url).startsWith(SHIPPING_QUEUE_URL))).toHaveLength(1)

    const repeating = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT, SAMPLE_RAW_SHIPMENT], [SAMPLE_RAW_SHIPMENT, SAMPLE_RAW_SHIPMENT], []] })
    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: repeating, pageSize: 2 })
    expect(shipments).toHaveLength(1)
    expect(repeating.mock.calls.filter(([url]) => String(url).startsWith(SHIPPING_QUEUE_URL))).toHaveLength(2)
  })

  it("skips shipments updated before the cutoff but keeps recent ones listed after them", async () => {
    const old = { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_OLD", lastUpdatedDate: 1700000000000 }
    const lagging = { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_LAGGING", lastUpdatedDate: 1791000000000 }
    const fresh = { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_FRESH", lastUpdatedDate: 1791500000000 }
    const fetchImpl = routedFetch({ pages: [[fresh, old, lagging], [{ ...old, shipmentId: "FBA_OLD_2" }, { ...old, shipmentId: "FBA_OLD_3" }, old], [fresh]] })

    const shipments = await fetchShippingQueueShipments({
      fetch: fetchImpl,
      sleep: noSleep,
      pageSize: 3,
      referenceDate: new Date("2026-10-10T12:00:00Z"),
    })

    expect(shipments.map((s) => s.shipmentId)).toEqual(["FBA_FRESH", "FBA_LAGGING"])
    // Page 2 holds only pre-cutoff shipments, so page 3 is never requested.
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).startsWith(SHIPPING_QUEUE_URL))).toHaveLength(2)
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).includes("/eligibilities/"))).toHaveLength(2)
  })

  it("keeps earlier pages and flags the list when a later page fails", async () => {
    const page1 = [
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_P1_0" },
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_P1_1" },
    ]
    const fetchImpl = routedFetch({ pages: [page1, 500] })

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl, pageSize: 2 })

    expect(shipments).toHaveLength(2)
    expect(shipments.every((s) => s.listingsIncomplete)).toBe(true)
    expect(shippingQueueSheetRows(shipments)[0]).toEqual([SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE])
  })

  it("throws when the first page fails", async () => {
    await expect(
      fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: routedFetch({ pages: [500] }) }),
    ).rejects.toThrow("Couldn’t load shipping queue (500).")
    await expect(
      fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: routedFetch({ pages: [{ not: "a list" }] }) }),
    ).rejects.toThrow("Couldn’t load shipping queue.")
  })

  it("marks only the shipments whose details fail", async () => {
    const pages = [[
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_OK" },
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_FORBIDDEN" },
      { ...SAMPLE_RAW_SHIPMENT, shipmentId: "FBA_BROKEN" },
    ]]
    const fetchImpl = routedFetch({
      pages,
      details: { FBA_FORBIDDEN: 403, FBA_BROKEN: "not an object" },
    })
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl })

    expect(shipments[0].details).toBeDefined()
    expect(shipments[1]).toMatchObject({ shipmentId: "FBA_FORBIDDEN", detailsFetchFailed: true })
    expect(shipments[1].details).toBeUndefined()
    expect(shipments[2]).toMatchObject({ shipmentId: "FBA_BROKEN", detailsFetchFailed: true })
    // A 403 pauses once, checks the list, and retries that shipment once.
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).includes("FBA_FORBIDDEN"))).toHaveLength(2)
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).includes("FBA_BROKEN"))).toHaveLength(1)
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).startsWith(SHIPPING_QUEUE_URL))).toHaveLength(2)
    vi.restoreAllMocks()
  })

  it("pauses on a session response and resumes without launching during the wait", async () => {
    const count = SHIPMENT_DETAILS_CONCURRENCY + 5
    const rows = Array.from({ length: count }, (_, i) => ({ ...SAMPLE_RAW_SHIPMENT, shipmentId: `FBA_${i}` }))
    const seen = new Map<string, number>()
    let waiting = false
    let startedDuringWait = 0
    let markSleepEntered: () => void = () => {}
    const sleepEntered = new Promise<void>((resolve) => {
      markSleepEntered = resolve
    })
    let releaseSleep: () => void = () => {}
    const sleepGate = new Promise<void>((resolve) => {
      releaseSleep = resolve
    })
    const base = routedFetch({ pages: [rows] })
    const fetchImpl = vi.fn(async (input: unknown, init?: unknown) => {
      const url = String(input)
      if (!url.includes("/eligibilities/")) return base(input, init)
      if (waiting) startedDuringWait += 1
      const id = decodeURIComponent(url.split("/eligibilities/")[1].split("?")[0])
      const attempt = (seen.get(id) ?? 0) + 1
      seen.set(id, attempt)
      if (id === "FBA_0" && attempt === 1) return response("<html>sign in</html>", 200, "text/html")
      return response({ ...SAMPLE_DETAILS_RESPONSE, shipmentId: id })
    })
    const sleep = vi.fn(async (ms: number) => {
      if (ms !== SHIPMENT_DETAILS_SESSION_WAIT_MS) return
      waiting = true
      markSleepEntered()
      await sleepGate
      waiting = false
    })
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const pending = fetchShippingQueueShipments({ cutoffDate: 0, fetch: fetchImpl, sleep })
    await sleepEntered
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(startedDuringWait).toBe(0)
    expect(seen.has(`FBA_${SHIPMENT_DETAILS_CONCURRENCY}`)).toBe(false)

    releaseSleep()
    const shipments = await pending

    expect(startedDuringWait).toBe(0)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(shipments).toHaveLength(count)
    expect(shipments.every((shipment) => shipment.details && !shipment.detailsFetchFailed)).toBe(true)
    expect(seen.get("FBA_0")).toBe(2)
    vi.restoreAllMocks()
  })

  it("marks shipments not yet started when the list check fails", async () => {
    const count = SHIPMENT_DETAILS_CONCURRENCY + 5
    const rows = Array.from({ length: count }, (_, i) => ({ ...SAMPLE_RAW_SHIPMENT, shipmentId: `FBA_${i}` }))
    const fetchImpl = routedFetch({ pages: [rows, 500], details: { FBA_0: 401 } })
    const sleep = vi.fn(async () => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const shipments = await fetchShippingQueueShipments({ cutoffDate: 0, fetch: fetchImpl, sleep })

    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(SHIPMENT_DETAILS_SESSION_WAIT_MS)
    expect(shipments[0]).toMatchObject({ shipmentId: "FBA_0", detailsFetchFailed: true })
    for (let i = 1; i < SHIPMENT_DETAILS_CONCURRENCY; i += 1) {
      expect(shipments[i].details).toBeDefined()
      expect(shipments[i].detailsFetchFailed).toBeUndefined()
    }
    for (let i = SHIPMENT_DETAILS_CONCURRENCY; i < count; i += 1) {
      expect(shipments[i].detailsFetchFailed).toBe(true)
      expect(fetchImpl.mock.calls.some(([url]) => String(url).includes(`/eligibilities/FBA_${i}?`))).toBe(false)
    }
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).includes("/eligibilities/FBA_0"))).toHaveLength(1)
    expect(fetchImpl.mock.calls.filter(([url]) => String(url).startsWith(SHIPPING_QUEUE_URL))).toHaveLength(2)
    vi.restoreAllMocks()
  })

  it("does not pause again after the session pause cap", async () => {
    const wave = SHIPMENT_DETAILS_CONCURRENCY
    const count = wave * (SHIPMENT_DETAILS_SESSION_PAUSES + 1) + 10
    const rows = Array.from({ length: count }, (_, i) => ({ ...SAMPLE_RAW_SHIPMENT, shipmentId: `FBA_${i}` }))
    const sessionIndexes = Array.from({ length: SHIPMENT_DETAILS_SESSION_PAUSES + 1 }, (_, i) => i * wave)
    const attempts = new Map<string, number>()
    const base = routedFetch({ pages: [rows] })
    const fetchImpl = vi.fn(async (input: unknown, init?: unknown) => {
      const url = String(input)
      if (!url.includes("/eligibilities/")) return base(input, init)
      const id = decodeURIComponent(url.split("/eligibilities/")[1].split("?")[0])
      const attempt = (attempts.get(id) ?? 0) + 1
      attempts.set(id, attempt)
      const index = Number(id.slice(4))
      if (sessionIndexes.includes(index) && attempt === 1) return response({}, 403)
      return response({ ...SAMPLE_DETAILS_RESPONSE, shipmentId: id })
    })
    const sleep = vi.fn(async (_ms: number) => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})

    const shipments = await fetchShippingQueueShipments({ cutoffDate: 0, fetch: fetchImpl, sleep })

    expect(sleep.mock.calls.filter(([ms]) => ms === SHIPMENT_DETAILS_SESSION_WAIT_MS)).toHaveLength(SHIPMENT_DETAILS_SESSION_PAUSES)
    for (const index of sessionIndexes.slice(0, SHIPMENT_DETAILS_SESSION_PAUSES)) {
      expect(shipments[index].details).toBeDefined()
      expect(attempts.get(`FBA_${index}`)).toBe(2)
    }
    const capped = sessionIndexes[SHIPMENT_DETAILS_SESSION_PAUSES]
    expect(shipments[capped]).toMatchObject({ detailsFetchFailed: true })
    expect(attempts.get(`FBA_${capped}`)).toBe(1)
    for (let i = wave * (SHIPMENT_DETAILS_SESSION_PAUSES + 1); i < count; i += 1) {
      expect(shipments[i].detailsFetchFailed).toBe(true)
      expect(attempts.has(`FBA_${i}`)).toBe(false)
    }
    expect(shipments[capped + 1].details).toBeDefined()
    vi.restoreAllMocks()
  })

  it("retries throttled and failing detail requests", async () => {
    let attempts = 0
    const base = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT]] })
    const fetchImpl = vi.fn(async (input: unknown, init?: unknown) => {
      if (String(input).includes("/eligibilities/")) {
        attempts += 1
        if (attempts === 1) return response({}, 429)
        if (attempts === 2) throw new Error("network down")
        return response(SAMPLE_DETAILS_RESPONSE)
      }
      return base(input, init)
    })
    const sleep = vi.fn(async () => {})

    const shipments = await fetchShippingQueueShipments({ cutoffDate: 0, fetch: fetchImpl, sleep })

    expect(attempts).toBe(3)
    expect(sleep).toHaveBeenCalledTimes(2)
    expect(shipments[0].details?.items).toHaveLength(2)
  })

  it("gives up after the maximum number of attempts", async () => {
    let attempts = 0
    const base = routedFetch({ pages: [[SAMPLE_RAW_SHIPMENT]] })
    const fetchImpl = vi.fn(async (input: unknown, init?: unknown) => {
      if (String(input).includes("/eligibilities/")) {
        attempts += 1
        return response({}, 503)
      }
      return base(input, init)
    })
    vi.spyOn(console, "error").mockImplementation(() => {})

    const shipments = await fetchShippingQueueShipments({ cutoffDate: 0, fetch: fetchImpl, sleep: noSleep })

    expect(attempts).toBe(SHIPMENT_DETAILS_MAX_ATTEMPTS)
    expect(shipments[0].detailsFetchFailed).toBe(true)
    vi.restoreAllMocks()
  })

  it("loads details forty at a time, in list order", async () => {
    const count = SHIPMENT_DETAILS_CONCURRENCY + 10
    const pages = [Array.from({ length: count }, (_, i) => ({ ...SAMPLE_RAW_SHIPMENT, shipmentId: `FBA_${String(i).padStart(2, "0")}` }))]
    let inFlight = 0
    let peak = 0
    const base = routedFetch({ pages })
    const fetchImpl = vi.fn(async (input: unknown, init?: unknown) => {
      if (!String(input).includes("/eligibilities/")) return base(input, init)
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1
      return base(input, init)
    })
    const events: ReportProgressEvent[] = []

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl, onProgress: (e) => events.push(e) })

    expect(shipments.map((s) => s.shipmentId)).toEqual(pages[0].map((s) => s.shipmentId))
    expect(peak).toBe(SHIPMENT_DETAILS_CONCURRENCY)
    const loaded = events.filter((e) => e.phase === "details" && e.status === "active").map((e) => e.loaded)
    expect(loaded).toEqual(Array.from({ length: count + 1 }, (_, i) => i))
  })

  it("completes without detail requests when there are no shipments", async () => {
    const fetchImpl = routedFetch({ pages: [[]] })
    const events: ReportProgressEvent[] = []

    const shipments = await fetchShippingQueueShipments({ ...NO_CUTOFF, fetch: fetchImpl, onProgress: (e) => events.push(e) })

    expect(shipments).toEqual([])
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(events.at(-1)).toEqual({ source: "shippingQueue", status: "complete", loaded: 0, total: 0, phase: "listings" })
  })
})

describe("calculateShippingQueueCutoffDate", () => {
  it("computes 9 months back from yesterday for standard dates", () => {
    // Reference date: Oct 10, 2026 -> Yesterday: Oct 09, 2026 -> 9 months back: Jan 09, 2026
    const ref = new Date("2026-10-10T15:30:00Z")
    const cutoff = calculateShippingQueueCutoffDate(ref)
    expect(cutoff.toISOString()).toBe("2026-01-09T00:00:00.000Z")
  })

  it("clamps to the end of the month when subtracting 9 months from month-end dates", () => {
    // Reference date: Mar 31, 2026 -> Yesterday: Mar 30, 2026 -> 9 months back: Jun 30, 2025
    const ref1 = new Date("2026-03-31T08:00:00Z")
    expect(calculateShippingQueueCutoffDate(ref1).toISOString()).toBe("2025-06-30T00:00:00.000Z")

    // Reference date: Dec 01, 2026 -> Yesterday: Nov 30, 2026 -> 9 months back: Feb 28, 2026
    const ref2 = new Date("2026-12-01T00:00:00Z")
    expect(calculateShippingQueueCutoffDate(ref2).toISOString()).toBe("2026-02-28T00:00:00.000Z")
  })

  it("crosses year boundaries cleanly", () => {
    // Reference date: Jan 01, 2026 -> Yesterday: Dec 31, 2025 -> 9 months back: Mar 31, 2025
    const ref = new Date("2026-01-01T12:00:00Z")
    expect(calculateShippingQueueCutoffDate(ref).toISOString()).toBe("2025-03-31T00:00:00.000Z")
  })
})

describe("getShipmentLastUpdatedMs", () => {
  it("extracts timestamp when lastUpdatedDate is a number", () => {
    expect(getShipmentLastUpdatedMs({ lastUpdatedDate: 1791563619000 })).toBe(1791563619000)
  })

  it("parses numeric string or ISO string", () => {
    expect(getShipmentLastUpdatedMs({ lastUpdatedDate: "1791563619000" })).toBe(1791563619000)
    expect(getShipmentLastUpdatedMs({ lastUpdatedDate: "2026-10-09T16:33:39.000Z" })).toBe(1791563619000)
  })

  it("falls back to createdDate when lastUpdatedDate is missing", () => {
    expect(getShipmentLastUpdatedMs({ createdDate: 1790695510000 })).toBe(1790695510000)
  })

  it("returns null when no valid date is available", () => {
    expect(getShipmentLastUpdatedMs({})).toBeNull()
    expect(getShipmentLastUpdatedMs({ lastUpdatedDate: null, createdDate: undefined })).toBeNull()
    expect(getShipmentLastUpdatedMs({ lastUpdatedDate: "invalid-date" })).toBeNull()
  })
})
