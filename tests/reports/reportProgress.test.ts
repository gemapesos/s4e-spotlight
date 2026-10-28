import { describe, expect, it } from "vitest"

import {
  applyReportProgressEvent,
  feedbackProgressPercent,
  INITIAL_REPORT_PROGRESS,
  reportSourceDetail,
  reportSourcePercent,
  shippingQueueProgressPercent,
  sourcesReadyForWorkbook,
  unfulfillableProgressPercent,
  type ReportProgressState,
} from "../../src/reports/progress"

describe("report progress helpers", () => {
  it("maps unfulfillable listings to the first 80 percent and removal to the rest", () => {
    expect(unfulfillableProgressPercent({ status: "active", loaded: 50, total: 100, phase: "listings" })).toBe(40)
    expect(unfulfillableProgressPercent({ status: "active", loaded: 25, total: 50, phase: "removal" })).toBe(90)
    expect(unfulfillableProgressPercent({ status: "complete" })).toBe(100)
  })

  it("calculates progress percentages correctly for all sources", () => {
    expect(feedbackProgressPercent({ status: "active", loaded: 2 })).toBeNull()
    expect(feedbackProgressPercent({ status: "active", loaded: 2, total: 4 })).toBe(50)
    expect(reportSourcePercent({ source: "stranded", status: "active" })).toBeNull()
    expect(reportSourcePercent({ source: "stranded", status: "complete" })).toBe(100)
    expect(reportSourcePercent({ source: "suppressed", status: "active", loaded: 1, total: 4, phase: "listings" })).toBe(20)
    expect(reportSourcePercent({ source: "suppressed", status: "active", loaded: 2, total: 4, phase: "issues" })).toBe(90)
    expect(reportSourcePercent({ source: "suppressed", status: "complete" })).toBe(100)
    expect(shippingQueueProgressPercent({ status: "active", loaded: 10 })).toBeNull()
    expect(shippingQueueProgressPercent({ status: "active", loaded: 50, total: 100 })).toBe(50)
    expect(reportSourcePercent({ source: "shippingQueue", status: "complete" })).toBe(100)
  })

  it("describes shipping queue listing and details progress", () => {
    expect(reportSourceDetail("shippingQueue", { status: "active", loaded: 250, phase: "listings" })).toBe("250 shipments")
    expect(reportSourceDetail("shippingQueue", { status: "active", loaded: 0, phase: "listings" })).toBe("Loading shipments")
    expect(reportSourceDetail("shippingQueue", { status: "active", loaded: 10, total: 40, phase: "details" })).toBe("Shipment details 10 of 40")
    expect(reportSourceDetail("shippingQueue", { status: "active", phase: "details" })).toBe("Loading shipment details")
  })

  it("applies per-source events without resetting the others", () => {
    const next = applyReportProgressEvent(
      {
        ...INITIAL_REPORT_PROGRESS,
        prepare: "complete",
        sources: {
          unfulfillable: { status: "active" },
          feedback: { status: "active" },
          stranded: { status: "active" },
          suppressed: { status: "active" },
          shippingQueue: { status: "active" },
        },
      },
      { source: "feedback", status: "active", loaded: 2 },
    )
    expect(next.sources.feedback).toEqual({ status: "active", loaded: 2, total: undefined, phase: undefined })
    expect(next.sources.unfulfillable.status).toBe("active")
    expect(next.sources.stranded.status).toBe("active")
    expect(next.sources.suppressed.status).toBe("active")
    expect(next.sources.shippingQueue.status).toBe("active")
  })

  it("waits only for the chosen sections before building the workbook", () => {
    const state: ReportProgressState = {
      ...INITIAL_REPORT_PROGRESS,
      prepare: "complete",
      sections: ["stranded", "shippingQueue"],
      sources: {
        ...INITIAL_REPORT_PROGRESS.sources,
        stranded: { status: "complete" },
        shippingQueue: { status: "active" },
      },
    }

    expect(sourcesReadyForWorkbook(state)).toBe(false)
    expect(sourcesReadyForWorkbook(applyReportProgressEvent(state, { source: "shippingQueue", status: "error" }))).toBe(true)
  })
})
