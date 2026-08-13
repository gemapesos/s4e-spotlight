import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import styles from "./styles.css?inline"
import { CommandPalette } from "./CommandPalette"
import { isPaletteShortcut } from "./lib/shortcut"

const HOST_ID = "command-palette-extension-root"
const PALETTE_OPEN_ATTRIBUTE = "data-s4e-palette-open"
const PASTE_GUARD_KEY = "__s4eSpotlightPasteGuard"

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

export type OpenIdsResponse =
  | { ok: true }
  | { ok: false; error: string }

export interface MountedCommandPalette {
  destroy: () => void
  host: HTMLElement
  setOpen: (open: boolean) => void
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

  const shadowRoot = host.attachShadow({ mode: shadowMode })
  const style = targetDocument.createElement("style")
  style.textContent = styles
  shadowRoot.append(style)

  const mountPoint = targetDocument.createElement("div")
  mountPoint.className = "palette-scope"
  mountPoint.style.pointerEvents = "auto"
  shadowRoot.append(mountPoint)
  targetDocument.documentElement.append(host)

  let root: Root | null = createRoot(mountPoint)
  let isOpen = false
  let previousFocus: HTMLElement | null = null
  let unlockDocumentScroll: (() => void) | null = null

  const setOpen = (nextOpen: boolean) => {
    if (nextOpen === isOpen) return

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

    root?.render(
      <React.StrictMode>
        <CommandPalette
          container={shadowRoot}
          open={isOpen}
          onOpenCaseIds={openCaseIds}
          onOpenShipmentIds={openShipmentIds}
          onOpenChange={setOpen}
        />
      </React.StrictMode>,
    )

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

  root.render(
    <React.StrictMode>
      <CommandPalette
        container={shadowRoot}
        open={false}
        onOpenCaseIds={openCaseIds}
        onOpenShipmentIds={openShipmentIds}
        onOpenChange={setOpen}
      />
    </React.StrictMode>,
  )

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
      root?.unmount()
      root = null
      host.remove()
    },
  }
}

if (
  typeof window !== "undefined" &&
  window.top === window &&
  import.meta.env.MODE !== "test"
) {
  mountCommandPalette()
}
