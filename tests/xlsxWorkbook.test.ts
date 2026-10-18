import { describe, expect, it } from "vitest"

import { buildWorkbook, readStoredZip } from "../src/lib/xlsxWorkbook"

function sheetXml(bytes: Uint8Array, index = 1): string {
  const files = readStoredZip(bytes)
  const sheet = files.get(`xl/worksheets/sheet${index}.xml`)
  if (!sheet) throw new Error(`Missing worksheet ${index}.`)
  return new TextDecoder().decode(sheet)
}

function columnWidths(xml: string): number[] {
  return [...xml.matchAll(/<col min="(\d+)" max="\1" width="([0-9.]+)" customWidth="1"\/>/g)].map((match) =>
    Number(match[2]),
  )
}

describe("worksheet column widths", () => {
  it("autofits a short value well under the 600px cap", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Short", rows: [["SKU"]] }]))
    expect(xml.indexOf("<cols>")).toBeLessThan(xml.indexOf("<sheetData>"))
    expect(xml).not.toContain("bestFit")
    const [width] = columnWidths(xml)
    expect(width).toBe(4.42)
    expect(width).toBeLessThan(85)
  })

  it("caps a very long value at width 85 (600 pixels)", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Long", rows: [["W".repeat(200)]] }]))
    expect(columnWidths(xml)).toEqual([85])
    expect(Math.floor(85 * 7 + 5)).toBe(600)
  })

  it("sizes a wrapped cell from its longest line", () => {
    const wrapped = sheetXml(buildWorkbook([{ name: "Wrapped", rows: [["W\nWWW"]] }]))
    const longest = sheetXml(buildWorkbook([{ name: "Longest", rows: [["WWW"]] }]))
    const shortest = sheetXml(buildWorkbook([{ name: "Shortest", rows: [["W"]] }]))
    expect(columnWidths(wrapped)).toEqual(columnWidths(longest))
    expect(columnWidths(wrapped)[0]).toBeGreaterThan(columnWidths(shortest)[0])
  })

  it("leaves empty columns at the default width", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Gaps", rows: [["AB", "", "CD"]] }]))
    expect(xml).toContain('<col min="1" max="1" width="3.28" customWidth="1"/>')
    expect(xml).toContain('<col min="3" max="3" width="3.28" customWidth="1"/>')
    expect(xml).not.toContain('min="2"')
  })

  it("omits blank and whitespace-only cells and keeps numeric zero", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Gaps", rows: [["AB", "", " ", "CD"], [0]] }]))
    expect(xml).toContain('<c r="A1"')
    expect(xml).toContain('<c r="D1"')
    expect(xml).not.toContain('<c r="B1"')
    expect(xml).not.toContain('<c r="C1"')
    expect(xml).not.toContain("<t></t>")
    expect(xml).not.toContain("<t> </t>")
    expect(xml).toContain('<c r="A2" s="0"><v>0</v></c>')
  })

  it("sets cols on every sheet that has cell content", () => {
    const bytes = buildWorkbook([
      { name: "One", rows: [["Hi"]] },
      { name: "Two", rows: [["There"]] },
    ])
    for (const index of [1, 2]) {
      const xml = sheetXml(bytes, index)
      expect(xml).toContain("<cols>")
      expect(xml).toContain('customWidth="1"')
      expect(xml).not.toContain("bestFit")
      expect(columnWidths(xml).length).toBe(1)
      expect(columnWidths(xml)[0]).toBeLessThan(85)
    }
  })

  it("omits cols on an empty sheet", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Empty" }, { name: "Blank", rows: [[]] }]))
    expect(xml).toContain("<sheetData/>")
    expect(xml).not.toContain("<cols")
    expect(xml).not.toContain("<row")

    const blank = sheetXml(
      buildWorkbook([
        { name: "Empty" },
        { name: "Blank", rows: [[]] },
      ]),
      2,
    )
    expect(blank).toContain("<row")
    expect(blank).not.toContain("<cols")
  })
})

describe("worksheet alignment", () => {
  it("centers the header row and left-aligns sku, product name, and note data", () => {
    const bytes = buildWorkbook([{
      name: "Aligned",
      rows: [[
        "SKU",
        "Product Name",
        "Other Actions",
        "Additional Notes",
        "Status",
        "Title",
        "MSKU",
        "MSKUs",
        "Product",
        "Title differentiation",
      ], [
        "ABC-1",
        "Widget",
        "Email seller",
        "Check lot",
        "Open",
        "Widget title",
        "MSKU-1",
        "4",
        "Hat",
        "Color",
      ]],
    }])
    const xml = sheetXml(bytes)
    const left = ["A", "B", "C", "D", "F", "G", "H", "I"]
    const center = ["E", "J"]
    for (const column of left) {
      expect(xml).toContain(`<c r="${column}1" s="0"`)
      expect(xml).toContain(`<c r="${column}2" s="1"`)
    }
    for (const column of center) {
      expect(xml).toContain(`<c r="${column}1" s="0"`)
      expect(xml).toContain(`<c r="${column}2" s="0"`)
    }

    const files = readStoredZip(bytes)
    const styles = new TextDecoder().decode(files.get("xl/styles.xml"))
    const contentTypes = new TextDecoder().decode(files.get("[Content_Types].xml"))
    const rels = new TextDecoder().decode(files.get("xl/_rels/workbook.xml.rels"))
    expect(styles).toContain('<alignment horizontal="center" vertical="center"/>')
    expect(styles).toContain('<alignment horizontal="left" vertical="center"/>')
    expect(contentTypes).toContain('PartName="/xl/styles.xml"')
    expect(rels).toContain('Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"')
  })
})

describe("worksheet text", () => {
  it("drops control characters that XML forbids and escapes markup", () => {
    const xml = sheetXml(buildWorkbook([{ name: "Text", rows: [["Bad\u0008title\u001F & <b>"]] }]))
    expect(xml).toContain("<t>Badtitle &amp; &lt;b&gt;</t>")
    expect(xml).not.toMatch(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/)
  })
})
