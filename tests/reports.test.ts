import { describe, expect, it, vi } from "vitest"

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

  it("fills Unfulfillable rows and leaves the other worksheets empty", () => {
    const bytes = buildReportWorkbook(reportWorkbookSheets([
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
    ]))
    expect(listWorkbookSheetNames(bytes)).toEqual([...REPORT_SHEETS])

    const files = readStoredZip(bytes)
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

    for (const index of [0, 2, 3, 4]) {
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
