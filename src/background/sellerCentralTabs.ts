/** Finds, opens and waits for Seller Central tabs, talks to their content script, and reads their session. */
import { createLogger, errorMessage } from "@/shared/log"
import { type SellerCentralSessionState } from "@/sellerCentral/session"
import { getActiveJob } from "./switch/job"
import { sleep } from "@/shared/async"

const log = createLogger("background")

export const SELLER_CENTRAL_HOME_URL = "https://sellercentral.amazon.com/"
export const SELLER_CENTRAL_TAB_URL_PATTERN = "https://sellercentral.amazon.com/*"

let sellerCentralTabLock: Promise<void> = Promise.resolve()

export function pickSellerCentralTab(tabs: readonly chrome.tabs.Tab[], preferredWindowId?: number): chrome.tabs.Tab | undefined {
  const withId = tabs.filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined)
  return [...withId].sort((a, b) => {
    const aPreferred = a.windowId === preferredWindowId ? 1 : 0
    const bPreferred = b.windowId === preferredWindowId ? 1 : 0
    if (aPreferred !== bPreferred) return bPreferred - aPreferred
    return (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)
  })[0]
}

const TAB_LOAD_TIMEOUT_MS = 30_000
const SESSION_PROBE_TIMEOUT_MS = 15_000
const SESSION_PROBE_INTERVAL_MS = 250

export async function ensureSellerCentralTab(
  senderTab?: chrome.tabs.Tab,
  options: { focus?: boolean } = {},
): Promise<{ tabId: number; focused?: true; opened?: true }> {
  const previous = sellerCentralTabLock
  let release!: () => void
  sellerCentralTabLock = new Promise<void>((resolve) => { release = resolve })
  await previous
  try {
    return await ensureSellerCentralTabNow(senderTab, options)
  } finally {
    release()
  }
}

async function ensureSellerCentralTabNow(
  senderTab?: chrome.tabs.Tab,
  options: { focus?: boolean } = {},
): Promise<{ tabId: number; focused?: true; opened?: true }> {
  const focus = options.focus !== false
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const tab = pickSellerCentralTab(tabs, senderTab?.windowId)
  if (tab?.id !== undefined) {
    if (focus) {
      await chrome.tabs.update(tab.id, { active: true })
      if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
      return { tabId: tab.id, focused: true }
    }
    return { tabId: tab.id }
  }
  const created = await chrome.tabs.create({
    active: true,
    url: SELLER_CENTRAL_HOME_URL,
    ...(senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }),
  })
  if (created.id === undefined) throw new Error("Chrome did not create the Seller Central tab.")
  return { tabId: created.id, opened: true }
}

export async function focusOrOpenSellerCentralTab(senderTab?: chrome.tabs.Tab): Promise<{ ok: true; focused?: true; opened?: true }> {
  const { focused, opened } = await ensureSellerCentralTab(senderTab)
  return { ok: true, ...(focused ? { focused: true } : {}), ...(opened ? { opened: true } : {}) }
}

export async function waitForTabComplete(tabId: number, timeoutMs = TAB_LOAD_TIMEOUT_MS): Promise<void> {
  await waitForTabCompleteMatching(tabId, (url) => Boolean(url && url !== "about:blank"), timeoutMs)
}

export async function waitForTabCompleteMatching(
  tabId: number,
  urlMatches: (url?: string) => boolean,
  timeoutMs = TAB_LOAD_TIMEOUT_MS,
): Promise<void> {
  const current = await chrome.tabs.get(tabId)
  if (current.status === "complete" && urlMatches(current.url)) return

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      reject(new Error("Seller Central did not finish loading."))
    }, timeoutMs)

    function onUpdated(updatedTabId: number, changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab): void {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return
      const url = changeInfo.url ?? tab.url
      if (!urlMatches(url)) return
      clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      resolve()
    }

    chrome.tabs.onUpdated.addListener(onUpdated)
  })
}

