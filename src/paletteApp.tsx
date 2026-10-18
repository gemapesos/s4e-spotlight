import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import styles from "./styles.css?inline"
import { CommandPalette, type AccountsStatus, type PaletteMode, type ReportsPrepareResult } from "./CommandPalette"
import { applyPrefersColorScheme } from "./lib/colorScheme"
import {
  createLogger,
  describeError,
  errorMessage,
  forwardLogsToBackground,
  logNow,
  setLogSink,
  type LogData,
} from "./lib/log"
import { downloadGeneratedReport } from "./lib/reportDownload"
import { reportWarnings, type GeneratedReport, type ReportDownloadFormat } from "./lib/reports"
import {
  DEFAULT_ENABLED_FEATURES,
  enabledFeaturesEqual,
  parseSettings,
  type EnabledFeatures,
  type ExtensionSettings,
} from "./lib/settings"
import type { SellerFeedback } from "./lib/feedback"
import { isPaletteShortcut } from "./lib/shortcut"
import {
  isReportProgressMessage,
  REPORT_SOURCES,
  type ReportProgressEvent,
  type ReportSource,
} from "./lib/reportProgress"
import type { ShippingQueueShipment } from "./lib/shippingQueue"
import type { StrandedListing } from "./lib/stranded"
import type { SuppressedListing } from "./lib/suppressed"
import type { UnfulfillableListing } from "./lib/unfulfillable"

const HOST_ID = "command-palette-extension-root"
const PALETTE_OPEN_ATTRIBUTE = "data-s4e-palette-open"
const PASTE_GUARD_KEY = "__s4eSpotlightPasteGuard"
const GEIST_FONT_FILE = "geist-latin-wght-normal.woff2"
const FIRST_OPEN_ASSET_TIMEOUT_MS = 120
const paletteLog = createLogger("palette")

if (typeof chrome !== "undefined" && chrome.runtime?.id) setLogSink(forwardLogsToBackground())

export async function loadPaletteFont(targetDocument: Document): Promise<void> {
  const fontUrl =
    typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL(GEIST_FONT_FILE)
      : ""
  if (!fontUrl) return
  if (typeof FontFace === "undefined" || !targetDocument.fonts) return
  try {
    const face = new FontFace("Geist Variable", `url("${fontUrl}")`, {
      display: "swap",
      style: "normal",
      weight: "100 900",
    })
    targetDocument.fonts.add(face)
    await face.load()
  } catch {
    // Best-effort; the UI falls back to the system stack.
  }
}

function waitWithTimeout(promise: Promise<unknown>, ms: number, targetWindow: Window | null): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    void promise.then(finish, finish)
    if (!targetWindow) {
      finish()
      return
    }
    targetWindow.setTimeout(finish, ms)
  })
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

/** Sends a message to the background worker and requires `ok: true` in the reply. */
async function requestBackground<T extends object = Record<string, unknown>>(
  message: Record<string, unknown>,
): Promise<T & { ok: true }> {
  const response = await chrome.runtime.sendMessage(message) as (T & { ok?: boolean; error?: string }) | undefined
  if (!response?.ok) throw new Error(response?.error ?? "The background worker did not respond.")
  return response as T & { ok: true }
}

export async function openCaseIds(caseIds: string[]): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_CASE_IDS", caseIds } satisfies OpenCaseIdsMessage)
}
export async function openShipmentIds(shipmentIds: string[]): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_SHIPMENT_IDS", shipmentIds } satisfies OpenShipmentIdsMessage)
}
export async function openSkuIds(skuIds: string[]): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_SKU_IDS", skuIds } satisfies OpenSkuIdsMessage)
}
export async function openTimeOut(): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_TIME_OUT" } satisfies OpenTimeOutMessage)
}

