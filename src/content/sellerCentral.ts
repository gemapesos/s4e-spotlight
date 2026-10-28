/**
 * seller-central.js, on Seller Central pages: runs the service worker's requests from the
 * signed-in tab (report sources, case scraping, removal checks and the session probe).
 */
import { resolveRemovalSkus } from "@/lib/bulkRemoval"
import { fetchNeutralNegativeFeedbacks } from "@/lib/feedback"
import {
  createLogger,
  createRequestMonitor,
  describeError,
  errorMessage,
  forwardLogsToBackground,
  setLogSink,
  type Logger,
} from "@/lib/log"
import type { ReportProgressEvent, ReportSource } from "@/lib/reportProgress"
import { sellerCentralSessionStatus } from "@/lib/sellerCentralSession"
import { fetchShippingQueueShipments } from "@/lib/shippingQueue"
import { fetchStrandedListings } from "@/lib/stranded"
import { fetchSuppressedListings } from "@/lib/suppressed"
import { fetchNextRemovalOrderId, fetchUnfulfillableListings } from "@/lib/unfulfillable"
import { scrapeCases } from "@/lib/viewCase"
import { isFromWorker, sendToBackground } from "@/shared/messages"

const contentLog = createLogger("content")

function emitReportProgress(event: ReportProgressEvent, runId?: string): void {
  if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") return
  void sendToBackground({ type: "REPORTS_PROGRESS", ...event, ...(runId ? { runId } : {}) }).catch(() => undefined)
}

interface SourceFetchOptions {
  fetch: typeof globalThis.fetch
  onProgress: (event: ReportProgressEvent) => void
  log: Logger
}

interface ReportFetcher {
  source: ReportSource
  fallbackError: string
  run: (options: SourceFetchOptions) => Promise<{ response: Record<string, unknown>; count: number }>
}

/** Report sources this content script loads from the signed-in Seller Central tab, by message type. */
const REPORT_FETCHERS: Record<string, ReportFetcher> = {
  REPORTS_FETCH_UNFULFILLABLE: {
    source: "unfulfillable",
    fallbackError: "Couldn’t load unfulfillable inventory.",
    run: async (options) => {
      const [listings, nextRemovalOrderId] = await Promise.all([
        fetchUnfulfillableListings(options),
        fetchNextRemovalOrderId(options.fetch),
      ])
      return { response: { listings, nextRemovalOrderId }, count: listings.length }
    },
  },
  REPORTS_FETCH_FEEDBACK: {
    source: "feedback",
    fallbackError: "Couldn’t load seller feedback.",
    run: async (options) => {
      const feedbacks = await fetchNeutralNegativeFeedbacks(options)
      return { response: { feedbacks }, count: feedbacks.length }
    },
  },
  REPORTS_FETCH_STRANDED: {
    source: "stranded",
    fallbackError: "Couldn’t load stranded inventory.",
    run: async (options) => {
      const listings = await fetchStrandedListings(options)
      return { response: { listings }, count: listings.length }
    },
  },
  REPORTS_FETCH_SUPPRESSED: {
    source: "suppressed",
    fallbackError: "Couldn’t load search-suppressed inventory.",
    run: async (options) => {
      const listings = await fetchSuppressedListings(options)
      return { response: { listings }, count: listings.length }
    },
  },
  REPORTS_FETCH_SHIPPING_QUEUE: {
    source: "shippingQueue",
    fallbackError: "Couldn’t load shipping queue.",
    run: async (options) => {
      const shipments = await fetchShippingQueueShipments(options)
      return { response: { shipments }, count: shipments.length }
    },
  },
}

const reportControllers = new Map<string, { controller: AbortController; active: number }>()

function reportFetchScope(runId?: string): { fetch: typeof globalThis.fetch; release: () => void } {
  if (!runId) return { fetch: globalThis.fetch, release: () => undefined }
  const scope = reportControllers.get(runId) ?? { controller: new AbortController(), active: 0 }
  scope.active += 1
  reportControllers.set(runId, scope)
  return {
    fetch: (input, init) => globalThis.fetch(input, {
      ...init,
      signal: init?.signal ? AbortSignal.any([scope.controller.signal, init.signal]) : scope.controller.signal,
    }),
    release: () => { if (--scope.active === 0) reportControllers.delete(runId) },
  }
}

