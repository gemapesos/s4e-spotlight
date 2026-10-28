/** Account messages from pages and the sign-in automation: who may send each, and its handling. */
import { type AccountVault, ACTIVE_JOB_STORAGE_KEY, CURRENT_STORE_KEY, decryptSharedVault, decryptVault, emptyVault, encryptSharedVault, encryptVault, generateTotp, mergeVaults, parseOtpAuthUri, publicStoreIndex, serializeKey, SESSION_KEY_STORAGE_KEY, STORE_INDEX_KEY, type StoreIndexRecord, type StoreRecord, VAULT_STORAGE_KEY } from "@/lib/accounts"
import { createLogger, describeError } from "@/lib/log"
import { assertSwitchOperationCurrent, assertVaultOperationCurrent, invalidateSwitchOperations, invalidateVaultOperations, operationGeneration, operationSwitchGeneration, queueVaultOperation, switchGeneration, vaultGeneration } from "./operations"
import { focusOrOpenSellerCentralTab } from "./sellerCentralTabs"
import { isOwnSender, isPageSender, requireSenderTab } from "./senders"
import { ACTIVE_JOB_TTL_MS, type ActiveJob, assertWorkflowSender, closeOwnedSwitchTab, getActiveJob, getJobRecords, getSwitchNotice, jobContext, jobLog, serializeSwitchStart, setActiveJob, setJobStage, SWITCH_NOTICE_KEY, withJobDebugger } from "./switch/job"
import { advanceLogoutToSignIn, openStoreAfterSignIn, signInUrlFor, signOutWithoutPages } from "./switch/signIn"
import { finishAccountSwitch, moveJobToUserTab, pauseSwitch, showSwitchTab } from "./switch/tabs"
import { currentStoreFromIndex, getCurrentStoreId, getEnvelope, getSessionKey, getUnlockedVault, requireMasterPassword, requireSharePassword, saveVault, setCurrentStoreId, UNLOCK_ATTEMPTS_KEY, validateVault } from "./vault"
import { openWorkspace, serializeWorkspace } from "./workspace"

const log = createLogger("background")

export const UNLOCK_RESUME_KEY = "accountsUnlockResume"
const MAX_OTP_CODES = 2
const AUTOMATION_CLICK_ACTIONS = new Set(["continue", "password-submit", "otp-submit"])
export type ApiResponse = { ok: true; [key: string]: unknown } | { ok: false; error: string }

const VAULT_ADMIN_TYPES = new Set([
  "ACCOUNTS_CREATE", "ACCOUNTS_UNLOCK", "ACCOUNTS_GET_VAULT", "ACCOUNTS_SAVE_VAULT",
  "ACCOUNTS_EXPORT_SHARE", "ACCOUNTS_IMPORT_SHARE", "ACCOUNTS_CREATE_FROM_SHARE",
  "ACCOUNTS_CHANGE_MASTER_PASSWORD", "ACCOUNTS_RESET", "ACCOUNTS_RESUME_SWITCH",
])
/** The workspace window may take the master password and resume a switch; editing stays on Accounts. */
const WORKSPACE_VAULT_TYPES = new Set(["ACCOUNTS_UNLOCK", "ACCOUNTS_RESUME_SWITCH"])
export interface UnlockResume {
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

async function requestAccountUnlock(storeId: unknown, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
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

async function resumeAccountSwitch(id: unknown, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  const pending = (await chrome.storage.session.get(UNLOCK_RESUME_KEY))[UNLOCK_RESUME_KEY] as UnlockResume | undefined
  if (!pending || pending.id !== id || pending.accountsTabId !== sender.tab?.id || Date.now() - pending.startedAt >= ACTIVE_JOB_TTL_MS) {
    throw new Error("This store switch has expired. Select the store again from the palette.")
  }
  await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
  // Ask the original document, not a replacement page in the same tab, to confirm it still exists.
  const source = await chrome.tabs.get(pending.sourceTabId)
  const alive = await chrome.tabs.sendMessage(source.id!, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: pending.sourceDocumentId }) as { ok?: boolean } | undefined
  if (!alive?.ok) throw new Error("The original page is no longer open. Select the store again.")
  await chrome.tabs.update(source.id!, { active: true })
  const result = await handleAccountsMessageNow({ type: "ACCOUNTS_START_SWITCH", storeId: pending.storeId }, { ...sender, tab: source })
  if (result.ok) {
    void showSwitchingPalette(source.id!, pending.sourceDocumentId)
    // A window opened only for this unlock closes; one already open for other work stays, and
    // follows the switch on its Accounts tab. Either way the page
    // the switch was chosen on comes back to the front, not the sign-in window behind it.
    void (async () => {
      if (pending.closeAccounts) await chrome.tabs.remove(pending.accountsTabId).catch(() => undefined)
      if (source.windowId !== undefined) await chrome.windows.update(source.windowId, { focused: true }).catch(() => undefined)
    })()
  }
  return result.ok ? { ...result, resumed: true } : result
}

/** The page the switch was chosen on follows it, as it would had the vault been unlocked. */
async function showSwitchingPalette(tabId: number, documentId: string): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "OPEN_PALETTE", mode: "switching" }, { documentId })
  } catch { /* the page can't show the palette */ }
}

