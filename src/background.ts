import {
  ACTIVE_JOB_STORAGE_KEY,
  CURRENT_STORE_KEY,
  SESSION_KEY_STORAGE_KEY,
  STORE_INDEX_KEY,
  VAULT_STORAGE_KEY,
  decryptVault,
  decryptVaultWithKey,
  deserializeKey,
  emptyVault,
  encryptVault,
  encryptVaultWithKey,
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
  DEFAULT_TIME_OUT_FORM_VALUES,
  loadSettings,
  TIME_OUT_FORM_BASE_URL,
  TIME_OUT_FORM_ENTRY_IDS,
  type TimeOutFormValues,
} from "./lib/settings.js"

const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID="
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/"
const SKU_URL = "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm="
const SKU_URL_SUFFIX = "&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx"
export const TIME_OUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1E7gfUVzy47vboZHOJ6xd8Jwx-1N6oewaVggrtI7G4yw/edit?gid=0#gid=0"
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx"
export const SIGN_IN_URL = "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_sw_signup_us&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0"
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

const MAX_BULK_IDS = 50
const ACTIVE_JOB_TTL_MS = 15 * 60 * 1000

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

export function normalizeCaseIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === "string" && /^\d{11}$/u.test(id)))] : []
}
export function normalizeShipmentIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string").map((id) => id.toUpperCase()).filter((id) => /^FBA[A-Z0-9]{9}$/u.test(id)))]
    : []
}
export function normalizeSkuIds(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter((id) => id.length > 0 && id.length <= 40))]
    : []
}
export function buildCaseUrl(id: string): string { return `${CASE_URL}${id}` }
export function buildShipmentUrl(id: string): string { return `${SHIPMENT_URL}${id}/contents` }
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
  const reason = cause instanceof Error ? cause.message : "Chrome could not create a tab."
  const suffix = openedIds.length
    ? ` ${openedIds.length} tab(s) could not be closed: ${openedIds.join(", ")}.`
    : " Any tabs opened by this attempt were closed."
  return new TabBatchError(`${reason}${suffix}`, openedIds, rolledBackIds)
}

