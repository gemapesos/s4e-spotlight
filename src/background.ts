const OPEN_CASE_IDS_MESSAGE = "OPEN_CASE_IDS"
const OPEN_SHIPMENT_IDS_MESSAGE = "OPEN_SHIPMENT_IDS"
const CASE_ID_PATTERN = /^\d{11}$/
const SHIPMENT_ID_PATTERN = /^FBA[A-Z0-9]{9}$/
const CASE_URL =
  "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID="
const SHIPMENT_URL =
  "https://sellercentral.amazon.com/fba/inbound-shipment/summary/"

export interface OpenCaseIdsMessage {
  type: typeof OPEN_CASE_IDS_MESSAGE
  caseIds: string[]
}

export interface OpenShipmentIdsMessage {
  type: typeof OPEN_SHIPMENT_IDS_MESSAGE
  shipmentIds: string[]
}

export type OpenIdsResponse =
  | { ok: true }
  | { ok: false; error: string }

type CreateTab = (
  createProperties: chrome.tabs.CreateProperties,
) => Promise<chrome.tabs.Tab>

type OpenTabs = (
  ids: unknown,
  senderTab: chrome.tabs.Tab | undefined,
) => Promise<void>

export function normalizeCaseIds(caseIds: unknown): string[] {
  if (!Array.isArray(caseIds)) return []

  return [
    ...new Set(
      caseIds.filter(
        (caseId): caseId is string =>
          typeof caseId === "string" && CASE_ID_PATTERN.test(caseId),
      ),
    ),
  ]
}

export function buildCaseUrl(caseId: string): string {
  return `${CASE_URL}${caseId}`
}

export function normalizeShipmentIds(shipmentIds: unknown): string[] {
  if (!Array.isArray(shipmentIds)) return []

  return [
    ...new Set(
      shipmentIds
        .filter((shipmentId): shipmentId is string =>
          typeof shipmentId === "string",
        )
        .map((shipmentId) => shipmentId.toUpperCase())
        .filter((shipmentId) => SHIPMENT_ID_PATTERN.test(shipmentId)),
    ),
  ]
}

export function buildShipmentUrl(shipmentId: string): string {
  return `${SHIPMENT_URL}${shipmentId}/contents`
}

async function createBackgroundTabs(
  ids: string[],
  senderTab: chrome.tabs.Tab | undefined,
  buildUrl: (id: string) => string,
  createTab: CreateTab,
): Promise<void> {
  if (senderTab?.id === undefined || senderTab.windowId === undefined) {
    throw new Error("The originating tab is unavailable.")
  }

  for (const id of ids) {
    await createTab({
      active: false,
      openerTabId: senderTab.id,
      url: buildUrl(id),
      windowId: senderTab.windowId,
    })
  }
}

export async function openCaseTabs(
  caseIds: unknown,
  senderTab: chrome.tabs.Tab | undefined,
  createTab: CreateTab = (properties) => chrome.tabs.create(properties),
): Promise<void> {
  const normalizedCaseIds = normalizeCaseIds(caseIds)

  if (normalizedCaseIds.length === 0) {
    throw new Error("No valid Case IDs were provided.")
  }

  await createBackgroundTabs(
    normalizedCaseIds,
    senderTab,
    buildCaseUrl,
    createTab,
  )
}

export async function openShipmentTabs(
  shipmentIds: unknown,
  senderTab: chrome.tabs.Tab | undefined,
  createTab: CreateTab = (properties) => chrome.tabs.create(properties),
): Promise<void> {
  const normalizedShipmentIds = normalizeShipmentIds(shipmentIds)

  if (normalizedShipmentIds.length === 0) {
    throw new Error("No valid Shipment IDs were provided.")
  }

  await createBackgroundTabs(
    normalizedShipmentIds,
    senderTab,
    buildShipmentUrl,
    createTab,
  )
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Couldn’t open tabs."
}

export function createOpenIdsMessageListener(
  openCases: OpenTabs = openCaseTabs,
  openShipments: OpenTabs = openShipmentTabs,
): (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: OpenIdsResponse) => void,
) => boolean | undefined {
  return (message, sender, sendResponse) => {
    if (
      typeof message !== "object" ||
      message === null ||
      !("type" in message)
    ) {
      return undefined
    }

    let openTabs: OpenTabs
    let ids: unknown

    if (message.type === OPEN_CASE_IDS_MESSAGE) {
      openTabs = openCases
      ids = "caseIds" in message ? message.caseIds : undefined
    } else if (message.type === OPEN_SHIPMENT_IDS_MESSAGE) {
      openTabs = openShipments
      ids = "shipmentIds" in message ? message.shipmentIds : undefined
    } else {
      return undefined
    }

    void openTabs(ids, sender.tab).then(
      () => sendResponse({ ok: true }),
      (error: unknown) =>
        sendResponse({ ok: false, error: getErrorMessage(error) }),
    )

    return true
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(createOpenIdsMessageListener())
}
