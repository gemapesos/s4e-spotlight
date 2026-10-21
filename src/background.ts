import {
  ACTIVE_JOB_STORAGE_KEY,
  CURRENT_STORE_KEY,
  SESSION_KEY_STORAGE_KEY,
  STORE_INDEX_KEY,
  VAULT_STORAGE_KEY,
  decryptSharedVault,
  decryptVault,
  decryptVaultWithKey,
  deserializeKey,
  emptyVault,
  encryptSharedVault,
  encryptVault,
  encryptVaultWithKey,
  mergeVaults,
  generateTotp,
  parseOtpAuthUri,
  publicStoreIndex,
  serializeKey,
  validateStoreUrl,
  type AccountVault,
  type CredentialRecord,
  type EncryptedVault,
  type StoreIndexRecord,
  type StoreRecord,
} from "./lib/accounts.js"
import {
  createLogger,
  createLogRunId,
  createLogStore,
  describeError,
  errorMessage,
  LOG_ENTRIES_MESSAGE,
  LOGS_CLEAR_MESSAGE,
  LOGS_GET_MESSAGE,
  sanitizeLogEntries,
  setLogSink,
  type LogData,
  type LogStore,
} from "./lib/log.js"
import {
  DEFAULT_TIME_OUT_FORM_VALUES,
  loadSettings,
  TIME_OUT_FORM_BASE_URL,
  TIME_OUT_FORM_ENTRY_IDS,
  type TimeOutFormValues,
} from "./lib/settings.js"

const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID="
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/"
const REMOVAL_ORDER_URL = "https://sellercentral.amazon.com/recoveryui/removal-order/detail?sourceRemovalOrderId="
const SKU_URL = "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm="
const SKU_URL_SUFFIX = "&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx"
const OPENID_SPEC = "http://specs.openid.net/auth/2.0"
export const TIME_OUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1E7gfUVzy47vboZHOJ6xd8Jwx-1N6oewaVggrtI7G4yw/edit?gid=0#gid=0"
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx"
export const SIGN_IN_URL = `https://sellercentral.amazon.com/ap/signin?${new URLSearchParams({
  "openid.return_to": "https://sellercentral.amazon.com/",
  "openid.identity": `${OPENID_SPEC}/identifier_select`,
  "openid.assoc_handle": "amzn_sw_signup_us",
  "openid.mode": "checkid_setup",
  "openid.claimed_id": `${OPENID_SPEC}/identifier_select`,
  "openid.ns": OPENID_SPEC,
})}`
export const SELLER_CENTRAL_HOME_URL = "https://sellercentral.amazon.com/"
export const SELLER_CENTRAL_TAB_URL_PATTERN = "https://sellercentral.amazon.com/*"

export type OpenIdsResponse =
  | { ok: true; openedCount: number }
  | { ok: false; error: string; openedIds?: string[]; rolledBackIds?: string[] }
type CreateTab = (properties: chrome.tabs.CreateProperties) => Promise<chrome.tabs.Tab>
type RemoveTabs = (tabIds: number[]) => Promise<void>
type OpenTabs = (ids: unknown, senderTab: chrome.tabs.Tab | undefined) => Promise<{ openedCount: number }>
type OpenTimeOut = (senderTab: chrome.tabs.Tab | undefined) => Promise<{ openedCount: number }>
type LoadTimeOutFormValues = () => Promise<TimeOutFormValues>
type SenderTab = chrome.tabs.Tab & { id: number; windowId: number }

const MAX_BULK_IDS = 50
const ACTIVE_JOB_TTL_MS = 15 * 60 * 1000
const log = createLogger("background")
const createChromeTab: CreateTab = (properties) => chrome.tabs.create(properties)
const removeChromeTabs: RemoveTabs = (tabIds) => chrome.tabs.remove(tabIds)

export class TabBatchError extends Error {
  constructor(
    message: string,
    readonly openedIds: string[],
    readonly rolledBackIds: string[],
  ) {
    super(message)
    this.name = "TabBatchError"
  }
}

function uniqueStrings(value: unknown, normalize: (id: string) => string, isValid: (id: string) => boolean): string[] {
  if (!Array.isArray(value)) return []
  const ids = value.filter((id): id is string => typeof id === "string").map(normalize).filter(isValid)
  return [...new Set(ids)]
}