async function createTabsInParallel(
  targets: ReadonlyArray<{ id: string; active: boolean; url: string }>,
  senderTab: chrome.tabs.Tab & { id: number; windowId: number },
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

async function createBackgroundTabs(
  ids: string[],
  senderTab: chrome.tabs.Tab | undefined,
  buildUrl: (id: string) => string,
  createTab: CreateTab,
  removeTabs: RemoveTabs,
): Promise<{ openedCount: number }> {
  if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.")
  if (ids.length > MAX_BULK_IDS) throw new Error(`Open no more than ${MAX_BULK_IDS} IDs at a time.`)

  return createTabsInParallel(
    ids.map((id) => ({ id, active: false, url: buildUrl(id) })),
    senderTab as chrome.tabs.Tab & { id: number; windowId: number },
    createTab,
    removeTabs,
  )
}
export async function openCaseTabs(ids: unknown, senderTab: chrome.tabs.Tab | undefined, createTab: CreateTab = (properties) => chrome.tabs.create(properties), removeTabs: RemoveTabs = (tabIds) => chrome.tabs.remove(tabIds)): Promise<{ openedCount: number }> {
  const normalized = normalizeCaseIds(ids)
  if (!normalized.length) throw new Error("No valid Case IDs were provided.")
  return createBackgroundTabs(normalized, senderTab, buildCaseUrl, createTab, removeTabs)
}
export async function openShipmentTabs(ids: unknown, senderTab: chrome.tabs.Tab | undefined, createTab: CreateTab = (properties) => chrome.tabs.create(properties), removeTabs: RemoveTabs = (tabIds) => chrome.tabs.remove(tabIds)): Promise<{ openedCount: number }> {
  const normalized = normalizeShipmentIds(ids)
  if (!normalized.length) throw new Error("No valid Shipment IDs were provided.")
  return createBackgroundTabs(normalized, senderTab, buildShipmentUrl, createTab, removeTabs)
}
export async function openSkuTabs(ids: unknown, senderTab: chrome.tabs.Tab | undefined, createTab: CreateTab = (properties) => chrome.tabs.create(properties), removeTabs: RemoveTabs = (tabIds) => chrome.tabs.remove(tabIds)): Promise<{ openedCount: number }> {
  const normalized = normalizeSkuIds(ids)
  if (!normalized.length) throw new Error("No valid SKUs were provided.")
  return createBackgroundTabs(normalized, senderTab, buildSkuUrl, createTab, removeTabs)
}

export async function openTimeOutTabs(
  senderTab: chrome.tabs.Tab | undefined,
  createTab: CreateTab = (properties) => chrome.tabs.create(properties),
  removeTabs: RemoveTabs = (tabIds) => chrome.tabs.remove(tabIds),
  date = new Date(),
  loadFormValues: LoadTimeOutFormValues = async () => (await loadSettings()).timeOutForm,
): Promise<{ openedCount: number }> {
  if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.")
  const values = await loadFormValues()

  return createTabsInParallel(
    [
      { id: "Google Sheet", active: false, url: TIME_OUT_SHEET_URL },
      { id: "Google Form", active: true, url: buildTimeOutFormUrl(date, values) },
    ],
    senderTab as chrome.tabs.Tab & { id: number; windowId: number },
    createTab,
    removeTabs,
  )
}

export function createOpenIdsMessageListener(openCases: OpenTabs = openCaseTabs, openShipments: OpenTabs = openShipmentTabs, openSkus: OpenTabs = openSkuTabs, openTimeOut: OpenTimeOut = openTimeOutTabs) {
  return (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: OpenIdsResponse) => void): boolean | undefined => {
    if (!message || typeof message !== "object" || !("type" in message)) return undefined
    const record = message as Record<string, unknown>
    if (record.type === "OPEN_TIME_OUT") {
      void openTimeOut(sender.tab).then(
        (result) => sendResponse({ ok: true, openedCount: result.openedCount }),
        (error: unknown) => sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Couldn’t open Time Out.",
          ...(error instanceof TabBatchError ? { openedIds: error.openedIds, rolledBackIds: error.rolledBackIds } : {}),
        }),
      )
      return true
    }
    const handler = record.type === "OPEN_CASE_IDS" ? openCases : record.type === "OPEN_SHIPMENT_IDS" ? openShipments : record.type === "OPEN_SKU_IDS" ? openSkus : null
    if (!handler) return undefined
    const ids = record.type === "OPEN_CASE_IDS" ? record.caseIds : record.type === "OPEN_SHIPMENT_IDS" ? record.shipmentIds : record.skuIds
    void handler(ids, sender.tab).then(
      (result) => sendResponse({ ok: true, openedCount: result?.openedCount ?? 0 }),
      (error: unknown) => sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Couldn’t open tabs.",
        ...(error instanceof TabBatchError ? { openedIds: error.openedIds, rolledBackIds: error.rolledBackIds } : {}),
      }),
    )
    return true
  }
}

interface ActiveJob {
  id: string
  tabId: number
  storeId: string
  stage: "logout" | "signin" | "email" | "password" | "otp" | "authenticated" | "paused"
  startedAt: number
}

const AUTOMATION_CLICK_ACTIONS = new Set(["continue", "password-submit", "otp-submit"])
let startSwitchLock: Promise<void> = Promise.resolve()

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
  const nextEnvelope = await encryptVaultWithKey(vault, key, Uint8Array.from(atob(envelope.salt), (c) => c.charCodeAt(0)), envelope.iterations)
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
  if (withId.length === 0) return undefined
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

export async function ensureSellerCentralTab(senderTab?: chrome.tabs.Tab): Promise<{ tabId: number; focused?: true; opened?: true }> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const tab = pickSellerCentralTab(tabs, senderTab?.windowId)
  if (tab?.id !== undefined) {
    await chrome.tabs.update(tab.id, { active: true })
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
    return { tabId: tab.id, focused: true }
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
  const current = await chrome.tabs.get(tabId)
  if (current.status === "complete" && current.url && current.url !== "about:blank") return

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(onUpdated)
      reject(new Error("Seller Central did not finish loading."))
    }, timeoutMs)

    function onUpdated(updatedTabId: number, changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab): void {
      if (updatedTabId !== tabId || changeInfo.status !== "complete") return
      const url = changeInfo.url ?? tab.url
      if (!url || url === "about:blank") return
      clearTimeout(timer)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      resolve()
    }

    chrome.tabs.onUpdated.addListener(onUpdated)
  })
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
  return last.loggedInToStore
}

