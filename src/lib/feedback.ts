import { formatUtcDateTime } from "./dates"
import { describeError, type Logger } from "./log"
import type { ReportProgressEvent } from "./reportProgress"
import { decodeHtmlEntities, textCell, yesNo } from "@/shared/format"

export const FEEDBACKS_URL = "https://sellercentral.amazon.com/fbmapi/v1/feedbacks"
/** Amazon's largest page; bigger pages fail with HTTP 500. */
export const FEEDBACK_PAGE_SIZE = 50
/** Cursor chains loading at once, each walking its own stretch of dates. */
export const FEEDBACK_CHAINS = 12
/** A busy chain is split for an idle one only while about this many entries are left in it. */
export const FEEDBACK_MIN_SPLIT_ENTRIES = 100
/** Lifetime 1–3 star entries; stores with more than this many are flagged. */
export const FEEDBACK_MAX_ENTRIES = 20_000
export const FEEDBACK_ATTEMPTS = 3
export const FEEDBACK_RETRY_DELAY_MS = 400
export const FEEDBACK_FROM_RATING = 1
export const FEEDBACK_TO_RATING = 3
/** Used for the date ranges if Amazon won't say when the oldest entry was left. */
const FEEDBACK_FALLBACK_OLDEST_MS = Date.UTC(1995, 0, 1)

export const FEEDBACK_INCOMPLETE_NOTE =
  `Only ${FEEDBACK_MAX_ENTRIES.toLocaleString("en-US")} feedback entries were loaded. Seller Central has more.`

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
  /** Set on every entry when the entry limit stopped loading before the end. */
  feedbackIncomplete?: boolean
}

export interface FeedbacksPage {
  feedbacks: SellerFeedback[]
  /** Entries Amazon returned, including any dropped as malformed. */
  rows: number
  lastPage?: boolean
  /** Amazon's key for the next page, when there is one. */
  cursor?: string
}

export interface FetchSellerFeedbacksOptions {
  fetch?: typeof globalThis.fetch
  onProgress?: (event: ReportProgressEvent) => void
  log?: Logger
  sleep?: (ms: number) => Promise<void>
  /** Overrides FEEDBACK_MAX_ENTRIES. */
  maxEntries?: number
}

export function isNeutralOrNegativeRating(rating: number | null | undefined): rating is number {
  return typeof rating === "number" && Number.isInteger(rating) && rating >= FEEDBACK_FROM_RATING && rating <= FEEDBACK_TO_RATING
}

export function feedbackSentiment(rating: number | null | undefined): "Negative" | "Neutral" | "" {
  if (!isNeutralOrNegativeRating(rating)) return ""
  return rating <= 2 ? "Negative" : "Neutral"
}

export function formatFeedbackDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatUtcDateTime(date)
}

function itemAsDescribed(feedback: SellerFeedback): string {
  return yesNo(feedback.answerMap?.ItemAsDescribed?.booleanRating)
}

export function feedbackSheetRow(feedback: SellerFeedback): Array<string | number> {
  const rating = typeof feedback.numericRating === "number" && Number.isFinite(feedback.numericRating)
    ? feedback.numericRating
    : ""
  const cells: Record<(typeof FEEDBACK_SHEET_HEADERS)[number], string | number> = {
    "Date": formatFeedbackDate(feedback.feedbackDate),
    "Rating": rating,
    "Sentiment": feedbackSentiment(typeof rating === "number" ? rating : undefined),
    "Order ID": textCell(feedback.orderId),
    "Feedback": decodeHtmlEntities(feedback.feedbackText ?? ""),
    "Item as described": itemAsDescribed(feedback),
    "Seller response": decodeHtmlEntities(feedback.responseText ?? ""),
    "Response date": formatFeedbackDate(feedback.responseDate),
    "Suppressed": yesNo(feedback.suppressed),
    "Partially suppressed": yesNo(feedback.partiallySuppressed),
    "Suppress reason": textCell(feedback.suppressReasonId),
    "Feedback ID": textCell(feedback.feedbackId),
  }
  return FEEDBACK_SHEET_HEADERS.map((header) => cells[header])
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
  const record = payload as { feedbacks?: unknown; lastPage?: unknown; lastEvaluatedKey?: unknown }
  if (!Array.isArray(record.feedbacks)) throw new Error("Couldn’t load seller feedback.")
  const feedbacks = record.feedbacks.map(asFeedback).filter((feedback): feedback is SellerFeedback => feedback !== undefined)
  return {
    feedbacks,
    rows: record.feedbacks.length,
    lastPage: typeof record.lastPage === "boolean" ? record.lastPage : undefined,
    ...(typeof record.lastEvaluatedKey === "string" && record.lastEvaluatedKey ? { cursor: record.lastEvaluatedKey } : {}),
  }
}

