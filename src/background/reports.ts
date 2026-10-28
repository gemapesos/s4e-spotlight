/** Report and case-scrape runs the workspace starts: each runs on one Seller Central tab for one page. */
import { createLogger, describeError } from "@/lib/log"
import { MAX_BULK_IDS, type BackgroundReply } from "@/shared/messages"
import { normalizeCaseIds } from "./openTabs"
import { ensureSellerCentralTab, probeSellerCentralSession, sendWhenContentScriptReady, waitForTabComplete } from "./sellerCentralTabs"
import { isOwnSender, isPageSender } from "./senders"
import { getActiveJob } from "./switch/job"
import { requireWorkspaceSender, RESULTS_LAUNCH_PREFIX } from "./workspace"

const log = createLogger("background")

const RESULTS_RUN_PREFIX = "resultsRun:"
export const RESULTS_RUN_TTL_MS = 30 * 60 * 1000
interface ResultsRun {
  id: string
  ownerTabId: number
  ownerDocumentId: string
  sellerCentralTabId: number
  sellerCentralUrl: string
  startedAt: number
  allowed: string[]
  claimed: string[]
  caseIds: string[]
}
let resultControls: Promise<unknown> = Promise.resolve()
const resultsNavigationEpoch = new Map<number, number>()

function observeResultsTab(tabId: number): number {
  if (!resultsNavigationEpoch.has(tabId)) resultsNavigationEpoch.set(tabId, 0)
  return resultsNavigationEpoch.get(tabId)!
}

function serializeResultControl<T>(action: () => Promise<T>): Promise<T> {
  const result = resultControls.catch(() => undefined).then(action)
  resultControls = result.catch(() => undefined)
  return result
}

async function readResultsRun(id: unknown): Promise<ResultsRun | undefined> {
  if (typeof id !== "string" || !/^[a-f\d-]{36}$/iu.test(id)) return undefined
  const key = `${RESULTS_RUN_PREFIX}${id}`
  const run = (await chrome.storage.session.get(key))[key] as ResultsRun | undefined
  if (run && Date.now() - run.startedAt >= RESULTS_RUN_TTL_MS) {
    await chrome.storage.session.remove(key)
    return undefined
  }
  return run
}

async function assertResultsRun(id: unknown, sender: chrome.runtime.MessageSender): Promise<ResultsRun> {
  if (!isPageSender(sender, "results.html") || !sender.documentId) throw new Error("Open this action from the Results page.")
  const run = await readResultsRun(id)
  if (!run || run.ownerTabId !== sender.tab?.id || run.ownerDocumentId !== sender.documentId) {
    throw new Error("This report is no longer authorized. Start it again from Results.")
  }
  const tab = await chrome.tabs.get(run.sellerCentralTabId)
  if (tab.url !== run.sellerCentralUrl || new URL(tab.url).origin !== "https://sellercentral.amazon.com" || await getActiveJob()) {
    await chrome.storage.session.remove(`${RESULTS_RUN_PREFIX}${run.id}`)
    throw new Error("The Seller Central session changed. Start the report again.")
  }
  return run
}

export async function revokeResultsForTab(tabId: number, closed = false): Promise<void> {
  if (resultsNavigationEpoch.has(tabId)) {
    if (closed) resultsNavigationEpoch.delete(tabId)
    else resultsNavigationEpoch.set(tabId, resultsNavigationEpoch.get(tabId)! + 1)
  }
  return serializeResultControl(async () => {
    const stored = await chrome.storage.session.get(null)
    const runs: ResultsRun[] = []
    const keys = Object.entries(stored).filter(([key, value]) => {
      if (key.startsWith(RESULTS_RUN_PREFIX)) {
        const run = value as ResultsRun
        if (run.ownerTabId === tabId || run.sellerCentralTabId === tabId) { runs.push(run); return true }
        return false
      }
      if (closed && key.startsWith(RESULTS_LAUNCH_PREFIX)) return (value as { tabId?: number }).tabId === tabId
      return false
    }).map(([key]) => key)
    if (keys.length) await chrome.storage.session.remove(keys)
    for (const run of runs) void chrome.tabs.sendMessage(run.sellerCentralTabId, { type: "REPORTS_ABORT", runId: run.id }, { frameId: 0 }).catch(() => undefined)
  })
}