export function normalizeCaseIds(value: unknown): string[] {
  return uniqueStrings(value, (id) => id, (id) => /^\d{11}$/u.test(id))
}
export function normalizeShipmentIds(value: unknown): string[] {
  return uniqueStrings(value, (id) => id.toUpperCase(), (id) => /^FBA[A-Z0-9]{9}$/u.test(id))
}
export function normalizeRemovalOrderIds(value: unknown): string[] {
  return uniqueStrings(value, (id) => id.toUpperCase(), (id) => /^S4E[A-Z]{2}\d{4}$/u.test(id))
}
export function normalizeSkuIds(value: unknown): string[] {
  return uniqueStrings(value, (id) => id.trim(), (id) => id.length > 0 && id.length <= 40)
}
export function buildCaseUrl(id: string): string { return `${CASE_URL}${id}` }
export function buildShipmentUrl(id: string): string { return `${SHIPMENT_URL}${id}/contents` }
export function buildRemovalOrderUrl(id: string): string { return `${REMOVAL_ORDER_URL}${encodeURIComponent(id)}` }
export function buildSkuUrl(id: string): string { return `${SKU_URL}${encodeURIComponent(id)}${SKU_URL_SUFFIX}` }
export function buildTimeOutFormUrl(date: Date, values: TimeOutFormValues = DEFAULT_TIME_OUT_FORM_VALUES): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const params = new URLSearchParams({
    [`entry.${TIME_OUT_FORM_ENTRY_IDS.date}`]: `${year}-${month}-${day}`,
  })
  for (const [key, entryId] of Object.entries(TIME_OUT_FORM_ENTRY_IDS)) {
    if (key === "date") continue
    const value = values[key as keyof TimeOutFormValues]
    if (value) params.set(`entry.${entryId}`, value)
  }
  return `${TIME_OUT_FORM_BASE_URL}?${params.toString()}`
}

async function rollbackCreatedTabs(
  created: Array<{ id: string; tabId: number }>,
  removeTabs: RemoveTabs,
): Promise<{ openedIds: string[]; rolledBackIds: string[] }> {
  const rolledBackIds: string[] = []
  const openedIds: string[] = []
  for (const item of created) {
    try {
      await removeTabs([item.tabId])
      rolledBackIds.push(item.id)
    } catch {
      openedIds.push(item.id)
    }
  }
  return { openedIds, rolledBackIds }
}

function tabBatchError(cause: unknown, openedIds: string[], rolledBackIds: string[]): TabBatchError {
  const reason = errorMessage(cause, "Chrome could not create a tab.")
  const suffix = openedIds.length
    ? ` ${openedIds.length} tab(s) could not be closed: ${openedIds.join(", ")}.`
    : " Any tabs opened by this attempt were closed."
  return new TabBatchError(`${reason}${suffix}`, openedIds, rolledBackIds)
}

function requireSenderTab(senderTab: chrome.tabs.Tab | undefined): SenderTab {
  if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.")
  return senderTab as SenderTab
}

async function createTabsInParallel(
  targets: ReadonlyArray<{ id: string; active: boolean; url: string }>,
  senderTab: SenderTab,
  createTab: CreateTab,
  removeTabs: RemoveTabs,
): Promise<{ openedCount: number }> {
  const results = await Promise.allSettled(
    targets.map(async (target) => {
      const tab = await createTab({
        active: target.active,
        openerTabId: senderTab.id,
        url: target.url,
        windowId: senderTab.windowId,
      })
      if (tab.id === undefined) throw new Error("Chrome created a tab without an ID.")
      return { id: target.id, tabId: tab.id }
    }),
  )

  const created: Array<{ id: string; tabId: number }> = []
  let failure: unknown
  for (const result of results) {
    if (result.status === "fulfilled") created.push(result.value)
    else if (failure === undefined) failure = result.reason
  }

  if (failure !== undefined) {
    const { openedIds, rolledBackIds } = await rollbackCreatedTabs(created, removeTabs)
    throw tabBatchError(failure, openedIds, rolledBackIds)
  }

  return { openedCount: created.length }
}

/** Opens one background tab per normalized ID, or rejects without leaving a partial batch open. */
function idTabOpener(normalize: (ids: unknown) => string[], buildUrl: (id: string) => string, noun: string) {
  return async (
    ids: unknown,
    senderTab: chrome.tabs.Tab | undefined,
    createTab: CreateTab = createChromeTab,
    removeTabs: RemoveTabs = removeChromeTabs,
  ): Promise<{ openedCount: number }> => {
    const normalized = normalize(ids)
    if (!normalized.length) throw new Error(`No valid ${noun} were provided.`)
    const sender = requireSenderTab(senderTab)
    if (normalized.length > MAX_BULK_IDS) throw new Error(`Open no more than ${MAX_BULK_IDS} IDs at a time.`)
    const targets = normalized.map((id) => ({ id, active: normalized.length === 1, url: buildUrl(id) }))
    return createTabsInParallel(targets, sender, createTab, removeTabs)
  }
}

export const openCaseTabs = idTabOpener(normalizeCaseIds, buildCaseUrl, "Case IDs")
export const openShipmentTabs = idTabOpener(normalizeShipmentIds, buildShipmentUrl, "Shipment IDs")
export const openSkuTabs = idTabOpener(normalizeSkuIds, buildSkuUrl, "SKUs")
export const openRemovalOrderTabs = idTabOpener(normalizeRemovalOrderIds, buildRemovalOrderUrl, "Removal Order IDs")

export async function openTimeOutTabs(
  senderTab: chrome.tabs.Tab | undefined,
  createTab: CreateTab = createChromeTab,
  removeTabs: RemoveTabs = removeChromeTabs,
  date = new Date(),
  loadFormValues: LoadTimeOutFormValues = async () => (await loadSettings()).timeOutForm,
): Promise<{ openedCount: number }> {
  const sender = requireSenderTab(senderTab)
  const values = await loadFormValues()

  return createTabsInParallel(
    [
      { id: "Google Sheet", active: false, url: TIME_OUT_SHEET_URL },
      { id: "Google Form", active: true, url: buildTimeOutFormUrl(date, values) },
    ],
    sender,
    createTab,
    removeTabs,
  )
}

