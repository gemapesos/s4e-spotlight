import { describe, expect, it } from "vitest"

import {
  SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE,
  SHIPPING_STATUS_MONITORING,
  SHIPPING_STATUS_NEW,
  type ShippingQueueShipment,
} from "../src/lib/shippingQueue"
import { SHEET_PASTE_SHEETS, sheetPasteSheets, type SheetPasteInput } from "../src/lib/sheetPaste"
import { buildWorkbook, readStoredZip } from "../src/lib/xlsxWorkbook"
import {
  formatRemovalStatus,
  REMOVAL_STATUS_BY_CODE,
  REMOVAL_STATUS_ELIGIBLE,
  type RemovalStatusSegment,
  type UnfulfillableListing,
} from "../src/lib/unfulfillable"

const generatedAt = new Date(2026, 9, 14)
const yesterday = "13-Oct-2026"

const listing: UnfulfillableListing = {
  coreListingFields: { sku: "SKU-1", asin: "B000TEST", fnSku: "X001" },
  listingData: { title: "Widget" },
  availability: {
    unfulfillable: 4,
    unfulfillableDetails: {
      damagedByCarrier: 1,
      damagedByCustomer: 0,
      defective: 2,
      expired: 0,
      damagedByWarehouse: 1,
      damagedByDistributor: 9,
    },
  },
  removal: [{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }],
}

const filledUnfulfillableRow = [
  yesterday,
  "SKU-1",
  "Widget",
  1,
  0,
  2,
  0,
  1,
  4,
  "Manual Removal Order Created",
  "N/A",
  "N/A",
  "N/A",
  "Not Applicable",
  "Total available for removal - 1 unit",
]

function paste(input: Partial<SheetPasteInput> & Pick<SheetPasteInput, "storeName">) {
  return sheetPasteSheets({
    generatedAt,
    unfulfillableListings: [],
    feedbacks: [],
    strandedListings: [],
    suppressedListings: [],
    shipments: [],
    ...input,
  })
}

function withRemoval(removal: RemovalStatusSegment[]): UnfulfillableListing {
  return { ...listing, removal }
}

