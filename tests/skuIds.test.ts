import { describe, expect, it } from "vitest"

import { extractSkuIds } from "../src/lib/skuIds"

describe("extractSkuIds", () => {
  it("splits SKUs on line breaks, commas, and tabs", () => {
    expect(extractSkuIds("ABC-123\nDEF_456,GHI.789\tJKL-000")).toEqual([
      "ABC-123",
      "DEF_456",
      "GHI.789",
      "JKL-000",
    ])
  })

  it("trims whitespace and drops empty values", () => {
    expect(extractSkuIds("  ABC-123  \n\n\t, DEF_456 \r\n")).toEqual([
      "ABC-123",
      "DEF_456",
    ])
  })

  it("deduplicates case-sensitively in first-seen order", () => {
    expect(extractSkuIds("abc-123\nABC-123\nabc-123\nDEF_456")).toEqual([
      "abc-123",
      "ABC-123",
      "DEF_456",
    ])
  })

  it("ignores values longer than 40 characters", () => {
    const tooLong = "A".repeat(41)
    expect(extractSkuIds(`${tooLong}\nABC-123\n${"B".repeat(40)}`)).toEqual([
      "ABC-123",
      "B".repeat(40),
    ])
  })
})
