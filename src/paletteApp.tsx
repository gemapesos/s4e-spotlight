import * as React from "react"
import { createPortal } from "react-dom"
import { createRoot, type Root } from "react-dom/client"

import styles from "./styles.css?inline"
import { CommandPalette, type AccountsStatus, type PaletteMode, type ReportsPrepareResult } from "./CommandPalette"
import { SwitchStatusCard } from "./SwitchProgress"
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
  isFeatureEnabled,
  parseSettings,
  type EnabledFeatures,
  type ExtensionSettings,
} from "./lib/settings"
import type { SellerFeedback } from "./lib/feedback"
import { isPaletteShortcut } from "./lib/shortcut"
import type { SellerCentralSessionState } from "./lib/sellerCentralSession"
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
/** IDs in the identifier input and its chips. */
const GEIST_MONO_FONT_FILE = "geist-mono-latin-wght-normal.woff2"
const FIRST_OPEN_ASSET_TIMEOUT_MS = 120
const paletteLog = createLogger("palette")

if (typeof chrome !== "undefined" && chrome.runtime?.id) setLogSink(forwardLogsToBackground())

async function addExtensionFont(targetDocument: Document, family: string, file: string): Promise<void> {
  const fontUrl =
    typeof chrome !== "undefined" && typeof chrome.runtime?.getURL === "function"
      ? chrome.runtime.getURL(file)
      : ""
  if (!fontUrl) return
  if (typeof FontFace === "undefined" || !targetDocument.fonts) return
  try {
    const face = new FontFace(family, `url("${fontUrl}")`, {
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

/** Waits for Geist, which every screen uses; Geist Mono loads alongside without holding up the first open. */
export async function loadPaletteFont(targetDocument: Document): Promise<void> {
  void addExtensionFont(targetDocument, "Geist Mono Variable", GEIST_MONO_FONT_FILE)
  await addExtensionFont(targetDocument, "Geist Variable", GEIST_FONT_FILE)
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

export interface ScrapeCasesMessage {
  type: "SCRAPE_CASES"
  caseIds: string[]
}

export interface OpenShipmentIdsMessage {
  type: "OPEN_SHIPMENT_IDS"
  shipmentIds: string[]
}

export interface OpenRemovalOrderIdsMessage {
  type: "OPEN_REMOVAL_ORDER_IDS"
  removalOrderIds: string[]
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
  /** Shows "Switched to …" until the user clicks or presses a key on this page. */
  showSwitchDone: (storeName: string) => void
  shadowRoot: ShadowRoot
}

export interface MountCommandPaletteOptions {
  document?: Document
  shadowMode?: ShadowRootMode
}

/** Sets inline styles and returns a function that puts the previous inline values back. */
function setInlineStyles(element: HTMLElement, styles: Record<string, [value: string, priority?: string]>): () => void {
  const previous = Object.keys(styles).map((property) => [
    property,
    element.style.getPropertyValue(property),
    element.style.getPropertyPriority(property),
  ] as const)

  for (const [property, [value, priority = ""]] of Object.entries(styles)) {
    element.style.setProperty(property, value, priority)
  }

  return () => {
    for (const [property, value, priority] of previous) {
      if (value) element.style.setProperty(property, value, priority)
      else element.style.removeProperty(property)
    }
  }
}

/** Radix Dialog marks body while its own scroll lock is mounted. */
const RADIX_SCROLL_LOCK_ATTRIBUTE = "data-scroll-locked"

/** Body styles Radix's scroll lock overrides (see react-remove-scroll-bar). */
const RADIX_LOCKED_BODY_PROPERTIES = [
  "overflow-x",
  "overflow-y",
  "position",
  "margin-top",
  "margin-right",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-left",
] as const

/**
 * Locks page scroll without touching layout. Hiding the scrollbar (Radix's approach, or
 * `overflow: hidden`) changes the viewport's width, and no padding or gutter trick looks the
 * same as the real scrollbar, so the scrollbar stays exactly as it is:
 * - Radix's lock styles on body are pinned to body's current values, so they change nothing.
 * - Radix's lock still cancels wheel and touch scrolling outside the palette, and focus stays
 *   trapped in the palette, so keys can't scroll the page.
 * - Dragging the scrollbar itself is undone as it happens.
 */
function lockDocumentScroll(document: Document): () => void {
  const { body } = document
  const view = document.defaultView
  if (!view) return () => {}

  const computed = view.getComputedStyle(body)
  const restoreBody = setInlineStyles(body, Object.fromEntries(
    RADIX_LOCKED_BODY_PROPERTIES.map((property) => [property, [computed.getPropertyValue(property), "important"]]),
  ))

  const scroller = document.scrollingElement ?? document.documentElement
  const { scrollLeft, scrollTop } = scroller
  const keepScrollPosition = (event: Event) => {
    const target = event.target === document ? scroller : event.target
    if (target !== scroller) return
    if (scroller.scrollTop !== scrollTop || scroller.scrollLeft !== scrollLeft) {
      scroller.scrollTo({ left: scrollLeft, top: scrollTop, behavior: "instant" })
    }
  }
  document.addEventListener("scroll", keepScrollPosition, { capture: true, passive: true })

  return () => {
    document.removeEventListener("scroll", keepScrollPosition, { capture: true })
    restoreBody()
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

export async function openCases(): Promise<void> {
  await requestBackground({ type: "RESULTS_OPEN", mode: "cases" })
}

export async function openShipmentIds(shipmentIds: string[]): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_SHIPMENT_IDS", shipmentIds } satisfies OpenShipmentIdsMessage)
}
export async function openRemovalOrderIds(removalOrderIds: string[]): Promise<void> {
  await requestBackground<OpenIdsResponse>({ type: "OPEN_REMOVAL_ORDER_IDS", removalOrderIds } satisfies OpenRemovalOrderIdsMessage)
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
export async function unlockAccounts(storeId: string): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_REQUEST_UNLOCK", storeId })
}
/** Reads the session from open Seller Central tabs; "unknown" never blocks a command. */
export async function checkSellerCentralSession(): Promise<SellerCentralSessionState> {
  try {
    const { session } = await requestBackground<{ session?: unknown }>({ type: "SELLER_CENTRAL_SESSION" })
    return session === "signed-in" || session === "signed-out" ? session : "unknown"
  } catch (error) {
    paletteLog.warn("session.checkFailed", { error: describeError(error) })
    return "unknown"
  }
}
export async function openSellerCentral(): Promise<void> {
  await requestBackground({ type: "SELLER_CENTRAL_OPEN" })
}
export async function openReports(): Promise<void> {
  await requestBackground({ type: "RESULTS_OPEN", mode: "reports" })
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
export async function dismissSwitchNotice(): Promise<void> {
  await requestBackground({ type: "ACCOUNTS_SWITCH_NOTICE_DISMISS" })
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

export async function prepareReports(sections: readonly ReportSource[] = REPORT_SOURCES): Promise<ReportsPrepareResult> {
  const response = await requestBackground<ReportsPrepareResult>({ type: "REPORTS_PREPARE", sections })
  return {
    loggedInToStore: response.loggedInToStore !== false,
    runId: response.runId,
    openedPromptOnSellerCentral: response.openedPromptOnSellerCentral,
  }
}

async function fetchReportItems<T>(type: string, key: string, runId?: string): Promise<T[]> {
  const response = await requestBackground<Record<string, unknown>>({ type, ...(runId ? { runId } : {}) })
  const items = response[key]
  return Array.isArray(items) ? items as T[] : []
}

async function fetchUnfulfillableFromBackground(runId?: string): Promise<{
  listings: UnfulfillableListing[]
  nextRemovalOrderId: string | null
}> {
  const response = await requestBackground<{ listings?: unknown; nextRemovalOrderId?: unknown }>({
    type: "REPORTS_FETCH_UNFULFILLABLE",
    ...(runId ? { runId } : {}),
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

export function dispatchReportProgress(event: ReportProgressEvent): void {
  for (const listener of reportProgressListeners) listener(event)
}

export async function generateReports(
  now = new Date(),
  currentStoreName?: string,
  onProgress?: (event: ReportProgressEvent) => void,
  sections: readonly ReportSource[] = REPORT_SOURCES,
  runId?: string,
): Promise<GeneratedReport> {
  const unsubscribe = onProgress ? subscribeReportProgress(onProgress) : () => undefined
  const done = paletteLog.time("report.run")
  const sources: Partial<Record<ReportSource, LogData>> = {}
  /**
   * Resolves a chosen source to its value, or to `fallback` after reporting the failure.
   * A source that wasn't chosen resolves to `fallback` without a request.
   */
  const track = <T,>(source: ReportSource, request: () => Promise<T>, fallback: T, count: (value: T) => number) => {
    if (!sections.includes(source)) return Promise.resolve(fallback)
    const startedAt = logNow()
    const elapsed = () => Math.round(logNow() - startedAt)
    return request().then(
      (value) => {
        const rows = count(value)
        sources[source] = { ms: elapsed(), count: rows }
        onProgress?.({ source, status: "complete", loaded: rows, total: rows })
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
    for (const source of sections) onProgress?.({ source, status: "active" })
    const length = (items: readonly unknown[]) => items.length
    const [unfulfillable, feedbacks, strandedListings, suppressedListings, shipments] = await Promise.all([
      track(
        "unfulfillable",
        () => fetchUnfulfillableFromBackground(runId),
        { listings: [], nextRemovalOrderId: null },
        (value) => value.listings.length,
      ),
      track("feedback", () => fetchReportItems<SellerFeedback>("REPORTS_FETCH_FEEDBACK", "feedbacks", runId), [], length),
      track("stranded", () => fetchReportItems<StrandedListing>("REPORTS_FETCH_STRANDED", "listings", runId), [], length),
      track("suppressed", () => fetchReportItems<SuppressedListing>("REPORTS_FETCH_SUPPRESSED", "listings", runId), [], length),
      track(
        "shippingQueue",
        () => fetchReportItems<ShippingQueueShipment>("REPORTS_FETCH_SHIPPING_QUEUE", "shipments", runId),
        [],
        length,
      ),
    ])
    const timed = Object.entries(sources) as Array<[ReportSource, LogData]>
    const slowest = timed.reduce<[ReportSource, LogData] | undefined>(
      (best, entry) => (!best || Number(entry[1].ms) > Number(best[1].ms) ? entry : best),
      undefined,
    )
    const report: GeneratedReport = {
      storeName,
      generatedAt: now,
      sections,
      unfulfillableListings: unfulfillable.listings,
      nextRemovalOrderId: unfulfillable.nextRemovalOrderId,
      feedbacks,
      strandedListings,
      suppressedListings,
      shipments,
    }
    const warnings = reportWarnings(report)
    done({
      sections: [...sections],
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
  let cancelPendingUnlock: (() => void) | null = null

  const unlockNow = () => {
    cancelPendingUnlock?.()
    unlockDocumentScroll?.()
    unlockDocumentScroll = null
  }

  // Radix keeps its own scroll lock mounted until the close animation ends. Unpinning body
  // first would let its styles hide the scrollbar for a moment, so release both together.
  const unlockAfterRadixScrollLock = () => {
    const body = targetDocument.body
    if (!unlockDocumentScroll || !body?.hasAttribute(RADIX_SCROLL_LOCK_ATTRIBUTE)) {
      unlockNow()
      return
    }

    const view = targetDocument.defaultView ?? window
    const observer = new MutationObserver(() => {
      if (!body.hasAttribute(RADIX_SCROLL_LOCK_ATTRIBUTE)) unlockNow()
    })
    // Fallback in case the close animation never finishes.
    const timeout = view.setTimeout(unlockNow, 1000)
    observer.observe(body, { attributes: true, attributeFilter: [RADIX_SCROLL_LOCK_ATTRIBUTE] })
    cancelPendingUnlock = () => {
      observer.disconnect()
      view.clearTimeout(timeout)
      cancelPendingUnlock = null
    }
  }
  let enabledFeatures: EnabledFeatures = DEFAULT_ENABLED_FEATURES
  let openGeneration = 0
  let firstOpenAssetsSettled = false
  /** The small store-switch card, for when the palette is hidden or another tab is in view. */
  let switchCard: { key: number; doneStoreName?: string } | null = null
  let switchCardKey = 0
  /** Set while the palette shows a finished switch the background asked this tab to show. */
  let switchedStoreName: string | undefined

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
          onOpenReports={openReports}
          onOpenCases={openCases}
          onOpenShipmentIds={openShipmentIds}
          onOpenRemovalOrderIds={openRemovalOrderIds}
          onOpenSkuIds={openSkuIds}
          onGetAccountsStatus={getAccountsStatus}
          onUnlockAccounts={unlockAccounts}
          onStartAccountSwitch={startAccountSwitch}
          onFocusCurrentStore={focusCurrentStore}
          onFocusAccountSwitch={focusAccountSwitch}
          onCancelAccountSwitch={cancelAccountSwitch}
          onManageAccounts={manageAccounts}
          onOpenTimeOut={openTimeOut}
          onCheckSession={checkSellerCentralSession}
          onOpenSellerCentral={openSellerCentral}
          onOpenChange={setOpen}
          switchedStoreName={switchedStoreName}
        />
        {/* Like the dialog, it sits directly in the shadow root, so it follows the host's dark class. */}
        {switchCard ? createPortal(
          <SwitchStatusCard
            key={switchCard.key}
            doneStoreName={switchCard.doneStoreName}
            onCancel={cancelAccountSwitch}
            onDismiss={dismissSwitchCard}
            onGetAccountsStatus={getAccountsStatus}
            onShowSignIn={focusAccountSwitch}
          />,
          shadowRoot,
        ) : null}
      </React.StrictMode>,
    )
  }

  const showSwitchCard = (doneStoreName?: string) => {
    switchCard = { key: ++switchCardKey, ...(doneStoreName ? { doneStoreName } : {}) }
    renderPalette()
  }

  function dismissSwitchCard() {
    if (!switchCard) return
    switchCard = null
    renderPalette()
    void dismissSwitchNotice().catch(() => undefined)
  }

  /** Picks up a switch still running once the palette is hidden, or when this tab comes back into view. */
  const watchForAccountSwitch = () => {
    // The open palette shows the switch itself; closing it checks again.
    if (isOpen || switchCard || !isFeatureEnabled(enabledFeatures, "accounts")) return
    void getAccountsStatus().then((status) => {
      if (status.activeSwitch && !switchCard && !isOpen) showSwitchCard()
    }, () => undefined)
  }

  const onVisibilityChange = () => {
    if (targetDocument.visibilityState === "visible") watchForAccountSwitch()
  }
  targetDocument.addEventListener("visibilitychange", onVisibilityChange)

  const setOpen = (nextOpen: boolean, mode: PaletteMode = "commands") => {
    if (nextOpen) openMode = mode
    else openMode = "commands"

    if (nextOpen === isOpen) {
      if (nextOpen) renderPalette()
      return
    }

    const generation = ++openGeneration

    if (nextOpen) {
      // The palette takes over showing the switch; a fresh card follows when it closes.
      switchCard = null
      if (mode !== "switch-done") switchedStoreName = undefined
      previousFocus = getDeepActiveElement(targetDocument)
      applyPaletteRemScale(host, targetDocument)
      // Reopened during the close animation: the page is still locked.
      if (cancelPendingUnlock) cancelPendingUnlock()
      else unlockDocumentScroll = lockDocumentScroll(targetDocument)
    } else {
      unlockAfterRadixScrollLock()
      // The name stays until the next opening so the closing palette doesn't change its text.
      if (switchedStoreName !== undefined) void dismissSwitchNotice().catch(() => undefined)
    }
    isOpen = nextOpen
    host.setAttribute(PALETTE_OPEN_ATTRIBUTE, String(nextOpen))
    host.style.pointerEvents = nextOpen ? "auto" : "none"

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
        watchForAccountSwitch()
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
    showSwitchDone: (storeName) => {
      switchedStoreName = storeName
      setOpen(true, "switch-done")
    },
    destroy: () => {
      host.setAttribute(PALETTE_OPEN_ATTRIBUTE, "false")
      unlockNow()
      targetDocument.defaultView?.removeEventListener("keydown", onKeyDown, true)
      targetDocument.removeEventListener("visibilitychange", onVisibilityChange)
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
