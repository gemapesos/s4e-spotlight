export const FEEDBACKS_URL = "https://sellercentral.amazon.com/fbmapi/v1/feedbacks"
export const FEEDBACK_PAGE_SIZE = 20
export const FEEDBACK_MAX_PAGES = 40
export const FEEDBACK_FROM_RATING = 1
export const FEEDBACK_TO_RATING = 3

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

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
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
}

export interface FeedbacksPage {
  feedbacks: SellerFeedback[]
  lastPage?: boolean
  pageNumber: number
}

export interface FetchSellerFeedbacksOptions {
  fetch?: typeof globalThis.fetch
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
  const day = String(date.getUTCDate()).padStart(2, "0")
  const month = MONTHS[date.getUTCMonth()]
  const year = date.getUTCFullYear()
  const hours = String(date.getUTCHours()).padStart(2, "0")
  const minutes = String(date.getUTCMinutes()).padStart(2, "0")
  const seconds = String(date.getUTCSeconds()).padStart(2, "0")
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`
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

function stringField(value: unknown): string | null | undefined {
  if (value == null) return value as null | undefined
  return typeof value === "string" ? value : undefined
}

function numberField(value: unknown): number | null | undefined {
  if (value == null) return value as null | undefined
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

function booleanField(value: unknown): boolean | null | undefined {
  if (value == null) return value as null | undefined
  return typeof value === "boolean" ? value : undefined
}

function asFeedback(value: unknown): SellerFeedback | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const answerMap = record.answerMap && typeof record.answerMap === "object"
    ? record.answerMap as Record<string, unknown>
    : undefined
  const itemAsDescribedAnswer = answerMap?.ItemAsDescribed && typeof answerMap.ItemAsDescribed === "object"
    ? answerMap.ItemAsDescribed as Record<string, unknown>
    : undefined
  const feedback: SellerFeedback = {}
  const feedbackId = stringField(record.feedbackId)
  const orderId = stringField(record.orderId)
  const numericRating = numberField(record.numericRating)
  const feedbackText = stringField(record.feedbackText)
  const feedbackDate = stringField(record.feedbackDate)
  const responseText = stringField(record.responseText)
  const responseDate = stringField(record.responseDate)
  const suppressed = booleanField(record.suppressed)
  const partiallySuppressed = booleanField(record.partiallySuppressed)
  const suppressReasonId = stringField(record.suppressReasonId)
  if (feedbackId !== undefined) feedback.feedbackId = feedbackId
  if (orderId !== undefined) feedback.orderId = orderId
  if (numericRating !== undefined) feedback.numericRating = numericRating
  if (feedbackText !== undefined) feedback.feedbackText = feedbackText
  if (feedbackDate !== undefined) feedback.feedbackDate = feedbackDate
  if (responseText !== undefined) feedback.responseText = responseText
  if (responseDate !== undefined) feedback.responseDate = responseDate
  if (suppressed !== undefined) feedback.suppressed = suppressed
  if (partiallySuppressed !== undefined) feedback.partiallySuppressed = partiallySuppressed
  if (suppressReasonId !== undefined) feedback.suppressReasonId = suppressReasonId
  if (itemAsDescribedAnswer) {
    feedback.answerMap = { ItemAsDescribed: { booleanRating: booleanField(itemAsDescribedAnswer.booleanRating) } }
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

export async function fetchNeutralNegativeFeedbacks(
  options: FetchSellerFeedbacksOptions = {},
): Promise<SellerFeedback[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const feedbacks: SellerFeedback[] = []

  for (let pageNumber = 0; pageNumber < FEEDBACK_MAX_PAGES; pageNumber += 1) {
    const page = await getFeedbacksPage(fetchImpl, pageNumber)
    feedbacks.push(...page.feedbacks.filter((feedback) => isNeutralOrNegativeRating(feedback.numericRating)))
    if (page.lastPage === true || page.feedbacks.length === 0) break
    if (page.lastPage !== false && page.feedbacks.length < FEEDBACK_PAGE_SIZE) break
  }

  return feedbacks
}
