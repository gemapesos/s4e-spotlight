import { afterEach, describe, expect, it, vi } from "vitest"

import { dailyTasksSheetRows } from "../../src/reports/dailyTasks"
import { createLogger, setLogSink, type LogEntry } from "../../src/shared/log"
import {
  FEEDBACKS_URL,
  FEEDBACK_CHAINS,
  FEEDBACK_FROM_RATING,
  FEEDBACK_INCOMPLETE_NOTE,
  FEEDBACK_PAGE_SIZE,
  FEEDBACK_SHEET_HEADERS,
  FEEDBACK_TO_RATING,
  decodeFeedbackCursor,
  feedbackCursorAt,
  feedbackSentiment,
  feedbackSheetRows,
  feedbacksUrl,
  fetchNeutralNegativeFeedbacks,
  formatFeedbackDate,
  isNeutralOrNegativeRating,
  parseFeedbacksPage,
  type SellerFeedback,
} from "../../src/sellerCentral/feedback"
import { jsonResponse } from "../helpers/fetch"

const negativeFeedback: SellerFeedback = {
  feedbackId: "A1JYWNJI6O4TQ1",
  orderId: "112-6224287-0679468",
  numericRating: 1,
  feedbackText: "I sent this back with Your UPS label on it - a week ago. Why has it not been credited?",
  feedbackDate: "2026-08-03T19:22:21.216Z",
  responseText: null,
  responseDate: null,
  suppressed: false,
  partiallySuppressed: false,
  suppressReasonId: null,
}

const suppressedNeutral: SellerFeedback = {
  feedbackId: "A158MUFY7CSNA9",
  orderId: "114-5743369-1861015",
  numericRating: 3,
  feedbackText: "The blanket had a metal &amp; plastic hanger thru it.",
  feedbackDate: "2026-01-09T17:47:23.740Z",
  responseText: null,
  responseDate: null,
  suppressed: true,
  partiallySuppressed: true,
  suppressReasonId: "AmazonFaultFBAShipping",
}

const positiveFeedback: SellerFeedback = {
  feedbackId: "A1HZLMA68SJEU4",
  orderId: "114-6345035-0371416",
  numericRating: 5,
  feedbackText: "Product arrived on time and is as described.",
  feedbackDate: "2026-07-22T21:13:08.696Z",
  responseText: "Thank you!",
  responseDate: "2026-07-23T10:00:00.000Z",
  suppressed: false,
  partiallySuppressed: false,
  suppressReasonId: null,
  answerMap: { ItemAsDescribed: { booleanRating: true } },
}

function feedbacksPayload(feedbacks: SellerFeedback[], extras: { lastPage?: boolean; lastEvaluatedKey?: string | null } = {}) {
  return {
    feedbacks,
    pageSize: FEEDBACK_PAGE_SIZE,
    pageNumber: 0,
    fromRating: FEEDBACK_FROM_RATING,
    toRating: FEEDBACK_TO_RATING,
    lastEvaluatedKey: extras.lastEvaluatedKey ?? null,
    lastPage: extras.lastPage ?? true,
  }
}

const DAY = 86_400_000

/**
 * `count` 1–3 star entries spread unevenly from `newest` back over about `years` years, most of
 * them recent, like a store whose sales grew.
 */
function feedbackHistory(count: number, newest = Date.UTC(2026, 9, 18), years = 15): SellerFeedback[] {
  return Array.from({ length: count }, (_, index) => {
    const age = Math.round(((index / count) ** 2) * years * 365 * DAY)
    return {
      ...negativeFeedback,
      feedbackId: `F${String(index).padStart(5, "0")}`,
      numericRating: 1 + (index % 3),
      feedbackDate: new Date(newest - age - (index % 7) * 1000).toISOString(),
    }
  })
}

interface ServerOptions {
  /** Status to answer instead of a page, given the request's cursor key (undefined for page one). */
  fail?: (key: { date: number; id: number } | undefined, ascending: boolean) => number | undefined
}

/**
 * Amazon's feedback list: newest first (or oldest first), 50 entries a page, paged by a base64
 * JSON cursor of the last entry's key. Any key works as a cursor, as on the real endpoint.
 */
