import { describe, expect, it, vi } from "vitest"

import {
  FEEDBACKS_URL,
  FEEDBACK_FROM_RATING,
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
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(jsonResponse(feedbacksPayload([negativeFeedback], { lastPage: false, pageNumber: 0 })))
      .mockResolvedValueOnce(jsonResponse(feedbacksPayload([suppressedNeutral], { lastPage: true, pageNumber: 1 })))

    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).resolves.toEqual([
      negativeFeedback,
      suppressedNeutral,
    ])
    expect(fetchImpl).toHaveBeenCalledTimes(2)
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
    expect(fetchImpl.mock.calls[1][0]).toBe(feedbacksUrl(1))
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
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("throws when Seller Central returns a failed response", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 403))
    await expect(fetchNeutralNegativeFeedbacks({ fetch: fetchImpl as unknown as typeof fetch })).rejects.toThrow(
      "Couldn’t load seller feedback (403).",
    )
  })
})