function openTabsFailure(error: unknown, fallback: string): OpenIdsResponse {
  return {
    ok: false,
    error: errorMessage(error, fallback),
    ...(error instanceof TabBatchError ? { openedIds: error.openedIds, rolledBackIds: error.rolledBackIds } : {}),
  }
}

export function createOpenIdsMessageListener(
  openCases: OpenTabs = openCaseTabs,
  openShipments: OpenTabs = openShipmentTabs,
  openSkus: OpenTabs = openSkuTabs,
  openTimeOut: OpenTimeOut = openTimeOutTabs,
  openRemovalOrders: OpenTabs = openRemovalOrderTabs,
) {
  const openers: Record<string, { kind: string; idsKey: string; open: OpenTabs }> = {
    OPEN_CASE_IDS: { kind: "case", idsKey: "caseIds", open: openCases },
    OPEN_SHIPMENT_IDS: { kind: "shipment", idsKey: "shipmentIds", open: openShipments },
    OPEN_SKU_IDS: { kind: "sku", idsKey: "skuIds", open: openSkus },
    OPEN_REMOVAL_ORDER_IDS: { kind: "removalOrder", idsKey: "removalOrderIds", open: openRemovalOrders },
  }
  return (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: OpenIdsResponse) => void,
  ): boolean | undefined => {
    if (!message || typeof message !== "object" || !("type" in message)) return undefined
    const record = message as Record<string, unknown>
    const type = String(record.type)
    const opener = Object.hasOwn(openers, type) ? openers[type] : undefined
    if (type !== "OPEN_TIME_OUT" && !opener) return undefined

    const kind = opener?.kind ?? "timeOut"
    const done = log.time("tabs.open", { kind })
    const request = opener ? opener.open(record[opener.idsKey], sender.tab) : openTimeOut(sender.tab)
    void request.then(
      (result) => {
        done({ count: result?.openedCount ?? 0 })
        sendResponse({ ok: true, openedCount: result?.openedCount ?? 0 })
      },
      (error: unknown) => {
        const rollback = error instanceof TabBatchError
          ? { stillOpen: error.openedIds.length, closed: error.rolledBackIds.length }
          : {}
        done({ error: describeError(error), ...rollback }, "error")
        sendResponse(openTabsFailure(error, opener ? "Couldn’t open tabs." : "Couldn’t open Time Out."))
      },
    )
    return true
  }
}

interface ActiveJob {
  id: string
  tabId: number
  storeId: string
  /** For logs only; the vault stays the source of truth. */
  storeName?: string
  stage: "logout" | "signin" | "email" | "password" | "otp" | "authenticated" | "paused"
  startedAt: number
  /** True when this job created the tab; cancel/failure must not close reused SC tabs. */
  ownsTab: boolean
}

const AUTOMATION_CLICK_ACTIONS = new Set(["continue", "password-submit", "otp-submit"])
let startSwitchLock: Promise<void> = Promise.resolve()
let sellerCentralTabLock: Promise<void> = Promise.resolve()
let reportProgressTabId: number | undefined

type ApiResponse = { ok: true; [key: string]: unknown } | { ok: false; error: string }

export function validateVault(vault: AccountVault): void {
  const names = new Set<string>()
  const domains = new Set<string>()
  const credentialIds = new Set(vault.credentials.map(({ id }) => id))
  for (const credential of vault.credentials) {
    const domain = credential.domain.trim().toLowerCase()
    if (!domain || domains.has(domain)) throw new Error("Credential domains must be present and unique.")
    domains.add(domain)
    if (!credential.password) throw new Error("Each credential needs a password.")
    parseOtpAuthUri(credential.otpAuthUri)
  }
  for (const store of vault.stores) {
    const name = store.name.trim().toLowerCase()
    if (!name || names.has(name)) throw new Error("Store names must be present and unique.")
    names.add(name)
    if (!credentialIds.has(store.credentialId)) throw new Error(`Store “${store.name}” references a missing credential.`)
    if (!validateStoreUrl(store.storeUrl)) throw new Error(`Store “${store.name}” needs an HTTPS Seller Central URL.`)
  }
}

async function getEnvelope(): Promise<EncryptedVault | undefined> {
  return (await chrome.storage.local.get(VAULT_STORAGE_KEY))[VAULT_STORAGE_KEY] as EncryptedVault | undefined
}
async function getSessionKey(): Promise<Uint8Array | undefined> {
  const value = (await chrome.storage.session.get(SESSION_KEY_STORAGE_KEY))[SESSION_KEY_STORAGE_KEY]
  return typeof value === "string" ? deserializeKey(value) : undefined
}
async function getUnlockedVault(): Promise<{ vault: AccountVault; envelope: EncryptedVault; key: Uint8Array }> {
  const [envelope, key] = await Promise.all([getEnvelope(), getSessionKey()])
  if (!envelope) throw new Error("Create the account vault first.")
  if (!key) throw new Error("The account vault is locked.")
  return { vault: await decryptVaultWithKey(envelope, key), envelope, key }
}
async function saveVault(vault: AccountVault, envelope: EncryptedVault, key: Uint8Array): Promise<void> {
  validateVault(vault)
  const salt = Uint8Array.from(atob(envelope.salt), (c) => c.charCodeAt(0))
  const nextEnvelope = await encryptVaultWithKey(vault, key, salt, envelope.iterations)
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: nextEnvelope, [STORE_INDEX_KEY]: publicStoreIndex(vault) })
  await pruneCurrentStore(vault.stores.map(({ id }) => id))
}