export async function prepareReports(senderTab?: chrome.tabs.Tab): Promise<ReportsPrepareResult> {
  const { tabId } = await ensureSellerCentralTab(senderTab)
  await waitForTabComplete(tabId)
  const loggedInToStore = await probeSellerCentralSession(tabId)
  if (loggedInToStore) return { ok: true, loggedInToStore: true, sellerCentralTabId: tabId }
  if (senderTab?.id === tabId) return { ok: true, loggedInToStore: false, sellerCentralTabId: tabId }

  const opened = await chrome.tabs.sendMessage(tabId, { type: "OPEN_PALETTE", mode: "report-login" }) as { ok?: boolean; error?: string }
  if (!opened?.ok) throw new Error(opened?.error ?? "Couldn’t open the command palette on Seller Central.")
  return { ok: true, loggedInToStore: false, sellerCentralTabId: tabId, openedPromptOnSellerCentral: true }
}

async function openStoreUrl(storeUrl: string, senderTab?: chrome.tabs.Tab): Promise<void> {
  const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  const tab = pickSellerCentralTab(tabs, senderTab?.windowId)
  if (tab?.id !== undefined) {
    await chrome.tabs.update(tab.id, { active: true, url: storeUrl })
    if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
    return
  }
  await chrome.tabs.create({
    active: true,
    url: storeUrl,
    ...(senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }),
  })
}

async function getActiveJob(): Promise<ActiveJob | undefined> {
  const job = (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY] as ActiveJob | undefined
  if (job && Date.now() - job.startedAt >= ACTIVE_JOB_TTL_MS) {
    await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
    return undefined
  }
  return job
}
async function setActiveJob(job?: ActiveJob): Promise<void> {
  if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job })
  else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY)
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

