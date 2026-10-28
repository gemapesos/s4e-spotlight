/** Opens case, shipment, SKU and removal order IDs in tabs, and the Time Out form and sheet. */
import { createLogger, describeError, errorMessage } from "@/lib/log"
import { DEFAULT_TIME_OUT_FORM_VALUES, loadSettings, TIME_OUT_FORM_BASE_URL, TIME_OUT_FORM_ENTRY_IDS, type TimeOutFormValues } from "@/lib/settings"
import { MAX_BULK_IDS } from "@/shared/messages"
import { requireSenderTab, type SenderTab } from "./senders"

const log = createLogger("background")

const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID="
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/"
const REMOVAL_ORDER_URL = "https://sellercentral.amazon.com/recoveryui/removal-order/detail?sourceRemovalOrderId="
const SKU_URL = "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm="
const SKU_URL_SUFFIX = "&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx"
export const TIME_OUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1E7gfUVzy47vboZHOJ6xd8Jwx-1N6oewaVggrtI7G4yw/edit?gid=0#gid=0"
export type OpenIdsResponse =
  | { ok: true; openedCount: number }
  | { ok: false; error: string; openedIds?: string[]; rolledBackIds?: string[] }
export type CreateTab = (properties: chrome.tabs.CreateProperties) => Promise<chrome.tabs.Tab>
type RemoveTabs = (tabIds: number[]) => Promise<void>
type OpenTabs = (ids: unknown, senderTab: chrome.tabs.Tab | undefined) => Promise<{ openedCount: number }>
type OpenTimeOut = (senderTab: chrome.tabs.Tab | undefined) => Promise<{ openedCount: number }>
type LoadTimeOutFormValues = () => Promise<TimeOutFormValues>
export const createChromeTab: CreateTab = (properties) => chrome.tabs.create(properties)
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