async function getCurrentStoreId(): Promise<string | undefined> {
  const value = (await chrome.storage.local.get(CURRENT_STORE_KEY))[CURRENT_STORE_KEY]
  return typeof value === "string" ? value : undefined
}

async function setCurrentStoreId(storeId?: string): Promise<void> {
  if (storeId) await chrome.storage.local.set({ [CURRENT_STORE_KEY]: storeId })
  else await chrome.storage.local.remove(CURRENT_STORE_KEY)
}

async function pruneCurrentStore(storeIds: readonly string[]): Promise<void> {
  const currentId = await getCurrentStoreId()
  if (currentId && !storeIds.includes(currentId)) await setCurrentStoreId(undefined)
}

function currentStoreFromIndex(stores: StoreIndexRecord[], storeId?: string): StoreIndexRecord | null {
  if (!storeId) return null
  return stores.find((store) => store.id === storeId) ?? null
}

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

export interface ReportsPrepareResult {
  ok: true
  loggedInToStore: boolean
  sellerCentralTabId: number
  openedPromptOnSellerCentral?: true
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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

interface ReportRun {
  id: string
  paletteTabId?: number
  sellerCentralTabId: number
}

/** The report run started by the latest successful prepare; used to tag logs from every context. */
let activeReportRun: ReportRun | undefined

function reportRunForPaletteTab(tabId?: number): string | undefined {
  return activeReportRun && activeReportRun.paletteTabId === tabId ? activeReportRun.id : undefined
}

function reportRunForTab(tabId?: number): string | undefined {
  if (!activeReportRun || tabId === undefined) return undefined
  return tabId === activeReportRun.paletteTabId || tabId === activeReportRun.sellerCentralTabId
    ? activeReportRun.id
    : undefined
}

type ReportFetchType =
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

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

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

function isReportFetchType(type: string): type is ReportFetchType {
  return Object.hasOwn(REPORT_REQUESTS, type)
}

const CONTENT_SCRIPT_MISSING = /Receiving end does not exist/i

/** Asks the Seller Central tab's content script for one report source, waiting for the script to load. */
async function sendReportFetch(tabId: number, type: ReportFetchType, runId?: string): Promise<Record<string, unknown>> {
  const request = REPORT_REQUESTS[type]
  const startedAt = Date.now()
  const deadline = startedAt + SESSION_PROBE_TIMEOUT_MS
  let lastError: string | undefined
  let attempts = 0
  while (Date.now() < deadline) {
    attempts += 1
    try {
      const response = await chrome.tabs.sendMessage(tabId, runId ? { type, runId } : { type }) as
        Record<string, unknown> | undefined
      if (attempts > 1) {
        log.withRun(runId).info("report.contentScriptWait", { source: request.source, attempts, ms: Date.now() - startedAt })
      }
      if (response?.ok) return { ok: true, ...request.pick(response) }
      throw new Error(typeof response?.error === "string" ? response.error : request.fallbackError)
    } catch (error) {
      const message = errorMessage(error, String(error))
      if (!CONTENT_SCRIPT_MISSING.test(message)) throw error instanceof Error ? error : new Error(message)
      lastError = message
    }
    await sleep(SESSION_PROBE_INTERVAL_MS)
  }
  throw new Error(lastError ?? request.fallbackError)
}

async function fetchReportSource(type: ReportFetchType, senderTab?: chrome.tabs.Tab): Promise<Record<string, unknown>> {
  rememberReportProgressTab(senderTab?.id)
  const runId = reportRunForPaletteTab(senderTab?.id)
  const source = REPORT_REQUESTS[type].source
  const done = log.withRun(runId).time("report.source", { source })
  try {
    const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false })
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

export function rememberReportProgressTab(tabId?: number): void {
  if (typeof tabId === "number") reportProgressTabId = tabId
}

export async function relayReportProgress(message: unknown): Promise<{ ok: true }> {
  if (reportProgressTabId === undefined) return { ok: true }
  try {
    await chrome.tabs.sendMessage(reportProgressTabId, message)
  } catch {
    /* palette tab may have closed */
  }
  return { ok: true }
}

type UnfulfillableReport = { ok: true; listings: unknown[]; nextRemovalOrderId: string | null }

export async function fetchUnfulfillableReport(senderTab?: chrome.tabs.Tab): Promise<UnfulfillableReport> {
  return await fetchReportSource("REPORTS_FETCH_UNFULFILLABLE", senderTab) as UnfulfillableReport
}
export async function fetchFeedbackReport(senderTab?: chrome.tabs.Tab): Promise<{ ok: true; feedbacks: unknown[] }> {
  return await fetchReportSource("REPORTS_FETCH_FEEDBACK", senderTab) as { ok: true; feedbacks: unknown[] }
}
export async function fetchStrandedReport(senderTab?: chrome.tabs.Tab): Promise<{ ok: true; listings: unknown[] }> {
  return await fetchReportSource("REPORTS_FETCH_STRANDED", senderTab) as { ok: true; listings: unknown[] }
}
export async function fetchSuppressedReport(senderTab?: chrome.tabs.Tab): Promise<{ ok: true; listings: unknown[] }> {
  return await fetchReportSource("REPORTS_FETCH_SUPPRESSED", senderTab) as { ok: true; listings: unknown[] }
}
export async function fetchShippingQueueReport(senderTab?: chrome.tabs.Tab): Promise<{ ok: true; shipments: unknown[] }> {
  return await fetchReportSource("REPORTS_FETCH_SHIPPING_QUEUE", senderTab) as { ok: true; shipments: unknown[] }
}

export async function probeSellerCentralSession(tabId: number): Promise<boolean> {
  const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS
  let last: { loggedInToStore: boolean; settled: boolean } | undefined
  while (Date.now() < deadline) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_SESSION_STATUS" }) as {
        ok?: boolean
        loggedInToStore?: boolean
        settled?: boolean
      }
      if (response?.ok && typeof response.loggedInToStore === "boolean") {
        last = { loggedInToStore: response.loggedInToStore, settled: Boolean(response.settled) }
        if (last.settled) return last.loggedInToStore
      }
    } catch {
      /* content script may not be ready yet */
    }
    await sleep(SESSION_PROBE_INTERVAL_MS)
  }
  if (!last) throw new Error("Couldn’t confirm the Seller Central session.")
  log.warn("report.sessionUnsettled", { tabId, loggedInToStore: last.loggedInToStore })
  return last.loggedInToStore
}

