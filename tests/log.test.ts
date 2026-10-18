import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createLogger,
  createLogStore,
  createRequestMonitor,
  describeError,
  errorMessage,
  forwardLogsToBackground,
  LOG_ENTRIES_MESSAGE,
  LOGS_STORAGE_KEY,
  requestEndpoint,
  sanitizeLogEntries,
  setLogSink,
  type LogEntry,
} from "../src/lib/log"

function captureLogs(): LogEntry[] {
  const entries: LogEntry[] = []
  setLogSink((entry) => entries.push(entry))
  return entries
}

function memoryStorage(initial: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = { ...initial }
  return {
    values,
    area: {
      get: vi.fn(async (key: string) => ({ [key]: values[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(values, items) }),
      remove: vi.fn(async (key: string) => { delete values[key] }),
    },
  }
}

const response = (status: number) => ({ ok: status >= 200 && status < 300, status }) as Response

afterEach(() => {
  setLogSink(null)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("logger", () => {
  it("writes structured entries with context, run, and data", () => {
    const entries = captureLogs()
    createLogger("content").withRun("report-1").warn("report.fetch", { source: "stranded" })

    expect(entries).toEqual([
      expect.objectContaining({ level: "warn", ctx: "content", event: "report.fetch", run: "report-1", data: { source: "stranded" } }),
    ])
    expect(entries[0].t).toBeTypeOf("number")
  })

  it("times a step and merges data passed at the end", () => {
    vi.useFakeTimers()
    const entries = captureLogs()
    const done = createLogger("background").time("report.prepare", { tab: 3 })
    vi.advanceTimersByTime(250)

    expect(done({ loggedInToStore: true }, "warn")).toBeGreaterThanOrEqual(0)
    expect(entries[0]).toMatchObject({
      level: "warn",
      event: "report.prepare",
      data: { tab: 3, loggedInToStore: true },
    })
    expect(entries[0].ms).toBeTypeOf("number")
  })

  it("never lets a failing sink break the caller", () => {
    setLogSink(() => { throw new Error("sink offline") })
    expect(() => createLogger("palette").error("report.run")).not.toThrow()
  })

  it("describes errors without leaking long messages", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom")
    expect(errorMessage(undefined, "fallback")).toBe("fallback")
    const described = describeError(new Error("x".repeat(500)))
    expect(String(described.message).length).toBeLessThanOrEqual(300)
    expect(described.name).toBe("Error")
  })
})

describe("log entry validation", () => {
  it("keeps valid entries, drops malformed ones, and truncates oversized data", () => {
    const entries = sanitizeLogEntries([
      { t: 1, level: "info", ctx: "palette", event: "report.run", ms: 20, data: { ok: true } },
      { t: 2, level: "debug", ctx: "palette", event: "ignored" },
      { level: "info", ctx: "palette", event: "missing time" },
      { t: 3, level: "error", ctx: "content", event: "big", data: { blob: "x".repeat(10_000) } },
    ])

    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({ t: 1, level: "info", ctx: "palette", event: "report.run", ms: 20, data: { ok: true } })
    expect(entries[1].data).toMatchObject({ truncated: true })
  })
})

describe("request monitor", () => {
  it("names endpoints by method, path, and GraphQL operation with IDs collapsed", () => {
    expect(requestEndpoint("https://sellercentral.amazon.com/fba/wmsr/eligibilities/FBA19RKC646S?withInquiry=true"))
      .toBe("GET /fba/wmsr/eligibilities/:id")
    expect(requestEndpoint("https://sellercentral.amazon.com/myinventory/gql", {
      method: "POST",
      body: JSON.stringify({ operationName: "getListingsV2", variables: {} }),
    })).toBe("POST /myinventory/gql getListingsV2")
  })

  it("summarizes counts, failures, statuses, and overlap per endpoint", async () => {
    const entries = captureLogs()
    const statuses = [200, 200, 503]
    const fetchImpl = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))
      return response(statuses.shift() ?? 200)
    })
    const monitor = createRequestMonitor(fetchImpl as unknown as typeof fetch, createLogger("content"))

    await Promise.all([1, 2, 3].map((id) => monitor.fetch(`https://sellercentral.amazon.com/fba/wmsr/eligibilities/FBA00000000${id}`)))
    await expect(monitor.fetch("https://sellercentral.amazon.com/fbmapi/v1/feedbacks", {})).resolves.toBeDefined()

    const summary = monitor.summary()
    expect(summary["GET /fba/wmsr/eligibilities/:id"]).toMatchObject({
      n: 3,
      failed: 1,
      statuses: { 200: 2, 503: 1 },
      maxInFlight: 3,
    })
    expect(summary["GET /fba/wmsr/eligibilities/:id"].parallelism).toBeGreaterThan(1)
    expect(summary["GET /fbmapi/v1/feedbacks"]).toMatchObject({ n: 1, failed: 0, maxInFlight: 1 })
    expect(summary["GET /fbmapi/v1/feedbacks"].statuses).toBeUndefined()
    expect(entries).toEqual([
      expect.objectContaining({ level: "warn", event: "request.failed", data: expect.objectContaining({ status: "503" }) }),
    ])
  })

  it("counts network errors and rethrows them", async () => {
    const monitor = createRequestMonitor(vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch)

    await expect(monitor.fetch("https://sellercentral.amazon.com/recovery/inventories")).rejects.toThrow("Failed to fetch")
    expect(monitor.summary()["GET /recovery/inventories"]).toMatchObject({ n: 1, failed: 1, statuses: { network: 1 } })
  })
})

describe("log store", () => {
  it("keeps only the newest entries and reads pending ones", async () => {
    const storage = memoryStorage({ [LOGS_STORAGE_KEY]: [{ t: 1, level: "info", ctx: "background", event: "old" }] })
    const store = createLogStore(storage.area, 2)

    store.append([
      { t: 2, level: "info", ctx: "background", event: "second" },
      { t: 3, level: "info", ctx: "background", event: "third" },
    ])

    expect((await store.read()).map((entry) => entry.event)).toEqual(["second", "third"])
    expect(storage.values[LOGS_STORAGE_KEY]).toHaveLength(2)
  })

  it("clears stored and pending entries", async () => {
    const storage = memoryStorage({ [LOGS_STORAGE_KEY]: [{ t: 1, level: "info", ctx: "background", event: "old" }] })
    const store = createLogStore(storage.area)
    store.append([{ t: 2, level: "info", ctx: "background", event: "pending" }])

    await store.clear()

    expect(await store.read()).toEqual([])
  })
})

describe("log forwarding", () => {
  it("batches entries to the background worker", () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("chrome", { runtime: { id: "extension", sendMessage } })
    setLogSink(forwardLogsToBackground())
    const log = createLogger("palette")

    log.info("one")
    log.info("two")
    expect(sendMessage).not.toHaveBeenCalled()
    vi.advanceTimersByTime(500)

    expect(sendMessage).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledWith({
      type: LOG_ENTRIES_MESSAGE,
      entries: [expect.objectContaining({ event: "one" }), expect.objectContaining({ event: "two" })],
    })
  })

  it("drops entries once the extension context is gone", () => {
    vi.useFakeTimers()
    const sendMessage = vi.fn()
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    setLogSink(forwardLogsToBackground())

    createLogger("content").info("orphaned")
    vi.advanceTimersByTime(500)

    expect(sendMessage).not.toHaveBeenCalled()
  })
})
