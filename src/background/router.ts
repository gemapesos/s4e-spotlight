/** Every message the service worker answers: who may send it, how it waits its turn, and its handler. */
import { createLogger, describeError, errorMessage } from "@/shared/log"
import { loadSettings } from "@/shared/settings"
import type { BackgroundMessageType, BackgroundReply } from "@/shared/messages"
import { createBulkRemoval, focusBulkRemovalTab } from "./bulkRemoval"
import { appendLogEntries, clearLogEntries, readLogEntries } from "./logs"
import { openCaseTabs, openIds, openRemovalOrderTabs, openShipmentTabs, openSkuTabs, openTimeOutTabs, TabBatchError } from "./openTabs"
import { invalidateSwitchOperations, invalidateVaultOperations, queueVaultOperation } from "./operations"
import { endRun, prepareRun, relayAuthorizedReportProgress, runSource } from "./reports"
import { checkSellerCentralSession, focusOrOpenSellerCentralTab } from "./sellerCentralTabs"
import { EXTENSION_PAGES, isExtensionPage, isOwnSender, isPageSender } from "./senders"
import {
  automationClick,
  automationComplete,
  automationError,
  automationJob,
  automationLeaveLogout,
  automationPaused,
  automationReauth,
  automationSecret,
  automationStoreReady,
} from "./switch/automation"
import { cancelSwitch, dismissSwitchNotice, focusCurrentStore, focusSwitch, requestAccountUnlock, resumeAccountSwitch, startSwitch, switchNotice } from "./switch/start"
import {
  accountsStatus,
  changeMasterPassword,
  createVault,
  createVaultFromShare,
  exportShare,
  getVault,
  importShare,
  lockVault,
  openAccountsPage,
  resetVault,
  saveVaultFromPage,
  unlockVault,
} from "./vault"
import { initResults, openResults } from "./workspace"

const log = createLogger("background")
const SLOW_MESSAGE_MS = 15_000

type Handler<T extends BackgroundMessageType> = (message: Record<string, unknown>, sender: chrome.runtime.MessageSender) => Promise<BackgroundReply<T>>

interface Route<T extends BackgroundMessageType> {
  handle: Handler<T>
  /** The extension pages that may send it, and the error anyone else gets. Absent: any of the extension's own contexts. */
  only?: { pages: readonly string[]; error: string }
  /** Waits for earlier vault and switch work, which Lock, Reset and Cancel can stop midway. */
  queued?: true
  /** Stops vault or switch work already running, the moment it arrives. */
  invalidates?: "vault" | "switch"
  /** The handler logs its own failures. */
  logsFailures?: true
}

const ACCOUNTS_PAGE = { pages: ["options.html"], error: "This vault operation is only available on the Accounts page." }
/** The workspace window may take the master password and resume a switch; editing stays on Accounts. */
const ACCOUNTS_OR_WORKSPACE = { pages: ["options.html", "results.html"], error: ACCOUNTS_PAGE.error }
const LOCK_PAGES = { pages: ["options.html", "popup.html", "results.html"], error: "Lock accounts from an extension page." }
const LOG_READERS = { pages: EXTENSION_PAGES, error: "Logs are only available to extension pages." }

