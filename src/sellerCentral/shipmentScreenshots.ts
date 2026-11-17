/**
 * Shipment screenshots: each Send to Amazon step (but the final one) and every UPS Proof of
 * Delivery for a shipment, 3840 px wide. Runs from the workspace page, driving one background tab
 * through the debugger so captures cover the whole element and need no focus.
 */
import { buildStoredZip } from "@/xlsx/workbook"

const SELLER_CENTRAL = "https://sellercentral.amazon.com"
export const shipmentInfoUrl = (shipmentId: string) => `${SELLER_CENTRAL}/fba/inbound-shipment/summary/shipment-info/${encodeURIComponent(shipmentId)}`
export const shipmentTrackingUrl = (shipmentId: string, offset: number) =>
  `${SELLER_CENTRAL}/fba/inbound/arest/addressbook/tracking/${encodeURIComponent(shipmentId)}/summary?pageSize=${TRACKING_PAGE_SIZE}&lastEntry=${offset}`
export const sendToAmazonUrl = (workflowId: string) => `${SELLER_CENTRAL}/fba/sendtoamazon?wf=${encodeURIComponent(workflowId)}`
export const upsTrackingUrl = (trackingId: string) => `https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(trackingId)}&requester=QUIC/trackdetails`

const TRACKING_PAGE_SIZE = 20
const MAX_TRACKING_PAGES = 25
/** Pages are laid out this wide and drawn at twice the density, so a full-width capture is 3840 px. */
const LAYOUT_WIDTH = 1920
const DEVICE_SCALE = 2
export const TARGET_WIDTH_PX = 3840
/** Chrome can't draw a capture taller than this many pixels. */
const MAX_CAPTURE_PX = 16_000
const WAIT_STEP_MS = 500
const LOAD_TIMEOUT_MS = 45_000
/** A step's panel counts as loaded once its height holds still this long. */
const SETTLE_MS = 1_500
/** How long "Next" gets to change the page number before the list counts as on its last page. */
const PAGE_TURN_TIMEOUT_MS = 6_000
/** A delivered package shows its Proof of Delivery button within a few seconds of the page loading. */
const UPS_POD_TIMEOUT_MS = 20_000
/** 40 pages of 25 is 1,000 SKUs, past any workflow we've seen. */
const MAX_LIST_PAGES = 40
const UPS_TRACKING_PATTERN = /^1Z[0-9A-Z]{16}$/u
/** Our own palette host; a store-switch notice in it would blur the capture. */
const PALETTE_HOST_ID = "command-palette-extension-root"

export interface ShipmentFile { name: string; data: Uint8Array }
export interface ShipmentCapture { shipmentId: string; files: ShipmentFile[]; notes: string[] }

export function parseWorkflowId(info: unknown): string | null {
  const workflowId = (info as { workflowId?: unknown } | null)?.workflowId
  return typeof workflowId === "string" && /^wf[0-9a-f-]{36}$/iu.test(workflowId) ? workflowId : null
}

/** One page of the Carrier updates API: its UPS tracking numbers and how many boxes there are in all. */
export function parseTrackingPage(page: unknown): { upsIds: string[]; count: number; total: number } {
  const items = (page as { trackingItemsPage?: { trackingItems?: unknown; totalCount?: unknown } } | null)?.trackingItemsPage
  const list = Array.isArray(items?.trackingItems) ? items.trackingItems : []
  const upsIds = list
    .map((item) => String((item as { trackingId?: unknown } | null)?.trackingId ?? "").trim().toUpperCase())
    .filter((id) => UPS_TRACKING_PATTERN.test(id))
  return { upsIds, count: list.length, total: typeof items?.totalCount === "number" ? items.totalCount : list.length }
}

/** "Step 1b – Pack individual units" → "sta-1b-pack-individual-units.png"; a list page adds "-page-2". */
export function stepFileName(title: string, index: number, page?: number): string {
  const number = /^step\s+(\w+)/iu.exec(title)?.[1]?.toLowerCase() ?? String(index + 1)
  const rest = title.replace(/^step\s+\w+\s*[:–—-]?\s*/iu, "")
  const slug = rest.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 60)
  return `sta-${number}${slug ? `-${slug}` : ""}${page ? `-page-${page}` : ""}.png`
}