describe("sheet paste workbook", () => {
  it("maps a listing onto the monthly headers with yesterday, action, and N/A fields", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      unfulfillableListings: [listing],
    })

    expect(sheets.map((sheet) => sheet.name)).toEqual([...SHEET_PASTE_SHEETS])
    const unfulfillable = sheets[0].rows ?? []
    expect(unfulfillable[0]).toEqual([
      "Date",
      "MSKU",
      "Product Name",
      "Carrier Damaged",
      "Customer Damaged",
      "Defective",
      "Expired",
      "Warehouse Damaged",
      "Total Quantity",
      "Action",
      "Date of E-Mail",
      "Removal Order ID",
      "Case ID",
      "Case Status",
      "Additional Notes",
    ])
    expect(unfulfillable[1]).toEqual(filledUnfulfillableRow)
    expect(unfulfillable[1]).not.toContain("B000TEST")
    expect(unfulfillable[1]).not.toContain(9)
  })

  it("builds only the tabs of the chosen sections", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      sections: ["feedback", "unfulfillable"],
      unfulfillableListings: [listing],
    })

    expect(sheets.map((sheet) => sheet.name)).toEqual(["UnfulfillableDisposals", "Feedback"])
    expect(sheets[0].rows?.[1]).toEqual(filledUnfulfillableRow)
  })

  it("fixes unfulfillable quantity columns at 60px and wraps a 32px header", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      unfulfillableListings: [listing],
    })
    const files = readStoredZip(buildWorkbook([sheets[0]]))
    const xml = new TextDecoder().decode(files.get("xl/worksheets/sheet1.xml"))
    const styles = new TextDecoder().decode(files.get("xl/styles.xml"))
    for (const column of [4, 5, 6, 7, 8, 9]) {
      expect(xml).toContain(`<col min="${column}" max="${column}" width="9.29" customWidth="1"/>`)
    }
    expect(xml).not.toContain('<col min="3" max="3" width="9.29" customWidth="1"/>')
    expect(xml).toContain('<row r="1" ht="24" customHeight="1">')
    expect(xml).toContain("<row r=\"2\">")
    expect(xml).not.toMatch(/<row r="2"[^>]*ht=/)
    expect(xml).toContain('<c r="D1" s="2"')
    expect(xml).toContain('<c r="D2" s="0"><v>1</v></c>')
    expect(styles).toContain('wrapText="1"')

    const jmg = paste({ storeName: "JMG Outdoors", unfulfillableListings: [listing] })
    expect(jmg[0].fixedColumns?.map((column) => column.index)).toEqual([4, 5, 6, 7, 8, 9])
  })

  it("inserts a blank Product column for JMG Outdoors", () => {
    const sheets = paste({
      storeName: "JMG Outdoors",
      unfulfillableListings: [listing],
    })
    const unfulfillable = sheets[0].rows ?? []
    expect(unfulfillable[0][1]).toBe("Product")
    expect(unfulfillable[1]).toEqual([yesterday, "", ...filledUnfulfillableRow.slice(1)])
  })

  it("maps removal-status combinations and leaves an unrecognized status blank", () => {
    const eligible = [{ label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }]
    const scheduled = [{ label: REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest, quantity: 2 }]
    const temporary = [{ label: REMOVAL_STATUS_BY_CODE.InventoryIsBound, quantity: 1 }]
    const damaged = [{ label: REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged, quantity: 1 }]
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      unfulfillableListings: [
        withRemoval([...eligible, ...scheduled]),
        withRemoval([...eligible, ...temporary]),
        withRemoval([...scheduled, ...temporary]),
        withRemoval([...eligible, ...scheduled, ...temporary]),
        withRemoval(damaged),
      ],
    })
    const rows = (sheets[0].rows ?? []).slice(1)
    const action = 9
    const notes = 14
    expect(rows.map((row) => row[action])).toEqual([
      "Manual Removal Order Created and Scheduled for Removal",
      "Manual Removal Created and Temporarily Unavailable",
      "Scheduled for Removal and Temporarily Unavailable",
      "Multiple Actions Applicable - Refer to Additional Notes for Details",
      "Damaged at the FC - For Monitoring",
    ])
    expect(rows[0][notes]).toBe(formatRemovalStatus([...eligible, ...scheduled]))
    expect(rows[3][notes]).toBe(formatRemovalStatus([...eligible, ...scheduled, ...temporary]))
    expect(rows[4][notes]).toBe(formatRemovalStatus(damaged))
    expect(rows[4][10]).toBe("N/A")
    expect(rows[4][13]).toBe("Not Applicable")
  })

  it("assigns the next removal order id only to rows available for removal", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      nextRemovalOrderId: "S4EAB0008",
      unfulfillableListings: [
        listing,
        withRemoval([{ label: REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged, quantity: 1 }]),
        withRemoval([{ label: REMOVAL_STATUS_BY_CODE.InventoryInUnsupportedFc, quantity: 1 }]),
        withRemoval([{ label: REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged, quantity: 1 }, { label: REMOVAL_STATUS_ELIGIBLE, quantity: 1 }]),
        withRemoval([{ label: "Inventory Unavailable", quantity: 1 }]),
      ],
    })
    const rows = (sheets[0].rows ?? []).slice(1)
    expect(rows.map((row) => row[9])).toEqual([
      "Manual Removal Order Created",
      "Damaged at the FC - For Monitoring",
      "Temporarily Unavailable",
      "Multiple Actions Applicable - Refer to Additional Notes for Details",
      "Multiple Actions Applicable - Refer to Additional Notes for Details",
    ])
    expect(rows.map((row) => row[11])).toEqual(["S4EAB0008", "N/A", "N/A", "S4EAB0008", "N/A"])
  })

  it("fills stranded, feedback, and suppressed workflow columns", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      strandedListings: [{ SKU: "S-1", ASIN: "B001", ProductName: "Hat", Condition: "New", StrandedReason: "Listing error" }],
      feedbacks: [{ feedbackDate: "2026-08-03T19:22:21.216Z", orderId: "112-1", numericRating: 1, suppressed: false }],
      suppressedListings: [{
        coreListingFields: { sku: "SUP-1", asin: "B002" },
        listingData: { title: "Lamp" },
        availability: { quantity: 2 },
      }],
    })
    const stranded = sheets[1].rows ?? []
    expect(stranded[1][stranded[0].indexOf("MSKU")]).toBe("S-1")
    expect(stranded[1][stranded[0].indexOf("Action")]).toBe("N/A")
    expect(stranded[1][stranded[0].indexOf("Other Actions")]).toBe("N/A")
    expect(stranded[1][stranded[0].indexOf("Date of E-Mail")]).toBe("N/A")
    expect(stranded[1][stranded[0].indexOf("Removal Order ID")]).toBe("N/A")
    expect(stranded[1][stranded[0].indexOf("Case ID")]).toBe("N/A")
    expect(stranded[1][stranded[0].indexOf("Case Status")]).toBe("Not Applicable")

    const feedback = sheets[2].rows ?? []
    expect(feedback[1][feedback[0].indexOf("Action")]).toBe("N/A")
    expect(feedback[1][feedback[0].indexOf("Other Actions")]).toBe("N/A")
    expect(feedback[1][feedback[0].indexOf("Date of E-Mail")]).toBe("N/A")
    expect(feedback[1][feedback[0].indexOf("Case ID")]).toBe("N/A")
    expect(feedback[1][feedback[0].indexOf("Case Status")]).toBe("Not Applicable")
    expect(feedback[0]).not.toContain("Removal Order ID")

    const suppressed = sheets[3].rows ?? []
    expect(suppressed[1][suppressed[0].indexOf("Action")]).toBe("N/A")
    expect(suppressed[1][suppressed[0].indexOf("Other Actions")]).toBe("N/A")
    expect(suppressed[1][suppressed[0].indexOf("Date of E-Mail")]).toBe("N/A")
    expect(suppressed[1][suppressed[0].indexOf("Removal Order ID")]).toBe("N/A")
    expect(suppressed[1][suppressed[0].indexOf("Case ID")]).toBe("N/A")
    expect(suppressed[1][suppressed[0].indexOf("Case Status")]).toBe("Not Applicable")
  })

  it("keeps only feedback whose suppressed column is no", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      feedbacks: [
        {
          feedbackDate: "2026-08-03T19:22:21.216Z",
          orderId: "112-keep",
          numericRating: 1,
          suppressed: false,
          partiallySuppressed: true,
        },
        {
          feedbackDate: "2026-08-04T19:22:21.216Z",
          orderId: "112-drop",
          numericRating: 2,
          suppressed: true,
        },
        {
          feedbackDate: "2026-08-05T19:22:21.216Z",
          orderId: "112-blank",
          numericRating: 3,
        },
      ],
    })
    const feedback = sheets[2].rows ?? []
    expect(feedback).toHaveLength(2)
    expect(feedback[1][feedback[0].indexOf("Order ID")]).toBe("112-keep")
    expect(feedback.flat()).not.toContain("112-drop")
    expect(feedback.flat()).not.toContain("112-blank")
  })

  it("rewrites feedback dates without a time", () => {
    const sheets = paste({
      storeName: "Cherrylane Enterprises",
      feedbacks: [{
        feedbackDate: "2026-08-03T19:22:21.216Z",
        orderId: "112-1",
        numericRating: 1,
        suppressed: false,
      }],
    })
    const feedback = sheets[2].rows ?? []
    expect(feedback[1][0]).toBe(yesterday)
    expect(feedback[1][feedback[0].indexOf("Feedback Date")]).toBe("03-Aug-2026")
  })

  it("drops shipping queue notes and rewrites the shipment date", () => {
    const sheets = paste({
      storeName: "Loving Home USA",
      shipments: [{
        shipmentId: "FBA123456789",
        shipmentStatus: "CLOSED",
        createdDate: "2026-08-14T00:00:00.000Z",
        listingsIncomplete: true,
        details: {
          ineligibilityReason: "NOT_ALL_SHIPPED",
          items: [{ merchantSKU: "SKU-1", totalDiscrepancyQuantity: -3, caseId: "CASE-9" }],
        },
      }],
    })
    const shipping = sheets[4].rows ?? []
    expect(shipping).toHaveLength(2)
    expect(shipping.flat()).not.toContain(SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE)
    expect(shipping[1]).toEqual([
      yesterday,
      "14-Aug-2026",
      "FBA123456789",
      "SKU-1",
      -3,
      "N/A",
      SHIPPING_STATUS_MONITORING,
      "N/A",
      yesterday,
      "N/A",
      "N/A",
      "CASE-9",
      "Not Applicable",
    ])
  })

  it("fills shipping required documents only for a new send-list line and blanks repeated shipment ids", () => {
    const sheets = paste({
      storeName: "Loving Home USA",
      shipments: [{
        shipmentId: "FBA123456789",
        createdDate: "2026-08-14T00:00:00.000Z",
        documentTypes: ["POD", "INVOICE"],
        details: {
          eligible: true,
          ineligibilityReason: "NONE",
          items: [
            { merchantSKU: "SKU-1", totalDiscrepancyQuantity: -3, caseId: "  " },
            { merchantSKU: "SKU-ZERO", totalDiscrepancyQuantity: 0, caseId: "000" },
            { merchantSKU: "SKU-OVER", totalDiscrepancyQuantity: 2, caseId: "999" },
            { merchantSKU: "SKU-2", totalDiscrepancyQuantity: -1, caseId: "123" },
          ],
        },
      }, {
        shipmentId: "FBA000000000",
        detailsFetchFailed: true,
      }, {
        shipmentId: "FBA111111111",
        createdDate: "2026-08-01T00:00:00.000Z",
        details: {
          items: [{ merchantSKU: "SKU-NONE", totalDiscrepancyQuantity: 0 }],
        },
      }],
    })
    const shipping = (sheets[4].rows ?? []).slice(1)
    expect(shipping).toHaveLength(2)
    expect(shipping.flat()).not.toContain("SKU-ZERO")
    expect(shipping.flat()).not.toContain("SKU-OVER")
    expect(shipping.flat()).not.toContain("FBA000000000")
    expect(shipping.flat()).not.toContain("FBA111111111")
    expect(shipping[0][0]).toBe(yesterday)
    expect(shipping[0][5]).toBe("Proof of Inventory Ownership AND Delivery")
    expect(shipping[0][6]).toBe(SHIPPING_STATUS_NEW)
    expect(shipping[0][8]).toBe(yesterday)
    expect(shipping[0][11]).toBe("N/A")
    expect(shipping[1][0]).toBe("")
    expect(shipping[1][1]).toBe("")
    expect(shipping[1][2]).toBe("")
    expect(shipping[1][3]).toBe("SKU-2")
    expect(shipping[1][5]).toBe("Proof of Inventory Ownership AND Delivery")
  })

  it("keeps only for-monitoring and new send-list shipping lines", () => {
    const sheets = paste({
      storeName: "Loving Home USA",
      shipments: [{
        shipmentId: "FBA222222222",
        createdDate: "2026-08-20T00:00:00.000Z",
        details: {
          eligible: true,
          ineligibilityReason: "NONE",
          items: [
            { merchantSKU: "SKU-COUNTED", totalDiscrepancyQuantity: -2, ineligibilityReason: "ITEM_LEVEL_AUTHORITATIVE_RECEIVE" },
            { merchantSKU: "SKU-LOCATED", totalDiscrepancyQuantity: -1, ineligibilityReason: "RESEARCHED" },
            { merchantSKU: "SKU-NEW", totalDiscrepancyQuantity: -4 },
          ],
        },
      }, {
        shipmentId: "FBA333333333",
        details: { ineligibilityReason: "NOT_ALL_SHIPPED", items: [{ merchantSKU: "SKU-WAIT", totalDiscrepancyQuantity: -3 }] },
      }, {
        shipmentId: "FBA444444444",
        details: { ineligibilityReason: "NINE_MONTH_STATUTE_OF_LIMITATIONS", items: [{ merchantSKU: "SKU-OLD", totalDiscrepancyQuantity: -5 }] },
      }, {
        shipmentId: "FBA555555555",
        details: { eligible: false, ineligibilityReason: "OTHER", items: [{ merchantSKU: "SKU-OTHER", totalDiscrepancyQuantity: -1 }] },
      }, {
        shipmentId: "FBA666666666",
        details: { items: [{ merchantSKU: "SKU-REVIEW", totalDiscrepancyQuantity: -1 }] },
      }],
    })
    const shipping = (sheets[4].rows ?? []).slice(1)
    expect(shipping.map((row) => [row[2], row[3], row[6]])).toEqual([
      ["FBA333333333", "SKU-WAIT", SHIPPING_STATUS_MONITORING],
      ["FBA222222222", "SKU-NEW", SHIPPING_STATUS_NEW],
    ])
    // The first kept line names its shipment even when earlier lines were left out.
    expect(shipping[1][1]).toBe("20-Aug-2026")
  })

  it("lists shipments oldest first and keeps each shipment's SKU lines in order", () => {
    const sendList = (shipmentId: string, createdDate: string, skus: string[]): ShippingQueueShipment => ({
      shipmentId,
      createdDate,
      details: { eligible: true, items: skus.map((merchantSKU) => ({ merchantSKU, totalDiscrepancyQuantity: -1 })) },
    })
    const sheets = paste({
      storeName: "Loving Home USA",
      // Amazon's list order: newest first.
      shipments: [
        sendList("FBA300000000", "2026-09-03T00:00:00.000Z", ["C-1", "C-2"]),
        sendList("FBA200000000", "2026-09-02T00:00:00.000Z", ["B-1"]),
        sendList("FBA100000000", "2026-09-01T00:00:00.000Z", ["A-1", "A-2"]),
      ],
    })
    const shipping = (sheets[4].rows ?? []).slice(1)
    expect(shipping.map((row) => row.slice(1, 4))).toEqual([
      ["01-Sep-2026", "FBA100000000", "A-1"],
      ["", "", "A-2"],
      ["02-Sep-2026", "FBA200000000", "B-1"],
      ["03-Sep-2026", "FBA300000000", "C-1"],
      ["", "", "C-2"],
    ])
  })
})