const ROUTES: { [T in BackgroundMessageType]: Route<T> } = {
  OPEN_CASE_IDS: { handle: (message, sender) => openIds("case", () => openCaseTabs(message.caseIds, sender.tab)), logsFailures: true },
  OPEN_SHIPMENT_IDS: { handle: (message, sender) => openIds("shipment", () => openShipmentTabs(message.shipmentIds, sender.tab)), logsFailures: true },
  OPEN_SKU_IDS: { handle: (message, sender) => openIds("sku", () => openSkuTabs(message.skuIds, sender.tab)), logsFailures: true },
  OPEN_REMOVAL_ORDER_IDS: { handle: (message, sender) => openIds("removalOrder", () => openRemovalOrderTabs(message.removalOrderIds, sender.tab)), logsFailures: true },
  OPEN_TIME_OUT: { handle: (_message, sender) => openIds("timeOut", () => openTimeOutTabs(sender.tab)), logsFailures: true },
  // Content scripts get only the command switches, not the Time Out form values.
  GET_SETTINGS: { handle: async (_message, sender) => {
    const settings = await loadSettings()
    return { ok: true, settings: isExtensionPage(sender) ? settings : { features: settings.features } }
  } },
  LOG_ENTRIES: { handle: (message, sender) => appendLogEntries(message.entries, sender) },
  LOGS_GET: { handle: () => readLogEntries(), only: LOG_READERS },
  LOGS_CLEAR: { handle: () => clearLogEntries(), only: LOG_READERS },
  SELLER_CENTRAL_SESSION: { handle: async (_message, sender) => ({ ok: true, session: await checkSellerCentralSession(sender.tab) }) },
  SELLER_CENTRAL_OPEN: { handle: (_message, sender) => focusOrOpenSellerCentralTab(sender.tab) },
  CREATE_BULK_REMOVAL: { handle: async (message, sender) => {
    if (!sender.tab) throw new Error("Open Bulk removal from the command palette.")
    return createBulkRemoval(message.skus, sender.tab)
  }, logsFailures: true },
  BULK_REMOVAL_FOCUS: { handle: (_message, sender) => focusBulkRemovalTab(sender.tab) },
  RESULTS_OPEN: { handle: openResults },
  RESULTS_INIT: { handle: initResults },
  RESULTS_CANCEL: { handle: endRun },
  RESULTS_FINISH: { handle: endRun },
  REPORTS_PREPARE: { handle: prepareRun },
  REPORTS_FETCH_UNFULFILLABLE: { handle: runSource("REPORTS_FETCH_UNFULFILLABLE") },
  REPORTS_FETCH_FEEDBACK: { handle: runSource("REPORTS_FETCH_FEEDBACK") },
  REPORTS_FETCH_STRANDED: { handle: runSource("REPORTS_FETCH_STRANDED") },
  REPORTS_FETCH_SUPPRESSED: { handle: runSource("REPORTS_FETCH_SUPPRESSED") },
  REPORTS_FETCH_SHIPPING_QUEUE: { handle: runSource("REPORTS_FETCH_SHIPPING_QUEUE") },
  SCRAPE_CASES: { handle: runSource("SCRAPE_CASES") },
  // A lost progress update is harmless, so this never fails.
  REPORTS_PROGRESS: { handle: (message, sender) => relayAuthorizedReportProgress(message, sender).catch(() => ({ ok: true as const })) },
  ACCOUNTS_STATUS: { handle: accountsStatus },
  ACCOUNTS_REQUEST_UNLOCK: { handle: requestAccountUnlock, queued: true },
  ACCOUNTS_CREATE: { handle: createVault, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_UNLOCK: { handle: unlockVault, only: ACCOUNTS_OR_WORKSPACE, queued: true },
  ACCOUNTS_LOCK: { handle: lockVault, only: LOCK_PAGES, queued: true, invalidates: "vault" },
  ACCOUNTS_GET_VAULT: { handle: getVault, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_SAVE_VAULT: { handle: saveVaultFromPage, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_EXPORT_SHARE: { handle: exportShare, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_IMPORT_SHARE: { handle: importShare, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_CREATE_FROM_SHARE: { handle: createVaultFromShare, only: ACCOUNTS_PAGE, queued: true },
  ACCOUNTS_CHANGE_MASTER_PASSWORD: { handle: changeMasterPassword, only: ACCOUNTS_PAGE, queued: true, invalidates: "vault" },
  ACCOUNTS_RESET: { handle: resetVault, only: ACCOUNTS_PAGE, queued: true, invalidates: "vault" },
  ACCOUNTS_OPEN_OPTIONS: { handle: openAccountsPage },
  ACCOUNTS_RESUME_SWITCH: { handle: resumeAccountSwitch, only: ACCOUNTS_OR_WORKSPACE, queued: true },
  ACCOUNTS_START_SWITCH: { handle: startSwitch, queued: true },
  ACCOUNTS_FOCUS_CURRENT_STORE: { handle: focusCurrentStore, queued: true },
  ACCOUNTS_SWITCH_NOTICE: { handle: switchNotice },
  ACCOUNTS_SWITCH_NOTICE_DISMISS: { handle: dismissSwitchNotice },
  ACCOUNTS_FOCUS_SWITCH: { handle: focusSwitch, queued: true },
  ACCOUNTS_CANCEL_SWITCH: { handle: cancelSwitch, queued: true, invalidates: "switch" },
  ACCOUNT_AUTOMATION_GET_JOB: { handle: automationJob },
  ACCOUNT_AUTOMATION_SECRET: { handle: automationSecret, queued: true },
  ACCOUNT_AUTOMATION_CLICK: { handle: automationClick, queued: true },
  ACCOUNT_AUTOMATION_PAUSED: { handle: automationPaused, queued: true },
  ACCOUNT_AUTOMATION_LEAVE_LOGOUT: { handle: automationLeaveLogout, queued: true },
  ACCOUNT_AUTOMATION_COMPLETE: { handle: automationComplete, queued: true },
  ACCOUNT_AUTOMATION_STORE_READY: { handle: automationStoreReady, queued: true },
  ACCOUNT_AUTOMATION_REAUTH: { handle: automationReauth, queued: true },
  ACCOUNT_AUTOMATION_ERROR: { handle: automationError, queued: true },
}

function routeFor(type: unknown): Route<BackgroundMessageType> | undefined {
  return typeof type === "string" && Object.hasOwn(ROUTES, type) ? ROUTES[type as BackgroundMessageType] as Route<BackgroundMessageType> : undefined
}

/** Answers one message as its route says: resolves with the reply, or rejects with the error to send back. */
export async function routeMessage(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<Record<string, unknown>> {
  if (!isOwnSender(sender)) throw new Error("Unauthorized extension message.")
  const route = routeFor(message.type)
  if (!route) throw new Error("Unknown message type.")
  if (route.only && !route.only.pages.some((page) => isPageSender(sender, page))) throw new Error(route.only.error)
  if (route.invalidates === "vault") invalidateVaultOperations()
  if (route.invalidates === "switch") invalidateSwitchOperations()
  // A step that never settles blocks every queued step after it; leave a trace of which one.
  const startedAt = Date.now()
  const slow = route.queued ? setTimeout(() => log.warn("message.slow", { type: message.type, ms: Date.now() - startedAt }), SLOW_MESSAGE_MS) : undefined
  const reply: object = await (route.queued ? queueVaultOperation(() => route.handle(message, sender)) : route.handle(message, sender))
    .finally(() => clearTimeout(slow))
  // Each reply is typed by its route above; from here it is only passed on.
  return reply as Record<string, unknown>
}

/**
 * The runtime.onMessage listener. It answers routed messages once `ready` (storage restricted to
 * the extension) settles, and leaves any other message unanswered for whoever it was meant for.
 */
export function listenForMessages(ready: Promise<unknown>) {
  return (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void): boolean | undefined => {
    if (!isOwnSender(sender)) {
      sendResponse({ ok: false, error: "Unauthorized extension message." })
      return undefined
    }
    if (!message || typeof message !== "object") return undefined
    const record = message as Record<string, unknown>
    const route = routeFor(record.type)
    if (!route) return undefined
    void ready.then(() => routeMessage(record, sender)).then(sendResponse, (error: unknown) => {
      if (!route.logsFailures) log.warn("message.failed", { type: record.type, error: describeError(error) })
      sendResponse({
        ok: false,
        error: errorMessage(error, "The extension couldn’t complete this request."),
        ...(error instanceof TabBatchError ? { openedIds: error.openedIds, rolledBackIds: error.rolledBackIds } : {}),
      })
    })
    return true
  }
}