/** A page of entries newest first (or oldest first), starting after `cursor`. */
export function feedbacksUrl(cursor = "", ascending = false): string {
  const params = new URLSearchParams({
    pageNumber: "0",
    pageSize: String(FEEDBACK_PAGE_SIZE),
    fromRating: String(FEEDBACK_FROM_RATING),
    toRating: String(FEEDBACK_TO_RATING),
    sortBy: "Date",
    descendingOrder: String(!ascending),
    includePartiallySuppressed: "true",
    excludeTTRFeedback: "false",
    lastEvaluatedKey: cursor,
  })
  return `${FEEDBACKS_URL}?${params.toString()}`
}

const feedbackSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function getFeedbacksPage(
  fetchImpl: typeof globalThis.fetch,
  cursor: string,
  ascending: boolean,
  sleep: (ms: number) => Promise<void>,
): Promise<FeedbacksPage> {
  let lastError = new Error("Couldn’t load seller feedback.")
  for (let attempt = 1; attempt <= FEEDBACK_ATTEMPTS; attempt += 1) {
    if (attempt > 1) await sleep(FEEDBACK_RETRY_DELAY_MS * (attempt - 1))
    let response: Response
    try {
      response = await fetchImpl(feedbacksUrl(cursor, ascending), {
        method: "GET",
        credentials: "include",
        headers: {
          accept: "application/json, text/plain, */*",
          "x-requested-with": "XMLHttpRequest",
        },
      })
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      continue
    }
    if (!response.ok) {
      lastError = new Error(`Couldn’t load seller feedback (${response.status}).`)
      if (response.status === 429 || response.status >= 500) continue
      throw lastError
    }
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      throw new Error("Couldn’t load seller feedback.")
    }
    return parseFeedbacksPage(payload)
  }
  throw lastError
}

type FeedbackCursorKey = Record<string, { S?: string; N?: string }>

/** Amazon's cursor is base64 JSON of the last entry's table key. Undefined if that ever changes. */
export function decodeFeedbackCursor(cursor: string): FeedbackCursorKey | undefined {
  try {
    const key = JSON.parse(atob(cursor)) as FeedbackCursorKey
    const date = Number(key?.feedbackDateUtcEpoch?.N)
    return Number.isFinite(date) && date > 0 && typeof key?.feedbackId?.N === "string" ? key : undefined
  } catch {
    return undefined
  }
}

/** A cursor that resumes the list just below `dateMs`, so the next page holds older entries. */
export function feedbackCursorAt(template: FeedbackCursorKey, dateMs: number): string {
  return btoa(JSON.stringify({
    ...template,
    feedbackId: { N: "0" },
    feedbackDateUtcEpoch: { N: String(Math.floor(dateMs)) },
  }))
}

function feedbackDateMs(feedback: SellerFeedback): number {
  return Date.parse(feedback.feedbackDate ?? "")
}

function isLastFeedbackPage(page: FeedbacksPage): boolean {
  return page.lastPage === true || page.rows === 0 || !page.cursor
}

interface FeedbackChain {
  /** Newest date the chain covers. */
  hi: number
  /** Entries older than this belong to another chain. */
  lo: number
  cursor: string
  /** Date of the oldest entry kept so far. */
  reached: number
  entries: SellerFeedback[]
  done: boolean
  running: boolean
}

/**
 * Loads lifetime 1–3 star feedback, newest first.
 *
 * Amazon pages this list with a cursor; asking for a page number instead re-reads every earlier
 * entry, gets slower with depth, and stops at page 100. A cursor is base64 JSON of an entry's key,
 * so a cursor built for any date starts reading there. The dates between the newest and oldest
 * entries are split among FEEDBACK_CHAINS chains that read at once, and a chain that finishes
 * early takes half of whichever chain has the most left. If the cursor format is unfamiliar or a
 * built cursor fails, one chain reads the list from start to end instead.
 */