export const isFinalStep = (title: string) => /^final step/iu.test(title.trim())

/** One folder per shipment; what couldn't be captured goes in that folder's notes.txt. */
export function shipmentsZip(captures: readonly ShipmentCapture[]): Blob {
  const files = captures.flatMap((capture) => [
    ...capture.files.map((file) => ({ name: `${capture.shipmentId}/${file.name}`, data: file.data })),
    ...capture.notes.length ? [{ name: `${capture.shipmentId}/notes.txt`, data: new TextEncoder().encode(`${capture.notes.join("\n")}\n`) }] : [],
  ])
  return new Blob([new Uint8Array(buildStoredZip(files))], { type: "application/zip" })
}

export function shipmentsZipName(shipmentIds: readonly string[], date = new Date()): string {
  if (shipmentIds.length === 1) return `shipment-${shipmentIds[0]}-screenshots.zip`
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((part) => String(part).padStart(2, "0")).join("-")
  return `shipments-${shipmentIds.length}-screenshots-${day}.zip`
}

type Target = chrome.debugger.Debuggee
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const send = <T>(target: Target, method: string, params?: Record<string, unknown>) => chrome.debugger.sendCommand(target, method, params) as unknown as Promise<T>

/** Evaluates `expression` in the page (the debugger isn't bound by its CSP) and returns its JSON result. */
async function evaluate<R>(target: Target, expression: string): Promise<R> {
  const result = await send<{ result?: { value?: unknown }; exceptionDetails?: { exception?: { description?: string } } }>(target, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? "The page script failed.")
  return result.result?.value as R
}

/** Runs `fn(arg)` in the page. `fn` must not use anything outside itself. */
const run = <A, R>(target: Target, fn: (arg: A) => R | Promise<R>, arg: A) =>
  evaluate<Awaited<R>>(target, `(${fn.toString()})(${JSON.stringify(arg)})`)

/** The UPS page's own Proof of Delivery button, not the chat assistant's. */
const UPS_POD_BUTTON = `[...document.querySelectorAll("button")].find((b) => /^\\s*proof of delivery/i.test(b.textContent || "") && !b.closest("[class*='va-']"))`

/** Polls the page until `fn(arg)` is truthy. Navigations in between just count as "not yet". */
async function waitFor<A, R>(target: Target, fn: (arg: A) => R, arg: A, timeoutMs = LOAD_TIMEOUT_MS, shouldStop?: () => boolean): Promise<Awaited<R> | undefined> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (shouldStop?.()) throw new StoppedError()
    const value = await run(target, fn, arg).catch(() => undefined)
    if (value) return value
    await sleep(WAIT_STEP_MS)
  }
  return undefined
}

export class StoppedError extends Error {
  constructor() { super("Stopped.") }
}

async function navigate(target: Target, url: string, shouldStop: () => boolean): Promise<string> {
  await send(target, "Page.navigate", { url })
  await sleep(WAIT_STEP_MS)
  const href = await waitFor(target, () => document.readyState === "complete" && location.href, null, LOAD_TIMEOUT_MS, shouldStop)
  if (!href) throw new Error("The page took too long to load.")
  if (new URL(href).pathname.startsWith("/ap/")) throw new Error("Seller Central is signed out. Sign in, then try again.")
  return href
}

/** The page's JSON at `url`, fetched from the page so it carries the store's session. */
async function pageJson(target: Target, url: string): Promise<{ status: number; body: unknown }> {
  return run(target, async (address: string) => {
    const response = await fetch(address, { credentials: "include", headers: { accept: "application/json" } })
    const text = await response.text()
    try { return { status: response.status, body: JSON.parse(text) as unknown } } catch { return { status: response.status, body: null } }
  }, url)
}

/**
 * Captures the element `locate` finds, laid out 1920 px wide and scaled to 3840 px. The viewport
 * is stretched to the whole page first, so sticky bars sit at the bottom instead of over it.
 */