async function scrapeCasesFromPage(caseIds: readonly string[], runId?: string): Promise<Record<string, unknown>> {
  const scope = reportFetchScope(runId)
  const monitor = createRequestMonitor(scope.fetch, contentLog)
  const done = contentLog.time("case.scrape", { requested: caseIds.length })
  try {
    const file = await scrapeCases(monitor.fetch, caseIds)
    done({
      cases: file.cases.length,
      errors: file.errors?.length ?? 0,
      requests: monitor.summary(),
    })
    return { ok: true, file }
  } catch (error) {
    done({ error: describeError(error), requests: monitor.summary() }, "error")
    return { ok: false, error: errorMessage(error, "Couldn’t scrape cases.") }
  } finally { scope.release() }
}

async function resolveBulkRemovalFromPage(skus: readonly string[]): Promise<Record<string, unknown>> {
  if (location.origin !== "https://sellercentral.amazon.com") return { ok: false, error: "Open Seller Central, then try again." }
  const monitor = createRequestMonitor(globalThis.fetch, contentLog)
  const done = contentLog.time("removal.resolve", { requested: skus.length })
  try {
    const resolution = await resolveRemovalSkus(skus, { fetch: monitor.fetch, log: contentLog })
    done({ removable: resolution.items.length, skipped: resolution.skipped.length, requests: monitor.summary() })
    return { ok: true, ...resolution }
  } catch (error) {
    done({ error: describeError(error), requests: monitor.summary() }, "error")
    return { ok: false, error: errorMessage(error, "Couldn’t check removal eligibility.") }
  }
}

async function runReportFetcher(fetcher: ReportFetcher, runId: string | undefined): Promise<Record<string, unknown>> {
  const log = contentLog.withRun(runId)
  const scope = reportFetchScope(runId)
  const monitor = createRequestMonitor(scope.fetch, log)
  const done = log.time("report.fetch", { source: fetcher.source })
  try {
    const { response, count } = await fetcher.run({ fetch: monitor.fetch, onProgress: (event) => emitReportProgress(event, runId), log })
    done({ count, requests: monitor.summary() })
    return { ok: true, ...response }
  } catch (error) {
    done({ error: describeError(error), requests: monitor.summary() }, "error")
    return { ok: false, error: errorMessage(error, fetcher.fallbackError) }
  } finally { scope.release() }
}

/** Answers only Seller Central requests; any other reply would win over content.js. */
export function handleSellerCentralMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
): boolean | undefined {
  if (!message || typeof message !== "object" || !("type" in message)) return undefined
  if (!isFromWorker(sender)) {
    sendResponse({ ok: false, error: "Unauthorized extension message." })
    return undefined
  }
  const record = message as { type?: unknown; runId?: unknown; caseIds?: unknown; skus?: unknown }
  if (record.type === "REPORTS_ABORT") {
    if (typeof record.runId === "string") reportControllers.get(record.runId)?.controller.abort()
    sendResponse({ ok: true })
    return
  }
  if (record.type === "REPORTS_SESSION_STATUS") {
    sendResponse({ ok: true, ...sellerCentralSessionStatus() })
    return
  }
  if (record.type === "SCRAPE_CASES") {
    const caseIds = Array.isArray(record.caseIds)
      ? record.caseIds.filter((id): id is string => typeof id === "string")
      : []
    void scrapeCasesFromPage(caseIds, typeof record.runId === "string" ? record.runId : undefined).then(sendResponse)
    return true
  }
  if (record.type === "BULK_REMOVAL_RESOLVE") {
    const skus = Array.isArray(record.skus) ? record.skus.filter((sku): sku is string => typeof sku === "string") : []
    void resolveBulkRemovalFromPage(skus).then(sendResponse)
    return true
  }
  const fetcher = typeof record.type === "string" && Object.hasOwn(REPORT_FETCHERS, record.type)
    ? REPORT_FETCHERS[record.type]
    : undefined
  if (!fetcher) return undefined
  const runId = typeof record.runId === "string" ? record.runId : undefined
  void runReportFetcher(fetcher, runId).then(sendResponse)
  return true
}

if (typeof window !== "undefined" && window.top === window && typeof chrome !== "undefined") {
  if (chrome.runtime?.id) setLogSink(forwardLogsToBackground())
  chrome.runtime?.onMessage?.addListener(handleSellerCentralMessage)
}