function feedbackServer(entries: SellerFeedback[], options: ServerOptions = {}) {
  const rows = entries
    .map((feedback, index) => ({ feedback, id: 2_000_000_000 + index, date: Date.parse(feedback.feedbackDate ?? "") }))
    .sort((a, b) => b.date - a.date || b.id - a.id)
  const keyOf = (row: (typeof rows)[number]) => btoa(JSON.stringify({
    encryptedRateeId: { S: "A1B2C3D4E5F6G" },
    feedbackId: { N: String(row.id) },
    feedbackDateUtcEpoch: { N: String(row.date) },
  }))
  return vi.fn(async (input: unknown, _init?: unknown) => {
    const params = new URL(String(input)).searchParams
    const ascending = params.get("descendingOrder") === "false"
    const cursor = params.get("lastEvaluatedKey") ?? ""
    const parsed = cursor ? JSON.parse(atob(cursor)) as Record<string, { N: string }> : undefined
    const key = parsed ? { date: Number(parsed.feedbackDateUtcEpoch.N), id: Number(parsed.feedbackId.N) } : undefined
    const status = options.fail?.(key, ascending)
    if (status) return jsonResponse({}, status)
    const ordered = ascending ? [...rows].reverse() : rows
    let start = 0
    if (key) {
      start = ordered.findIndex((row) => ascending
        ? row.date > key.date || (row.date === key.date && row.id > key.id)
        : row.date < key.date || (row.date === key.date && row.id < key.id))
      if (start === -1) start = ordered.length
    }
    const page = ordered.slice(start, start + FEEDBACK_PAGE_SIZE)
    const last = start + page.length >= ordered.length
    return jsonResponse(feedbacksPayload(page.map((row) => row.feedback), {
      lastPage: last,
      lastEvaluatedKey: last || page.length === 0 ? null : keyOf(page[page.length - 1]),
    }))
  })
}

const newestFirst = (entries: SellerFeedback[]) =>
  [...entries].sort((a, b) => Date.parse(b.feedbackDate ?? "") - Date.parse(a.feedbackDate ?? "") || (b.feedbackId ?? "").localeCompare(a.feedbackId ?? ""))
const idsOf = (entries: SellerFeedback[]) => entries.map((entry) => entry.feedbackId)

describe("feedback sentiment", () => {
  it("maps 1-2 to Negative and 3 to Neutral", () => {
    expect(feedbackSentiment(1)).toBe("Negative")
    expect(feedbackSentiment(2)).toBe("Negative")
    expect(feedbackSentiment(3)).toBe("Neutral")
    expect(feedbackSentiment(4)).toBe("")
    expect(feedbackSentiment(5)).toBe("")
    expect(isNeutralOrNegativeRating(3)).toBe(true)
    expect(isNeutralOrNegativeRating(4)).toBe(false)
  })
})

describe("feedback text helpers", () => {
  it("formats ISO timestamps as UTC datetimes", () => {
    expect(formatFeedbackDate("2026-08-03T19:22:21.216Z")).toBe("03-Aug-2026 19:22:21")
    expect(formatFeedbackDate(null)).toBe("")
    expect(formatFeedbackDate("not-a-date")).toBe("not-a-date")
  })
})

describe("feedback sheet rows", () => {
  it("writes a header and one row per feedback with decoded text", () => {
    const rows = feedbackSheetRows([negativeFeedback, suppressedNeutral, {
      ...positiveFeedback,
      numericRating: 2,
      answerMap: { ItemAsDescribed: { booleanRating: false } },
    }])
    expect(rows[0]).toEqual([...FEEDBACK_SHEET_HEADERS])
    expect(rows[1]).toEqual([
      "03-Aug-2026 19:22:21",
      1,
      "Negative",
      "112-6224287-0679468",
      "I sent this back with Your UPS label on it - a week ago. Why has it not been credited?",
      "",
      "",
      "",
      "No",
      "No",
      "",
      "A1JYWNJI6O4TQ1",
    ])
    expect(rows[2]).toEqual([
      "09-Jan-2026 17:47:23",
      3,
      "Neutral",
      "114-5743369-1861015",
      "The blanket had a metal & plastic hanger thru it.",
      "",
      "",
      "",
      "Yes",
      "Yes",
      "AmazonFaultFBAShipping",
      "A158MUFY7CSNA9",
    ])
    expect(rows[3][2]).toBe("Negative")
    expect(rows[3][5]).toBe("No")
    expect(rows[3][6]).toBe("Thank you!")
    expect(rows[3][7]).toBe("23-Jul-2026 10:00:00")
  })
})

