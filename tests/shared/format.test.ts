import { describe, expect, it } from "vitest"

import { decodeHtmlEntities, numberCell, quantityCell, textCell, yesNo } from "../../src/shared/format"

describe("report cells", () => {
  it("leaves missing values blank, never null or undefined", () => {
    expect(textCell(null)).toBe("")
    expect(textCell(undefined)).toBe("")
    expect(textCell(0)).toBe("0")
    expect(textCell("ABC-123")).toBe("ABC-123")
  })

  it("keeps numbers, reads numeric text, and leaves anything else blank", () => {
    expect(numberCell(0)).toBe(0)
    expect(numberCell(26)).toBe(26)
    expect(numberCell("42")).toBe(42)
    expect(numberCell(null)).toBe("")
    expect(numberCell(undefined)).toBe("")
    expect(numberCell("")).toBe("")
    expect(numberCell("abc")).toBe("")
    expect(numberCell(Number.NaN)).toBe("")
  })

  it("leaves whitespace blank instead of reading it as 0", () => {
    expect(numberCell("  ")).toBe("")
  })

  it("counts a missing quantity as 0", () => {
    expect(quantityCell(3)).toBe(3)
    expect(quantityCell(null)).toBe(0)
    expect(quantityCell("abc")).toBe(0)
  })

  it("formats booleans as Yes or No", () => {
    expect(yesNo(true)).toBe("Yes")
    expect(yesNo(false)).toBe("No")
    expect(yesNo(null)).toBe("")
    expect(yesNo(undefined)).toBe("")
  })
})

describe("decodeHtmlEntities", () => {
  it("decodes named and numeric entities and leaves invalid code points alone", () => {
    expect(decodeHtmlEntities("metal &amp; plastic")).toBe("metal & plastic")
    expect(decodeHtmlEntities("a &lt; b &gt; c")).toBe("a < b > c")
    expect(decodeHtmlEntities("a &#1114112; b &#x110000; c &#x1F600;")).toBe("a &#1114112; b &#x110000; c \u{1F600}")
  })
})
