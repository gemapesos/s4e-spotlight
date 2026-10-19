const PALETTE_HOST_ID = "command-palette-extension-root"
const PALETTE_OPEN_ATTRIBUTE = "data-s4e-palette-open"
const PASTE_GUARD_KEY = "__s4eSpotlightPasteGuard"

interface PasteGuardController {
  destroy: () => void
}

type PasteGuardWindow = Window &
  typeof globalThis & {
    [PASTE_GUARD_KEY]?: PasteGuardController
  }

function isPasteShortcut(event: KeyboardEvent): boolean {
  return (
    typeof event.key === "string" &&
    event.key.toLowerCase() === "v" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey
  )
}

function isSelectAllShortcut(event: KeyboardEvent): boolean {
  return (
    typeof event.key === "string" &&
    event.key.toLowerCase() === "a" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey
  )
}

function isTextEditingKey(event: KeyboardEvent): boolean {
  if (typeof event.key !== "string") return false

  const canProduceText =
    event.key.length === 1 ||
    event.key === "Dead" ||
    event.key === "Process" ||
    event.key === "Unidentified"
  const usesPrimaryShortcut =
    event.metaKey || (event.ctrlKey && !event.altKey)

  return (
    (!usesPrimaryShortcut && canProduceText) ||
    event.key === "Backspace" ||
    event.key === "Delete"
  )
}

function isEditableTarget(event: Event): boolean {
  const target = event.composedPath()[0]
  if (!(target instanceof Element)) return false
  return target.matches("input, textarea, [contenteditable]:not([contenteditable=false])")
}

/** Space on a palette list (no text field focused) toggles the selected row, so the palette must receive it. */
function isListSpace(event: KeyboardEvent): boolean {
  return event.key === " " && !isEditableTarget(event)
}

function isGuardedEvent(event: Event): boolean {
  if (event.type === "paste" || event.type === "beforeinput") return true
  if (event.type !== "keydown" && event.type !== "keypress") return false

  const keyboardEvent = event as KeyboardEvent
  if (isListSpace(keyboardEvent)) return false
  return (
    isTextEditingKey(keyboardEvent) ||
    isPasteShortcut(keyboardEvent) ||
    isSelectAllShortcut(keyboardEvent)
  )
}

function paletteOwnsEvent(targetDocument: Document, event: Event): boolean {
  const host = targetDocument.getElementById(PALETTE_HOST_ID)

  if (!host || host.getAttribute(PALETTE_OPEN_ATTRIBUTE) !== "true") {
    return false
  }

  return (
    targetDocument.activeElement === host || event.composedPath().includes(host)
  )
}

function installPasteGuard(targetWindow: Window): PasteGuardController {
  const targetDocument = targetWindow.document
  const guard = (event: Event) => {
    if (!isGuardedEvent(event) || !paletteOwnsEvent(targetDocument, event)) {
      return
    }

    event.stopImmediatePropagation()
  }

  targetWindow.addEventListener("keydown", guard, true)
  targetWindow.addEventListener("keypress", guard, true)
  targetWindow.addEventListener("paste", guard, true)
  targetWindow.addEventListener("beforeinput", guard, true)

  return {
    destroy: () => {
      targetWindow.removeEventListener("keydown", guard, true)
      targetWindow.removeEventListener("keypress", guard, true)
      targetWindow.removeEventListener("paste", guard, true)
      targetWindow.removeEventListener("beforeinput", guard, true)
    },
  }
}

const pasteGuardWindow = window as PasteGuardWindow
pasteGuardWindow[PASTE_GUARD_KEY]?.destroy()
pasteGuardWindow[PASTE_GUARD_KEY] = installPasteGuard(window)