describe("parseFeedbacksPage", () => {
  it("reads HAR-shaped payloads and keeps lastPage and the cursor", () => {
    expect(parseFeedbacksPage(feedbacksPayload([negativeFeedback, positiveFeedback], { lastPage: false, lastEvaluatedKey: "abc=" }))).toEqual({
      feedbacks: [negativeFeedback, positiveFeedback],
      rows: 2,
      lastPage: false,
      cursor: "abc=",
    })
    expect(parseFeedbacksPage(feedbacksPayload([negativeFeedback]))).toEqual({ feedbacks: [negativeFeedback], rows: 1, lastPage: true })
  })

  it("counts malformed entries as rows", () => {
    expect(parseFeedbacksPage({ feedbacks: [negativeFeedback, null, "x"] })).toMatchObject({
      feedbacks: [negativeFeedback],
      rows: 3,
    })
  })

  it("throws when the payload is not a feedbacks list", () => {
    expect(() => parseFeedbacksPage({})).toThrow("Couldn’t load seller feedback.")
    expect(() => parseFeedbacksPage(null)).toThrow("Couldn’t load seller feedback.")
  })
})

describe("feedback cursors", () => {
  const key = { encryptedRateeId: { S: "A1B2C3D4E5F6G" }, feedbackId: { N: "2000000123" }, feedbackDateUtcEpoch: { N: "1786000000000" } }

  it("reads Amazon's cursor and builds one for any date", () => {
    const template = decodeFeedbackCursor(btoa(JSON.stringify(key)))
    expect(template).toEqual(key)
    expect(JSON.parse(atob(feedbackCursorAt(template!, Date.UTC(2015, 0, 1))))).toEqual({
      encryptedRateeId: { S: "A1B2C3D4E5F6G" },
      feedbackId: { N: "0" },
      feedbackDateUtcEpoch: { N: String(Date.UTC(2015, 0, 1)) },
    })
  })

  it("rejects cursors in any other format", () => {
    expect(decodeFeedbackCursor("not base64!")).toBeUndefined()
    expect(decodeFeedbackCursor(btoa("{}"))).toBeUndefined()
    expect(decodeFeedbackCursor(btoa(JSON.stringify({ ...key, feedbackDateUtcEpoch: { N: "soon" } })))).toBeUndefined()
  })

  it("asks for 50 entries newest or oldest first after a cursor", () => {
    const url = new URL(feedbacksUrl("abc=", true))
    expect(url.href.startsWith(`${FEEDBACKS_URL}?`)).toBe(true)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      pageNumber: "0",
      pageSize: "50",
      fromRating: "1",
      toRating: "3",
      sortBy: "Date",
      descendingOrder: "false",
      includePartiallySuppressed: "true",
      excludeTTRFeedback: "false",
      lastEvaluatedKey: "abc=",
    })
    expect(new URL(feedbacksUrl()).searchParams.get("descendingOrder")).toBe("true")
  })
})

