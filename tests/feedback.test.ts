import { describe, expect, it, vi } from "vitest"

import { dailyTasksSheetRows } from "../src/lib/dailyTasks"
import { createLogger, setLogSink, type LogEntry } from "../src/lib/log"
import {
  FEEDBACKS_URL,
  FEEDBACK_FROM_RATING,
  FEEDBACK_INCOMPLETE_NOTE,
  FEEDBACK_MAX_PAGES,
  FEEDBACK_PAGE_CONCURRENCY,
  FEEDBACK_PAGE_SIZE,
  FEEDBACK_SHEET_HEADERS,
  FEEDBACK_TO_RATING,
  decodeHtmlEntities,
  feedbackSentiment,
  feedbackSheetRows,
  feedbacksUrl,
  fetchNeutralNegativeFeedbacks,
  formatFeedbackDate,
  isNeutralOrNegativeRating,
  parseFeedbacksPage,
  type SellerFeedback,
} from "../src/lib/feedback"

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

function jsonResponse(payload: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

function feedbacksPayload(feedbacks: SellerFeedback[], extras: { lastPage?: boolean; pageNumber?: number } = {}) {
  return {
    feedbacks,
    pageSize: FEEDBACK_PAGE_SIZE,
    pageNumber: extras.pageNumber ?? 0,
    fromRating: FEEDBACK_FROM_RATING,
    toRating: FEEDBACK_TO_RATING,
    lastPage: extras.lastPage ?? true,
  }
}

function pageNumberFromUrl(input: unknown): number {
  return Number(new URL(String(input)).searchParams.get("pageNumber"))
}

function requestedPageNumbers(fetchImpl: ReturnType<typeof vi.fn>): number[] {
  return fetchImpl.mock.calls.map(([url]) => pageNumberFromUrl(url)).sort((a, b) => a - b)
}

function fetchByPage(
  pages: Record<number, { payload: unknown; status?: number }>,
  fallback?: { payload: unknown; status?: number },
) {
  return vi.fn(async (input: unknown) => {
    const pageNumber = pageNumberFromUrl(input)
    const handler = pages[pageNumber] ?? fallback
    if (!handler) throw new Error(`Unexpected feedback page ${pageNumber}`)
    return jsonResponse(handler.payload, handler.status ?? 200)
  })
}

function continuingPage(feedback: SellerFeedback, pageNumber: number) {
  return {
    payload: feedbacksPayload([feedback], { lastPage: false, pageNumber }),
  }
}

function lastPage(feedback: SellerFeedback, pageNumber: number) {
  return {
    payload: feedbacksPayload([feedback], { lastPage: true, pageNumber }),
  }
}

const emptyLastPage = { payload: feedbacksPayload([], { lastPage: true }) }

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
  it("decodes HTML entities in comments", () => {
    expect(decodeHtmlEntities("metal &amp; plastic")).toBe("metal & plastic")
    expect(decodeHtmlEntities("a &lt; b &gt; c")).toBe("a < b > c")
  })

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
  it("reads HAR-shaped payloads and keeps lastPage", () => {
    expect(parseFeedbacksPage(feedbacksPayload([negativeFeedback, positiveFeedback], { lastPage: false, pageNumber: 0 }))).toEqual({
      feedbacks: [negativeFeedback, positiveFeedback],
      lastPage: false,
      pageNumber: 0,
    })
  })

  it("throws when the payload is not a feedbacks list", () => {
    expect(() => parseFeedbacksPage({})).toThrow("Couldn’t load seller feedback.")
    expect(() => parseFeedbacksPage(null)).toThrow("Couldn’t load seller feedback.")
  })
})