async function captureElement(target: Target, locate: string): Promise<Uint8Array> {
  const prepare = (hostId: string) => {
    document.getElementById(hostId)?.remove()
    document.getAnimations().forEach((animation) => { try { animation.finish() } catch { /* infinite animations can't finish */ } })
    return document.documentElement.scrollHeight
  }
  // A scrollbar takes 15 px that the capture itself doesn't have, so the page would reflow wider
  // between measuring and capturing and lose its right edge.
  await send(target, "Emulation.setScrollbarsHidden", { hidden: true })
  await send(target, "Emulation.setDeviceMetricsOverride", { width: LAYOUT_WIDTH, height: 1080, deviceScaleFactor: DEVICE_SCALE, mobile: false })
  await sleep(300)
  const pageHeight = await run(target, prepare, PALETTE_HOST_ID)
  await send(target, "Emulation.setDeviceMetricsOverride", { width: LAYOUT_WIDTH, height: Math.max(1080, pageHeight), deviceScaleFactor: DEVICE_SCALE, mobile: false })
  await sleep(700)
  await run(target, prepare, PALETTE_HOST_ID)
  const rect = await evaluate<{ x: number; y: number; width: number; height: number } | null>(target, `(() => {
    scrollTo(0, 0)
    const element = ${locate}
    if (!element) return null
    const box = element.getBoundingClientRect()
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  })()`)
  if (!rect || rect.width < 1 || rect.height < 1) throw new Error("The section to capture wasn’t on the page.")
  const scale = Math.min(TARGET_WIDTH_PX / (rect.width * DEVICE_SCALE), MAX_CAPTURE_PX / (rect.height * DEVICE_SCALE))
  const shot = await send<{ data: string }>(target, "Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { ...rect, scale },
  })
  return Uint8Array.from(atob(shot.data), (char) => char.charCodeAt(0))
}

/** Every UPS tracking number on the shipment's Carrier updates, page by page. */
async function upsTrackingIds(target: Target, shipmentId: string): Promise<{ upsIds: string[]; boxes: number }> {
  const upsIds: string[] = []
  let offset = 0
  let total = Infinity
  for (let page = 0; page < MAX_TRACKING_PAGES && offset < total; page += 1) {
    const { status, body } = await pageJson(target, shipmentTrackingUrl(shipmentId, offset))
    if (status !== 200) throw new Error(`Carrier updates didn’t load (HTTP ${status}).`)
    const parsed = parseTrackingPage(body)
    upsIds.push(...parsed.upsIds)
    total = parsed.total
    if (parsed.count === 0) break
    offset += parsed.count
  }
  return { upsIds: [...new Set(upsIds)], boxes: Number.isFinite(total) ? total : 0 }
}

async function captureSendToAmazon(target: Target, workflowId: string, shouldStop: () => boolean, progress: (message: string) => void): Promise<ShipmentFile[]> {
  progress("Opening Send to Amazon…")
  await navigate(target, sendToAmazonUrl(workflowId), shouldStop)
  const rows = await waitFor(target, () => {
    const found = [...document.querySelectorAll("[data-testid^='e2e-step']")]
      .filter((row) => row.querySelector("[data-testid='step-view-link']"))
      .map((row) => ({ id: row.getAttribute("data-testid") ?? "", title: (row as HTMLElement).innerText.split("\n")[0].trim() }))
    return found.length ? found : null
  }, null, LOAD_TIMEOUT_MS, shouldStop)
  if (!rows) throw new Error("Send to Amazon didn’t show this workflow’s steps.")
  const files: ShipmentFile[] = []
  const steps = rows.filter((row) => !isFinalStep(row.title))
  for (const [index, step] of steps.entries()) {
    if (shouldStop()) throw new StoppedError()
    progress(`Capturing ${step.title}…`)
    const opened = await run(target, (id: string) => {
      const link = document.querySelector<HTMLElement>(`[data-testid='${id}'] [data-testid='step-view-link']`)
      link?.click()
      return Boolean(link)
    }, step.id)
    if (!opened) throw new Error(`Couldn’t open ${step.title}.`)
    if (!await waitForStepSettled(target, step.id)) throw new Error(`${step.title} didn’t open.`)
    const locate = `document.querySelector("[data-testid='${step.id}']")`
    const hide = stepClutter(step.title)
    if (hide.warnings || hide.fees) await hideStepClutter(target, step.id, hide)
    const pages = [await captureElement(target, locate)]
    // Long lists (Step 1's SKUs: 25 a page) page in place; "Next" on the last page does nothing.
    for (let page = await stepPage(target, step.id); page !== null && pages.length < MAX_LIST_PAGES; ) {
      if (shouldStop()) throw new StoppedError()
      await run(target, (id: string) => {
        const next = [...document.querySelectorAll<HTMLElement>(`[data-testid='${id}'] [data-testid$='paging'] a`)].find((link) => /^next/iu.test(link.textContent?.trim() ?? ""))
        next?.click()
      }, step.id)
      const turned = await waitFor(target, ({ id, from }: { id: string; from: number }) => {
        const labels = [...document.querySelectorAll<HTMLElement>(`[data-testid='${id}'] [data-testid$='paging']`)].map((pager) => pager.innerText)
        const current = Number(labels.map((label) => /page\s+(\d+)/iu.exec(label)?.[1]).find(Boolean))
        return current !== from && current > 0 ? current : null
      }, { id: step.id, from: page }, PAGE_TURN_TIMEOUT_MS, shouldStop)
      if (!turned) break
      page = turned
      progress(`Capturing ${step.title}, page ${page}…`)
      await waitForStepSettled(target, step.id)
      pages.push(await captureElement(target, locate))
    }
    pages.forEach((data, page) => files.push({ name: stepFileName(step.title, index, pages.length > 1 ? page + 1 : undefined), data }))
  }
  return files
}

