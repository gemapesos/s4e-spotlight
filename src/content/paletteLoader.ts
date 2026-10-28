/**
 * content.js, on every page: opens the command palette on ⌘/ or Ctrl+/, and when the service
 * worker asks. Seller Central requests are answered by seller-central.js.
 */
import { createLogger, describeError, errorMessage, forwardLogsToBackground, setLogSink } from "@/shared/log"
import { isPaletteShortcut } from "@/shared/shortcut"
import { isFromWorker, sendToBackground } from "@/shared/messages"

const PALETTE_APP_FILE = "palette-app.js"
const EXTENSION_CONTEXT_INVALIDATED = "Extension context invalidated."
const PALETTE_UNSUPPORTED_PAGE = "The command palette can’t open on this page."
const contentLog = createLogger("content")

export type PaletteOpenMode = "commands" | "switching"

interface MountedPalette {
  setOpen: (open: boolean, mode?: PaletteOpenMode) => void
  showSwitchDone: (storeName: string) => void
}

interface PaletteAppModule {
  mountCommandPalette: () => MountedPalette | null
}

let mounted: MountedPalette | null = null
let pending: Promise<MountedPalette> | null = null

/**
 * React DOM reads document.createElement("div").style as it loads. XML documents such as feeds,
 * sitemaps, and SVG files create elements without one, so the palette runs only on HTML pages.
 */
export function canHostPalette(doc: Document = document): boolean {
  return doc.createElement("div").style !== undefined
}

export async function loadPalette(doc: Document = document): Promise<MountedPalette> {
  if (mounted) return mounted
  if (!pending) {
    if (!canHostPalette(doc)) throw new Error(PALETTE_UNSUPPORTED_PAGE)
    if (typeof chrome === "undefined" || !chrome.runtime?.id) {
      throw new Error(EXTENSION_CONTEXT_INVALIDATED)
    }
    pending = import(chrome.runtime.getURL(PALETTE_APP_FILE))
      .then((mod: PaletteAppModule) => {
        mounted = mod.mountCommandPalette()
        if (!mounted) throw new Error("Could not mount the command palette.")
        return mounted
      })
      .catch((error: unknown) => {
        pending = null
        contentLog.error("palette.loadFailed", { contentType: doc.contentType, error: describeError(error) })
        throw error
      })
  }
  return pending
}

function onKeyDown(event: KeyboardEvent): void {
  handleContentKeyDown(event)
}

export function handleContentKeyDown(
  event: KeyboardEvent,
  load: () => Promise<MountedPalette> = loadPalette,
): void {
  if (!isPaletteShortcut(event)) {
    if (event.metaKey || event.ctrlKey) void load().catch(() => undefined)
    return
  }

  event.preventDefault()
  event.stopImmediatePropagation()
  window.removeEventListener("keydown", onKeyDown, true)
  void load()
    .then((palette) => {
      palette.setOpen(true)
    })
    .catch(() => {
      window.addEventListener("keydown", onKeyDown, true)
    })
}

/** A finished store switch reloads this tab; show its result until the user is back. */
export async function showSwitchNotice(load: () => Promise<MountedPalette> = loadPalette): Promise<void> {
  if (location.origin !== "https://sellercentral.amazon.com") return
  const { storeName } = await sendToBackground({ type: "ACCOUNTS_SWITCH_NOTICE" })
  if (typeof storeName !== "string") return
  ;(await load()).showSwitchDone(storeName)
}

/** Answers only the palette's own messages; any other reply would win over seller-central.js. */
export function handlePaletteMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
  load: () => Promise<MountedPalette> = loadPalette,
): boolean | undefined {
  if (!message || typeof message !== "object" || !("type" in message)) return undefined
  if (!isFromWorker(sender)) {
    sendResponse({ ok: false, error: "Unauthorized extension message." })
    return undefined
  }
  const record = message as { type?: unknown; mode?: unknown; storeName?: unknown }
  if (record.type === "ACCOUNTS_RESUME_CHECK") { sendResponse({ ok: true }); return }
  if (record.type === "ACCOUNTS_SWITCH_DONE") {
    const storeName = typeof record.storeName === "string" ? record.storeName : "the selected store"
    void load().then((palette) => palette.showSwitchDone(storeName), () => undefined)
    sendResponse({ ok: true })
    return
  }
  if (record.type !== "OPEN_PALETTE") return undefined
  const mode = record.mode === "switching" ? record.mode : undefined
  void load()
    .then((palette) => {
      palette.setOpen(true, mode)
    })
    .then(
      () => sendResponse({ ok: true }),
      (error: unknown) => sendResponse({
        ok: false,
        error: errorMessage(error, "Couldn’t open the command palette."),
      }),
    )
  return true
}

if (typeof window !== "undefined" && window.top === window) {
  if (canHostPalette()) window.addEventListener("keydown", onKeyDown, true)
  if (typeof chrome !== "undefined") {
    if (chrome.runtime?.id) setLogSink(forwardLogsToBackground())
    chrome.runtime?.onMessage?.addListener(handlePaletteMessage)
    if (chrome.runtime?.id && canHostPalette()) void showSwitchNotice().catch(() => undefined)
  }
}
