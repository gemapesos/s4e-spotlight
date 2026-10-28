/** Starting, resuming, following and cancelling a store switch from the palette and extension pages. */
import { STORE_INDEX_KEY, type StoreIndexRecord, type StoreRecord } from "@/lib/accounts"
import { describeError } from "@/lib/log"
import type { BackgroundReply } from "@/shared/messages"
import { assertSwitchOperationCurrent, assertVaultOperationCurrent, operationGeneration, operationSwitchGeneration, queueVaultOperation, switchGeneration, vaultGeneration } from "../operations"
import { focusOrOpenSellerCentralTab } from "../sellerCentralTabs"
import { requireSenderTab } from "../senders"
import { getCurrentStoreId, getUnlockedVault, setCurrentStoreId } from "../vault"
import { openWorkspace, serializeWorkspace } from "../workspace"
import { ACTIVE_JOB_TTL_MS, type ActiveJob, closeOwnedSwitchTab, getActiveJob, getSwitchNotice, jobContext, jobLog, serializeSwitchStart, setActiveJob, SWITCH_NOTICE_KEY, UNLOCK_RESUME_KEY } from "./job"
import { signOutWithoutPages } from "./signIn"
import { moveJobToUserTab, showSwitchTab } from "./tabs"

interface UnlockResume {
  id: string
  storeId: string
  sourceTabId: number
  sourceDocumentId: string
  /** The workspace window's tab, where the master password is typed. */
  accountsTabId: number
  /** The window was opened just for this unlock, so it closes once the switch starts. */
  closeAccounts?: boolean
  startedAt: number
}

export async function requestAccountUnlock(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_REQUEST_UNLOCK">> {
  const { storeId } = message
  const source = requireSenderTab(sender.tab)
  const sourceDocumentId = sender.documentId
  if (!sourceDocumentId || sender.frameId !== 0 || typeof storeId !== "string") throw new Error("Open unlock from the store picker.")
  const stored = await chrome.storage.local.get(STORE_INDEX_KEY)
  const stores = (stored[STORE_INDEX_KEY] ?? []) as StoreIndexRecord[]
  const store = stores.find((item) => item.id === storeId)
  if (!store) throw new Error("The selected store no longer exists.")
  const id = crypto.randomUUID()
  // The master password is typed in the workspace window, an extension page no website can read.
  await serializeWorkspace(() => openWorkspace({ mode: "accounts", caseIds: [], resumeId: id, storeName: store.name }, source, async (tabId, created) => {
    assertVaultOperationCurrent()
    const pending: UnlockResume = { id, storeId, sourceTabId: source.id, sourceDocumentId, accountsTabId: tabId, closeAccounts: created, startedAt: Date.now() }
    await chrome.storage.session.set({ [UNLOCK_RESUME_KEY]: pending })
    // Commit the handoff before the window can load and try to consume it.
    assertVaultOperationCurrent()
  }))
  return { ok: true }
}

export async function resumeAccountSwitch(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_RESUME_SWITCH">> {
  const pending = (await chrome.storage.session.get(UNLOCK_RESUME_KEY))[UNLOCK_RESUME_KEY] as UnlockResume | undefined
  if (!pending || pending.id !== message.resumeId || pending.accountsTabId !== sender.tab?.id || Date.now() - pending.startedAt >= ACTIVE_JOB_TTL_MS) {
    throw new Error("This store switch has expired. Select the store again from the palette.")
  }
  await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
  // Ask the original document, not a replacement page in the same tab, to confirm it still exists.
  const source = await chrome.tabs.get(pending.sourceTabId)
  const alive = await chrome.tabs.sendMessage(source.id!, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: pending.sourceDocumentId }) as { ok?: boolean } | undefined
  if (!alive?.ok) throw new Error("The original page is no longer open. Select the store again.")
  await chrome.tabs.update(source.id!, { active: true })
  const result = await startSwitch({ storeId: pending.storeId }, { ...sender, tab: source })
  void showSwitchingPalette(source.id!, pending.sourceDocumentId)
  // A window opened only for this unlock closes; one already open for other work stays, and
  // follows the switch on its Accounts tab. Either way the page
  // the switch was chosen on comes back to the front, not the sign-in window behind it.
  void (async () => {
    if (pending.closeAccounts) await chrome.tabs.remove(pending.accountsTabId).catch(() => undefined)
    if (source.windowId !== undefined) await chrome.windows.update(source.windowId, { focused: true }).catch(() => undefined)
  })()
  return { ...result, resumed: true }
}

/** The page the switch was chosen on follows it, as it would had the vault been unlocked. */
async function showSwitchingPalette(tabId: number, documentId: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "OPEN_PALETTE", mode: "switching" }, { documentId })
  } catch { /* the page can't show the palette */ }
}

export function startSwitch(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_START_SWITCH">> {
  return serializeSwitchStart(async () => {
    if (await getActiveJob()) throw new Error("Another account switch is already running.")
    const { vault } = await getUnlockedVault()
    const store = vault.stores.find(({ id }) => id === message.storeId)
    if (!store) throw new Error("The selected store was not found.")
    const currentStoreId = await getCurrentStoreId()
    const currentStore = currentStoreId ? vault.stores.find(({ id }) => id === currentStoreId) : undefined
    return startSignInSwitch(store, sender, currentStore?.credentialId === store.credentialId)
  })
}