export async function prepareRun(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"REPORTS_PREPARE">> {
  const owner = requireWorkspaceSender(sender)
  const ownerEpoch = observeResultsTab(owner.tabId)
  if (await getActiveJob()) throw new Error("Wait for the store switch to finish, then try again.")
  const { tabId } = await ensureSellerCentralTab(sender.tab, { focus: false })
  await waitForTabComplete(tabId)
  const sellerEpoch = observeResultsTab(tabId)
  if (!await probeSellerCentralSession(tabId)) {
    if (message.mode === "cases") throw new Error("Sign in to a store in Seller Central, then try again.")
    return { ok: true, loggedInToStore: false }
  }
  const tab = await chrome.tabs.get(tabId)
  if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com") throw new Error("The Seller Central tab has navigated away.")
  const cases = message.mode === "cases"
  const sections = Array.isArray(message.sections) ? message.sections : []
  const allowed = cases ? ["SCRAPE_CASES"] : Object.entries(REPORT_REQUESTS).filter(([, request]) => sections.includes(request.source)).map(([name]) => name)
  const caseIds = cases ? normalizeCaseIds(message.caseIds) : []
  if (allowed.length === 0 || (cases && (caseIds.length === 0 || caseIds.length > MAX_BULK_IDS))) throw new Error("Choose what to include before starting.")
  const run: ResultsRun = { id: crypto.randomUUID(), ownerTabId: owner.tabId, ownerDocumentId: owner.documentId, sellerCentralTabId: tabId, sellerCentralUrl: tab.url, startedAt: Date.now(), allowed, claimed: [], caseIds }
  await serializeResultControl(async () => {
    const alive = await chrome.tabs.sendMessage(run.ownerTabId, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: run.ownerDocumentId }) as { ok?: boolean } | undefined
    if (!alive?.ok || resultsNavigationEpoch.get(run.ownerTabId) !== ownerEpoch || resultsNavigationEpoch.get(tabId) !== sellerEpoch) {
      throw new Error("A report tab changed while preparing. Start the report again.")
    }
    if (await getActiveJob()) throw new Error("Wait for the store switch to finish, then try again.")
    await chrome.storage.session.set({ [`${RESULTS_RUN_PREFIX}${run.id}`]: run })
  })
  return { ok: true, runId: run.id }
}

