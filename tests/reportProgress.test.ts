import { describe, expect, it } from "vitest"

import {
  applyReportProgressEvent,
  feedbackProgressPercent,
  INITIAL_REPORT_PROGRESS,
  reportSourcePercent,
  unfulfillableProgressPercent,
} from "../src/lib/reportProgress"

describe("report progress helpers", () => {
  it("maps unfulfillable listings to the first 80 percent and removal to the rest", () => {
    expect(unfulfillableProgressPercent({ status: "active", loaded: 50, total: 100, phase: "listings" })).toBe(40)
    expect(unfulfillableProgressPercent({ status: "active", loaded: 25, total: 50, phase: "removal" })).toBe(90)
    expect(unfulfillableProgressPercent({ status: "complete" })).toBe(100)
  })

  it("keeps feedback indeterminate until the last page is known", () => {
    expect(feedbackProgressPercent({ status: "active", loaded: 2 })).toBeNull()
    expect(feedbackProgressPercent({ status: "active", loaded: 2, total: 4 })).toBe(50)
    expect(reportSourcePercent({ source: "stranded", status: "active" })).toBeNull()
    expect(reportSourcePercent({ source: "stranded", status: "complete" })).toBe(100)
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
        },
      },
      { source: "feedback", status: "active", loaded: 2 },
    )
    expect(next.sources.feedback).toEqual({ status: "active", loaded: 2, total: undefined, phase: undefined })
    expect(next.sources.unfulfillable.status).toBe("active")
    expect(next.sources.stranded.status).toBe("active")
  })
})