/** Serialize key/vault changes; Lock invalidates work immediately and completes after prior commits. */
export async function handleAccountsMessage(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  if (!isOwnSender(sender)) throw new Error("Unauthorized extension message.")
  const type = String(message.type)
  if (VAULT_ADMIN_TYPES.has(type) && !isPageSender(sender, "options.html")
    && !(WORKSPACE_VAULT_TYPES.has(type) && isPageSender(sender, "results.html"))) {
    throw new Error("This vault operation is only available on the Accounts page.")
  }
  if (type === "ACCOUNTS_LOCK" && !["options.html", "popup.html", "results.html"].some((page) => isPageSender(sender, page))) {
    throw new Error("Lock accounts from an extension page.")
  }
  if (type === "ACCOUNTS_STATUS" || type === "ACCOUNT_AUTOMATION_GET_JOB" || type === "ACCOUNTS_OPEN_OPTIONS"
    || type === "ACCOUNTS_SWITCH_NOTICE" || type === "ACCOUNTS_SWITCH_NOTICE_DISMISS") {
    return handleAccountsMessageNow(message, sender)
  }
  if (type === "ACCOUNTS_LOCK" || type === "ACCOUNTS_RESET" || type === "ACCOUNTS_CHANGE_MASTER_PASSWORD") invalidateVaultOperations()
  if (type === "ACCOUNTS_CANCEL_SWITCH") invalidateSwitchOperations()
  return queueVaultOperation(() => handleAccountsMessageNow(message, sender))
}

