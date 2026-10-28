/** The service worker: restricts storage, then routes messages and tab events to their handlers. */
import { createLogger, createLogStore, describeError, errorMessage, LOG_ENTRIES_MESSAGE, LOGS_CLEAR_MESSAGE, LOGS_GET_MESSAGE, setLogSink } from "@/lib/log"
import { loadSettings } from "@/lib/settings"
import { handleAccountsMessage, UNLOCK_RESUME_KEY, type UnlockResume } from "./accounts"
import { createBulkRemoval, focusBulkRemovalTab } from "./bulkRemoval"
import { handleLogMessage } from "./logs"
import { createOpenIdsMessageListener } from "./openTabs"
import { queueVaultOperation } from "./operations"
import { handleResultsMessage, isReportFetchType, relayAuthorizedReportProgress, revokeResultsForTab } from "./reports"
import { checkSellerCentralSession, focusOrOpenSellerCentralTab } from "./sellerCentralTabs"
import { isExtensionPage, isOwnSender } from "./senders"
import { forgetDebuggerSession, getActiveJob, getSwitchNotice, jobContext, jobLog, setActiveJob, SWITCH_NOTICE_KEY } from "./switch/job"
import { handleAccountTabUpdated, recordSignInHop } from "./switch/signIn"

const log = createLogger("background")

/** Resolves a message handler's promise into sendResponse. Handlers that log their own failures pass logged. */
function respond(
  type: string,
  request: Promise<unknown>,
  sendResponse: (response: unknown) => void,
  fallbackError: string,
  logged = false,
): true {
  void request.then(sendResponse, (error: unknown) => {
    if (!logged) log.warn("message.failed", { type, error: describeError(error) })
    sendResponse({ ok: false, error: errorMessage(error, fallbackError) })
  })
  return true
}

const idsListener = createOpenIdsMessageListener()
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  const logStore = createLogStore(chrome.storage.local)
  setLogSink((entry) => logStore.append([entry]))
  chrome.runtime.onInstalled?.addListener(({ reason, previousVersion }) => {
    log.info("extension.installed", { reason, version: chrome.runtime.getManifest().version, previousVersion })
  })

  const storageReady = Promise.all([
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  ])
  void storageReady.catch(() => log.error("storage.restrictionFailed"))
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    if (!isOwnSender(sender)) {
      sendResponse({ ok: false, error: "Unauthorized extension message." })
      return undefined
    }
    const handled = idsListener(message, sender, sendResponse)
    if (handled) return true
    if (!message || typeof message !== "object" || !("type" in message)) return undefined
    const record = message as Record<string, unknown>
    const type = String(record.type)
    if (type === LOG_ENTRIES_MESSAGE || type === LOGS_GET_MESSAGE || type === LOGS_CLEAR_MESSAGE) {
      return handleLogMessage(type, record, sender, logStore, sendResponse)
    }
    if (type === "GET_SETTINGS") {
      return respond(type, storageReady.then(loadSettings).then((settings) => ({ ok: true, settings: isExtensionPage(sender) ? settings : { features: settings.features } })), sendResponse, "Couldn’t load settings.")
    }
    if (type.startsWith("RESULTS_") || type === "REPORTS_PREPARE" || type === "SCRAPE_CASES" || isReportFetchType(type)) {
      return respond(type, storageReady.then(() => handleResultsMessage(record, sender)), sendResponse, "Couldn’t complete this Results action.")
    }
    if (type === "REPORTS_PROGRESS") {
      void storageReady.then(() => relayAuthorizedReportProgress(record, sender)).then(sendResponse, () => sendResponse({ ok: true }))
      return true
    }
    if (type === "SELLER_CENTRAL_SESSION") {
      return respond(type, storageReady.then(() => checkSellerCentralSession(sender.tab)).then((session) => ({ ok: true, session })), sendResponse, "Couldn’t check Seller Central.")
    }
    if (type === "CREATE_BULK_REMOVAL") {
      if (!sender.tab) {
        sendResponse({ ok: false, error: "Open Bulk removal from the command palette." })
        return undefined
      }
      return respond(type, storageReady.then(() => createBulkRemoval(record.skus, sender.tab)), sendResponse, "Couldn’t create the removal.", true)
    }
    if (type === "BULK_REMOVAL_FOCUS") {
      return respond(type, focusBulkRemovalTab(sender.tab), sendResponse, "Couldn’t open the removal tab.")
    }
    if (type === "SELLER_CENTRAL_OPEN") {
      return respond(type, focusOrOpenSellerCentralTab(sender.tab), sendResponse, "Couldn’t open Seller Central.")
    }
    if (!type.startsWith("ACCOUNT")) return undefined
    return respond(type, storageReady.then(() => handleAccountsMessage(record, sender)), sendResponse, "Account operation failed.")
  })
  chrome.debugger?.onDetach?.addListener((source) => forgetDebuggerSession(source.tabId))
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    recordSignInHop(tabId, changeInfo.url)
    if (changeInfo.status === "loading" || changeInfo.url) void revokeResultsForTab(tabId)
    void handleAccountTabUpdated(tabId, changeInfo, tab).catch(() => log.warn("account.switch.navigationFailed"))
  })
  chrome.tabs.onRemoved.addListener((tabId) => {
    void revokeResultsForTab(tabId, true)
    void queueVaultOperation(async () => {
      const stored = await chrome.storage.session.get(UNLOCK_RESUME_KEY)
      const pending = stored[UNLOCK_RESUME_KEY] as UnlockResume | undefined
      if (pending && (pending.sourceTabId === tabId || pending.accountsTabId === tabId)) await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
      if ((await getSwitchNotice())?.tabId === tabId) await chrome.storage.session.remove(SWITCH_NOTICE_KEY)
      const job = await getActiveJob()
      if (job?.tabId !== tabId) return
      jobLog(job).warn("account.switch.tabClosed", jobContext(job))
      await setActiveJob(undefined)
    }).catch(() => undefined)
  })
}
