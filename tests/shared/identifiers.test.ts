import { describe, expect, it } from "vitest"

import { extractCaseIds, extractRemovalOrderIds, extractShipmentIds, extractSkuIds, findRemovalOrderIds } from "../../src/shared/identifiers"

describe("extractCaseIds", () => {
  it("extracts Case IDs from sentences, punctuation, and line breaks", () => {
    expect(
      extractCaseIds(
        "Please open 21476974831, then this one:\n21476874681. Thanks.",
      ),
    ).toEqual(["21476974831", "21476874681"])
  })

  it("removes duplicates while preserving first-seen order", () => {
    expect(
      extractCaseIds("21476874681 21476974831 21476874681 21476974831"),
    ).toEqual(["21476874681", "21476974831"])
  })

  it("rejects shorter, longer, and embedded digit sequences", () => {
    expect(
      extractCaseIds(
        "1234567890 123456789012 9912345678901 and valid 21476974831",
      ),
    ).toEqual(["21476974831"])
  })
})

describe("extractShipmentIds", () => {
  it("extracts Shipment IDs from links, punctuation, and line breaks", () => {
    expect(
      extractShipmentIds(
        "https://sellercentral.amazon.com/fba/inbound-shipment/summary/FBA19749WJ6Q/contents\nNext: FBA18G77LW09.",
      ),
    ).toEqual(["FBA19749WJ6Q", "FBA18G77LW09"])
  })

  it("accepts the complete supplied Shipment ID sample set", () => {
    expect(
      extractShipmentIds(`
        FBA18G77LW09
        FBA196J1QB5C
        FBA19749WJ6Q
        FBA197P07GQB
        FBA197W00R31
        FBA19DD5L2FY
        FBA19F7B2ZGH
        FBA19FKYKJ4T
      `),
    ).toEqual([
      "FBA18G77LW09",
      "FBA196J1QB5C",
      "FBA19749WJ6Q",
      "FBA197P07GQB",
      "FBA197W00R31",
      "FBA19DD5L2FY",
      "FBA19F7B2ZGH",
      "FBA19FKYKJ4T",
    ])
  })

  it("normalizes case and deduplicates in first-seen order", () => {
    expect(
      extractShipmentIds(
        "fba196j1qb5c FBA197P07GQB FBA196J1QB5C fba197p07gqb",
      ),
    ).toEqual(["FBA196J1QB5C", "FBA197P07GQB"])
  })

  it("rejects malformed and embedded identifiers", () => {
    expect(
      extractShipmentIds(
        "FBA123 FBA1234567890 XFBA19749WJ6Q FBA19749WJ6QX FBA19FKYKJ4T",
      ),
    ).toEqual(["FBA19FKYKJ4T"])
  })
})

describe("extractRemovalOrderIds", () => {
  it("extracts Removal Order IDs from links, punctuation, and line breaks", () => {
    expect(
      extractRemovalOrderIds(
        "https://sellercentral.amazon.com/recoveryui/removal-order/detail?sourceRemovalOrderId=S4EKM0127\nNext: s4ekm0126.",
      ),
    ).toEqual(["S4EKM0127", "S4EKM0126"])
  })

  it("ignores IDs embedded in longer tokens or with the wrong shape", () => {
    expect(extractRemovalOrderIds("XS4EKM0127 S4EKM01270 S4EK0127 S4EKM012 86RmssEGx+")).toEqual([])
  })

  it("counts repeats so duplicates can be reported", () => {
    expect(findRemovalOrderIds("S4EKM0127 s4ekm0127")).toEqual(["S4EKM0127", "S4EKM0127"])
  })
})

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