export async function prepareReports(senderTab?: chrome.tabs.Tab): Promise<ReportsPrepareResult> {
  const runId = createLogRunId("report")
  const runLog = log.withRun(runId)
  const done = runLog.time("report.prepare")
  const timings: LogData = {}
  const step = async <T>(name: string, action: () => Promise<T>): Promise<T> => {
    const startedAt = Date.now()
    try {
      return await action()
    } finally {
      timings[name] = Date.now() - startedAt
    }
  }
  try {
    const { tabId, opened } = await step("tabMs", () => ensureSellerCentralTab(senderTab, { focus: false }))
    await step("loadMs", () => waitForTabComplete(tabId))
    const tab = await chrome.tabs.get(tabId)
    const loggedInToStore = await step("sessionMs", () => probeSellerCentralSession(tabId))
    done({ loggedInToStore, sellerCentralTab: opened ? "opened" : "reused", ...timings })
    if (loggedInToStore) {
      activeReportRun = { id: runId, paletteTabId: senderTab?.id, sellerCentralTabId: tabId }
      return { ok: true, loggedInToStore: true, sellerCentralTabId: tabId }
    }
    if (senderTab?.id === tabId) return { ok: true, loggedInToStore: false, sellerCentralTabId: tabId }

    await chrome.tabs.update(tabId, { active: true })
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })

    const prompt = await chrome.tabs.sendMessage(tabId, { type: "OPEN_PALETTE", mode: "report-login" }) as
      { ok?: boolean; error?: string }
    if (!prompt?.ok) throw new Error(prompt?.error ?? "Couldn’t open the command palette on Seller Central.")
    return { ok: true, loggedInToStore: false, sellerCentralTabId: tabId, openedPromptOnSellerCentral: true }
  } catch (error) {
    runLog.error("report.prepareFailed", { error: describeError(error), ...timings })
    throw error
  }
}

async function openStoreUrl(storeUrl: string, senderTab?: chrome.tabs.Tab): Promise<void> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const tab = pickSellerCentralTab(tabs, senderTab?.windowId)
  if (tab?.id !== undefined) {
    await chrome.tabs.update(tab.id, { active: true, url: storeUrl })
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
    void restorePageFocus(tab.id)
    void closeDuplicateSellerCentralTabs(tab.id)
    return
  }
  const created = await chrome.tabs.create({
    active: true,
    url: storeUrl,
    ...(senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }),
  })
  if (created.id !== undefined) {
    void restorePageFocus(created.id)
    void closeDuplicateSellerCentralTabs(created.id)
  }
}

async function closeDuplicateSellerCentralTabs(keepTabId: number): Promise<void> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const toClose = tabs
    .map((tab) => tab.id)
    .filter((id): id is number => id !== undefined && id !== keepTabId)
  if (toClose.length === 0) return
  try { await chrome.tabs.remove(toClose) } catch { /* best effort */ }
}

