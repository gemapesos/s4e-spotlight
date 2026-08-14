import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import styles from "./styles.css?inline"
import { CommandPalette, type AccountsStatus, type PaletteMode, type ReportsPrepareResult } from "./CommandPalette"
import { applyPrefersColorScheme } from "./lib/colorScheme"
import { buildReportWorkbook, downloadBytes, reportFileName, reportWorkbookSheets } from "./lib/reports"
import {
  DEFAULT_ENABLED_FEATURES,
  enabledFeaturesEqual,
  parseSettings,
  type EnabledFeatures,
  type ExtensionSettings,
} from "./lib/settings"
import { isPaletteShortcut } from "./lib/shortcut"
import type { UnfulfillableListing } from "./lib/unfulfillable"

const HOST_ID = "command-palette-extension-root"
const PALETTE_OPEN_ATTRIBUTE = "data-s4e-palette-open"
const PASTE_GUARD_KEY = "__s4eSpotlightPasteGuard"
const GEIST_FONT_FILE = "geist-latin-wght-normal.woff2"

function paletteFontFaceCss(): string {
  const fontUrl =
    typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL(GEIST_FONT_FILE)
      : ""
  if (!fontUrl) return ""
  return `@font-face{font-family:"Geist Variable";font-style:normal;font-display:swap;font-weight:100 900;src:url("${fontUrl}") format("woff2-variations")}`
}

interface PasteGuardController {
  destroy: () => void
}

type PasteGuardWindow = Window &
  typeof globalThis & {
    [PASTE_GUARD_KEY]?: PasteGuardController
  }

export interface OpenCaseIdsMessage {
  type: "OPEN_CASE_IDS"
  caseIds: string[]
}

export interface OpenShipmentIdsMessage {
  type: "OPEN_SHIPMENT_IDS"
  shipmentIds: string[]
}

export interface OpenSkuIdsMessage {
  type: "OPEN_SKU_IDS"
  skuIds: string[]
}

export interface OpenTimeOutMessage {
  type: "OPEN_TIME_OUT"
}

export type OpenIdsResponse =
  | { ok: true; openedCount: number }
  | { ok: false; error: string; openedIds?: string[]; rolledBackIds?: string[] }

export interface MountedCommandPalette {
  destroy: () => void
  host: HTMLElement
  setOpen: (open: boolean, mode?: PaletteMode) => void
  shadowRoot: ShadowRoot
}

export interface MountCommandPaletteOptions {
  document?: Document
  shadowMode?: ShadowRootMode
}

interface OverflowStyles {
  overflow: string
  overflowX: string
  overflowY: string
}

function lockDocumentScroll(document: Document): () => void {
  const elements = [document.documentElement, document.body]
  const previousStyles = elements.map<OverflowStyles>((element) => ({
    overflow: element.style.overflow,
    overflowX: element.style.overflowX,
    overflowY: element.style.overflowY,
  }))

  for (const element of elements) {
    element.style.overflow = "hidden"
  }

  return () => {
    elements.forEach((element, index) => {
      const previous = previousStyles[index]
      element.style.overflow = previous.overflow
      element.style.overflowX = previous.overflowX
      element.style.overflowY = previous.overflowY
    })
  }
}

function getDeepActiveElement(document: Document): HTMLElement | null {
  let activeElement: Element | null = document.activeElement

  while (activeElement?.shadowRoot?.activeElement) {
    activeElement = activeElement.shadowRoot.activeElement
  }

  return activeElement instanceof HTMLElement ? activeElement : null
}

/** rem resolves against document <html>, not the shadow host — normalize to a 16px root. */
export function getPaletteRemScale(targetDocument: Document): number {
  const fontSize = parseFloat(
    targetDocument.defaultView?.getComputedStyle(targetDocument.documentElement)
      .fontSize ?? "16",
  )
  if (!Number.isFinite(fontSize) || fontSize <= 0) return 1
  return 16 / fontSize
}

function applyPaletteRemScale(host: HTMLElement, targetDocument: Document): number {
  const scale = getPaletteRemScale(targetDocument)
  host.style.zoom = String(scale)
  return scale
}

export async function openCaseIds(caseIds: string[]): Promise<void> {
  const response = await chrome.runtime.sendMessage<
    OpenCaseIdsMessage,
    OpenIdsResponse
  >({
    type: "OPEN_CASE_IDS",
    caseIds,
  })

  if (!response?.ok) {
    throw new Error(response?.error ?? "The background worker did not respond.")
  }
}

