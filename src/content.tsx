import { fetchNeutralNegativeFeedbacks } from "./lib/feedback"
import { isPaletteShortcut } from "./lib/shortcut"
import type { ReportProgressEvent } from "./lib/reportProgress"
import { sellerCentralSessionStatus } from "./lib/sellerCentralSession"
import { fetchStrandedListings } from "./lib/stranded"
import { fetchUnfulfillableListings } from "./lib/unfulfillable"

const PALETTE_APP_FILE = "palette-app.js"

export type PaletteOpenMode = "commands" | "report-login"

interface MountedPalette {
  setOpen: (open: boolean, mode?: PaletteOpenMode) => void
}

interface PaletteAppModule {
  mountCommandPalette: () => MountedPalette | null
}

let mounted: MountedPalette | null = null
let pending: Promise<MountedPalette> | null = null

async function loadPalette(): Promise<MountedPalette> {
  if (mounted) return mounted
  if (!pending) {
    pending = import(chrome.runtime.getURL(PALETTE_APP_FILE))
      .then((mod: PaletteAppModule) => {
        mounted = mod.mountCommandPalette()
        if (!mounted) throw new Error("Could not mount the command palette.")
        return mounted
      })
      .catch((error: unknown) => {
        pending = null
        throw error
      })
  }
  return pending
}

function onKeyDown(event: KeyboardEvent): void {
  if (!isPaletteShortcut(event)) return

  event.preventDefault()
  event.stopImmediatePropagation()
  window.removeEventListener("keydown", onKeyDown, true)
  void loadPalette()
    .then((palette) => {
      palette.setOpen(true)
    })
    .catch(() => {
      window.addEventListener("keydown", onKeyDown, true)
    })
}

function emitReportProgress(event: ReportProgressEvent): void {
  if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") return
  void chrome.runtime.sendMessage({ type: "REPORTS_PROGRESS", ...event }).then(
    () => undefined,
    () => undefined,
  )
}

export function handleContentMessage(
  message: unknown,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void,
  load: () => Promise<MountedPalette> = loadPalette,
): boolean | undefined {
  if (!message || typeof message !== "object" || !("type" in message)) return undefined
  const record = message as { type?: unknown; mode?: unknown }
  if (record.type === "REPORTS_SESSION_STATUS") {
    sendResponse({ ok: true, ...sellerCentralSessionStatus() })
    return
  }
  if (record.type === "OPEN_PALETTE") {
    const mode = record.mode === "report-login" ? "report-login" : undefined
    void load()
      .then((palette) => {
        palette.setOpen(true, mode)
      })
      .then(
        () => sendResponse({ ok: true }),
        (error: unknown) => sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : "Couldn’t open the command palette.",
        }),
      )
    return true
  }
  if (record.type === "REPORTS_FETCH_UNFULFILLABLE") {
    void fetchUnfulfillableListings({ onProgress: emitReportProgress }).then(
      (listings) => sendResponse({ ok: true, listings }),
      (error: unknown) => sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Couldn’t load unfulfillable inventory.",
      }),
    )
    return true
  }
  if (record.type === "REPORTS_FETCH_FEEDBACK") {
    void fetchNeutralNegativeFeedbacks({ onProgress: emitReportProgress }).then(
      (feedbacks) => sendResponse({ ok: true, feedbacks }),
      (error: unknown) => sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Couldn’t load seller feedback.",
      }),
    )
    return true
  }
  if (record.type === "REPORTS_FETCH_STRANDED") {
    void fetchStrandedListings({ onProgress: emitReportProgress }).then(
      (listings) => sendResponse({ ok: true, listings }),
      (error: unknown) => sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Couldn’t load stranded inventory.",
      }),
    )
    return true
  }
  return undefined
}

if (typeof window !== "undefined" && window.top === window) {
  window.addEventListener("keydown", onKeyDown, true)
  if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.addListener(handleContentMessage)
}
