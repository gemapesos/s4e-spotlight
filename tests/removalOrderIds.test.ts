import { describe, expect, it } from "vitest"

import { extractRemovalOrderIds, findRemovalOrderIds } from "../src/lib/removalOrderIds"

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