export async function fetchNeutralNegativeFeedbacks(
  options: FetchSellerFeedbacksOptions = {},
): Promise<SellerFeedback[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const sleep = options.sleep ?? feedbackSleep
  const onProgress = options.onProgress
  const log = options.log
  const maxEntries = options.maxEntries ?? FEEDBACK_MAX_ENTRIES
  let requests = 0
  let kept = 0
  let capped = false
  const load = (cursor = "", ascending = false) => {
    requests += 1
    return getFeedbacksPage(fetchImpl, cursor, ascending, sleep)
  }
  const reportKept = (count: number) => {
    kept += count
    onProgress?.({ source: "feedback", status: "active", loaded: kept })
  }

  onProgress?.({ source: "feedback", status: "active", loaded: 0 })
  // The oldest entry bounds the date ranges, so ask for it alongside the newest page.
  const [first, oldestPage] = await Promise.all([
    load(),
    load("", true).catch((error: unknown) => {
      log?.warn("feedback.oldestUnavailable", { error: describeError(error) })
      return undefined
    }),
  ])
  reportKept(first.feedbacks.length)

  let strategy = "single"
  let chains: FeedbackChain[] = []
  let splits = 0
  let rest: SellerFeedback[] = []
  /** Reads one chain at a time from `cursor` to the end of the list. */
  const walk = async (cursor: string): Promise<SellerFeedback[]> => {
    const entries: SellerFeedback[] = []
    for (let next: string | undefined = cursor; next; ) {
      if (kept >= maxEntries) {
        capped = true
        break
      }
      const page = await load(next)
      entries.push(...page.feedbacks)
      reportKept(page.feedbacks.length)
      next = isLastFeedbackPage(page) ? undefined : page.cursor
    }
    return entries
  }

  if (!isLastFeedbackPage(first)) {
    const template = decodeFeedbackCursor(first.cursor ?? "")
    if (!template) {
      log?.warn("feedback.cursorUnknown")
      strategy = "sequential"
      rest = await walk(first.cursor ?? "")
    } else {
      strategy = "parallel"
      const top = Number(template.feedbackDateUtcEpoch?.N)
      const oldestDate = oldestPage?.feedbacks[0] ? feedbackDateMs(oldestPage.feedbacks[0]) : Number.NaN
      const oldest = Number.isFinite(oldestDate) && oldestDate < top ? oldestDate : FEEDBACK_FALLBACK_OLDEST_MS
      const span = Math.max(1, top - oldest)
      chains = Array.from({ length: FEEDBACK_CHAINS }, (_, index) => {
        const hi = index === 0 ? top : Math.round(top - (span * index) / FEEDBACK_CHAINS)
        return {
          hi,
          lo: index === FEEDBACK_CHAINS - 1 ? Number.NEGATIVE_INFINITY : Math.round(top - (span * (index + 1)) / FEEDBACK_CHAINS),
          // The first chain continues from Amazon's own cursor, so entries sharing page one's last date aren't skipped.
          cursor: index === 0 ? first.cursor ?? "" : feedbackCursorAt(template, hi),
          reached: hi,
          entries: [],
          done: false,
          running: false,
        }
      })
      let failure: unknown
      const run = async (chain: FeedbackChain) => {
        chain.running = true
        try {
          while (!chain.done && failure === undefined) {
            if (kept >= maxEntries) {
              capped = true
              return
            }
            const page = await load(chain.cursor)
            let ended = isLastFeedbackPage(page)
            const before = chain.entries.length
            for (const feedback of page.feedbacks) {
              const date = feedbackDateMs(feedback)
              if (date < chain.lo) {
                ended = true
                break
              }
              chain.entries.push(feedback)
              if (Number.isFinite(date)) chain.reached = date
            }
            reportKept(chain.entries.length - before)
            if (ended) chain.done = true
            else chain.cursor = page.cursor ?? ""
          }
        } catch (error) {
          failure ??= error
        } finally {
          chain.running = false
        }
      }
      /** An idle chain, or half of the busiest one when it still has plenty left. */
      const nextChain = (): FeedbackChain | undefined => {
        if (failure !== undefined || capped) return undefined
        const idle = chains.find((chain) => !chain.done && !chain.running)
        if (idle) return idle
        let busiest: FeedbackChain | undefined
        let busiestLeft = FEEDBACK_MIN_SPLIT_ENTRIES
        for (const chain of chains) {
          if (chain.done || chain.entries.length === 0) continue
          const floor = Number.isFinite(chain.lo) ? chain.lo : oldest
          const left = (chain.entries.length / Math.max(1, chain.hi - chain.reached)) * (chain.reached - floor)
          if (left > busiestLeft) {
            busiest = chain
            busiestLeft = left
          }
        }
        if (!busiest) return undefined
        const floor = Number.isFinite(busiest.lo) ? busiest.lo : oldest - 1
        const middle = Math.round(floor + (busiest.reached - floor) / 2)
        const half: FeedbackChain = {
          hi: middle,
          lo: busiest.lo,
          cursor: feedbackCursorAt(template, middle),
          reached: middle,
          entries: [],
          done: false,
          running: false,
        }
        busiest.lo = middle
        chains.push(half)
        splits += 1
        return half
      }
      await Promise.all(Array.from({ length: FEEDBACK_CHAINS }, async () => {
        for (let chain = nextChain(); chain; chain = nextChain()) await run(chain)
      }))
      if (failure !== undefined) {
        log?.warn("feedback.parallelFailed", { error: describeError(failure), requests })
        strategy = "sequential"
        chains = []
        kept = first.feedbacks.length
        capped = false
        rest = await walk(first.cursor ?? "")
      } else {
        rest = [...chains].sort((a, b) => b.hi - a.hi).flatMap((chain) => chain.entries)
      }
    }
  }

  const seen = new Set<string>()
  const feedbacks = [...first.feedbacks, ...rest].filter((feedback) => {
    if (!isNeutralOrNegativeRating(feedback.numericRating)) return false
    const id = feedback.feedbackId
    if (!id) return true
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  log?.info("feedback.load", {
    strategy,
    requests,
    entries: feedbacks.length,
    ...(chains.length ? { chains: chains.length, splits } : {}),
  })
  onProgress?.({ source: "feedback", status: "complete", loaded: feedbacks.length, total: feedbacks.length })
  if (!capped) return feedbacks

  log?.warn("feedback.entryLimit", { limit: maxEntries, entries: feedbacks.length })
  return feedbacks.slice(0, maxEntries).map((feedback) => ({ ...feedback, feedbackIncomplete: true }))
}
