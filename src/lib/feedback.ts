import { formatUtcDateTime } from "./dates"
import type { Logger } from "./log"
import type { ReportProgressEvent } from "./reportProgress"

export const FEEDBACKS_URL = "https://sellercentral.amazon.com/fbmapi/v1/feedbacks"
export const FEEDBACK_PAGE_SIZE = 20
/** Lifetime 1–3 star entries, newest first; stores with more than this many pages are flagged. */
export const FEEDBACK_MAX_PAGES = 200
export const FEEDBACK_PAGE_CONCURRENCY = 5
export const FEEDBACK_FROM_RATING = 1
export const FEEDBACK_TO_RATING = 3

export const FEEDBACK_INCOMPLETE_NOTE =
  `Only the newest ${FEEDBACK_MAX_PAGES * FEEDBACK_PAGE_SIZE} feedback entries were loaded. Seller Central has more.`

export const FEEDBACK_SHEET_HEADERS = [
  "Date",
  "Rating",
  "Sentiment",
  "Order ID",
  "Feedback",
  "Item as described",
  "Seller response",
  "Response date",
  "Suppressed",
  "Partially suppressed",
  "Suppress reason",
  "Feedback ID",
] as const

const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

export interface SellerFeedback {
  feedbackId?: string | null
  orderId?: string | null
  numericRating?: number | null
  feedbackText?: string | null
  feedbackDate?: string | null
  responseText?: string | null
  responseDate?: string | null
  suppressed?: boolean | null
  partiallySuppressed?: boolean | null
  suppressReasonId?: string | null
  answerMap?: {
    ItemAsDescribed?: {
      booleanRating?: boolean | null
    } | null
  } | null
  /** Set on every entry when the page limit stopped loading before the last page. */
  feedbackIncomplete?: boolean
}

export interface FeedbacksPage {
  feedbacks: SellerFeedback[]
  lastPage?: boolean
  pageNumber: number
}

export interface FetchSellerFeedbacksOptions {
  fetch?: typeof globalThis.fetch
  onProgress?: (event: ReportProgressEvent) => void
  log?: Logger
}

export function isNeutralOrNegativeRating(rating: number | null | undefined): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= FEEDBACK_FROM_RATING && rating <= FEEDBACK_TO_RATING
}

export function feedbackSentiment(rating: number | null | undefined): "Negative" | "Neutral" | "" {
  if (!isNeutralOrNegativeRating(rating)) return ""
  return rating <= 2 ? "Negative" : "Neutral"
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return HTML_NAMED_ENTITIES[entity] ?? match
  })
}

export function formatFeedbackDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatUtcDateTime(date)
}

function feedbackCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return ""
  return String(value)
}

function yesNo(value: boolean | null | undefined): string {
  if (value === true) return "Yes"
  if (value === false) return "No"
  return ""
}

function itemAsDescribed(feedback: SellerFeedback): string {
  return yesNo(feedback.answerMap?.ItemAsDescribed?.booleanRating)
}

export function feedbackSheetRow(feedback: SellerFeedback): Array<string | number> {
  const rating = typeof feedback.numericRating === "number" && Number.isFinite(feedback.numericRating)
    ? feedback.numericRating
    : ""
  return [
    formatFeedbackDate(feedback.feedbackDate),
    rating,
    feedbackSentiment(typeof rating === "number" ? rating : undefined),
    feedbackCell(feedback.orderId),
    decodeHtmlEntities(feedback.feedbackText ?? ""),
    itemAsDescribed(feedback),
    decodeHtmlEntities(feedback.responseText ?? ""),
    formatFeedbackDate(feedback.responseDate),
    yesNo(feedback.suppressed),
    yesNo(feedback.partiallySuppressed),
    feedbackCell(feedback.suppressReasonId),
    feedbackCell(feedback.feedbackId),
  ]
}

export function feedbackSheetRows(feedbacks: readonly SellerFeedback[]): Array<Array<string | number>> {
  return [[...FEEDBACK_SHEET_HEADERS], ...feedbacks.map(feedbackSheetRow)]
}

const FEEDBACK_STRING_FIELDS = [
  "feedbackId",
  "orderId",
  "feedbackText",
  "feedbackDate",
  "responseText",
  "responseDate",
  "suppressReasonId",
] as const satisfies ReadonlyArray<keyof SellerFeedback>
const FEEDBACK_BOOLEAN_FIELDS = ["suppressed", "partiallySuppressed"] as const satisfies ReadonlyArray<keyof SellerFeedback>

/** Keeps null and correctly typed values; drops anything else. */
function typedField<T>(value: unknown, isType: (value: unknown) => value is T): T | null | undefined {
  if (value === null) return null
  return isType(value) ? value : undefined
}

const isString = (value: unknown): value is string => typeof value === "string"
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value)
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean"