describe("fetchNeutralNegativeFeedbacks", () => {
  it("requests ratings 1-3 and paginates until lastPage", async () => {
    const fetchImpl = fetchByPage({
      0: continuingPage(negativeFeedback, 0),
      1: lastPage(suppressedNeutral, 1),
    }, emptyLastPage)

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
    ])
    expect(requestedPageNumbers(fetchImpl)).toEqual([0, 1, 2, 3, 4])
    expect(FEEDBACK_PAGE_CONCURRENCY).toBe(5)
    expect(fetchImpl).toHaveBeenNthCalledWith(1, feedbacksUrl(0), expect.objectContaining({
      method: "GET",
      credentials: "include",
      headers: expect.objectContaining({
        accept: "application/json, text/plain, */*",
        "x-requested-with": "XMLHttpRequest",
      }),
    }))
    expect(fetchImpl.mock.calls[0][0]).toContain(`${FEEDBACKS_URL}?`)
    expect(fetchImpl.mock.calls[0][0]).toContain("fromRating=1")
    expect(fetchImpl.mock.calls[0][0]).toContain("toRating=3")
    expect(FEEDBACK_PAGE_SIZE).toBe(20)
    expect(fetchImpl.mock.calls[0][0]).toContain("pageSize=20")
    expect(fetchImpl.mock.calls.map(([url]) => url)).toContain(feedbacksUrl(1))
  })

  it("reports page progress including the last page total", async () => {
    const onProgress = vi.fn()
    const fetchImpl = fetchByPage({
      0: continuingPage(negativeFeedback, 0),
      1: lastPage(suppressedNeutral, 1),
    }, emptyLastPage)

    await fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch, onProgress })
    expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "active", loaded: 0 })
    expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "active", loaded: 1, total: undefined })
    expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "complete", loaded: 2, total: 2 })
  })

  it("drops 4-5 star feedback if the API returns them", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(feedbacksPayload([
      negativeFeedback,
      positiveFeedback,
      suppressedNeutral,
    ])))

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
    ])
  })

  it("stops when lastPage is missing and the page is short", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ feedbacks: [negativeFeedback] }),
    })

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
    ])
    expect(requestedPageNumbers(fetchImpl)).toEqual([0, 1, 2, 3, 4])
  })

  it("does not start the next window after lastPage and ignores later-window overshoot", async () => {
    const fetchImpl = fetchByPage({
      0: continuingPage(negativeFeedback, 0),
      1: continuingPage(suppressedNeutral, 1),
      2: continuingPage(negativeFeedback, 2),
      3: continuingPage(suppressedNeutral, 3),
      4: continuingPage(negativeFeedback, 4),
      5: lastPage(suppressedNeutral, 5),
      6: { payload: {}, status: 500 },
      7: { payload: {}, status: 500 },
      8: { payload: {}, status: 500 },
      9: { payload: {}, status: 500 },
    })

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
      negativeFeedback,
      suppressedNeutral,
      negativeFeedback,
      suppressedNeutral,
    ])
    expect(requestedPageNumbers(fetchImpl)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it("ignores a failed page after lastPage", async () => {
    const fetchImpl = fetchByPage({
      0: continuingPage(negativeFeedback, 0),
      1: lastPage(suppressedNeutral, 1),
      2: { payload: {}, status: 500 },
      3: { payload: {}, status: 403 },
      4: { payload: {}, status: 429 },
    })

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
    ])
  })

  it("throws when a needed page fails", async () => {
    const fetchImpl = fetchByPage({
      0: continuingPage(negativeFeedback, 0),
      1: { payload: {}, status: 403 },
      2: lastPage(suppressedNeutral, 2),
      3: lastPage(suppressedNeutral, 3),
      4: lastPage(suppressedNeutral, 4),
    })

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      "Couldn’t load seller feedback (403).",
    )
  })

  it("throws when Seller Central returns a failed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403))
    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      "Couldn’t load seller feedback (403).",
    )
  })

  it("flags every entry and logs a warning when the page limit stops before the last page", async () => {
    const fetchImpl = fetchByPage({}, continuingPage(negativeFeedback, 0))
    const entries: LogEntry[] = []
    setLogSink((entry) => entries.push(entry))

    try {
      const feedbacks = await fetchNeutralNegativeFeedbacks({
        fetch: fetchImpl as unknown as typeof fetch,
        log: createLogger("content"),
      })

      expect(fetchImpl).toHaveBeenCalledTimes(FEEDBACK_MAX_PAGES)
      expect(feedbacks).toHaveLength(FEEDBACK_MAX_PAGES)
      expect(feedbacks.every((feedback) => feedback.feedbackIncomplete)).toBe(true)
      expect(dailyTasksSheetRows(feedbacks).slice(0, 2)).toEqual([["Feedback Manager"], [FEEDBACK_INCOMPLETE_NOTE]])
      expect(entries).toContainEqual(expect.objectContaining({
        level: "warn",
        event: "feedback.pageLimit",
        data: { pages: FEEDBACK_MAX_PAGES, entries: FEEDBACK_MAX_PAGES },
      }))
    } finally {
      setLogSink(null)
    }
  })
})
