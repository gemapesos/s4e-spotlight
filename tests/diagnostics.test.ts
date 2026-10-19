import { describe, expect, it } from "vitest"

import type { LogEntry } from "../src/lib/log"
import { formatSeconds, logsFileName, summarizeLastReport } from "../src/popup/diagnostics"

const run = (t: number, ms: number, data: Record<string, unknown>): LogEntry => ({
  t,
  level: "info",
  ctx: "palette",
  event: "report.run",
  ms,
  data,
})

describe("popup diagnostics", () => {
  it("summarizes the most recent report run", () => {
    const entries: LogEntry[] = [
      run(1, 9_000, { sources: { feedback: { ms: 9_000 } }, slowest: "feedback", failed: [] }),
      { t: 2, level: "info", ctx: "background", event: "report.source", ms: 47_000 },
      run(3, 48_200, {
        sources: { shippingQueue: { ms: 47_500 }, stranded: { ms: 900, error: "Couldn’t load stranded inventory (503)." } },
        slowest: "shippingQueue",
        failed: ["stranded"],
      }),
    ]

    expect(summarizeLastReport(entries)).toEqual({
      at: 3,
      ms: 48_200,
      slowest: { label: "Shipping Queue", ms: 47_500 },
      failed: ["Stranded"],
    })
    expect(summarizeLastReport([])).toBeNull()
  })

  it("formats durations and file names", () => {
    expect(formatSeconds(1_250)).toBe("1.3 s")
    expect(formatSeconds(48_200)).toBe("48 s")
    expect(logsFileName(new Date(2026, 9, 18))).toBe("s4e-spotlight-logs-2026-10-18.json")
  })
})