/** Show a background-created tab once it renders a real page, so focus lands in the page. */
export async function activateLoadedTab(tabId: number): Promise<void> {
  try {
    await waitForTabComplete(tabId)
  } catch {
    /* still activate so the user can see a partial page */
  }
  try {
    const tab = await chrome.tabs.get(tabId)
    await chrome.tabs.update(tabId, { active: true })
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
  } catch { /* tab closed mid-switch */ }
}

/** Yank keyboard focus out of the omnibox after extension-driven navigations. */
export async function restorePageFocus(tabId: number): Promise<void> {
  try {
    if (typeof chrome.tabs?.get !== "function" || typeof chrome.tabs?.onUpdated?.addListener !== "function") {
      return
    }
    await waitForTabComplete(tabId)
    const tab = await chrome.tabs.get(tabId)
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
    await chrome.tabs.update(tabId, { active: true })
  } catch {
    /* tab closed mid-switch */
  }
}

function jobLog(job: ActiveJob) {
  return log.withRun(job.id)
}

function jobContext(job: ActiveJob): LogData {
  return { store: job.storeName ?? job.storeId, stage: job.stage, elapsedMs: Date.now() - job.startedAt }
}

async function getActiveJob(): Promise<ActiveJob | undefined> {
  const job = (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY] as ActiveJob | undefined
  if (job && Date.now() - job.startedAt >= ACTIVE_JOB_TTL_MS) {
    jobLog(job).warn("account.switch.expired", jobContext(job))
    await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
    return undefined
  }
  return job
}
async function setActiveJob(job?: ActiveJob): Promise<void> {
  if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job })
  else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
}

/** Moves a job to `stage`, logging the transition once. */
async function setJobStage(job: ActiveJob, stage: ActiveJob["stage"]): Promise<void> {
  if (job.stage !== stage) jobLog(job).info("account.switch.stage", { ...jobContext(job), stage, from: job.stage })
  job.stage = stage
  await setActiveJob(job)
}

async function serializeSwitchStart<T>(action: () => Promise<T>): Promise<T> {
  const previous = startSwitchLock
  let release!: () => void
  startSwitchLock = new Promise<void>((resolve) => { release = resolve })
  await previous
  try { return await action() } finally { release() }
}
async function assertWorkflowSender(sender: chrome.runtime.MessageSender, jobId: unknown): Promise<ActiveJob> {
  const job = await getActiveJob()
  if (!job || job.id !== jobId || sender.tab?.id !== job.tabId) throw new Error("This login workflow is no longer authorized.")
  const hostname = sender.url ? new URL(sender.url).hostname : ""
  if (hostname !== "sellercentral.amazon.com") throw new Error("Unexpected login origin.")
  return job
}
async function getJobRecords(job: ActiveJob): Promise<{ store: StoreRecord; credential: CredentialRecord }> {
  const { vault } = await getUnlockedVault()
  const store = vault.stores.find(({ id }) => id === job.storeId)
  const credential = store && vault.credentials.find(({ id }) => id === store.credentialId)
  if (!store || !credential) throw new Error("The selected account no longer exists.")
  return { store, credential }
}

async function withJobDebugger<T>(
  job: ActiveJob,
  action: (target: chrome.debugger.Debuggee) => Promise<T>,
): Promise<T> {
  const target = { tabId: job.tabId }
  let attached = false
  try {
    await chrome.debugger.attach(target, "1.3")
    attached = true
    return await action(target)
  } finally {
    if (attached) {
      try { await chrome.debugger.detach(target) } catch { /* already detached */ }
    }
  }
}

function requireMasterPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 10) throw new Error("Use a master password of at least 10 characters.")
  return value
}

function requireSharePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 10) throw new Error("Use a share password of at least 10 characters.")
  return value
}

/** Starts a switch to a store on another credential: sign out in a Seller Central tab, then sign in. */
async function startSignInSwitch(store: StoreRecord, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const existingTabId = pickSellerCentralTab(tabs, sender.tab?.windowId)?.id
  const ownsTab = existingTabId === undefined
  let tabId = existingTabId
  try {
    if (tabId === undefined) {
      // Opening a foreground tab on about:blank makes Chrome focus the omnibox and keep it
      // focused across the whole switch, so create it in the background and activate it
      // once it is showing a real page.
      const tab = await chrome.tabs.create({
        active: false,
        url: "about:blank",
        ...(sender.tab?.windowId === undefined ? {} : { windowId: sender.tab.windowId }),
      })
      if (tab.id === undefined) throw new Error("Chrome did not create the login tab.")
      tabId = tab.id
    }
    const job: ActiveJob = {
      id: crypto.randomUUID(),
      tabId,
      storeId: store.id,
      storeName: store.name,
      stage: "logout",
      startedAt: Date.now(),
      ownsTab,
    }
    await setActiveJob(job)
    await chrome.tabs.update(tabId, { url: LOGOUT_URL })
    void activateLoadedTab(tabId)
    jobLog(job).info("account.switch.start", { store: store.name, path: "sign-in", tab: ownsTab ? "new" : "reused" })
    return { ok: true, jobId: job.id }
  } catch (error) {
    if (ownsTab && tabId !== undefined) try { await chrome.tabs.remove(tabId) } catch { /* best effort */ }
    await setActiveJob(undefined)
    throw error
  }
}

