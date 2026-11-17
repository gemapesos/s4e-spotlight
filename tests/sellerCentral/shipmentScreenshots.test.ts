import { describe, expect, it } from "vitest"

import {
  isFinalStep,
  parseTrackingPage,
  parseWorkflowId,
  shipmentsZip,
  shipmentsZipName,
  stepClutter,
  stepFileName,
  upsTrackingUrl,
} from "@/sellerCentral/shipmentScreenshots"
import { buildStoredZip, dosDateTime, readStoredZip } from "@/xlsx/workbook"

describe("shipment screenshots", () => {
  it("reads the Send to Amazon workflow ID from shipment-info", () => {
    expect(parseWorkflowId({ workflowId: "wf1b37ae29-aeb1-48e2-b63c-e01a199cd3fc" })).toBe("wf1b37ae29-aeb1-48e2-b63c-e01a199cd3fc")
    expect(parseWorkflowId({ workflowId: "abc" })).toBeNull()
    expect(parseWorkflowId(null)).toBeNull()
  })

  it("keeps only UPS tracking numbers from Carrier updates", () => {
    const page = {
      trackingItemsPage: {
        totalCount: 3,
        trackingItems: [
          { trackingId: "1Z229W110369104689" },
          { trackingId: " 1z229w110369104690 " },
          { trackingId: "TBA123456789000" },
        ],
      },
    }
    expect(parseTrackingPage(page)).toEqual({ upsIds: ["1Z229W110369104689", "1Z229W110369104690"], count: 3, total: 3 })
    expect(parseTrackingPage({})).toEqual({ upsIds: [], count: 0, total: 0 })
  })

  it("names step files after the step and skips the final step", () => {
    expect(stepFileName("Step 1: Confirmed inventory to send", 0)).toBe("sta-1-confirmed-inventory-to-send.png")
    expect(stepFileName("Step 1b – Pack individual units", 1)).toBe("sta-1b-pack-individual-units.png")
    expect(stepFileName("Box labels", 3)).toBe("sta-4-box-labels.png")
    expect(stepFileName("Step 1: Confirmed inventory to send", 0, 2)).toBe("sta-1-confirmed-inventory-to-send-page-2.png")
    expect(stepClutter("Step 1b – Pack individual units")).toEqual({ warnings: true, fees: false })
    expect(stepClutter("Step 2: Confirmed shipping")).toEqual({ warnings: true, fees: true })
    expect(stepClutter("Step 1: Confirmed inventory to send")).toEqual({ warnings: false, fees: false })
    expect(stepClutter("Step 3: Box labels printed")).toEqual({ warnings: false, fees: false })
    expect(isFinalStep("Final step: Tracking details")).toBe(true)
    expect(isFinalStep("Step 3: Box labels printed")).toBe(false)
  })

  it("zips one folder per shipment with its notes", async () => {
    const zip = shipmentsZip([
      { shipmentId: "FBA19RSG3KZN", files: [{ name: "sta-1-x.png", data: new Uint8Array([1, 2]) }], notes: [] },
      { shipmentId: "FBA000000000", files: [], notes: ["Not found in the current store."] },
    ])
    const entries = readStoredZip(new Uint8Array(await zip.arrayBuffer()))
    expect([...entries.keys()]).toEqual(["FBA19RSG3KZN/sta-1-x.png", "FBA000000000/notes.txt"])
    expect(new TextDecoder().decode(entries.get("FBA000000000/notes.txt"))).toBe("Not found in the current store.\n")
  })

  it("stamps zip entries with the real date, not 1980", () => {
    expect(dosDateTime(new Date(2026, 10, 17, 20, 28, 30))).toEqual({
      time: (20 << 11) | (28 << 5) | 15,
      day: ((2026 - 1980) << 9) | (11 << 5) | 17,
    })
    const zip = buildStoredZip([{ name: "a.png", data: new Uint8Array([1]) }], new Date(2026, 10, 17, 20, 28, 30))
    const view = new DataView(zip.buffer)
    expect(view.getUint16(12, true)).toBe(((2026 - 1980) << 9) | (11 << 5) | 17)
  })

  it("names the zip and the UPS lookup", () => {
    expect(shipmentsZipName(["FBA19RSG3KZN"])).toBe("shipment-FBA19RSG3KZN-screenshots.zip")
    expect(shipmentsZipName(["A", "B"], new Date(2026, 10, 7))).toBe("shipments-2-screenshots-2026-11-07.zip")
    expect(upsTrackingUrl("1Z229W110369104689")).toContain("tracknum=1Z229W110369104689")
  })
})
