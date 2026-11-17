/**
 * Every request the extension's pages and scripts send to the service worker, and what a
 * successful reply adds to `ok: true`. A failed reply is `{ ok: false, error }`.
 */
import type { AccountVault, SharedVaultFile, StoreIndexRecord, VaultMergeCounts } from "@/shared/accounts"
import type { SellerFeedback } from "@/sellerCentral/feedback"
import type { LogEntry } from "@/shared/log"
import type { ReportProgressEvent } from "@/reports/progress"
import type { ReportSource } from "@/reports/sources"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import type { ExtensionSettings } from "@/shared/settings"
import type { ShippingQueueShipment } from "@/sellerCentral/shippingQueue"
import type { StrandedListing } from "@/sellerCentral/stranded"
import type { SuppressedListing } from "@/sellerCentral/suppressed"
import type { UnfulfillableListing } from "@/sellerCentral/unfulfillable"
import type { ScrapeCasesFile } from "@/sellerCentral/viewCase"

/** The most IDs one command opens, removes or scrapes. */
export const MAX_BULK_IDS = 50

export type WorkspaceMode = "reports" | "cases" | "shipments" | "accounts"
export type AccountStoreSummary = StoreIndexRecord

export interface ActiveSwitchSummary {
  storeId: string
  storeName: string
  stage: string
  startedAt: number
  /** False when a same-credential switch only opens the store. */
  signIn?: boolean
  /** The step a paused switch is waiting on. */
  resumeStage?: string
  attentionMessage?: string
}

export interface AccountsStatus {
  initialized: boolean
  unlocked: boolean
  stores: AccountStoreSummary[]
  activeSwitch?: ActiveSwitchSummary
  currentStore?: AccountStoreSummary | null
}

export interface BulkRemovalSummary {
  openedCount: number
  skipped: Array<{ sku: string; reason: string }>
  nextRemovalOrderId: string | null
  /** Amazon didn't report eligibility for some SKUs, so they were included unchecked. */
  eligibilityUnknown: boolean
}

type Empty = Record<never, never>
type Message<Request, Reply> = { request: Request; reply: Reply }
type JobMessage<Request = Empty, Reply = Empty> = Message<{ jobId: string } & Request, Reply>