function asFeedback(value: unknown): SellerFeedback | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const feedback: SellerFeedback = {}
  for (const field of FEEDBACK_STRING_FIELDS) {
    const fieldValue = typedField(record[field], isString)
    if (fieldValue !== undefined) feedback[field] = fieldValue
  }
  const numericRating = typedField(record.numericRating, isFiniteNumber)
  if (numericRating !== undefined) feedback.numericRating = numericRating
  for (const field of FEEDBACK_BOOLEAN_FIELDS) {
    const fieldValue = typedField(record[field], isBoolean)
    if (fieldValue !== undefined) feedback[field] = fieldValue
  }
  const answerMap = record.answerMap && typeof record.answerMap === "object"
    ? record.answerMap as Record<string, unknown>
    : undefined
  const itemAsDescribedAnswer = answerMap?.ItemAsDescribed && typeof answerMap.ItemAsDescribed === "object"
    ? answerMap.ItemAsDescribed as Record<string, unknown>
    : undefined
  if (itemAsDescribedAnswer) {
    const booleanRating = typedField(itemAsDescribedAnswer.booleanRating, isBoolean)
    feedback.answerMap = { ItemAsDescribed: { booleanRating } }
  }
  return feedback
}

export function parseFeedbacksPage(payload: unknown): FeedbacksPage {
  if (!payload || typeof payload !== "object") throw new Error("Couldn’t load seller feedback.")
  const record = payload as { feedbacks?: unknown; lastPage?: unknown; pageNumber?: unknown }
  if (!Array.isArray(record.feedbacks)) throw new Error("Couldn’t load seller feedback.")
  const feedbacks = record.feedbacks.map(asFeedback).filter((feedback): feedback is SellerFeedback => feedback !== undefined)
  const pageNumber = typeof record.pageNumber === "number" && Number.isFinite(record.pageNumber) ? record.pageNumber : 0
  return {
    feedbacks,
    lastPage: typeof record.lastPage === "boolean" ? record.lastPage : undefined,
    pageNumber,
  }
}

export function feedbacksUrl(pageNumber: number): string {
  const params = new URLSearchParams({
    pageNumber: String(pageNumber),
    pageSize: String(FEEDBACK_PAGE_SIZE),
    fromRating: String(FEEDBACK_FROM_RATING),
    toRating: String(FEEDBACK_TO_RATING),
    sortBy: "Date",
    descendingOrder: "true",
    includePartiallySuppressed: "true",
    excludeTTRFeedback: "false",
    lastEvaluatedKey: "",
  })
  return `${FEEDBACKS_URL}?${params.toString()}`
}

async function getFeedbacksPage(
  fetchImpl: typeof globalThis.fetch,
  pageNumber: number,
): Promise<FeedbacksPage> {
  const response = await fetchImpl(feedbacksUrl(pageNumber), {
    method: "GET",
    credentials: "include",
    headers: {
      accept: "application/json, text/plain, */*",
      "x-requested-with": "XMLHttpRequest",
    },
  })

  if (!response.ok) throw new Error(`Couldn’t load seller feedback (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load seller feedback.")
  }

  return parseFeedbacksPage(payload)
}

function isLastFeedbackPage(page: FeedbacksPage): boolean {
  return page.lastPage === true
    || page.feedbacks.length === 0
    || (page.lastPage !== false && page.feedbacks.length < FEEDBACK_PAGE_SIZE)
}

export async function fetchNeutralNegativeFeedbacks(
  options: FetchSellerFeedbacksOptions = {},
): Promise<SellerFeedback[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const onProgress = options.onProgress
  const feedbacks: SellerFeedback[] = []

  onProgress?.({ source: "feedback", status: "active", loaded: 0 })
  for (let start = 0; start < FEEDBACK_MAX_PAGES; start += FEEDBACK_PAGE_CONCURRENCY) {
    const batchSize = Math.min(FEEDBACK_PAGE_CONCURRENCY, FEEDBACK_MAX_PAGES - start)
    const results = await Promise.allSettled(
      Array.from({ length: batchSize }, (_, offset) => getFeedbacksPage(fetchImpl, start + offset)),
    )

    for (let offset = 0; offset < results.length; offset += 1) {
      const result = results[offset]
      if (result.status === "rejected") throw result.reason
      const page = result.value
      feedbacks.push(...page.feedbacks.filter((feedback) => isNeutralOrNegativeRating(feedback.numericRating)))
      const lastPage = isLastFeedbackPage(page)
      const loaded = start + offset + 1
      onProgress?.({
        source: "feedback",
        status: lastPage ? "complete" : "active",
        loaded,
        total: lastPage ? loaded : undefined,
      })
      if (lastPage) return feedbacks
    }
  }

  options.log?.warn("feedback.pageLimit", { pages: FEEDBACK_MAX_PAGES, entries: feedbacks.length })
  return feedbacks.map((feedback) => ({ ...feedback, feedbackIncomplete: true }))
}