/** All store switches run in an unfocused, normal window until verified or needing input. */
async function startSignInSwitch(store: StoreRecord, sender: chrome.runtime.MessageSender, sameCredential = false): Promise<ApiResponse> {
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

async function handleAccountsMessageNow(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  switch (message.type) {
    case "ACCOUNTS_REQUEST_UNLOCK":
      return requestAccountUnlock(message.storeId, sender)
    case "ACCOUNTS_STATUS": {
      const [envelope, key, stored] = await Promise.all([
        getEnvelope(),
        getSessionKey(),
        chrome.storage.local.get([STORE_INDEX_KEY, CURRENT_STORE_KEY]),
      ])
      const stores = (stored[STORE_INDEX_KEY] ?? []) as StoreIndexRecord[]
      const currentStoreId = typeof stored[CURRENT_STORE_KEY] === "string" ? stored[CURRENT_STORE_KEY] : undefined
      const job = await getActiveJob()
      const activeStore = job ? stores.find((store) => store.id === job.storeId) : undefined
      return {
        ok: true,
        initialized: Boolean(envelope),
        unlocked: Boolean(key),
        stores,
        currentStore: currentStoreFromIndex(stores, currentStoreId),
        activeSwitch: job
          ? {
            storeId: job.storeId,
            storeName: activeStore?.name ?? "Selected store",
            stage: job.stage,
            startedAt: job.startedAt,
            signIn: Boolean(job.signIn),
            ...(job.resumeStage ? { resumeStage: job.resumeStage } : {}),
            ...(job.attentionMessage ? { attentionMessage: job.attentionMessage } : {}),
          }
          : undefined,
      }
    }
    case "ACCOUNTS_CREATE": {
      if (await getEnvelope()) throw new Error("The account vault already exists.")
      const masterPassword = requireMasterPassword(message.masterPassword)
      const done = log.time("vault.create")
      const { envelope, keyBytes } = await encryptVault(emptyVault(), masterPassword)
      assertVaultOperationCurrent()
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: [] })
      await chrome.storage.local.remove(CURRENT_STORE_KEY)
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      done()
      return { ok: true }
    }
    case "ACCOUNTS_UNLOCK": {
      const envelope = await getEnvelope()
      if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.")
      const attempts = (await chrome.storage.session.get(UNLOCK_ATTEMPTS_KEY))[UNLOCK_ATTEMPTS_KEY] as { failures: number; nextAttemptAt: number } | undefined
      if (attempts && attempts.nextAttemptAt > Date.now()) throw new Error(`Try unlocking again in ${Math.ceil((attempts.nextAttemptAt - Date.now()) / 1000)} seconds.`)
      const done = log.time("vault.unlock")
      try {
        const { keyBytes } = await decryptVault(envelope, message.masterPassword)
        assertVaultOperationCurrent()
        await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
        await chrome.storage.session.remove(UNLOCK_ATTEMPTS_KEY)
      } catch (error) {
        assertVaultOperationCurrent()
        const failures = Math.min(9, (attempts?.failures ?? 0) + 1)
        const delay = failures < 3 ? 0 : Math.min(60_000, 1000 * 2 ** (failures - 3))
        await chrome.storage.session.set({ [UNLOCK_ATTEMPTS_KEY]: { failures, nextAttemptAt: Date.now() + delay } })
        done({ ok: false }, "warn")
        throw new Error("Incorrect master password or damaged vault.")
      }
      done({ ok: true })
      return { ok: true }
    }
    case "ACCOUNTS_LOCK": {
      const job = await getActiveJob()
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY, UNLOCK_RESUME_KEY])
      await closeOwnedSwitchTab(job)
      log.info("vault.lock")
      return { ok: true }
    }
    case "ACCOUNTS_GET_VAULT": {
      const { vault } = await getUnlockedVault()
      return { ok: true, vault }
    }
    case "ACCOUNTS_SAVE_VAULT": {
      const current = await getUnlockedVault()
      const vault = message.vault as AccountVault
      await saveVault(vault, current.envelope, current.key)
      log.info("vault.save", { stores: vault.stores.length, credentials: vault.credentials.length })
      return { ok: true }
    }
    case "ACCOUNTS_EXPORT_SHARE": {
      const { vault } = await getUnlockedVault()
      const sharePassword = requireSharePassword(message.sharePassword)
      const file = await encryptSharedVault(vault, sharePassword)
      log.info("vault.share.export", { stores: vault.stores.length, credentials: vault.credentials.length })
      return { ok: true, file }
    }
    case "ACCOUNTS_IMPORT_SHARE": {
      const current = await getUnlockedVault()
      const sharePassword = requireSharePassword(message.sharePassword)
      const incoming = await decryptSharedVault(message.file, sharePassword)
      validateVault(incoming)
      const merged = mergeVaults(current.vault, incoming)
      validateVault(merged.vault)
      await saveVault(merged.vault, current.envelope, current.key)
      log.info("vault.share.import", {
        addedCredentials: merged.added.credentials,
        addedStores: merged.added.stores,
        updatedCredentials: merged.updated.credentials,
        updatedStores: merged.updated.stores,
      })
      return { ok: true, vault: merged.vault, added: merged.added, updated: merged.updated }
    }
    case "ACCOUNTS_CREATE_FROM_SHARE": {
      if (await getEnvelope()) throw new Error("The account vault already exists.")
      const sharePassword = requireSharePassword(message.sharePassword)
      const masterPassword = requireMasterPassword(message.masterPassword)
      const vault = await decryptSharedVault(message.file, sharePassword)
      validateVault(vault)
      const done = log.time("vault.share.create")
      const { envelope, keyBytes } = await encryptVault(vault, masterPassword)
      assertVaultOperationCurrent()
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: publicStoreIndex(vault) })
      await chrome.storage.local.remove(CURRENT_STORE_KEY)
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      done({ stores: vault.stores.length, credentials: vault.credentials.length })
      return { ok: true }
    }
    case "ACCOUNTS_CHANGE_MASTER_PASSWORD": {
      const { vault } = await getUnlockedVault()
      const masterPassword = requireMasterPassword(message.masterPassword)
      const { envelope, keyBytes } = await encryptVault(vault, masterPassword)
      assertVaultOperationCurrent()
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope })
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
      log.info("vault.changePassword")
      return { ok: true }
    }
    case "ACCOUNTS_RESET": {
      const job = await getActiveJob()
      await chrome.storage.local.remove([VAULT_STORAGE_KEY, STORE_INDEX_KEY, CURRENT_STORE_KEY])
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY, UNLOCK_RESUME_KEY, UNLOCK_ATTEMPTS_KEY, SWITCH_NOTICE_KEY])
      await closeOwnedSwitchTab(job)
      log.warn("vault.reset")
      return { ok: true }
    }
    case "ACCOUNTS_OPEN_OPTIONS":
      await chrome.runtime.openOptionsPage()
      return { ok: true }
    case "ACCOUNTS_RESUME_SWITCH":
      return resumeAccountSwitch(message.resumeId, sender)
    case "ACCOUNTS_START_SWITCH": {
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
    case "ACCOUNTS_FOCUS_CURRENT_STORE": {
      if (!(await getCurrentStoreId())) throw new Error("No store is currently selected.")
      return focusOrOpenSellerCentralTab(sender.tab)
    }
    case "ACCOUNTS_SWITCH_NOTICE": {
      const notice = await getSwitchNotice()
      if (!notice || notice.tabId !== sender.tab?.id || sender.frameId !== 0) return { ok: true }
      return { ok: true, storeName: notice.storeName }
    }
    case "ACCOUNTS_SWITCH_NOTICE_DISMISS": {
      const notice = await getSwitchNotice()
      if (notice && notice.tabId === sender.tab?.id) await chrome.storage.session.remove(SWITCH_NOTICE_KEY)
      return { ok: true }
    }
    case "ACCOUNTS_FOCUS_SWITCH": {
      const job = await getActiveJob()
      if (!job || job.tabId < 0) throw new Error("No account switch is running.")
      await showSwitchTab(job)
      return { ok: true }
    }
    case "ACCOUNTS_CANCEL_SWITCH": {
      const job = await getActiveJob()
      if (!job) return { ok: true }
      await setActiveJob(undefined)
      await closeOwnedSwitchTab(job)
      jobLog(job).info("account.switch.cancelled", jobContext(job))
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_GET_JOB": {
      const job = await getActiveJob()
      if (!job || sender.tab?.id !== job.tabId || sender.frameId !== 0 || !sender.documentId || !sender.url || new URL(sender.url).origin !== "https://sellercentral.amazon.com") return { ok: true, job: null }
      return { ok: true, job: { id: job.id, stage: job.stage, ...(job.resumeStage ? { resumeStage: job.resumeStage } : {}) } }
    }
    case "ACCOUNT_AUTOMATION_SECRET": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if (!sender.url || !new URL(sender.url).pathname.startsWith("/ap/")) throw new Error("Credentials are only available on an Amazon sign-in page.")
      const stage = job.resumeStage ?? job.stage
      if (stage === "logout" || stage === "store" || stage === "authenticated" || new URL(sender.url).searchParams.get("openid.return_to")?.includes("/sign-out")) {
        throw new Error("Credentials are not available during this login step.")
      }
      const { credential } = await getJobRecords(job)
      if (message.kind === "email") {
        await setJobStage(job, "email")
        return { ok: true, value: credential.domain }
      }
      if (message.kind === "password") {
        await setJobStage(job, "password")
        return { ok: true, value: credential.password }
      }
      if (message.kind === "otp") {
        // Submit at once, even late in a time step: RFC 6238 verifiers accept the previous step.
        // A rejected code is retried once with a later step's code, never the same one.
        const attempts = job.otpAttempts ?? 0
        if (attempts >= MAX_OTP_CODES || (message.retry === true && attempts === 0)) {
          throw new Error("Amazon rejected the verification code. Check the saved authenticator key or this computer's clock.")
        }
        const { period } = parseOtpAuthUri(credential.otpAuthUri)
        const current = Math.floor(Date.now() / 1000 / period)
        const counter = job.otpCounter === undefined ? current : Math.max(current, job.otpCounter + 1)
        if (message.retry === true) jobLog(job).warn("account.switch.otpRetry", { ...jobContext(job), stepsAhead: counter - current })
        job.otpCounter = counter
        job.otpAttempts = attempts + 1
        await setJobStage(job, "otp")
        return { ok: true, value: await generateTotp(credential.otpAuthUri, counter * period * 1000) }
      }
      throw new Error("Unknown credential stage.")
    }
    case "ACCOUNT_AUTOMATION_CLICK": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) {
        throw new Error("Unsupported login click action.")
      }
      const { x, y } = message
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
        throw new Error("Invalid login click coordinates.")
      }
      const expectedStage = { continue: "email", "password-submit": "password", "otp-submit": "otp" }[message.action]
      if (job.stage !== expectedStage) throw new Error("This click does not match the current login step.")
      await withJobDebugger(job, async (target) => {
        const send = (type: string, extra: Record<string, unknown> = {}) => {
          assertSwitchOperationCurrent()
          return chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type, x, y, ...extra })
        }
        await send("mouseMoved")
        await send("mousePressed", { button: "left", clickCount: 1 })
        await send("mouseReleased", { button: "left", clickCount: 1 })
      })
      jobLog(job).info("account.switch.click", { ...jobContext(job), action: message.action })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_PAUSED": {
      const job = await assertWorkflowSender(sender, message.jobId)
      const reason = typeof message.reason === "string" ? message.reason : "captcha"
      await pauseSwitch(job, reason)
      jobLog(job).warn("account.switch.paused", { ...jobContext(job), reason })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_LEAVE_LOGOUT": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if ((job.resumeStage ?? job.stage) !== "logout" || sender.url === job.signOutFallbackFrom) return { ok: true }
      await advanceLogoutToSignIn(job)
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_COMPLETE": {
      const job = await assertWorkflowSender(sender, message.jobId)
      await openStoreAfterSignIn(job, sender.url, sender.documentId)
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_STORE_READY": {
      const job = await assertWorkflowSender(sender, message.jobId)
      return finishAccountSwitch(job, sender)
    }
    case "ACCOUNT_AUTOMATION_REAUTH": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if ((job.resumeStage ?? job.stage) !== "store" || !new URL(sender.url!).pathname.startsWith("/ap/")) throw new Error("Unexpected sign-in step.")
      await setCurrentStoreId(undefined)
      job.signIn = true
      job.otpAttempts = 0
      await setJobStage(job, "signin")
      await chrome.tabs.update(job.tabId, { url: signInUrlFor((await getJobRecords(job)).store.storeUrl) })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_ERROR": {
      const job = await assertWorkflowSender(sender, message.jobId)
      await pauseSwitch(job, "error")
      const error = typeof message.error === "string" ? message.error : "Unknown error."
      jobLog(job).error("account.switch.failed", { ...jobContext(job), error })
      return { ok: true }
    }
    default: throw new Error("Unknown account command.")
  }
}
