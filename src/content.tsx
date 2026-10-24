import { fetchNeutralNegativeFeedbacks } from "./lib/feedback"
import {
  createLogger,
  createRequestMonitor,
  describeError,
  errorMessage,
  forwardLogsToBackground,
  setLogSink,
  type Logger,
} from "./lib/log"
import { isPaletteShortcut } from "./lib/shortcut"
import type { ReportProgressEvent, ReportSource } from "./lib/reportProgress"
import { sellerCentralSessionStatus } from "./lib/sellerCentralSession"
import { fetchShippingQueueShipments } from "./lib/shippingQueue"
import { fetchStrandedListings } from "./lib/stranded"
import { fetchSuppressedListings } from "./lib/suppressed"
import { fetchNextRemovalOrderId, fetchUnfulfillableListings } from "./lib/unfulfillable"
import { scrapeCases } from "./lib/viewCase"

const PALETTE_APP_FILE = "palette-app.js"
const EXTENSION_CONTEXT_INVALIDATED = "Extension context invalidated."
const PALETTE_UNSUPPORTED_PAGE = "The command palette can’t open on this page."
const contentLog = createLogger("content")

export type PaletteOpenMode = "commands" | "report-login" | "switching"

interface MountedPalette {
  setOpen: (open: boolean, mode?: PaletteOpenMode) => void
  showSwitchDone: (storeName: string) => void
}

interface PaletteAppModule {
  mountCommandPalette: () => MountedPalette | null
}

let mounted: MountedPalette | null = null
let pending: Promise<MountedPalette> | null = null

/**
 * React DOM reads document.createElement("div").style as it loads. XML documents such as feeds,
 * sitemaps, and SVG files create elements without one, so the palette runs only on HTML pages.
 */
export function canHostPalette(doc: Document = document): boolean {
  return doc.createElement("div").style !== undefined
}

export async function loadPalette(doc: Document = document): Promise<MountedPalette> {
  if (mounted) return mounted
  if (!pending) {
    if (!canHostPalette(doc)) throw new Error(PALETTE_UNSUPPORTED_PAGE)
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      throw new Error(EXTENSION_CONTEXT_INVALIDATED)
    }
    pending = import(chrome.runtime.getURL(PALETTE_APP_FILE))
      .then((mod: PaletteAppModule) => {
        mounted = mod.mountCommandPalette()
        if (!mounted) throw new Error("Could not mount the command palette.")
        return mounted
      })
      .catch((error: unknown) => {
        pending = null
        contentLog.error("palette.loadFailed", { contentType: doc.contentType, error: describeError(error) })
        throw error
      })
  }
  return pending
}

function onKeyDown(event: KeyboardEvent): void {
  handleContentKeyDown(event)
}

export function handleContentKeyDown(
  event: KeyboardEvent,
  load: () => Promise<MountedPalette> = loadPalette,
): void {
  if (!isPaletteShortcut(event)) {
    if (event.metaKey || event.ctrlKey) void load().catch(() => undefined)
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()
  window.removeEventListener("keydown", onKeyDown, true)
  void load()
    .then((palette) => {
      palette.setOpen(true)
    })
    .catch(() => {
      window.addEventListener("keydown", onKeyDown, true)
    })
}

/** A finished store switch reloads this tab; show its result until the user is back. */
export async function showSwitchNotice(load: () => Promise<MountedPalette> = loadPalette): Promise<void> {
  if (location.origin !== "https://sellercentral.amazon.com") return
  const response = await chrome.runtime.sendMessage({ type: "ACCOUNTS_SWITCH_NOTICE" }) as { ok?: boolean; storeName?: unknown } | undefined
  if (!response?.ok || typeof response.storeName !== "string") return
  ;(await load()).showSwitchDone(response.storeName)
}

function emitReportProgress(event: ReportProgressEvent, runId?: string): void {
  if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") return
  void chrome.runtime.sendMessage({ type: "REPORTS_PROGRESS", ...event, ...(runId ? { runId } : {}) }).then(
    () => undefined,
    () => undefined,
  )
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

export function handleContentMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
  load: () => Promise<MountedPalette> = loadPalette,
): boolean | undefined {
  if (!message || typeof message !== "object" || !("type" in message)) return undefined
  if (typeof chrome === "undefined" || !chrome.runtime?.id || sender.id !== chrome.runtime.id || sender.tab
    || (sender.url && sender.url !== chrome.runtime.getURL("background.js"))) {
    sendResponse({ ok: false, error: "Unauthorized extension message." })
    return undefined
  }
  const record = message as { type?: unknown; mode?: unknown; runId?: unknown; caseIds?: unknown; storeName?: unknown }
  if (record.type === "ACCOUNTS_RESUME_CHECK") { sendResponse({ ok: true }); return }
  if (record.type === "ACCOUNTS_SWITCH_DONE") {
    const storeName = typeof record.storeName === "string" ? record.storeName : "the selected store"
    void load().then((palette) => palette.showSwitchDone(storeName), () => undefined)
    sendResponse({ ok: true })
    return
  }
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
  if (record.type === "OPEN_PALETTE") {
    const mode = record.mode === "report-login" || record.mode === "switching" ? record.mode : undefined
    void load()
      .then((palette) => {
        palette.setOpen(true, mode)
      })
      .then(
        () => sendResponse({ ok: true }),
        (error: unknown) => sendResponse({
          ok: false,
          error: errorMessage(error, "Couldn’t open the command palette."),
        }),
      )
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

if (typeof window !== "undefined" && window.top === window) {
  if (canHostPalette()) window.addEventListener("keydown", onKeyDown, true)
  if (typeof chrome !== "undefined") {
    if (chrome.runtime?.id) setLogSink(forwardLogsToBackground())
    chrome.runtime?.onMessage?.addListener(handleContentMessage)
    if (chrome.runtime?.id && canHostPalette()) void showSwitchNotice().catch(() => undefined)
  }
}
