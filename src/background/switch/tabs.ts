/** The tabs and windows a switch uses, and handing the finished store to the user's tab. */
import type { BackgroundReply } from "@/shared/messages"
import { assertSwitchOperationCurrent } from "@/background/operations"
import { SELLER_CENTRAL_TAB_URL_PATTERN } from "@/background/sellerCentralTabs"
import { setCurrentStoreId } from "@/background/vault"
import { type ActiveJob, assertWorkflowSender, getJobRecords, jobLog, setActiveJob, setJobStage, SWITCH_NOTICE_KEY, type SwitchNotice } from "./job"

/** Rechecks a queried tab, since it may have navigated away or closed since the query. */
async function isSellerCentralTabFor(job: ActiveJob, tabId: number): Promise<boolean> {
  let current: chrome.tabs.Tab
  try { current = await chrome.tabs.get(tabId) } catch { return false }
  return Boolean(current.url) && new URL(current.url!).origin === "https://sellercentral.amazon.com" && Boolean(current.incognito) === Boolean(job.incognito)
}

async function closeDuplicateSellerCentralTabs(job: ActiveJob, keepTabId: number): Promise<void> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  for (const tab of tabs) {
    if (tab.id === undefined || tab.id === job.tabId || tab.id === keepTabId || Boolean(tab.incognito) !== Boolean(job.incognito)) continue
    if (!await isSellerCentralTabFor(job, tab.id)) continue
    assertSwitchOperationCurrent()
    try { await chrome.tabs.remove(tab.id) } catch { /* already closed or retained by Chrome */ }
  }
}

/** The user's Seller Central tab to reload in place: the one the switch started from, else the most recent. */
async function reusableSellerCentralTab(job: ActiveJob): Promise<number | undefined> {
  const tabs = (await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN, windowType: "normal" }))
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => tab.id !== undefined && tab.id !== job.tabId && Boolean(tab.incognito) === Boolean(job.incognito))
  const rank = (tab: chrome.tabs.Tab) => (tab.id === job.sourceTabId ? 2 : 0) + (tab.windowId === job.returnWindowId ? 1 : 0)
  const ordered = [...tabs].sort((a, b) => rank(b) - rank(a) || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
  for (const tab of ordered) {
    if (await isSellerCentralTabFor(job, tab.id)) return tab.id
  }
  return undefined
}

/** Where a kept helper tab goes: beside the tab the switch started from, else at the end. */
async function indexAfterSource(job: ActiveJob, windowId: number): Promise<number> {
  if (job.sourceTabId === undefined) return -1
  try {
    const source = await chrome.tabs.get(job.sourceTabId)
    return source.windowId === windowId ? source.index + 1 : -1
  } catch { return -1 }
}

export async function showSwitchTab(job: ActiveJob): Promise<void> {
  const tab = await chrome.tabs.get(job.tabId)
  assertSwitchOperationCurrent()
  await chrome.tabs.update(job.tabId, { active: true })
  if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true, state: "normal" })
}

export async function pauseSwitch(job: ActiveJob, reason: string): Promise<void> {
  const messages: Record<string, string> = {
    captcha: "Complete the CAPTCHA in the sign-in window.",
    verification: "Complete Amazon’s verification in the sign-in window.",
    manual: "Complete sign-in manually in the sign-in window.",
    error: "Sign-in needs your attention. Review the sign-in window or cancel and retry.",
  }
  const attentionMessage = messages[reason] ?? messages.verification
  const alreadyShown = job.stage === "paused" && job.attentionMessage === attentionMessage
  if (job.stage !== "paused") job.resumeStage = job.stage
  job.attentionMessage = attentionMessage
  await setJobStage(job, "paused")
  if (!alreadyShown) await showSwitchTab(job)
}

async function switchDestinationWindow(job: ActiveJob): Promise<number | undefined> {
  if (job.returnWindowId !== undefined) {
    try {
      const window = await chrome.windows.get(job.returnWindowId)
      if (window.type === "normal" && Boolean(window.incognito) === Boolean(job.incognito)) return window.id
    } catch { /* the original window was closed */ }
  }
  const windows = await chrome.windows.getAll({ windowTypes: ["normal"] })
  return windows.find((window) => window.id !== job.helperWindowId && Boolean(window.incognito) === Boolean(job.incognito))?.id
}

/**
 * Sign-in is shared, so the user's own Seller Central tab can load the store directly: the store
 * loads once instead of in the helper and then again in their tab. Their tab keeps its place and is
 * not activated. Returns false, keeping the helper's tab, when no Seller Central tab is open.
 */
export async function moveJobToUserTab(job: ActiveJob): Promise<boolean> {
  if (!job.ownsTab) return false // already in the user's tab, e.g. signing in again there
  const userTabId = await reusableSellerCentralTab(job)
  assertSwitchOperationCurrent()
  if (userTabId === undefined) return false
  job.tabId = userTabId
  job.ownsTab = false
  return true
}