const CONTENT_SCRIPT_MISSING = /Receiving end does not exist/i

/** Sends a message to the Seller Central tab's content script, waiting for the script to load. */
export async function sendWhenContentScriptReady(
  tabId: number,
  message: Record<string, unknown>,
  fallbackError: string,
  onWaited: (attempts: number, ms: number) => void,
): Promise<Record<string, unknown>> {
  const startedAt = Date.now()
  const deadline = startedAt + SESSION_PROBE_TIMEOUT_MS
  let lastError: string | undefined
  let attempts = 0
  while (Date.now() < deadline) {
    attempts += 1
    try {
      const response = await chrome.tabs.sendMessage(tabId, message, { frameId: 0 }) as
        Record<string, unknown> | undefined
      if (attempts > 1) onWaited(attempts, Date.now() - startedAt)
      if (response?.ok) return response
      throw new Error(typeof response?.error === "string" ? response.error : fallbackError)
    } catch (error) {
      const message = errorMessage(error, String(error))
      if (!CONTENT_SCRIPT_MISSING.test(message)) throw error instanceof Error ? error : new Error(message)
      lastError = message
    }
    await sleep(SESSION_PROBE_INTERVAL_MS)
  }
  throw new Error(lastError ?? fallbackError)
}

/** Polls a tab's content script until it reports a settled session, or the time runs out. */
async function pollSellerCentralSession(
  tabId: number,
  timeoutMs: number,
): Promise<{ loggedInToStore: boolean; settled: boolean } | undefined> {
  const deadline = Date.now() + timeoutMs
  let last: { loggedInToStore: boolean; settled: boolean } | undefined
  while (Date.now() < deadline) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_SESSION_STATUS" }, { frameId: 0 }) as {
        ok?: boolean
        loggedInToStore?: boolean
        settled?: boolean
      }
      if (response?.ok && typeof response.loggedInToStore === "boolean") {
        last = { loggedInToStore: response.loggedInToStore, settled: Boolean(response.settled) }
        if (last.settled) return last
      }
    } catch {
      /* content script may not be ready yet */
    }
    await sleep(SESSION_PROBE_INTERVAL_MS)
  }
  return last
}

export async function probeSellerCentralSession(tabId: number): Promise<boolean> {
  const last = await pollSellerCentralSession(tabId, SESSION_PROBE_TIMEOUT_MS)
  if (!last) throw new Error("Couldn’t confirm the Seller Central session.")
  if (!last.settled) log.warn("report.sessionUnsettled", { tabId, loggedInToStore: last.loggedInToStore })
  return last.loggedInToStore
}

const SESSION_CHECK_TIMEOUT_MS = 3_000
const SESSION_CHECK_MAX_TABS = 5

/**
 * Whether Seller Central is signed in, read from the tabs already open; it never opens one.
 * Tabs share cookies, so one signed-in tab is enough, and a stale sign-in page alone isn't trusted over it.
 */
export async function checkSellerCentralSession(senderTab?: chrome.tabs.Tab): Promise<SellerCentralSessionState> {
  // A switch signs out on purpose; its own screens cover that time.
  if (await getActiveJob()) return "unknown"
  const tabs = (await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN }))
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined && Boolean(tab.incognito) === Boolean(senderTab?.incognito))
    .sort((a, b) => Number(b.id === senderTab?.id) - Number(a.id === senderTab?.id) || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .slice(0, SESSION_CHECK_MAX_TABS)
  const states = await Promise.all(tabs.map((tab) => pollSellerCentralSession(tab.id, SESSION_CHECK_TIMEOUT_MS)))
  const settled = states.filter((state) => state?.settled)
  const session: SellerCentralSessionState = settled.some((state) => state!.loggedInToStore)
    ? "signed-in"
    : settled.length ? "signed-out" : "unknown"
  log.info("session.check", { session, tabs: tabs.length, settled: settled.length })
  return session
}