/**
 * Hides a step's yellow warning boxes and, in Step 2, the grey fee band at the bottom. Hidden, not
 * removed: Amazon's page still owns those nodes, and opening the next step would trip over gaps.
 */
async function hideStepClutter(target: Target, id: string, hide: { warnings: boolean; fees: boolean }): Promise<void> {
  await run(target, ({ stepId, warnings, fees }: { stepId: string; warnings: boolean; fees: boolean }) => {
    const row = document.querySelector(`[data-testid='${stepId}']`)
    if (!row) return
    const hidden: Element[] = warnings ? [...row.querySelectorAll("kat-alert[variant='warning']")] : []
    const summary = fees ? row.querySelector("[data-testid='confirm-shipping-fee-summary']") : null
    if (summary) {
      // The grey band is the summary's nearest ancestor with a background of its own.
      let band: Element = summary
      for (let node = summary.parentElement; node && node !== row; node = node.parentElement) {
        if (getComputedStyle(node).backgroundColor !== "rgba(0, 0, 0, 0)") { band = node; break }
      }
      hidden.push(band)
    }
    for (const element of hidden) (element as HTMLElement).style.setProperty("display", "none", "important")
  }, { stepId: id, ...hide })
  await waitForStepSettled(target, id)
}

/** What to hide in a step, by its title: Step 1b's and Step 2's warnings, and Step 2's fees. */
export function stepClutter(title: string): { warnings: boolean; fees: boolean } {
  const number = /^step\s+(\w+)/iu.exec(title.trim())?.[1]?.toLowerCase()
  return { warnings: number === "1b" || number === "2", fees: number === "2" }
}

/** Opening a step or a list page swaps content in place, then it loads; this waits for the height to hold. */
async function waitForStepSettled(target: Target, id: string): Promise<boolean> {
  let last = -1
  let stableSince = Date.now()
  const deadline = Date.now() + LOAD_TIMEOUT_MS
  while (Date.now() < deadline) {
    const height = await run(target, (stepId: string) => {
      const row = document.querySelector(`[data-testid='${stepId}']`)
      return row?.querySelector("[data-testid='header-close-link']") ? Math.round(row.getBoundingClientRect().height) : -1
    }, id).catch(() => -1)
    if (height !== last) { last = height; stableSince = Date.now() }
    else if (height > 0 && Date.now() - stableSince >= SETTLE_MS) return true
    await sleep(WAIT_STEP_MS)
  }
  return false
}

/** The page number of the step's paged list, or null when it has none. */
const stepPage = (target: Target, id: string) => run(target, (stepId: string) => {
  const labels = [...document.querySelectorAll<HTMLElement>(`[data-testid='${stepId}'] [data-testid$='paging']`)].map((pager) => pager.innerText)
  const page = Number(labels.map((label) => /page\s+(\d+)/iu.exec(label)?.[1]).find(Boolean))
  return page > 0 ? page : null
}, id)

