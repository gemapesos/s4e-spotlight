import { describe, expect, it, vi } from "vitest"

import { dailyTasksSheetRows } from "../src/lib/dailyTasks"
import {
  REPORT_SHEETS,
  buildReportWorkbook,
  downloadBytes,
  formatReportDate,
  reportFileName,
  reportWarnings,
  reportWorkbookSheets,
  sheetsReportFileName,
  sanitizeStoreName,
} from "../src/lib/reports"
import { listWorkbookSheetNames, readStoredZip } from "../src/lib/xlsxWorkbook"

describe("report filenames", () => {
  it("formats the local date as dd-mmm-yyyy with dashes", () => {
    expect(formatReportDate(new Date(2026, 7, 14))).toBe("14-Aug-2026")
    expect(formatReportDate(new Date(2026, 0, 1))).toBe("01-Jan-2026")
  })

  it("uses Unknown when the store name is missing or blank", () => {
    expect(reportFileName("", new Date(2026, 7, 14))).toBe("Unknown - 14-Aug-2026.xlsx")
    expect(reportFileName("   ", new Date(2026, 7, 14))).toBe("Unknown - 14-Aug-2026.xlsx")
  })

  it("includes the store name, dashes, and xlsx extension", () => {
    expect(reportFileName("JMG Outdoors", new Date(2026, 7, 14))).toBe(
      "JMG Outdoors - 14-Aug-2026.xlsx",
    )
    expect(sheetsReportFileName("JMG Outdoors", new Date(2026, 7, 14))).toBe(
      "JMG Outdoors - 14-Aug-2026 - Sheets.xlsx",
    )
  })

  it("replaces filesystem-unsafe characters in the store name", () => {
    expect(sanitizeStoreName('JMG/Outdoors:"Store"')).toBe("JMG Outdoors Store")
    expect(reportFileName("A\\B:C", new Date(2026, 7, 14))).toBe("A B C - 14-Aug-2026.xlsx")
    expect(sanitizeStoreName("***")).toBe("Unknown")
  })
})