/** Finish only after the saved store URL has produced a new, loaded, signed-in document. */
export async function finishAccountSwitch(job: ActiveJob, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNT_AUTOMATION_STORE_READY">> {
  if ((job.resumeStage ?? job.stage) !== "store") throw new Error("The selected store has not loaded yet.")
  // The page that started the store navigation can still ask before it is replaced.
  if (sender.documentId === job.storeNavigationDocumentId) return { ok: true, waitMs: 500 }
  const url = new URL(sender.url!)
  if (url.pathname.startsWith("/ap/") || url.pathname.startsWith("/account-switcher/") || url.pathname.startsWith("/sign-out")) {
    throw new Error("The selected store has not loaded yet.")
  }
  // No URL comparison: Seller Central rewrites some store URLs in place (/home to /amazonsell/business),
  // which the tab's URL follows but sender.url does not. The status check below goes to this exact document.
  const tab = await chrome.tabs.get(job.tabId)
  if (tab.status !== "complete") return { ok: true, waitMs: 500 }
  const session = await chrome.tabs.sendMessage(job.tabId, { type: "REPORTS_SESSION_STATUS" }, { documentId: sender.documentId }) as { ok?: boolean; loggedInToStore?: boolean; settled?: boolean } | undefined
  assertSwitchOperationCurrent()
  if (!session?.ok || !session.loggedInToStore || !session.settled) return { ok: true, waitMs: 500 }

  // Any signed-in page passes the check above, so confirm Seller Central selected this store's merchant.
  const { store } = await getJobRecords(job)
  const expectedMerchant = new URL(store.storeUrl).searchParams.get("mons_sel_dir_mcid")
  if (expectedMerchant) {
    const selected = await chrome.tabs.sendMessage(job.tabId, { type: "SELLER_CENTRAL_SELECTED_ACCOUNT" }, { documentId: sender.documentId })
      .catch((caught: unknown) => ({ ok: false, error: String(caught) })) as { ok?: boolean; merchantId?: string; label?: string; error?: string } | undefined
    assertSwitchOperationCurrent()
    if (selected?.ok && selected.merchantId && selected.merchantId !== expectedMerchant) {
      jobLog(job).warn("account.switch.wrongStore", { store: store.name, landed: selected.label ?? "unknown" })
      throw new Error(`Seller Central opened ${selected.label ?? "a different store"} instead of ${store.name}. Check that this login can open ${store.name}, or edit its store URL.`)
    }
    // An unreadable answer must not block a real switch if Amazon changes the endpoint.
    if (!selected?.ok || !selected.merchantId) jobLog(job).warn("account.switch.storeUnverified", { store: store.name, error: selected?.error ?? "no merchant in reply" })
  }

  // A store loaded in the user's own tab is already where it belongs. Otherwise reload their tab in
  // place: it keeps its place, and neither it nor its window is activated.
  let finalTabId = job.ownsTab ? await reusableSellerCentralTab(job) : undefined
  assertSwitchOperationCurrent()
  if (finalTabId !== undefined) {
    // Recheck the store document before reloading or closing any of the user's tabs.
    await assertWorkflowSender(sender, job.id)
    await chrome.storage.session.set({ [SWITCH_NOTICE_KEY]: { tabId: finalTabId, storeName: store.name } satisfies SwitchNotice })
    try {
      await chrome.tabs.update(finalTabId, { url: store.storeUrl })
    } catch {
      finalTabId = undefined // closed meanwhile: keep the helper's tab instead
    }
  }
  if (finalTabId === undefined) {
    const destination = job.ownsTab ? await switchDestinationWindow(job) : undefined
    assertSwitchOperationCurrent()
    if (destination !== undefined && destination !== tab.windowId) {
      // Moving its only tab closes the helper window. A moved tab is not activated.
      await chrome.tabs.move(job.tabId, { windowId: destination, index: await indexAfterSource(job, destination) })
    }
    // Recheck the document after the move before replacing any existing SC tabs.
    await assertWorkflowSender(sender, job.id)
    finalTabId = job.tabId
    await chrome.storage.session.set({ [SWITCH_NOTICE_KEY]: { tabId: finalTabId, storeName: store.name } satisfies SwitchNotice })
  }
  await closeDuplicateSellerCentralTabs(job, finalTabId)
  assertSwitchOperationCurrent()
  await setCurrentStoreId(job.storeId)
  await setActiveJob(undefined)
  jobLog(job).info("account.switch.complete", { store: store.name, ms: Date.now() - job.startedAt, tab: !job.ownsTab ? "user" : finalTabId === job.tabId ? "helper" : "reloaded" })
  if (finalTabId === job.tabId) void confirmSwitchDone(job.tabId, store.name, sender.documentId)
  else try { await chrome.tabs.remove(job.tabId) } catch { /* closing its only tab closes the helper window */ }
  return { ok: true }
}

/** A loaded page asks for its notice on startup; a kept helper page is already loaded, so tell it. */
async function confirmSwitchDone(tabId: number, storeName: string, documentId?: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "ACCOUNTS_SWITCH_DONE", storeName }, { documentId })
  } catch { /* the finished page navigated or closed */ }
}
