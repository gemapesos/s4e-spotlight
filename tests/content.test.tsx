import { afterEach, describe, expect, it, vi } from "vitest"

import {
  mountCommandPalette,
  openCaseIds,
  openShipmentIds,
  openSkuIds,
  type MountedCommandPalette,
} from "../src/content"

let mounted: MountedCommandPalette | null = null

afterEach(() => {
  mounted?.destroy()
  mounted = null
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute("style")
  document.body.removeAttribute("style")
  document.body.replaceChildren()
  document.documentElement.querySelectorAll("#command-palette-extension-root").forEach((node) => node.remove())
})

describe("content-script mount", () => {
  it("sends Case IDs to the background worker and requires success", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(openCaseIds(["21476974831", "21476874681"])).resolves.toBeUndefined()
    expect(sendMessage).toHaveBeenCalledWith({
      type: "OPEN_CASE_IDS",
      caseIds: ["21476974831", "21476874681"],
    })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(openCaseIds(["21476974831"])).rejects.toThrow("worker failed")
  })

  it("sends Shipment IDs to the background worker and requires success", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(
      openShipmentIds(["FBA19749WJ6Q", "FBA18G77LW09"]),
    ).resolves.toBeUndefined()
    expect(sendMessage).toHaveBeenCalledWith({
      type: "OPEN_SHIPMENT_IDS",
      shipmentIds: ["FBA19749WJ6Q", "FBA18G77LW09"],
    })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(openShipmentIds(["FBA19749WJ6Q"])).rejects.toThrow(
      "worker failed",
    )
  })

  it("sends SKUs to the background worker and requires success", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(openSkuIds(["ABC-123", "DEF_456"])).resolves.toBeUndefined()
    expect(sendMessage).toHaveBeenCalledWith({
      type: "OPEN_SKU_IDS",
      skuIds: ["ABC-123", "DEF_456"],
    })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(openSkuIds(["ABC-123"])).rejects.toThrow("worker failed")
  })

  it("isolates the UI in a shadow root and ignores a duplicate mount", () => {
    mounted = mountCommandPalette({ document, shadowMode: "open" })

    expect(mounted).not.toBeNull()
    expect(mounted?.host.parentElement).toBe(document.body)
    expect(mounted?.host).toHaveAttribute("data-s4e-palette-open", "false")
    expect(mounted?.shadowRoot.querySelector("style")).not.toBeNull()
    expect(mountCommandPalette({ document, shadowMode: "open" })).toBeNull()
  })

  it("captures the shortcut, prevents the page handler, and toggles the dialog", async () => {
    const errorSpy = vi.spyOn(console, "error")
    mounted = mountCommandPalette({ document, shadowMode: "open" })
    const pageHandler = vi.fn()
    window.addEventListener("keydown", pageHandler)

    try {
      const openEvent = new KeyboardEvent("keydown", {
        code: "Slash",
        ctrlKey: true,
        cancelable: true,
      })
      window.dispatchEvent(openEvent)

      await vi.waitFor(() => {
        expect(mounted?.shadowRoot.querySelector("[role=dialog]")).not.toBeNull()
      })
      expect(mounted?.host.style.pointerEvents).toBe("auto")
      expect(mounted?.host).toHaveAttribute("data-s4e-palette-open", "true")
      expect(openEvent.defaultPrevented).toBe(true)
      expect(pageHandler).not.toHaveBeenCalled()
      expect(
        errorSpy.mock.calls.some(([message]) => String(message).includes("aria-hidden")),
      ).toBe(false)
    } finally {
      errorSpy.mockRestore()
    }

    const closeEvent = new KeyboardEvent("keydown", {
      code: "Slash",
      ctrlKey: true,
      cancelable: true,
    })
    window.dispatchEvent(closeEvent)

    await vi.waitFor(() => {
      expect(mounted?.shadowRoot.querySelector("[role=dialog]")).toBeNull()
    })
    expect(mounted?.host.style.pointerEvents).toBe("none")
    expect(mounted?.host).toHaveAttribute("data-s4e-palette-open", "false")
    window.removeEventListener("keydown", pageHandler)
  })

  it("locks page scrolling without reserving a scrollbar gutter and restores styles", async () => {
    document.documentElement.style.overflowX = "clip"
    document.documentElement.style.overflowY = "auto"
    document.body.style.overflow = "visible"
    mounted = mountCommandPalette({ document, shadowMode: "open" })

    mounted?.setOpen(true)

    expect(document.documentElement.style.overflow).toBe("hidden")
    expect(document.body.style.overflow).toBe("hidden")
    expect(document.documentElement.style.scrollbarGutter).toBe("")

    mounted?.setOpen(false)

    expect(document.documentElement.style.overflow).toBe("")
    expect(document.documentElement.style.overflowX).toBe("clip")
    expect(document.documentElement.style.overflowY).toBe("auto")
    expect(document.body.style.overflow).toBe("visible")
  })

  it("restores page overflow styles when destroyed while open", () => {
    document.documentElement.style.overflow = "scroll"
    document.body.style.overflowY = "auto"
    mounted = mountCommandPalette({ document, shadowMode: "open" })

    mounted?.setOpen(true)
    mounted?.destroy()
    mounted = null

    expect(document.documentElement.style.overflow).toBe("scroll")
    expect(document.body.style.overflowY).toBe("auto")
  })

  it("marks the palette closed and tears down the early guard on destroy", () => {
    const destroyGuard = vi.fn()
    Object.assign(window, {
      __s4eSpotlightPasteGuard: { destroy: destroyGuard },
    })
    mounted = mountCommandPalette({ document, shadowMode: "open" })
    mounted?.setOpen(true)
    const host = mounted?.host

    mounted?.destroy()
    mounted = null

    expect(host).toHaveAttribute("data-s4e-palette-open", "false")
    expect(destroyGuard).toHaveBeenCalledOnce()
    delete (
      window as typeof window & {
        __s4eSpotlightPasteGuard?: { destroy: () => void }
      }
    ).__s4eSpotlightPasteGuard
  })

  it("restores focus after closing", async () => {
    const trigger = document.createElement("button")
    document.body.append(trigger)
    trigger.focus()
    mounted = mountCommandPalette({ document, shadowMode: "open" })

    mounted?.setOpen(true)
    await vi.waitFor(() => {
      expect(mounted?.shadowRoot.activeElement?.getAttribute("aria-label")).toBe("Search commands")
    })

    mounted?.setOpen(false)
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    expect(document.activeElement).toBe(trigger)
  })
})