export async function getAccountsStatus(): Promise<AccountsStatus> {
  const response = await requestBackground<AccountsStatus>({ type: "ACCOUNTS_STATUS" })
  return {
    initialized: response.initialized,
    unlocked: response.unlocked,
    stores: response.stores,
    activeSwitch: response.activeSwitch,
    currentStore: response.currentStore ?? null,
  }
}
export async function unlockAccounts(masterPassword: string): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_UNLOCK", masterPassword })
}
export async function startAccountSwitch(storeId: string): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_START_SWITCH", storeId })
}
export async function focusCurrentStore(): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" })
}
export async function focusAccountSwitch(): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_FOCUS_SWITCH" })
}
export async function cancelAccountSwitch(): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_CANCEL_SWITCH" })
}
export async function manageAccounts(): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_OPEN_OPTIONS" })
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return parseSettings(undefined)
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" }) as { ok?: boolean; settings?: unknown; error?: string }
    if (!response?.ok) throw new Error(response?.error ?? "The background worker did not respond.")
    return parseSettings(response.settings)
  } catch (error) {
    paletteLog.warn("settings.loadFailed", { error: describeError(error) })
    return parseSettings(undefined)
  }
}

export async function prepareReports(): Promise<ReportsPrepareResult> {
  const response = await requestBackground<ReportsPrepareResult>({ type: "REPORTS_PREPARE" })
  return {
    loggedInToStore: Boolean(response.loggedInToStore),
    openedPromptOnSellerCentral: response.openedPromptOnSellerCentral,
  }
}

async function fetchReportItems<T>(type: string, key: string): Promise<T[]> {
  const response = await requestBackground<Record<string, unknown>>({ type })
  const items = response[key]
  return Array.isArray(items) ? items as T[] : []
}

async function fetchUnfulfillableFromBackground(): Promise<{
  listings: UnfulfillableListing[]
  nextRemovalOrderId: string | null
}> {
  const response = await requestBackground<{ listings?: unknown; nextRemovalOrderId?: unknown }>({
    type: "REPORTS_FETCH_UNFULFILLABLE",
  })
  const nextRemovalOrderId = response.nextRemovalOrderId
  return {
    listings: Array.isArray(response.listings) ? response.listings as UnfulfillableListing[] : [],
    nextRemovalOrderId: typeof nextRemovalOrderId === "string" && nextRemovalOrderId ? nextRemovalOrderId : null,
  }
}

const reportProgressListeners = new Set<(event: ReportProgressEvent) => void>()

export function subscribeReportProgress(listener: (event: ReportProgressEvent) => void): () => void {
  reportProgressListeners.add(listener)
  return () => { reportProgressListeners.delete(listener) }
}

function dispatchReportProgress(event: ReportProgressEvent): void {
  for (const listener of reportProgressListeners) listener(event)
}

export async function generateReports(
  now = new Date(),
  currentStoreName?: string,
  onProgress?: (event: ReportProgressEvent) => void,
): Promise<GeneratedReport> {
  const unsubscribe = onProgress ? subscribeReportProgress(onProgress) : () => undefined
  const done = paletteLog.time("report.run")
  const sources: Partial<Record<ReportSource, LogData>> = {}
  /** Resolves a source to its value, or to `fallback` after reporting the failure. */
  const track = <T,>(source: ReportSource, request: Promise<T>, fallback: T, count: (value: T) => number) => {
    const startedAt = logNow()
    const elapsed = () => Math.round(logNow() - startedAt)
    return request.then(
      (value) => {
        sources[source] = { ms: elapsed(), count: count(value) }
        onProgress?.({ source, status: "complete" })
        return value
      },
      (error: unknown) => {
        const message = errorMessage(error, "Couldn’t load this report section.")
        sources[source] = { ms: elapsed(), error: message }
        paletteLog.warn("report.sourceFailed", { source, error: describeError(error) })
        onProgress?.({ source, status: "error", error: message })
        return fallback
      },
    )
  }
  try {
    const storeName =
      currentStoreName !== undefined
        ? currentStoreName
        : (await getAccountsStatus()).currentStore?.name ?? ""
    for (const source of REPORT_SOURCES) onProgress?.({ source, status: "active" })
    const length = (items: readonly unknown[]) => items.length
    const [unfulfillable, feedbacks, strandedListings, suppressedListings, shipments] = await Promise.all([
      track(
        "unfulfillable",
        fetchUnfulfillableFromBackground(),
        { listings: [], nextRemovalOrderId: null },
        (value) => value.listings.length,
      ),
      track("feedback", fetchReportItems<SellerFeedback>("REPORTS_FETCH_FEEDBACK", "feedbacks"), [], length),
      track("stranded", fetchReportItems<StrandedListing>("REPORTS_FETCH_STRANDED", "listings"), [], length),
      track("suppressed", fetchReportItems<SuppressedListing>("REPORTS_FETCH_SUPPRESSED", "listings"), [], length),
      track("shippingQueue", fetchReportItems<ShippingQueueShipment>("REPORTS_FETCH_SHIPPING_QUEUE", "shipments"), [], length),
    ])
    const timed = Object.entries(sources) as Array<[ReportSource, LogData]>
    const slowest = timed.reduce<[ReportSource, LogData] | undefined>(
      (best, entry) => (!best || Number(entry[1].ms) > Number(best[1].ms) ? entry : best),
      undefined,
    )
    const report: GeneratedReport = {
      storeName,
      generatedAt: now,
      unfulfillableListings: unfulfillable.listings,
      nextRemovalOrderId: unfulfillable.nextRemovalOrderId,
      feedbacks,
      strandedListings,
      suppressedListings,
      shipments,
    }
    const warnings = reportWarnings(report)
    done({
      sources,
      slowest: slowest?.[0],
      failed: timed.filter(([, data]) => data.error).map(([source]) => source),
      ...(warnings.length ? { warnings: warnings.map(({ source, text }) => `${source}: ${text}`) } : {}),
    })
    return report
  } catch (error) {
    done({ error: describeError(error), sources }, "error")
    throw error
  } finally {
    unsubscribe()
  }
}