export async function handleAccountsMessage(message: Record<string, unknown>, sender: chrome.runtime.MessageSender): Promise<ApiResponse> {
  switch (message.type) {
    case "ACCOUNTS_STATUS": {
      const [envelope, key, stored] = await Promise.all([
        getEnvelope(),
        getSessionKey(),
        chrome.storage.local.get([STORE_INDEX_KEY, CURRENT_STORE_KEY]),
      ])
      const stores = (stored[STORE_INDEX_KEY] ?? []) as StoreIndexRecord[]
      const job = await getActiveJob()
      const activeStore = job ? stores.find((store) => store.id === job.storeId) : undefined
      return {
        ok: true,
        initialized: Boolean(envelope),
        unlocked: Boolean(key),
        stores,
        currentStore: currentStoreFromIndex(stores, typeof stored[CURRENT_STORE_KEY] === "string" ? stored[CURRENT_STORE_KEY] : undefined),
        activeSwitch: job ? { storeId: job.storeId, storeName: activeStore?.name ?? "Selected store", stage: job.stage, startedAt: job.startedAt } : undefined,
      }
    }
    case "ACCOUNTS_CREATE": {
      if (await getEnvelope()) throw new Error("The account vault already exists.")
      if (typeof message.masterPassword !== "string" || message.masterPassword.length < 10) throw new Error("Use a master password of at least 10 characters.")
      const { envelope, keyBytes } = await encryptVault(emptyVault(), message.masterPassword)
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: [] })
      await chrome.storage.local.remove(CURRENT_STORE_KEY)
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      return { ok: true }
    }
    case "ACCOUNTS_UNLOCK": {
      const envelope = await getEnvelope()
      if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.")
      try {
        const { keyBytes } = await decryptVault(envelope, message.masterPassword)
        await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      } catch { throw new Error("Incorrect master password or damaged vault.") }
      return { ok: true }
    }
    case "ACCOUNTS_LOCK":
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY])
      return { ok: true }
    case "ACCOUNTS_GET_VAULT": {
      const { vault } = await getUnlockedVault()
      return { ok: true, vault }
    }
    case "ACCOUNTS_SAVE_VAULT": {
      const current = await getUnlockedVault()
      const vault = message.vault as AccountVault
      await saveVault(vault, current.envelope, current.key)
      return { ok: true }
    }
    case "ACCOUNTS_CHANGE_MASTER_PASSWORD": {
      const { vault } = await getUnlockedVault()
      if (typeof message.masterPassword !== "string" || message.masterPassword.length < 10) throw new Error("Use a master password of at least 10 characters.")
      const { envelope, keyBytes } = await encryptVault(vault, message.masterPassword)
      await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope })
      await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
      return { ok: true }
    }
    case "ACCOUNTS_RESET":
      await chrome.storage.local.remove([VAULT_STORAGE_KEY, STORE_INDEX_KEY, CURRENT_STORE_KEY])
      await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY])
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
          return { ok: true }
        }
        let tabId: number | undefined
        try {
          const tab = await chrome.tabs.create({ active: true, url: "about:blank" })
          if (tab.id === undefined) throw new Error("Chrome did not create the login tab.")
          tabId = tab.id
          const job: ActiveJob = { id: crypto.randomUUID(), tabId: tab.id, storeId: store.id, stage: "logout", startedAt: Date.now() }
          await setActiveJob(job)
          await chrome.tabs.update(tab.id, { url: LOGOUT_URL })
          return { ok: true, jobId: job.id }
        } catch (error) {
          if (tabId !== undefined) try { await chrome.tabs.remove(tabId) } catch { /* best effort */ }
          await setActiveJob(undefined)
          throw error
        }
      })
    }
    case "ACCOUNTS_FOCUS_CURRENT_STORE": {
      if (!(await getCurrentStoreId())) throw new Error("No store is currently selected.")
      return focusOrOpenSellerCentralTab(sender.tab)
    }
    case "ACCOUNTS_FOCUS_SWITCH": {
      const job = await getActiveJob()
      if (!job || job.tabId < 0) throw new Error("No account switch is running.")
      await chrome.tabs.update(job.tabId, { active: true })
      return { ok: true }
    }
    case "ACCOUNTS_CANCEL_SWITCH": {
      const job = await getActiveJob()
      if (!job) return { ok: true }
      await setActiveJob(undefined)
      if (job.tabId >= 0) try { await chrome.tabs.remove(job.tabId) } catch { /* tab already closed */ }
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
      if (message.kind === "email") { job.stage = "email"; await setActiveJob(job); return { ok: true, value: credential.domain } }
      if (message.kind === "password") { job.stage = "password"; await setActiveJob(job); return { ok: true, value: credential.password } }
      if (message.kind === "otp") {
        const parsed = parseOtpAuthUri(credential.otpAuthUri)
        const remaining = parsed.period - (Math.floor(Date.now() / 1000) % parsed.period)
        if (remaining <= 5) return { ok: true, waitMs: (remaining + 1) * 1000 }
        job.stage = "otp"; await setActiveJob(job)
        return { ok: true, value: await generateTotp(credential.otpAuthUri) }
      }
      throw new Error("Unknown credential stage.")
    }
    case "ACCOUNT_AUTOMATION_CLICK": {
      const job = await assertWorkflowSender(sender, message.jobId)
      if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) throw new Error("Unsupported login click action.")
      const { x, y } = message
      if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw new Error("Invalid login click coordinates.")
      await withJobDebugger(job, async (target) => {
        await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y })
        await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 })
        await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 })
      })
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_PAUSED": {
      const job = await assertWorkflowSender(sender, message.jobId)
      job.stage = "paused"; await setActiveJob(job)
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
      job.stage = "authenticated"; await setActiveJob(job)
      await chrome.tabs.update(job.tabId, { url: store.storeUrl })
      await setCurrentStoreId(store.id)
      await setActiveJob(undefined)
      return { ok: true }
    }
    case "ACCOUNT_AUTOMATION_ERROR": {
      await assertWorkflowSender(sender, message.jobId)
      await setActiveJob(undefined)
      return { ok: true }
    }
    default: throw new Error("Unknown account command.")
  }
}

async function advanceLogoutToSignIn(job: ActiveJob): Promise<void> {
  job.stage = "signin"
  await setActiveJob(job)
  await chrome.tabs.update(job.tabId, { url: SIGN_IN_URL })
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

  // Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
  await advanceLogoutToSignIn(job)
}

const idsListener = createOpenIdsMessageListener()
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })
  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const handled = idsListener(message, sender, sendResponse)
    if (handled) return true
    if (!message || typeof message !== "object" || !("type" in message)) return undefined
    const type = String((message as { type: unknown }).type)
    if (type === "GET_SETTINGS") {
      void loadSettings().then(
        (settings) => sendResponse({ ok: true, settings }),
        (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Couldn’t load settings." }),
      )
      return true
    }
    if (type === "REPORTS_PREPARE") {
      void prepareReports(sender.tab).then(
        sendResponse,
        (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Couldn’t open Seller Central." }),
      )
      return true
    }
    if (!type.startsWith("ACCOUNT")) return undefined
    void handleAccountsMessage(message as Record<string, unknown>, sender).then(sendResponse, (error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : "Account operation failed." }))
    return true
  })
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => { void handleAccountTabUpdated(tabId, changeInfo, tab) })
  chrome.tabs.onRemoved.addListener((tabId) => { void getActiveJob().then((job) => job?.tabId === tabId ? setActiveJob(undefined) : undefined) })
}