describe("fetchNeutralNegativeFeedbacks", () => {
  afterEach(() => setLogSink(null))

  function captureLogs(): LogEntry[] {
    const logged: LogEntry[] = []
    setLogSink((entry) => logged.push(entry))
    return logged
  }

  it("reads every entry, newest first, with cursor chains working in parallel", async () => {
    const history = feedbackHistory(1234)
    const fetchImpl = feedbackServer(history)
    const logged = captureLogs()
    let inFlight = 0
    let peak = 0
    const counted = vi.fn(async (input: unknown, init?: unknown) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      try {
        return await fetchImpl(input, init)
      } finally {
        inFlight -= 1
      }
    })

    const feedbacks = await fetchNeutralNegativeFeedbacks({ fetch: counted as unknown as typeof fetch, log: createLogger("content") })

    expect(idsOf(feedbacks)).toEqual(idsOf(newestFirst(history)))
    expect(peak).toBe(FEEDBACK_CHAINS)
    expect(counted.mock.calls.every(([url]) => new URL(String(url)).searchParams.get("pageSize") === "50")).toBe(true)
    expect(logged.find((entry) => entry.event === "feedback.load")).toMatchObject({
      level: "info",
      data: { strategy: "parallel", entries: 1234 },
    })
    expect(fetchImpl).toHaveBeenNthCalledWith(1, feedbacksUrl(), expect.objectContaining({
      method: "GET",
      credentials: "include",
      headers: expect.objectContaining({
        accept: "application/json, text/plain, */*",
        "x-requested-with": "XMLHttpRequest",
      }),
    }))
  })

  it("stops after one page when the store has no more", async () => {
    const history = feedbackHistory(30)
    const fetchImpl = feedbackServer(history)
    const logged = captureLogs()

    const feedbacks = await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, log: createLogger("content") })

    expect(idsOf(feedbacks)).toEqual(idsOf(newestFirst(history)))
    // Page one, and the oldest-first page asked for alongside it.
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(logged.find((entry) => entry.event === "feedback.load")?.data).toMatchObject({ strategy: "single", requests: 2 })
  })

  it("reads one chain at a time when Amazon's cursor format is unfamiliar", async () => {
    const history = newestFirst(feedbackHistory(120))
    const fetchImpl = vi.fn(async (input: unknown) => {
      const cursor = new URL(String(input)).searchParams.get("lastEvaluatedKey") ?? ""
      const start = cursor ? Number(cursor.slice("opaque-".length)) : 0
      const page = history.slice(start, start + FEEDBACK_PAGE_SIZE)
      const last = start + page.length >= history.length
      return jsonResponse(feedbacksPayload(page, { lastPage: last, lastEvaluatedKey: last ? null : `opaque-${start + page.length}` }))
    })
    const logged = captureLogs()

    const feedbacks = await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, log: createLogger("content") })

    expect(idsOf(feedbacks)).toEqual(idsOf(history))
    expect(logged).toContainEqual(expect.objectContaining({ level: "warn", event: "feedback.cursorUnknown" }))
    expect(logged.find((entry) => entry.event === "feedback.load")?.data).toMatchObject({ strategy: "sequential" })
  })

  it("starts over with one chain when Amazon rejects a built cursor", async () => {
    const history = feedbackHistory(400)
    const fetchImpl = feedbackServer(history, { fail: (key) => (key?.id === 0 ? 400 : undefined) })
    const logged = captureLogs()

    const feedbacks = await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, log: createLogger("content") })

    expect(idsOf(feedbacks)).toEqual(idsOf(newestFirst(history)))
    expect(logged).toContainEqual(expect.objectContaining({ level: "warn", event: "feedback.parallelFailed" }))
    expect(logged.find((entry) => entry.event === "feedback.load")?.data).toMatchObject({ strategy: "sequential", entries: 400 })
  })

  it("retries pages Amazon fails or throttles", async () => {
    const history = feedbackHistory(200)
    let failures = 0
    const fetchImpl = feedbackServer(history, {
      fail: (key) => {
        if (!key || failures >= 2) return undefined
        failures += 1
        return failures === 1 ? 500 : 429
      },
    })
    const sleep = vi.fn(async () => {})

    const feedbacks = await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, sleep })

    expect(feedbacks).toHaveLength(200)
    expect(sleep).toHaveBeenCalled()
  })

  it("throws when page one keeps failing", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 503))
    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, sleep: async () => {} })).rejects.toThrow(
      "Couldn’t load seller feedback (503).",
    )
  })

  it("throws at once when Seller Central refuses the request", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403))
    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      "Couldn’t load seller feedback (403).",
    )
    // Page one and the oldest-first page, each tried once.
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("drops 4-5 star feedback and repeated entries if the API returns them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(feedbacksPayload([
      negativeFeedback,
      positiveFeedback,
      suppressedNeutral,
      negativeFeedback,
    ])))

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
    ])
  })

  it("reports progress as entries load", async () => {
    const onProgress = vi.fn()
    const fetchImpl = feedbackServer(feedbackHistory(260))

    await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, onProgress })

    expect(onProgress).toHaveBeenNthCalledWith(1, { source: "feedback", status: "active", loaded: 0 })
    expect(onProgress).toHaveBeenNthCalledWith(2, { source: "feedback", status: "active", loaded: 50 })
    expect(onProgress).toHaveBeenLastCalledWith({ source: "feedback", status: "complete", loaded: 260, total: 260 })
  })

  it("flags every entry and logs a warning when the entry limit stops loading", async () => {
    const fetchImpl = feedbackServer(feedbackHistory(1000))
    const logged = captureLogs()

    const feedbacks = await fetchNeutralNegativeFeedbacks({
      fetch: fetchImpl as unknown as typeof fetch,
      log: createLogger("content"),
      maxEntries: 120,
    })

    expect(feedbacks).toHaveLength(120)
    expect(feedbacks.every((feedback) => feedback.feedbackIncomplete)).toBe(true)
    expect(FEEDBACK_INCOMPLETE_NOTE).toBe("Only 20,000 feedback entries were loaded. Seller Central has more.")
    expect(dailyTasksSheetRows(feedbacks).slice(0, 2)).toEqual([["Feedback Manager"], [FEEDBACK_INCOMPLETE_NOTE]])
    expect(logged).toContainEqual(expect.objectContaining({ level: "warn", event: "feedback.entryLimit" }))
  })
})
