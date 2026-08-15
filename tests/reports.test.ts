import { describe, expect, it, vi } from "vitest"

import { dailyTasksSheetRows } from "../src/lib/dailyTasks"
import {
  REPORT_SHEETS,
  buildReportWorkbook,
  downloadBytes,
  formatReportDate,
  reportFileName,
  reportWorkbookSheets,
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
      expect(sheet).not.toContain("<row")
    }
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

  it("fills Unfulfillable and Stranded rows and stacks Daily Tasks sections", () => {
    const bytes = buildReportWorkbook(reportWorkbookSheets(
      [
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
      [
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
      [
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
    ))
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
    expect(unfulfillable).toContain('<c r="F2"><v>21.75</v></c>')
    expect(unfulfillable).toContain('<c r="H2"><v>2</v></c>')
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
    expect(stranded).toContain('<c r="H2"><v>0</v></c>')
    expect(stranded).toContain('<c r="J2"><v>1</v></c>')
    expect(stranded).not.toContain('<c r="H2" t="inlineStr">')

    for (const index of [3, 4]) {
      const sheet = new TextDecoder().decode(files.get(`xl/worksheets/sheet${index + 1}.xml`))
      expect(sheet).toContain("<sheetData/>")
      expect(sheet).not.toContain("<row")
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