/** Cancels or finishes a run; the Seller Central tab stops any request still going. */
export function endRun(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<{ ok: true }> {
  const owner = requireWorkspaceSender(sender)
  return serializeResultControl(async () => {
    const run = await readResultsRun(message.runId)
    if (run && (run.ownerTabId !== owner.tabId || run.ownerDocumentId !== owner.documentId)) throw new Error("This report belongs to another Results page.")
    if (run) {
      await chrome.storage.session.remove(`${RESULTS_RUN_PREFIX}${run.id}`)
      void chrome.tabs.sendMessage(run.sellerCentralTabId, { type: "REPORTS_ABORT", runId: run.id }, { frameId: 0 }).catch(() => undefined)
    }
    return { ok: true }
  })
}

/** Raw results are only returned to a confirmed run in our own Results document, once per source. */
export function runSource<T extends ReportFetchType | "SCRAPE_CASES">(type: T) {
  return async (message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<T>> => {
    requireWorkspaceSender(sender)
    const run = await serializeResultControl(async () => {
      const current = await assertResultsRun(message.runId, sender)
      if (!current.allowed.includes(type) || current.claimed.includes(type)) throw new Error("This request was not selected or has already started.")
      current.claimed.push(type)
      await chrome.storage.session.set({ [`${RESULTS_RUN_PREFIX}${current.id}`]: current })
      return current
    })
    await serializeResultControl(() => assertResultsRun(run.id, sender))
    const result = type === "SCRAPE_CASES"
      ? await scrapeSellerCentralCases(run.caseIds, run.sellerCentralTabId, run.id)
      : await fetchReportSource(type as ReportFetchType, run.sellerCentralTabId, run.id)
    await serializeResultControl(() => assertResultsRun(run.id, sender))
    // The content script's reply, narrowed by its source's pick.
    return result as BackgroundReply<T>
  }
}

export type ReportFetchType =
  | "REPORTS_FETCH_UNFULFILLABLE"
  | "REPORTS_FETCH_FEEDBACK"
  | "REPORTS_FETCH_STRANDED"
  | "REPORTS_FETCH_SUPPRESSED"
  | "REPORTS_FETCH_SHIPPING_QUEUE"

interface ReportRequest {
  source: string
  fallbackError: string
  /** The fields the palette needs from the content script's response. */
  pick: (response: Record<string, unknown>) => Record<string, unknown>
}

export const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const REPORT_REQUESTS: Record<ReportFetchType, ReportRequest> = {
  REPORTS_FETCH_UNFULFILLABLE: {
    source: "unfulfillable",
    fallbackError: "Couldn’t load unfulfillable inventory.",
    pick: ({ listings, nextRemovalOrderId }) => ({
      listings: asArray(listings),
      nextRemovalOrderId: typeof nextRemovalOrderId === "string" && nextRemovalOrderId ? nextRemovalOrderId : null,
    }),
  },
  REPORTS_FETCH_FEEDBACK: {
    source: "feedback",
    fallbackError: "Couldn’t load seller feedback.",
    pick: ({ feedbacks }) => ({ feedbacks: asArray(feedbacks) }),
  },
  REPORTS_FETCH_STRANDED: {
    source: "stranded",
    fallbackError: "Couldn’t load stranded inventory.",
    pick: ({ listings }) => ({ listings: asArray(listings) }),
  },
  REPORTS_FETCH_SUPPRESSED: {
    source: "suppressed",
    fallbackError: "Couldn’t load search-suppressed inventory.",
    pick: ({ listings }) => ({ listings: asArray(listings) }),
  },
  REPORTS_FETCH_SHIPPING_QUEUE: {
    source: "shippingQueue",
    fallbackError: "Couldn’t load shipping queue.",
    pick: ({ shipments }) => ({ shipments: asArray(shipments) }),
  },
}

export function isReportFetchType(type: string): type is ReportFetchType {
  return Object.hasOwn(REPORT_REQUESTS, type)
}

/** Asks the Seller Central tab's content script for one report source. */
async function sendReportFetch(tabId: number, type: ReportFetchType, runId: string): Promise<Record<string, unknown>> {
  const request = REPORT_REQUESTS[type]
  const response = await sendWhenContentScriptReady(tabId, { type, runId }, request.fallbackError, (attempts, ms) => {
    log.withRun(runId).info("report.contentScriptWait", { source: request.source, attempts, ms })
  })
  return { ok: true, ...request.pick(response) }
}

async function fetchReportSource(type: ReportFetchType, tabId: number, runId: string): Promise<Record<string, unknown>> {
  const source = REPORT_REQUESTS[type].source
  const done = log.withRun(runId).time("report.source", { source })
  try {
    await waitForTabComplete(tabId)
    const result = await sendReportFetch(tabId, type, runId)
    const items = Object.values(result).find(Array.isArray)
    done({ count: items?.length ?? 0 })
    return result
  } catch (error) {
    done({ error: describeError(error) }, "error")
    throw error
  }
}

export async function relayAuthorizedReportProgress(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<{ ok: true }> {
  if (!isOwnSender(sender) || sender.frameId !== 0 || !sender.url || new URL(sender.url).origin !== "https://sellercentral.amazon.com") return { ok: true }
  const run = await readResultsRun(message.runId)
  if (!run || run.sellerCentralTabId !== sender.tab?.id) return { ok: true }
  try {
    await chrome.tabs.sendMessage(run.ownerTabId, message, { documentId: run.ownerDocumentId })
  } catch { /* Results may have closed. */ }
  return { ok: true }
}

export const CASE_SCRAPE_SIGN_IN_ERROR = "Sign in to Seller Central, then try again."

async function scrapeSellerCentralCases(caseIds: unknown, tabId: number, runId: string): Promise<{ ok: true; file: unknown }> {
  const ids = normalizeCaseIds(caseIds)
  if (ids.length === 0) throw new Error("Enter at least one 11-digit Case ID.")
  if (ids.length > MAX_BULK_IDS) throw new Error(`Scrape no more than ${MAX_BULK_IDS} cases at a time.`)
  const done = log.time("case.scrape", { requested: ids.length })
  try {
    await waitForTabComplete(tabId)
    const loggedIn = await probeSellerCentralSession(tabId)
    if (!loggedIn) throw new Error(CASE_SCRAPE_SIGN_IN_ERROR)
    const response = await chrome.tabs.sendMessage(tabId, { type: "SCRAPE_CASES", caseIds: ids, runId }, { frameId: 0 }) as {
      ok?: boolean
      error?: string
      file?: unknown
    } | undefined
    if (!response?.ok || !response.file || typeof response.file !== "object") {
      throw new Error(typeof response?.error === "string" ? response.error : "Couldn’t scrape cases.")
    }
    const file = response.file as { cases?: unknown; errors?: unknown }
    done({
      cases: Array.isArray(file.cases) ? file.cases.length : 0,
      errors: Array.isArray(file.errors) ? file.errors.length : 0,
    })
    return { ok: true, file: response.file }
  } catch (error) {
    done({ error: describeError(error) }, "error")
    throw error
  }
}