export async function handleAccountsMessage(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  switch (message.type) {
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
          ? { storeId: job.storeId, storeName: activeStore?.name ?? "Selected store", stage: job.stage, startedAt: job.startedAt }
          : undefined,
      }
    }
    case "ACCOUNTS_CREATE": {
      if (await getEnvelope()) throw new Error("The account vault already exists.")
      const masterPassword = requireMasterPassword(message.masterPassword)
      const done = log.time("vault.create")
      const { envelope, keyBytes } = await encryptVault(emptyVault(), masterPassword)
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: [] })
      await chrome.storage.local.remove(CURRENT_STORE_KEY)
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      done()
      return { ok: true }
    }
    case "ACCOUNTS_UNLOCK": {
      const envelope = await getEnvelope()
      if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.")
      const done = log.time("vault.unlock")
      try {
        const { keyBytes } = await decryptVault(envelope, message.masterPassword)
        await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      } catch {
        done({ ok: false }, "warn")
        throw new Error("Incorrect master password or damaged vault.")
      }
      done({ ok: true })
      return { ok: true }
    }
    case "ACCOUNTS_LOCK":
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY])
      log.info("vault.lock")
      return { ok: true }
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
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope })
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      log.info("vault.changePassword")
      return { ok: true }
    }
    case "ACCOUNTS_RESET":
      await chrome.storage.local.remove([VAULT_STORAGE_KEY, STORE_INDEX_KEY, CURRENT_STORE_KEY])
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY])
      log.warn("vault.reset")
      return { ok: true }
    case "ACCOUNTS_OPEN_OPTIONS":
      await chrome.runtime.openOptionsPage()
      return { ok: true }
    case "ACCOUNTS_START_SWITCH": {
      return serializeSwitchStart(async () => {
        if (await getActiveJob()) throw new Error("Another account switch is already running.")
        const { vault } = await getUnlockedVault()
        const store = vault.stores.find(({ id }) => id === message.storeId)
        if (!store) throw new Error("The selected store was not found.")
        const currentStoreId = await getCurrentStoreId()
        const currentStore = currentStoreId ? vault.stores.find(({ id }) => id === currentStoreId) : undefined
        if (currentStore && currentStore.credentialId === store.credentialId) {
          await openStoreUrl(store.storeUrl, sender.tab)
          await setCurrentStoreId(store.id)
          log.info("account.switch.start", { store: store.name, path: "same-credential" })
          return { ok: true }
        }
        return startSignInSwitch(store, sender)
      })
    }
    case "ACCOUNTS_FOCUS_CURRENT_STORE": {
      if (!(await getCurrentStoreId())) throw new Error("No store is currently selected.")
      return focusOrOpenSellerCentralTab(sender.tab)
    }
    case "ACCOUNTS_FOCUS_SWITCH": {
      const job = await getActiveJob()
      if (!job || job.tabId < 0) throw new Error("No account switch is running.")
      const tab = await chrome.tabs.update(job.tabId, { active: true })
      if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
      return { ok: true }
    }
    case "ACCOUNTS_CANCEL_SWITCH": {
      const job = await getActiveJob()
      if (!job) return { ok: true }
      await setActiveJob(undefined)
      if (job.ownsTab && job.tabId >= 0) try { await chrome.tabs.remove(job.tabId) } catch { /* tab already closed */ }
      jobLog(job).info("account.switch.cancelled", jobContext(job))
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_GET_JOB": {
      const job = await getActiveJob()
      if (!job || sender.tab?.id !== job.tabId) return { ok: true, job: null }
      return { ok: true, job: { id: job.id, stage: job.stage } }
    }
    case "ACCOUNT_AUTOMATION_SECRET": {
      const job = await assertWorkflowSender(sender, message.jobId)
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
        const parsed = parseOtpAuthUri(credential.otpAuthUri)
        const remaining = parsed.period - (Math.floor(Date.now() / 1000) % parsed.period)
        if (remaining <= 5) {
          jobLog(job).info("account.switch.otpWait", { waitMs: (remaining + 1) * 1000 })
          return { ok: true, waitMs: (remaining + 1) * 1000 }
        }
        await setJobStage(job, "otp")
        return { ok: true, value: await generateTotp(credential.otpAuthUri) }
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
      await withJobDebugger(job, async (target) => {
        const send = (type: string, extra: Record<string, unknown> = {}) =>
          chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type, x, y, ...extra })
        await send("mouseMoved")
        await send("mousePressed", { button: "left", clickCount: 1 })
        await send("mouseReleased", { button: "left", clickCount: 1 })
      })
      jobLog(job).info("account.switch.click", { ...jobContext(job), action: message.action })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_PAUSED": {
      const job = await assertWorkflowSender(sender, message.jobId)
      await setJobStage(job, "paused")
      jobLog(job).warn("account.switch.paused", { ...jobContext(job), reason: "captcha" })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_LEAVE_LOGOUT": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if (job.stage !== "logout") return { ok: true }
      await advanceLogoutToSignIn(job)
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_COMPLETE": {
      const job = await assertWorkflowSender(sender, message.jobId)
      const { store } = await getJobRecords(job)
      await setJobStage(job, "authenticated")
      await chrome.tabs.update(job.tabId, { active: true, url: store.storeUrl })
      await setCurrentStoreId(store.id)
      await setActiveJob(undefined)
      void restorePageFocus(job.tabId)
      void closeDuplicateSellerCentralTabs(job.tabId)
      jobLog(job).info("account.switch.complete", { store: store.name, ms: Date.now() - job.startedAt })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_ERROR": {
      const job = await assertWorkflowSender(sender, message.jobId)
      await setActiveJob(undefined)
      const error = typeof message.error === "string" ? message.error : "Unknown error."
      jobLog(job).error("account.switch.failed", { ...jobContext(job), error })
      return { ok: true }
    }
    default: throw new Error("Unknown account command.")
  }
}