export interface BackgroundMessages {
  OPEN_CASE_IDS: Message<{ caseIds: string[] }, { openedCount: number }>
  OPEN_SHIPMENT_IDS: Message<{ shipmentIds: string[] }, { openedCount: number }>
  OPEN_REMOVAL_ORDER_IDS: Message<{ removalOrderIds: string[] }, { openedCount: number }>
  OPEN_SKU_IDS: Message<{ skuIds: string[] }, { openedCount: number }>
  OPEN_TIME_OUT: Message<Empty, { openedCount: number }>
  GET_SETTINGS: Message<Empty, { settings: Partial<ExtensionSettings> }>
  LOG_ENTRIES: Message<{ entries: LogEntry[] }, Empty>
  LOGS_GET: Message<Empty, { entries: LogEntry[] }>
  LOGS_CLEAR: Message<Empty, Empty>
  SELLER_CENTRAL_SESSION: Message<Empty, { session: SellerCentralSessionState }>
  SELLER_CENTRAL_OPEN: Message<Empty, { focused?: true; opened?: true }>
  CREATE_BULK_REMOVAL: Message<{ skus: string[] }, BulkRemovalSummary>
  BULK_REMOVAL_FOCUS: Message<Empty, Empty>
  RESULTS_OPEN: Message<{ mode: WorkspaceMode; caseIds?: string[] }, Empty>
  RESULTS_INIT: Message<{ launchId: string | null }, { mode: WorkspaceMode; caseIds: string[]; resumeId?: string; storeName?: string }>
  RESULTS_CANCEL: Message<{ runId: string }, Empty>
  RESULTS_FINISH: Message<{ runId: string }, Empty>
  REPORTS_PREPARE: Message<{ sections?: readonly ReportSource[]; mode?: "cases"; caseIds?: string[] }, { loggedInToStore?: false; runId?: string }>
  REPORTS_FETCH_UNFULFILLABLE: Message<{ runId: string }, { listings: UnfulfillableListing[]; nextRemovalOrderId: string | null }>
  REPORTS_FETCH_FEEDBACK: Message<{ runId: string }, { feedbacks: SellerFeedback[] }>
  REPORTS_FETCH_STRANDED: Message<{ runId: string }, { listings: StrandedListing[] }>
  REPORTS_FETCH_SUPPRESSED: Message<{ runId: string }, { listings: SuppressedListing[] }>
  REPORTS_FETCH_SHIPPING_QUEUE: Message<{ runId: string }, { shipments: ShippingQueueShipment[] }>
  SCRAPE_CASES: Message<{ runId: string }, { file: ScrapeCasesFile }>
  REPORTS_PROGRESS: Message<ReportProgressEvent & { runId?: string }, Empty>
  ACCOUNTS_STATUS: Message<Empty, AccountsStatus>
  ACCOUNTS_REQUEST_UNLOCK: Message<{ storeId: string }, Empty>
  ACCOUNTS_CREATE: Message<{ masterPassword: string }, Empty>
  ACCOUNTS_UNLOCK: Message<{ masterPassword: string }, Empty>
  ACCOUNTS_LOCK: Message<Empty, Empty>
  ACCOUNTS_GET_VAULT: Message<Empty, { vault: AccountVault }>
  ACCOUNTS_SAVE_VAULT: Message<{ vault: AccountVault }, Empty>
  ACCOUNTS_EXPORT_SHARE: Message<{ sharePassword: string }, { file: SharedVaultFile }>
  ACCOUNTS_IMPORT_SHARE: Message<{ sharePassword: string; file: unknown }, { vault: AccountVault; added: VaultMergeCounts; updated: VaultMergeCounts }>
  ACCOUNTS_CREATE_FROM_SHARE: Message<{ sharePassword: string; masterPassword: string; file: unknown }, Empty>
  ACCOUNTS_CHANGE_MASTER_PASSWORD: Message<{ masterPassword: string }, Empty>
  ACCOUNTS_RESET: Message<Empty, Empty>
  ACCOUNTS_OPEN_OPTIONS: Message<Empty, Empty>
  ACCOUNTS_RESUME_SWITCH: Message<{ resumeId: string }, { jobId: string; resumed: true }>
  ACCOUNTS_START_SWITCH: Message<{ storeId: string }, { jobId: string }>
  ACCOUNTS_FOCUS_CURRENT_STORE: Message<Empty, { focused?: true; opened?: true }>
  ACCOUNTS_SWITCH_NOTICE: Message<Empty, { storeName?: string }>
  ACCOUNTS_SWITCH_NOTICE_DISMISS: Message<Empty, Empty>
  ACCOUNTS_FOCUS_SWITCH: Message<Empty, Empty>
  ACCOUNTS_CANCEL_SWITCH: Message<Empty, Empty>
  ACCOUNT_AUTOMATION_GET_JOB: Message<Empty, { job: { id: string; stage: string; resumeStage?: string } | null }>
  ACCOUNT_AUTOMATION_SECRET: JobMessage<{ kind: "email" | "password" | "otp"; retry?: boolean }, { value: string }>
  ACCOUNT_AUTOMATION_CLICK: JobMessage<{ action: "continue" | "password-submit" | "otp-submit"; x: number; y: number }>
  ACCOUNT_AUTOMATION_PAUSED: JobMessage<{ reason: string }>
  ACCOUNT_AUTOMATION_LEAVE_LOGOUT: JobMessage
  ACCOUNT_AUTOMATION_COMPLETE: JobMessage
  ACCOUNT_AUTOMATION_STORE_READY: JobMessage<Empty, { waitMs?: number; waiting?: string }>
  ACCOUNT_AUTOMATION_REAUTH: JobMessage
  ACCOUNT_AUTOMATION_ERROR: JobMessage<{ error: string }>
}

export type BackgroundMessageType = keyof BackgroundMessages
export type BackgroundRequest<T extends BackgroundMessageType> = { type: T } & BackgroundMessages[T]["request"]
export type BackgroundReply<T extends BackgroundMessageType> = { ok: true } & BackgroundMessages[T]["reply"]

/** Sends a request to the service worker and returns its reply, or throws the worker's error. */
export async function sendToBackground<T extends BackgroundMessageType>(
  message: BackgroundRequest<T>,
  fallbackError = "The extension did not respond.",
): Promise<BackgroundReply<T>> {
  const response = await chrome.runtime.sendMessage(message) as { ok?: boolean; error?: string } | undefined
  if (!response?.ok) throw new Error(response?.error ?? fallbackError)
  return response as BackgroundReply<T>
}

/** Messages to pages and content scripts must come from this extension's service worker. */
export function isFromWorker(sender: chrome.runtime.MessageSender): boolean {
  return Boolean(chrome.runtime?.id) && sender.id === chrome.runtime.id && !sender.tab
    && (!sender.url || sender.url === chrome.runtime.getURL("background.js"))
}