/** All store switches run in an unfocused, normal window until verified or needing input. */
async function startSignInSwitch(store: StoreRecord, sender: chrome.runtime.MessageSender, sameCredential = false): Promise<BackgroundReply<"ACCOUNTS_START_SWITCH">> {
  const original = sender.tab?.windowId === undefined
    ? await chrome.windows.getLastFocused({ windowTypes: ["normal"] })
    : await chrome.windows.get(sender.tab.windowId)
  const incognito = Boolean(original.incognito)
  let helperWindowId: number | undefined
  let tabId: number | undefined
  try {
    assertSwitchOperationCurrent()
    const job: ActiveJob = {
      id: crypto.randomUUID(),
      tabId: -1,
      storeId: store.id,
      storeName: store.name,
      stage: sameCredential ? "store" : "logout",
      startedAt: Date.now(),
      ownsTab: true,
      returnWindowId: original.id,
      ...(sender.tab?.id === undefined ? {} : { sourceTabId: sender.tab.id }),
      incognito,
      signIn: !sameCredential,
    }
    // Without sign-in there is nothing to hide: load the store once, in the user's own tab.
    if (!sameCredential || !await moveJobToUserTab(job)) {
      const helper = await chrome.windows.create({ url: "about:blank", type: "normal", focused: false, incognito })
      helperWindowId = helper?.id
      if (helperWindowId === undefined) throw new Error("Chrome did not create the sign-in window.")
      tabId = helper?.tabs?.[0]?.id ?? (await chrome.tabs.query({ windowId: helperWindowId }))[0]?.id
      if (tabId === undefined) throw new Error("Chrome did not create the login tab.")
      job.tabId = tabId
      job.helperWindowId = helperWindowId
    }
    await setActiveJob(job)
    await chrome.storage.session.remove(SWITCH_NOTICE_KEY)
    if (!sameCredential) await setCurrentStoreId(undefined)
    assertSwitchOperationCurrent()
    if (sameCredential) await chrome.tabs.update(job.tabId, { url: store.storeUrl })
    else void queueVaultOperation(() => signOutWithoutPages(job.id)).catch((error) => jobLog(job).warn("account.switch.signOutFailed", { error: describeError(error) }))
    jobLog(job).info("account.switch.start", { store: store.name, path: sameCredential ? "same-credential" : "sign-in", tab: job.ownsTab ? "helper-window" : "user" })
    return { ok: true, jobId: job.id }
  } catch (error) {
    if (tabId !== undefined) try { await chrome.tabs.remove(tabId) } catch { /* best effort */ }
    else if (helperWindowId !== undefined) try { await chrome.windows.remove(helperWindowId) } catch { /* best effort */ }
    // Lock/Cancel owns cleanup once it invalidates this operation.
    if (operationGeneration === vaultGeneration && operationSwitchGeneration === switchGeneration) await setActiveJob(undefined)
    throw error
  }
}

export async function focusCurrentStore(_message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_FOCUS_CURRENT_STORE">> {
  if (!(await getCurrentStoreId())) throw new Error("No store is currently selected.")
  return focusOrOpenSellerCentralTab(sender.tab)
}

export async function switchNotice(_message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_SWITCH_NOTICE">> {
  const notice = await getSwitchNotice()
  if (!notice || notice.tabId !== sender.tab?.id || sender.frameId !== 0) return { ok: true }
  return { ok: true, storeName: notice.storeName }
}

export async function dismissSwitchNotice(_message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<BackgroundReply<"ACCOUNTS_SWITCH_NOTICE_DISMISS">> {
  const notice = await getSwitchNotice()
  if (notice && notice.tabId === sender.tab?.id) await chrome.storage.session.remove(SWITCH_NOTICE_KEY)
  return { ok: true }
}

export async function focusSwitch(): Promise<BackgroundReply<"ACCOUNTS_FOCUS_SWITCH">> {
  const job = await getActiveJob()
  if (!job || job.tabId < 0) throw new Error("No account switch is running.")
  await showSwitchTab(job)
  return { ok: true }
}

export async function cancelSwitch(): Promise<BackgroundReply<"ACCOUNTS_CANCEL_SWITCH">> {
  const job = await getActiveJob()
  if (!job) return { ok: true }
  await setActiveJob(undefined)
  await closeOwnedSwitchTab(job)
  jobLog(job).info("account.switch.cancelled", jobContext(job))
  return { ok: true }
}

/** A closed tab drops the unlock hand-off, notice or switch that belonged to it. */
export function forgetClosedTab(tabId: number): Promise<void> {
  return queueVaultOperation(async () => {
    const stored = await chrome.storage.session.get(UNLOCK_RESUME_KEY)
    const pending = stored[UNLOCK_RESUME_KEY] as UnlockResume | undefined
    if (pending && (pending.sourceTabId === tabId || pending.accountsTabId === tabId)) await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
    if ((await getSwitchNotice())?.tabId === tabId) await chrome.storage.session.remove(SWITCH_NOTICE_KEY)
    const job = await getActiveJob()
    if (job?.tabId !== tabId) return
    jobLog(job).warn("account.switch.tabClosed", jobContext(job))
    await setActiveJob(undefined)
  })
}