export async function openShipmentIds(shipmentIds: string[]): Promise<void> {
  const response = await chrome.runtime.sendMessage<
    OpenShipmentIdsMessage,
    OpenIdsResponse
  >({
    type: "OPEN_SHIPMENT_IDS",
    shipmentIds,
  })

  if (!response?.ok) {
    throw new Error(response?.error ?? "The background worker did not respond.")
  }
}

export async function openSkuIds(skuIds: string[]): Promise<void> {
  const response = await chrome.runtime.sendMessage<
    OpenSkuIdsMessage,
    OpenIdsResponse
  >({
    type: "OPEN_SKU_IDS",
    skuIds,
  })

  if (!response?.ok) {
    throw new Error(response?.error ?? "The background worker did not respond.")
  }
}

export async function openTimeOut(): Promise<void> {
  const response = await chrome.runtime.sendMessage<
    OpenTimeOutMessage,
    OpenIdsResponse
  >({ type: "OPEN_TIME_OUT" })

  if (!response?.ok) {
    throw new Error(response?.error ?? "The background worker did not respond.")
  }
}

async function accountApi<T extends Record<string, unknown>>(message: Record<string, unknown>): Promise<T> {
  const response = await chrome.runtime.sendMessage(message) as T & { ok?: boolean; error?: string }
  if (!response?.ok) throw new Error(response?.error ?? "The background worker did not respond.")
  return response
}
export async function getAccountsStatus(): Promise<AccountsStatus> {
  const response = await accountApi<{
    ok: true
    initialized: boolean
    unlocked: boolean
    stores: AccountsStatus["stores"]
    activeSwitch?: AccountsStatus["activeSwitch"]
    currentStore?: AccountsStatus["currentStore"]
  }>({ type: "ACCOUNTS_STATUS" })
  return {
    initialized: response.initialized,
    unlocked: response.unlocked,
    stores: response.stores,
    activeSwitch: response.activeSwitch,
    currentStore: response.currentStore ?? null,
  }
}
export async function unlockAccounts(masterPassword: string): Promise<void> { await accountApi({ type: "ACCOUNTS_UNLOCK", masterPassword }) }
export async function startAccountSwitch(storeId: string): Promise<void> { await accountApi({ type: "ACCOUNTS_START_SWITCH", storeId }) }
export async function focusCurrentStore(): Promise<void> { await accountApi({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" }) }
export async function focusAccountSwitch(): Promise<void> { await accountApi({ type: "ACCOUNTS_FOCUS_SWITCH" }) }
export async function cancelAccountSwitch(): Promise<void> { await accountApi({ type: "ACCOUNTS_CANCEL_SWITCH" }) }
export async function manageAccounts(): Promise<void> { await accountApi({ type: "ACCOUNTS_OPEN_OPTIONS" }) }

export async function getSettings(): Promise<ExtensionSettings> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return parseSettings(undefined)
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" }) as { ok?: boolean; settings?: unknown }
    if (!response?.ok) return parseSettings(undefined)
    return parseSettings(response.settings)
  } catch {
    return parseSettings(undefined)
  }
}

export async function prepareReports(): Promise<ReportsPrepareResult> {
  const response = await chrome.runtime.sendMessage({ type: "REPORTS_PREPARE" }) as ReportsPrepareResult & { ok?: boolean; error?: string }
  if (!response?.ok) throw new Error(response?.error ?? "The background worker did not respond.")
  return {
    loggedInToStore: Boolean(response.loggedInToStore),
    openedPromptOnSellerCentral: response.openedPromptOnSellerCentral,
  }
}

export async function fetchUnfulfillableListingsFromBackground(): Promise<UnfulfillableListing[]> {
  const response = await chrome.runtime.sendMessage({ type: "REPORTS_FETCH_UNFULFILLABLE" }) as {
    ok?: boolean
    listings?: UnfulfillableListing[]
    error?: string
  }
  if (!response?.ok) throw new Error(response?.error ?? "The background worker did not respond.")
  return Array.isArray(response.listings) ? response.listings : []
}

export async function generateReports(
  now = new Date(),
  targetDocument: Document = document,
  currentStoreName?: string,
): Promise<void> {
  const storeName =
    currentStoreName !== undefined
      ? currentStoreName
      : (await getAccountsStatus()).currentStore?.name ?? ""
  const listings = await fetchUnfulfillableListingsFromBackground()
  downloadBytes(buildReportWorkbook(reportWorkbookSheets(listings)), reportFileName(storeName, now), targetDocument)
}

export function mountCommandPalette({
  document: targetDocument = window.document,
  shadowMode = "closed",
}: MountCommandPaletteOptions = {}): MountedCommandPalette | null {
  if (targetDocument.getElementById(HOST_ID)) return null

  const host = targetDocument.createElement("div")
  host.id = HOST_ID
  host.setAttribute(PALETTE_OPEN_ATTRIBUTE, "false")
  host.style.cssText = [
    "all: initial",
    "position: fixed",
    "inset: 0",
    "z-index: 2147483647",
    "pointer-events: none",
  ].join(";")
  applyPaletteRemScale(host, targetDocument)
  const stopColorScheme = applyPrefersColorScheme(host, targetDocument.defaultView ?? window)

  const shadowRoot = host.attachShadow({ mode: shadowMode })
  const style = targetDocument.createElement("style")
  const fontFace = paletteFontFaceCss()
  style.textContent = fontFace ? `${fontFace}\n${styles}` : styles
  shadowRoot.append(style)

  const mountPoint = targetDocument.createElement("div")
  mountPoint.className = "palette-scope"
  mountPoint.style.pointerEvents = "auto"
  shadowRoot.append(mountPoint)
  // Radix Dialog's hideOthers() walks document.body, so the host must live there.
  // Fall back to <html> only if this document has no body yet.
  ;(targetDocument.body ?? targetDocument.documentElement).append(host)

  let root: Root | null = createRoot(mountPoint)
  let isOpen = false
  let openMode: PaletteMode = "commands"
  let previousFocus: HTMLElement | null = null
  let unlockDocumentScroll: (() => void) | null = null
  let enabledFeatures: EnabledFeatures = DEFAULT_ENABLED_FEATURES

  const renderPalette = () => {
    root?.render(
      <React.StrictMode>
        <CommandPalette
          container={shadowRoot}
          enabledFeatures={enabledFeatures}
          initialMode={openMode}
          open={isOpen}
          onOpenCaseIds={openCaseIds}
          onOpenShipmentIds={openShipmentIds}
          onOpenSkuIds={openSkuIds}
          onGetAccountsStatus={getAccountsStatus}
          onUnlockAccounts={unlockAccounts}
          onStartAccountSwitch={startAccountSwitch}
          onFocusCurrentStore={focusCurrentStore}
          onFocusAccountSwitch={focusAccountSwitch}
          onCancelAccountSwitch={cancelAccountSwitch}
          onManageAccounts={manageAccounts}
          onPrepareReports={prepareReports}
          onGenerateReports={(storeName) => generateReports(new Date(), targetDocument, storeName)}
          onOpenTimeOut={openTimeOut}
          onOpenChange={setOpen}
        />
      </React.StrictMode>,
    )
  }

  const setOpen = (nextOpen: boolean, mode: PaletteMode = "commands") => {
    if (nextOpen) openMode = mode
    else openMode = "commands"

    if (nextOpen === isOpen) {
      if (nextOpen) renderPalette()
      return
    }

    if (nextOpen) {
      previousFocus = getDeepActiveElement(targetDocument)
      unlockDocumentScroll = lockDocumentScroll(targetDocument)
    } else {
      unlockDocumentScroll?.()
      unlockDocumentScroll = null
    }
    isOpen = nextOpen
    host.setAttribute(PALETTE_OPEN_ATTRIBUTE, String(nextOpen))
    host.style.pointerEvents = nextOpen ? "auto" : "none"
    if (nextOpen) applyPaletteRemScale(host, targetDocument)

    renderPalette()
    if (nextOpen) {
      void getSettings().then((settings) => {
        if (!isOpen) return
        if (enabledFeaturesEqual(enabledFeatures, settings.features)) return
        enabledFeatures = settings.features
        renderPalette()
      })
    }

    if (!nextOpen) {
      requestAnimationFrame(() => previousFocus?.focus({ preventScroll: true }))
    }
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isPaletteShortcut(event)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    setOpen(!isOpen)
  }

  targetDocument.defaultView?.addEventListener("keydown", onKeyDown, true)

  return {
    host,
    shadowRoot,
    setOpen,
    destroy: () => {
      host.setAttribute(PALETTE_OPEN_ATTRIBUTE, "false")
      unlockDocumentScroll?.()
      unlockDocumentScroll = null
      targetDocument.defaultView?.removeEventListener("keydown", onKeyDown, true)
      ;(targetDocument.defaultView as PasteGuardWindow | null)?.[
        PASTE_GUARD_KEY
      ]?.destroy()
      stopColorScheme()
      root?.unmount()
      root = null
      host.remove()
    },
  }
}
