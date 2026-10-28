/** The workspace window (results.html): opening it and handing it what to show. */
import { type WorkspaceMode } from "@/shared/messages"
import { waitForTabCompleteMatching } from "./sellerCentralTabs"

export const RESULTS_LAUNCH_PREFIX = "resultsLaunch:"
/**
 * The workspace window is results.html opened as a small Chrome popup window. Reports, case
 * scrapes and unlocking run there, away from web pages; one window is reused for every launch.
 */
const WORKSPACE_WINDOW_KEY = "workspaceWindow"
const WORKSPACE_WIDTH = 440
const WORKSPACE_HEIGHT = 680
const WORKSPACE_LOAD_TIMEOUT_MS = 5_000
export interface WorkspaceLaunch {
  tabId: number
  mode: WorkspaceMode
  caseIds: string[]
  startedAt: number
  /** An unlock the palette asked for; the window resumes this store switch once unlocked. */
  resumeId?: string
  storeName?: string
}
interface WorkspaceWindow { windowId: number; tabId: number }
let workspaceOpening: Promise<unknown> = Promise.resolve()

export function serializeWorkspace<T>(action: () => Promise<T>): Promise<T> {
  const result = workspaceOpening.catch(() => undefined).then(action)
  workspaceOpening = result.catch(() => undefined)
  return result
}

async function openWorkspaceWindowRecord(): Promise<WorkspaceWindow | undefined> {
  const stored = (await chrome.storage.session.get(WORKSPACE_WINDOW_KEY))[WORKSPACE_WINDOW_KEY] as WorkspaceWindow | undefined
  if (!stored) return undefined
  try {
    const tab = await chrome.tabs.get(stored.tabId)
    if (tab.windowId === stored.windowId) return stored
  } catch { /* the window was closed */ }
  await chrome.storage.session.remove(WORKSPACE_WINDOW_KEY)
  return undefined
}

/** Centers the new window over the one it was opened from. */
async function workspacePosition(source?: chrome.tabs.Tab): Promise<{ left?: number; top?: number }> {
  if (source?.windowId === undefined) return {}
  try {
    const window = await chrome.windows.get(source.windowId)
    if (window.left === undefined || window.top === undefined || window.width === undefined) return {}
    return { left: Math.round(window.left + Math.max(0, (window.width - WORKSPACE_WIDTH) / 2)), top: Math.round(window.top + 72) }
  } catch { return {} }
}

/**
 * Shows a launch in the workspace window, reusing an open one. `commit` runs with the window's tab
 * before the page can ask for the launch, so a handoff that names that tab is already stored.
 */
export async function openWorkspace(
  launch: Omit<WorkspaceLaunch, "tabId" | "startedAt">,
  source?: chrome.tabs.Tab,
  commit?: (tabId: number, created: boolean) => Promise<void>,
): Promise<{ tabId: number; created: boolean }> {
  const launchId = crypto.randomUUID()
  const launchRecord = (tabId: number) => ({ [`${RESULTS_LAUNCH_PREFIX}${launchId}`]: { ...launch, tabId, startedAt: Date.now() } satisfies WorkspaceLaunch })
  const pageUrl = `${chrome.runtime.getURL("results.html")}?launch=${launchId}`
  const existing = await openWorkspaceWindowRecord()
  if (existing) {
    await chrome.storage.session.set(launchRecord(existing.tabId))
    await commit?.(existing.tabId, false)
    // The open page switches to the launch itself, keeping any run in its other tabs.
    const shown = await chrome.tabs.sendMessage(existing.tabId, { type: "RESULTS_SHOW", launchId }).catch(() => undefined) as { ok?: boolean } | undefined
    if (!shown?.ok) await chrome.tabs.update(existing.tabId, { url: pageUrl })
    await chrome.windows.update(existing.windowId, { focused: true })
    return { tabId: existing.tabId, created: false }
  }
  // A window that opens focused on about:blank puts focus in its location bar, and navigating it
  // with chrome.tabs.update never moves focus to the page, so no field in it can take typing.
  // Open it unfocused and focus it once the page has loaded.
  const created = await chrome.windows.create({
    type: "popup",
    url: "about:blank",
    focused: false,
    width: WORKSPACE_WIDTH,
    height: WORKSPACE_HEIGHT,
    ...(await workspacePosition(source)),
  })
  const windowId = created?.id
  const tabId = created?.tabs?.[0]?.id ?? (windowId === undefined ? undefined : (await chrome.tabs.query({ windowId }))[0]?.id)
  if (windowId === undefined || tabId === undefined) throw new Error("Chrome could not open the S4E Spotlight window.")
  await chrome.storage.session.set({ ...launchRecord(tabId), [WORKSPACE_WINDOW_KEY]: { windowId, tabId } satisfies WorkspaceWindow })
  await commit?.(tabId, true)
  // Initial navigation must not race RESULTS_INIT or revoke the launch handoff.
  await chrome.tabs.update(tabId, { url: pageUrl })
  // Show the window even if the load wait times out, rather than leaving it behind.
  void waitForTabCompleteMatching(tabId, (url) => url === pageUrl, WORKSPACE_LOAD_TIMEOUT_MS)
    .catch(() => undefined)
    .then(() => chrome.windows.update(windowId, { focused: true }))
    .catch(() => undefined)
  return { tabId, created: true }
}