function downloadReport(report: GeneratedReport, format: ReportDownloadFormat, targetDocument: Document): void {
  const done = paletteLog.time("report.download", { format })
  try {
    const { bytes } = downloadGeneratedReport(report, format, targetDocument)
    done({ bytes })
  } catch (error) {
    done({ error: describeError(error) }, "error")
    throw error
  }
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
  style.textContent = styles
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
  let openGeneration = 0
  let firstOpenAssetsSettled = false

  let fontLoaded = false
  let settingsLoaded = false
  const fontReady = loadPaletteFont(targetDocument).finally(() => { fontLoaded = true })
  const settingsReady = getSettings().then((settings) => {
    settingsLoaded = true
    if (enabledFeaturesEqual(enabledFeatures, settings.features)) return
    enabledFeatures = settings.features
    if (isOpen) renderPalette()
  })

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
          onGenerateReports={(storeName, onProgress) => generateReports(new Date(), storeName, onProgress)}
          onDownloadReport={(report, format) => downloadReport(report, format, targetDocument)}
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

    const generation = ++openGeneration

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

    const render = () => {
      if (generation !== openGeneration) return
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

    if (nextOpen && !firstOpenAssetsSettled) {
      const startedAt = logNow()
      void waitWithTimeout(
        Promise.all([fontReady, settingsReady]),
        FIRST_OPEN_ASSET_TIMEOUT_MS,
        targetDocument.defaultView,
      ).then(() => {
        firstOpenAssetsSettled = true
        if (!fontLoaded || !settingsLoaded) {
          const waitedMs = Math.round(logNow() - startedAt)
          paletteLog.warn("palette.slowFirstOpen", { waitedMs, fontLoaded, settingsLoaded })
        }
        render()
      })
      return
    }

    render()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isPaletteShortcut(event)) return

    event.preventDefault()
    event.stopImmediatePropagation()
    setOpen(!isOpen)
  }

  targetDocument.defaultView?.addEventListener("keydown", onKeyDown, true)

  const onRuntimeMessage = (message: unknown) => {
    if (!isReportProgressMessage(message)) return
    dispatchReportProgress(message)
  }
  if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.addListener(onRuntimeMessage)

  return {
    host,
    shadowRoot,
    setOpen,
    destroy: () => {
      host.setAttribute(PALETTE_OPEN_ATTRIBUTE, "false")
      unlockDocumentScroll?.()
      unlockDocumentScroll = null
      targetDocument.defaultView?.removeEventListener("keydown", onKeyDown, true)
      if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.removeListener(onRuntimeMessage)
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
