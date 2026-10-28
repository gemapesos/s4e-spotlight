/** The running store switch: its state in session storage, its logs, and its debugger session. */
import { ACTIVE_JOB_STORAGE_KEY, type CredentialRecord, type StoreRecord } from "@/lib/accounts"
import { createLogger, type LogData } from "@/lib/log"
import { assertSwitchOperationCurrent } from "../operations"
import { SELLER_CENTRAL_HOME_URL } from "../sellerCentralTabs"
import { isOwnSender } from "../senders"
import { getUnlockedVault } from "../vault"

const log = createLogger("background")

export const ACTIVE_JOB_TTL_MS = 15 * 60 * 1000
/** "Switched to …" stays on the finished tab, across its reloads, until the user dismisses it. */
export const SWITCH_NOTICE_KEY = "accountsSwitchNotice"
export interface SwitchNotice { tabId: number; storeName: string }
export interface ActiveJob {
  id: string
  tabId: number
  storeId: string
  /** For logs only; the vault stays the source of truth. */
  storeName?: string
  stage: "logout" | "signin" | "email" | "password" | "otp" | "store" | "authenticated" | "paused"
  startedAt: number
  /** True when this job created the tab; cancel/failure must not close reused SC tabs. */
  ownsTab: boolean
  helperWindowId?: number
  returnWindowId?: number
  /** Where the switch was started; reloaded into the store if it shows Seller Central. */
  sourceTabId?: number
  incognito?: boolean
  /** False while a same-credential switch only opens the store URL; true once it signs in. */
  signIn?: boolean
  /** The login document cannot also confirm the subsequent store navigation. */
  storeNavigationDocumentId?: string
  resumeStage?: ActiveJob["stage"]
  attentionMessage?: string
  /** TOTP time step of the last code issued, so a retry never repeats a rejected code. */
  otpCounter?: number
  otpAttempts?: number
  /** Signed out by dropping cookies; if Amazon still knows the old session, use its sign-out page. */
  cookieSignOut?: boolean
  /** The still-signed-in page that triggered the fallback; it must not skip the sign-out it started. */
  signOutFallbackFrom?: string
}

let startSwitchLock: Promise<void> = Promise.resolve()
export async function closeOwnedSwitchTab(job?: ActiveJob): Promise<void> {
  if (job?.ownsTab && job.tabId >= 0) {
    if (job.helperWindowId !== undefined) {
      try {
        if ((await chrome.tabs.get(job.tabId)).windowId !== job.helperWindowId) return
      } catch { return }
    }
    // Closing its sole tab also closes the helper window. Other user-added tabs survive.
    try { await chrome.tabs.remove(job.tabId) } catch { /* already closed */ }
  }
}

export async function getSwitchNotice(): Promise<SwitchNotice | undefined> {
  return (await chrome.storage.session.get(SWITCH_NOTICE_KEY))[SWITCH_NOTICE_KEY] as SwitchNotice | undefined
}

export function jobLog(job: ActiveJob) {
  return log.withRun(job.id)
}

export function jobContext(job: ActiveJob): LogData {
  return { store: job.storeName ?? job.storeId, stage: job.stage, elapsedMs: Date.now() - job.startedAt }
}

export async function getActiveJob(): Promise<ActiveJob | undefined> {
  const job = (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY] as ActiveJob | undefined
  if (job && Date.now() - job.startedAt >= ACTIVE_JOB_TTL_MS) {
    jobLog(job).warn("account.switch.expired", jobContext(job))
    await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
    await closeOwnedSwitchTab(job)
    return undefined
  }
  return job
}
export async function setActiveJob(job?: ActiveJob): Promise<void> {
  assertSwitchOperationCurrent()
  // Clicks happen only while signing in; detach once the job ends, pauses for the user, or moves tabs.
  if (!job || job.tabId !== debuggerTabId || job.stage === "paused" || job.stage === "store") await detachSwitchDebugger()
  if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job })
  else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
}