describe("report workbook", () => {
  it("builds five empty named worksheets in order", () => {
    const bytes = buildReportWorkbook()
    expect(listWorkbookSheetNames(bytes)).toEqual([...REPORT_SHEETS])

    const files = readStoredZip(bytes)
    for (const index of REPORT_SHEETS.keys()) {
      const sheet = new TextDecoder().decode(files.get(`xl/worksheets/sheet${index + 1}.xml`))
      expect(sheet).toContain("<sheetData/>")
      expect(sheet).not.toContain("<cols")
      expect(sheet).not.toContain("<row")
    }
  })

  it("leaves out the sheets of sections that weren't chosen", () => {
    const names = (report: Parameters<typeof reportWorkbookSheets>[0]) =>
      reportWorkbookSheets(report).map((sheet) => sheet.name)

    expect(names({ sections: ["stranded", "shippingQueue"] })).toEqual(["Stranded", "Shipping Queue"])
    expect(names({ sections: ["unfulfillable", "suppressed"] })).toEqual(["Unfulfillable", "Suppressed"])
    expect(names({ sections: ["feedback"] })).toEqual(["Daily Tasks"])
  })

  it("stacks Daily Tasks sections with Feedback Manager data and reserved titles", () => {
    const rows = dailyTasksSheetRows([
      {
        feedbackId: "A1JYWNJI6O4TQ1",
        orderId: "112-6224287-0679468",
        numericRating: 1,
        feedbackText: "Why has it not been credited?",
        feedbackDate: "2026-08-03T19:22:21.216Z",
        suppressed: false,
        partiallySuppressed: false,
      },
    ])
    expect(rows[0]).toEqual(["Feedback Manager"])
    expect(rows[1][0]).toBe("Date")
    expect(rows[1]).toContain("Order ID")
    expect(rows[2][3]).toBe("112-6224287-0679468")
    expect(rows[3]).toEqual([])
    expect(rows[4]).toEqual(["Disposal Orders"])
    expect(rows[5]).toEqual([])
    expect(rows[6]).toEqual(["Open Cases"])
    expect(rows).toHaveLength(7)
  })

  it("still writes Feedback Manager headers when there is no feedback", () => {
    expect(dailyTasksSheetRows()).toEqual([
      ["Feedback Manager"],
      ["Date", "Rating", "Sentiment", "Order ID", "Feedback", "Item as described", "Seller response", "Response date", "Suppressed", "Partially suppressed", "Suppress reason", "Feedback ID"],
      [],
      ["Disposal Orders"],
      [],
      ["Open Cases"],
    ])
  })

  it("fills Unfulfillable, Stranded, and in-stock Suppressed rows and stacks Daily Tasks sections", () => {
    const bytes = buildReportWorkbook(reportWorkbookSheets({
      unfulfillableListings: [
        {
          coreListingFields: { sku: "20231103_9.00_Sephora_67493", asin: "B00JJPVVYQ", fnSku: "X004110PZF" },
          listingData: { title: "Sephora Collection Colorful Waterproof Eyeliner", lastUpdated: "11/15/2024 15:18:56" },
          status: { status: "INACTIVE" },
          availability: {
            unfulfillable: 2,
            unfulfillableDetails: { expired: 2, damagedByCarrier: 0, damagedByCustomer: 0, damagedByDistributor: 0, damagedByWarehouse: 0, defective: 0 },
          },
          offers: [{ price: { price: { amount: "21.75", currencyUnit: "USD" } } }],
        },
      ],
      feedbacks: [
        {
          feedbackId: "A1JYWNJI6O4TQ1",
          orderId: "112-6224287-0679468",
          numericRating: 1,
          feedbackText: "I sent this back with Your UPS label on it.",
          feedbackDate: "2026-08-03T19:22:21.216Z",
          suppressed: false,
          partiallySuppressed: false,
        },
      ],
      strandedListings: [
        {
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
          StrandedReasonLabel: "Missing price",
          FulfilledBy: "Amazon",
          SupportedActions: "EditListing#RemovalOrder#RefreshSIRC#PostponeAutoRemoval",
        },
      ],
      suppressedListings: [
        {
          coreListingFields: { sku: "STOCK-SKU", asin: "B0STOCK", fnSku: "X00STOCK", fulfillmentChannel: "AFN" },
          listingData: { title: "In-stock suppressed towel" },
          status: {
            status: "SEARCH_SUPPRESSED",
            statusText: "Search suppressed",
            inlineAction: "FIX_LISTING_SUPPRESSION",
            inlineActionText: "Fix listing suppression",
          },
          availability: { quantity: 12 },
          offers: [{ price: { price: { amount: "16.99", currencyUnit: "USD" } } }],
          issues: [{
            localizedIssueMessage: "'Product Description' is required but missing.",
            type: "CVS_MISSING_REQUIRED_ATTRIBUTE",
          }],
        },
        {
          coreListingFields: { sku: "ZERO-SKU", asin: "B0ZERO", fnSku: "X00ZERO" },
          listingData: { title: "Zero quantity suppressed towel" },
          status: { status: "SEARCH_SUPPRESSED" },
          availability: { quantity: 0 },
        },
      ],
      shipments: [
        {
          shipmentName: "FBA STA (09/29/2026 15:25)-HGR6",
          shipmentId: "FBA19RKC646S",
          destinationFC: "HGR6",
          fcAddress: "US",
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
          blocked: false,
          partneredImport: false,
          merchantLaunched: false,
          finalized: false,
        },
      ],
    }))
    expect(listWorkbookSheetNames(bytes)).toEqual([...REPORT_SHEETS])

    const files = readStoredZip(bytes)
    const dailyTasks = new TextDecoder().decode(files.get("xl/worksheets/sheet1.xml"))
    expect(dailyTasks).toContain("Feedback Manager")
    expect(dailyTasks).toContain("Date")
    expect(dailyTasks).toContain("Sentiment")
    expect(dailyTasks).toContain("Order ID")
    expect(dailyTasks).toContain("112-6224287-0679468")
    expect(dailyTasks).toContain("Negative")
    expect(dailyTasks).toContain("Disposal Orders")
    expect(dailyTasks).toContain("Open Cases")
    expect(dailyTasks.indexOf("Feedback Manager")).toBeLessThan(dailyTasks.indexOf("Disposal Orders"))
    expect(dailyTasks.indexOf("Disposal Orders")).toBeLessThan(dailyTasks.indexOf("Open Cases"))

    const unfulfillable = new TextDecoder().decode(files.get("xl/worksheets/sheet2.xml"))
    expect(unfulfillable).toContain("<row r=\"1\">")
    expect(unfulfillable).toContain("SKU")
    expect(unfulfillable).toContain("Carrier Damaged")
    expect(unfulfillable).toContain("Removal Status")
    expect(unfulfillable).toContain("Unfulfillable")
    expect(unfulfillable).not.toContain("Eligible for Removal")
    expect(unfulfillable).toContain("20231103_9.00_Sephora_67493")
    expect(unfulfillable).toContain('<c r="F2" s="0"><v>21.75</v></c>')
    expect(unfulfillable).toContain('<c r="H2" s="0"><v>2</v></c>')
    expect(unfulfillable).not.toContain('<c r="F2" t="inlineStr">')
    expect(unfulfillable).not.toContain('<c r="H2" t="inlineStr">')

    const stranded = new TextDecoder().decode(files.get("xl/worksheets/sheet3.xml"))
    expect(stranded).toContain("<row r=\"1\">")
    expect(stranded).toContain("SKU")
    expect(stranded).toContain("Date stranded")
    expect(stranded).toContain("Stranded reason")
    expect(stranded).toContain("2026-07-24-B0F2KGX1K3-15700")
    expect(stranded).toContain("Missing price")
    expect(stranded).toContain("08/11/2026")
    expect(stranded).toContain("Return to seller")
    expect(stranded).toContain('<c r="H2" s="0"><v>0</v></c>')
    expect(stranded).toContain('<c r="J2" s="0"><v>1</v></c>')
    expect(stranded).not.toContain('<c r="H2" t="inlineStr">')

    const suppressed = new TextDecoder().decode(files.get("xl/worksheets/sheet4.xml"))
    expect(suppressed).toContain("<row r=\"1\">")
    expect(suppressed).toContain("SKU")
    expect(suppressed).toContain("STOCK-SKU")
    expect(suppressed).toContain("Search Suppressed")
    expect(suppressed).toContain("FIX_LISTING_SUPPRESSION")
    expect(suppressed).toContain("Product Description")
    expect(suppressed).not.toContain("ZERO-SKU")

    const shippingQueue = new TextDecoder().decode(files.get("xl/worksheets/sheet5.xml"))
    expect(shippingQueue).toContain("<row r=\"1\">")
    expect(shippingQueue).toContain("Shipment Name")
    expect(shippingQueue).toContain("Shipment ID")
    expect(shippingQueue).toContain("Shipment URL")
    expect(shippingQueue).toContain("Quantity Discrepancy")
    expect(shippingQueue).toContain("FBA19RKC646S")
    expect(shippingQueue).toContain("HGR6")
    expect(shippingQueue).toContain("29-Sep-2026 23:25:10")
    // Shipped quantity: 26 (numeric), received quantity: 24 (numeric), discrepancy: -2 (numeric)
    expect(shippingQueue).toContain("<v>26</v>")
    expect(shippingQueue).toContain("<v>24</v>")
    expect(shippingQueue).toContain("<v>-2</v>")

    for (const index of REPORT_SHEETS.keys()) {
      const sheet = new TextDecoder().decode(files.get(`xl/worksheets/sheet${index + 1}.xml`))
      expect(sheet.indexOf("<cols>")).toBeGreaterThan(-1)
      expect(sheet.indexOf("<cols>")).toBeLessThan(sheet.indexOf("<sheetData>"))
      expect(sheet).not.toContain("bestFit")
      const widths = [...sheet.matchAll(/width="([0-9.]+)"/g)].map((match) => Number(match[1]))
      expect(widths.length).toBeGreaterThan(0)
      for (const width of widths) expect(width).toBeLessThanOrEqual(85)
    }
  })
})

