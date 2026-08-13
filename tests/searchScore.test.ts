import { describe, expect, it } from "vitest"

import { commandFilter } from "../src/lib/searchScore"

const shipment = "Open Shipment IDs"
const shipmentKeywords = ["shipment", "fba", "inbound", "transfer"]
const caseLabel = "Open Case ID/s"

describe("commandFilter", () => {
  it("shows every candidate for an empty search", () => {
    expect(commandFilter(shipment, "")).toBeGreaterThan(0)
    expect(commandFilter(shipment, "   ")).toBeGreaterThan(0)
  })

  it("ranks exact word, prefix, acronym, substring, typo, then fuzzy", () => {
    const exact = commandFilter(shipment, "shipment")
    const prefix = commandFilter(shipment, "ship")
    const acronym = commandFilter(shipment, "osi")
    const substring = commandFilter(shipment, "hipmen")
    const typo = commandFilter(shipment, "shipmnet")
    const fuzzy = commandFilter(shipment, "shpmt")

    expect(exact).toBeGreaterThan(prefix)
    expect(prefix).toBeGreaterThan(acronym)
    expect(acronym).toBeGreaterThan(substring)
    expect(substring).toBeGreaterThan(typo)
    expect(typo).toBeGreaterThan(fuzzy)
    expect(fuzzy).toBeGreaterThan(0)
  })

  it("matches acronyms of word initials", () => {
    expect(commandFilter(shipment, "osi")).toBeGreaterThan(0)
    expect(commandFilter(shipment, "OSI")).toBeGreaterThan(0)
  })

  it("tolerates a single Damerau-Levenshtein edit on tokens of 4+ characters", () => {
    expect(commandFilter(shipment, "shipmnet")).toBeGreaterThan(0)
    expect(commandFilter("Accounts", "acounts")).toBeGreaterThan(0)
    expect(commandFilter(shipment, "xyz")).toBe(0)
    expect(commandFilter(shipment, "shp")).toBeGreaterThan(0)
    expect(commandFilter("abc", "abz")).toBe(0)
  })

  it("requires every token to match, order-independently", () => {
    expect(commandFilter(caseLabel, "ids case")).toBeGreaterThan(0)
    expect(commandFilter(caseLabel, "case ids")).toBeGreaterThan(0)
    expect(commandFilter(caseLabel, "ids calendar")).toBe(0)
  })

  it("normalizes diacritics and treats slash, dash, underscore, and dots as separators", () => {
    expect(commandFilter(caseLabel, "ids")).toBeGreaterThan(0)
    expect(commandFilter("Café Accounts", "cafe")).toBeGreaterThan(0)
    expect(commandFilter("open-case-ids", "case")).toBeGreaterThan(0)
    expect(commandFilter("sku.ids", "sku")).toBeGreaterThan(0)
  })

  it("scores keywords the same way as the value and keeps the max", () => {
    expect(commandFilter(shipment, "fba", shipmentKeywords)).toBeGreaterThan(0)
    expect(commandFilter(shipment, "fba")).toBe(0)
    expect(commandFilter(shipment, "inbound", shipmentKeywords)).toBe(
      commandFilter("inbound", "inbound"),
    )
  })
})
