import { describe, expect, it } from "vitest"

import { extractCaseIds } from "../src/lib/caseIds"

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