/** Moves a job to `stage`, logging the transition once. */
export async function setJobStage(job: ActiveJob, stage: ActiveJob["stage"]): Promise<void> {
  if (job.stage !== stage) jobLog(job).info("account.switch.stage", { ...jobContext(job), stage, from: job.stage })
  job.stage = stage
  if (stage !== "paused") { delete job.resumeStage; delete job.attentionMessage }
  await setActiveJob(job)
}

export async function serializeSwitchStart<T>(action: () => Promise<T>): Promise<T> {
  const previous = startSwitchLock
  let release!: () => void
  startSwitchLock = new Promise<void>((resolve) => { release = resolve })
  await previous
  try { return await action() } finally { release() }
}
export async function assertWorkflowSender(sender: chrome.runtime.MessageSender, jobId: unknown): Promise<ActiveJob> {
  const job = await getActiveJob()
  if (!job || job.id !== jobId || sender.tab?.id !== job.tabId) throw new Error("This login workflow is no longer authorized.")
  if (!isOwnSender(sender) || sender.frameId !== 0 || !sender.documentId || !sender.url || new URL(sender.url).origin !== SELLER_CENTRAL_HOME_URL.slice(0, -1)) {
    throw new Error("Unexpected login origin or frame.")
  }
  const tab = await chrome.tabs.get(job.tabId)
  if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com") throw new Error("The login tab has navigated away.")
  if (sender.documentLifecycle && sender.documentLifecycle !== "active") throw new Error("The login document is no longer active.")
  const alive = await chrome.tabs.sendMessage(job.tabId, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: sender.documentId }) as { ok?: boolean } | undefined
  if (!alive?.ok) throw new Error("The login document has navigated away.")
  assertSwitchOperationCurrent()
  return job
}
export async function getJobRecords(job: ActiveJob): Promise<{ store: StoreRecord; credential: CredentialRecord }> {
  const { vault } = await getUnlockedVault()
  const store = vault.stores.find(({ id }) => id === job.storeId)
  const credential = store && vault.credentials.find(({ id }) => id === store.credentialId)
  if (!store || !credential) throw new Error("The selected account no longer exists.")
  return { store, credential }
}

/** The login tab the debugger stays attached to between clicks; attaching costs a round trip per step. */
let debuggerTabId: number | undefined

export async function withJobDebugger<T>(
  job: ActiveJob,
  action: (target: chrome.debugger.Debuggee) => Promise<T>,
): Promise<T> {
  const target = { tabId: job.tabId }
  try {
    assertSwitchOperationCurrent()
    const tab = await chrome.tabs.get(job.tabId)
    if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com" || !new URL(tab.url).pathname.startsWith("/ap/")) throw new Error("The login tab has navigated away.")
    if (debuggerTabId !== job.tabId) {
      await detachSwitchDebugger()
      try {
        await chrome.debugger.attach(target, "1.3")
      } catch (error) {
        // A restarted service worker forgets a session Chrome still holds for this tab.
        if (!String((error as Error)?.message ?? error).includes("already attached")) throw error
      }
      debuggerTabId = job.tabId
    }
    assertSwitchOperationCurrent()
    return await action(target)
  } catch (error) {
    await detachSwitchDebugger()
    throw error
  }
}

/** Ends the switch's debugging session, and with it Chrome's debugging bar. */
async function detachSwitchDebugger(): Promise<void> {
  const tabId = debuggerTabId
  if (tabId === undefined) return
  debuggerTabId = undefined
  try { await chrome.debugger.detach({ tabId }) } catch { /* already detached */ }
}

/** Reuses the switch's debugger session, or attaches just for `action`, so its debugging bar only flashes. */
export async function withTabDebugger<T>(tabId: number, action: (target: chrome.debugger.Debuggee) => Promise<T>): Promise<T> {
  const target = { tabId }
  const attachedHere = debuggerTabId !== tabId
  if (attachedHere) await chrome.debugger.attach(target, "1.3")
  try {
    return await action(target)
  } finally {
    if (attachedHere) try { await chrome.debugger.detach(target) } catch { /* already detached */ }
  }
}

/** The user can end the session from Chrome's debugging bar; the next click reattaches. */
export function forgetDebuggerSession(tabId?: number): void {
  if (tabId === debuggerTabId) debuggerTabId = undefined
}