const logoutExits = new Map<string, Promise<void>>()

/** The tab listener and the content script both leave logout; share one navigation so neither cancels the other ("Navigation rejected"). */
function advanceLogoutToSignIn(job: ActiveJob): Promise<void> {
  let exit = logoutExits.get(job.id)
  if (!exit) {
    exit = (async () => {
      await setJobStage(job, "signin")
      await chrome.tabs.update(job.tabId, { url: SIGN_IN_URL })
    })()
    exit.catch(() => logoutExits.delete(job.id))
    logoutExits.set(job.id, exit)
  }
  return exit
}

export async function handleAccountTabUpdated(
  tabId: number,
  changeInfo: { status?: string; url?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  if (changeInfo.status !== "complete") return
  const job = await getActiveJob()
  if (!job || job.tabId !== tabId || job.stage !== "logout") return

  const currentUrl = changeInfo.url ?? tab.url
  if (!currentUrl || currentUrl === "about:blank") return
  let url: URL
  try { url = new URL(currentUrl) } catch { return }
  if (url.hostname !== "sellercentral.amazon.com") return
  if (!url.pathname.startsWith("/ap/") && !url.pathname.startsWith("/sign-out")) return

  // Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
  await advanceLogoutToSignIn(job)
}

/** Only extension pages (popup, options) may read or clear the diagnostics log. */
function isExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return sender.id === chrome.runtime.id && Boolean(sender.url?.startsWith(chrome.runtime.getURL("")))
}

export function handleLogMessage(
  type: string,
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  store: LogStore,
  sendResponse: (response: unknown) => void,
): boolean | undefined {
  if (type === LOG_ENTRIES_MESSAGE) {
    const tab = sender.tab?.id
    const entries = sanitizeLogEntries(message.entries).map((entry) => {
      const run = entry.run ?? reportRunForTab(tab)
      return { ...entry, ...(tab === undefined ? {} : { tab }), ...(run ? { run } : {}) }
    })
    store.append(entries)
    sendResponse({ ok: true })
    return undefined
  }
  if (type !== LOGS_GET_MESSAGE && type !== LOGS_CLEAR_MESSAGE) return undefined
  if (!isExtensionPage(sender)) {
    sendResponse({ ok: false, error: "Logs are only available to extension pages." })
    return undefined
  }
  const request = type === LOGS_GET_MESSAGE
    ? store.read().then((entries) => ({ ok: true, entries }))
    : store.clear().then(() => ({ ok: true }))
  void request.then(sendResponse, (error: unknown) => sendResponse({ ok: false, error: errorMessage(error, "Couldn’t read logs.") }))
  return true
}

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

  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const handled = idsListener(message, sender, sendResponse)
    if (handled) return true
    if (!message || typeof message !== "object" || !("type" in message)) return undefined
    const record = message as Record<string, unknown>
    const type = String(record.type)
    if (type === LOG_ENTRIES_MESSAGE || type === LOGS_GET_MESSAGE || type === LOGS_CLEAR_MESSAGE) {
      return handleLogMessage(type, record, sender, logStore, sendResponse)
    }
    if (type === "GET_SETTINGS") {
      return respond(type, loadSettings().then((settings) => ({ ok: true, settings })), sendResponse, "Couldn’t load settings.")
    }
    if (type === "REPORTS_PREPARE") {
      return respond(type, prepareReports(sender.tab), sendResponse, "Couldn’t open Seller Central.", true)
    }
    if (isReportFetchType(type)) {
      const { fallbackError } = REPORT_REQUESTS[type]
      return respond(type, fetchReportSource(type, sender.tab), sendResponse, fallbackError, true)
    }
    if (type === "REPORTS_PROGRESS") {
      void relayReportProgress(message).then(sendResponse, () => sendResponse({ ok: true }))
      return true
    }
    if (!type.startsWith("ACCOUNT")) return undefined
    return respond(type, handleAccountsMessage(record, sender), sendResponse, "Account operation failed.")
  })
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { void handleAccountTabUpdated(tabId, changeInfo, tab) })
  chrome.tabs.onRemoved.addListener((tabId) => {
    void getActiveJob().then(async (job) => {
      if (job?.tabId !== tabId) return
      jobLog(job).warn("account.switch.tabClosed", jobContext(job))
      await setActiveJob(undefined)
    })
  })
}
