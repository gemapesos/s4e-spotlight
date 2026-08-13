import { describe, expect, it } from "vitest"

import { extractShipmentIds } from "../src/lib/shipmentIds"

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