describe("downloadBytes", () => {
  it("starts a same-page download with the given filename", () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:report")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    const clicked: { download?: string } = {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.download = this.download
    })

    try {
      downloadBytes(new Uint8Array([1, 2, 3]), "JMG Outdoors - 14-Aug-2026.xlsx")
      expect(createObjectURL).toHaveBeenCalledOnce()
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026.xlsx")
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:report")
      expect(document.querySelector("a[download]")).toBeNull()
    } finally {
      click.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})

describe("report warnings", () => {
  const empty = {
    storeName: "Cherrylane Enterprises",
    generatedAt: new Date(2026, 9, 18),
    unfulfillableListings: [],
    feedbacks: [],
    strandedListings: [],
    suppressedListings: [],
    shipments: [],
  }

  it("names each section that loaded only partly", () => {
    expect(reportWarnings({
      ...empty,
      unfulfillableListings: [{ listingsIncomplete: true, removalFetchFailed: true }, { listingsIncomplete: true }],
      feedbacks: [{ feedbackIncomplete: true }, { feedbackIncomplete: true }],
      suppressedListings: [{ issuesFetchFailed: true }],
      shipments: [{ detailsFetchFailed: true }, { details: { items: [{}], discrepancyTotalRecords: 3 } }],
    })).toEqual([
      { source: "unfulfillable", text: "Only 2 unfulfillable listings loaded; Seller Central lists more." },
      { source: "unfulfillable", text: "Removal status is missing for 1 SKU." },
      { source: "feedback", text: "Only 2 feedback entries loaded; Seller Central has more." },
      { source: "suppressed", text: "Suppression reasons are missing for 1 SKU." },
      { source: "shippingQueue", text: "Details are missing for 1 shipment." },
      { source: "shippingQueue", text: "SKU lines are incomplete for 1 shipment." },
    ])
  })

  it("has nothing to say about a complete report", () => {
    expect(reportWarnings(empty)).toEqual([])
  })
})