async function captureUpsProof(target: Target, trackingId: string, shouldStop: () => boolean): Promise<Uint8Array> {
  await navigate(target, upsTrackingUrl(trackingId), shouldStop)
  const deadline = Date.now() + UPS_POD_TIMEOUT_MS
  for (;;) {
    const state = await evaluate<"pod" | "invalid" | null>(target, `${UPS_POD_BUTTON} ? "pod" : /invalid tracking number|not active yet/i.test(document.body.innerText) ? "invalid" : null`).catch(() => null)
    if (state === "pod") break
    // UPS drops tracking history after some months; older shipments come back as "invalid".
    if (state === "invalid") throw new Error("UPS no longer has tracking for this number (UPS removes older shipments).")
    if (shouldStop()) throw new StoppedError()
    if (Date.now() > deadline) throw new Error("UPS showed no Proof of Delivery (not delivered yet?).")
    await sleep(WAIT_STEP_MS)
  }
  // A plain DOM click: UPS's survey and chat pop-ups can sit over the button and catch a real one.
  await evaluate(target, `${UPS_POD_BUTTON}.click()`)
  const letter = await waitFor(target, () => /proof of delivery/iu.test(document.getElementById("stApp_podModal")?.textContent ?? ""), null, LOAD_TIMEOUT_MS, shouldStop)
  if (!letter) throw new Error(`UPS didn’t open the Proof of Delivery for ${trackingId}.`)
  return captureElement(target, `document.getElementById("stApp_podModal")?.closest(".modal-content") ?? document.getElementById("stApp_podModal")`)
}

/** Everything for one shipment. Problems that leave the rest usable become notes, not errors. */
export async function captureShipment(
  target: Target,
  shipmentId: string,
  shouldStop: () => boolean,
  progress: (message: string) => void,
): Promise<ShipmentCapture> {
  const capture: ShipmentCapture = { shipmentId, files: [], notes: [] }
  progress("Reading the shipment…")
  // Opening the JSON itself gives the tab Seller Central's origin, so the next fetch carries the session.
  await navigate(target, shipmentInfoUrl(shipmentId), shouldStop)
  const info = await pageJson(target, shipmentInfoUrl(shipmentId))
  if (info.status !== 200 || (info.body as { shipmentId?: unknown } | null)?.shipmentId !== shipmentId) {
    throw new Error("Not found in the current store.")
  }
  const { upsIds, boxes } = await upsTrackingIds(target, shipmentId)

  const workflowId = parseWorkflowId(info.body)
  if (workflowId) {
    try {
      capture.files.push(...await captureSendToAmazon(target, workflowId, shouldStop, progress))
    } catch (error) {
      if (error instanceof StoppedError) throw error
      capture.notes.push(`Send to Amazon: ${(error as Error).message}`)
    }
  } else {
    capture.notes.push("Send to Amazon: this shipment wasn’t created with Send to Amazon.")
  }

  if (upsIds.length === 0) capture.notes.push(boxes ? "UPS: no UPS tracking numbers on this shipment." : "UPS: this shipment has no tracking numbers yet.")
  for (const trackingId of upsIds) {
    if (shouldStop()) throw new StoppedError()
    progress(`Capturing UPS Proof of Delivery ${trackingId}…`)
    try {
      capture.files.push({ name: `ups-pod-${trackingId}.png`, data: await captureUpsProof(target, trackingId, shouldStop) })
    } catch (error) {
      if (error instanceof StoppedError) throw error
      capture.notes.push(`UPS ${trackingId}: ${(error as Error).message}`)
    }
  }
  return capture
}

/** A background tab in the user's window with the debugger attached, for the whole run. */
export async function openCaptureTab(): Promise<{ target: Target; close: () => Promise<void> }> {
  const window = await chrome.windows.getLastFocused({ windowTypes: ["normal"] }).catch(() => undefined)
  const tab = await chrome.tabs.create({ url: "about:blank", active: false, ...(window?.id === undefined ? {} : { windowId: window.id }) })
  if (tab.id === undefined) throw new Error("Chrome couldn’t open a tab.")
  const target = { tabId: tab.id }
  try {
    await chrome.debugger.attach(target, "1.3")
  } catch (error) {
    await chrome.tabs.remove(tab.id).catch(() => undefined)
    throw error
  }
  return {
    target,
    close: async () => {
      await chrome.debugger.detach(target).catch(() => undefined)
      await chrome.tabs.remove(target.tabId).catch(() => undefined)
    },
  }
}
