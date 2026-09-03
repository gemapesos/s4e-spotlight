import { afterEach, describe, expect, it, vi } from "vitest"

import {
  focusCurrentStore,
  generateReports,
  getAccountsStatus,
  getSettings,
  mountCommandPalette,
  openCaseIds,
  openShipmentIds,
  openSkuIds,
  openTimeOut,
  prepareReports,
  type MountedCommandPalette,
} from "../src/paletteApp"

let mounted: MountedCommandPalette | null = null
const documentFonts = Object.getOwnPropertyDescriptor(document, "fonts")
  ?? Object.getOwnPropertyDescriptor(Document.prototype, "fonts")

afterEach(() => {
  mounted?.destroy()
  mounted = null
  vi.unstubAllGlobals()
  document.documentElement.removeAttribute("style")
  document.body.removeAttribute("style")
  document.body.replaceChildren()
  document.documentElement.querySelectorAll("#command-palette-extension-root").forEach((node) => node.remove())
  if (documentFonts) Object.defineProperty(document, "fonts", documentFonts)
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

  it("asks the background worker to open Time Out and requires success", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true, openedCount: 2 })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(openTimeOut()).resolves.toBeUndefined()
    expect(sendMessage).toHaveBeenCalledWith({ type: "OPEN_TIME_OUT" })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(openTimeOut()).rejects.toThrow("worker failed")
  })

  it("loads accounts status from the background worker", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      initialized: true,
      unlocked: false,
      stores: [],
      currentStore: null,
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(getAccountsStatus()).resolves.toEqual({
      initialized: true,
      unlocked: false,
      stores: [],
      currentStore: null,
    })
    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_STATUS" })
  })

  it("asks the background worker to focus or open Seller Central for the current store", async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(focusCurrentStore()).resolves.toBeUndefined()
    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(focusCurrentStore()).rejects.toThrow("worker failed")
  })

  it("asks the background worker to prepare Seller Central for reports", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      loggedInToStore: true,
      sellerCentralTabId: 22,
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(prepareReports()).resolves.toEqual({
      loggedInToStore: true,
      openedPromptOnSellerCentral: undefined,
    })
    expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_PREPARE" })

    sendMessage.mockResolvedValue({ ok: false, error: "worker failed" })
    await expect(prepareReports()).rejects.toThrow("worker failed")
  })

  it("asks the background worker for settings when the palette opens", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      settings: {
        features: {
          "open-case-ids": false,
          "open-shipment-ids": true,
          "search-skus": true,
          "time-out": true,
          "generate-reports": true,
          accounts: true,
        },
        timeOutForm: {
          staffName: "Dhylan Mapesos",
          business: "S4E",
          supervisor: "Lou",
          hoursWorked: "4",
          scheduledAccountsCompleted: "Yes",
          blockersOrRedFlags: "No",
        },
      },
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    mounted = mountCommandPalette({ document, shadowMode: "open" })
    mounted?.setOpen(true)

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({ type: "GET_SETTINGS" })
    })
  })

  it("registers Geist at mount and loads it before first paint", async () => {
    const load = vi.fn().mockResolvedValue(undefined)
    class FontFaceMock {
      family: string
      load = load
      constructor(family: string) {
        this.family = family
      }
    }
    const add = vi.fn()
    vi.stubGlobal("FontFace", FontFaceMock)
    Object.defineProperty(document, "fonts", { configurable: true, value: { add } })
    vi.stubGlobal("chrome", {
      runtime: {
        getURL: (path: string) => `chrome-extension://id/${path}`,
        sendMessage: vi.fn().mockResolvedValue({ ok: true, settings: {} }),
      },
    })

    mounted = mountCommandPalette({ document, shadowMode: "open" })

    expect(add).toHaveBeenCalledOnce()
    expect(add.mock.calls[0]?.[0]).toBeInstanceOf(FontFaceMock)
    expect(add.mock.calls[0]?.[0].family).toBe("Geist Variable")
    expect(load).toHaveBeenCalledOnce()
  })

  it("renders the first open after settings resolve", async () => {
    let resolveSettings: ((value: unknown) => void) | undefined
    const sendMessage = vi.fn((message: { type?: string }) => {
      if (message.type === "GET_SETTINGS") {
        return new Promise((resolve) => {
          resolveSettings = resolve
        })
      }
      return Promise.resolve({ ok: true })
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    mounted = mountCommandPalette({ document, shadowMode: "open" })
    mounted?.setOpen(true)

    expect(mounted?.shadowRoot.querySelector("[role=dialog]")).toBeNull()
    expect(sendMessage).toHaveBeenCalledWith({ type: "GET_SETTINGS" })

    resolveSettings?.({ ok: true, settings: {} })
    await vi.waitFor(() => {
      expect(mounted?.shadowRoot.querySelector("[role=dialog]")).not.toBeNull()
    })
  })

  it("loads settings from the background worker", async () => {
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      settings: { features: { "open-case-ids": false } },
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })

    await expect(getSettings()).resolves.toMatchObject({
      features: { "open-case-ids": false, "time-out": true },
    })
    expect(sendMessage).toHaveBeenCalledWith({ type: "GET_SETTINGS" })
  })

  it("downloads a report named for the current store", async () => {
    const sendMessage = vi.fn(async (message: { type?: string }) => {
      if (message.type === "REPORTS_FETCH_UNFULFILLABLE") return { ok: true, listings: [] }
      if (message.type === "REPORTS_FETCH_FEEDBACK") return { ok: true, feedbacks: [] }
      if (message.type === "REPORTS_FETCH_STRANDED") return { ok: true, listings: [] }
      return {
        ok: true,
        initialized: true,
        unlocked: true,
        stores: [{ id: "store-1", name: "JMG Outdoors" }],
        currentStore: { id: "store-1", name: "JMG Outdoors" },
      }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    const createObjectURL = vi.fn().mockReturnValue("blob:report")
    const revokeObjectURL = vi.fn()
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })
    const clicked: { download?: string } = {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.download = this.download
    })

    try {
      await generateReports(new Date(2026, 7, 14))
      expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_STATUS" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_UNFULFILLABLE" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_FEEDBACK" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_STRANDED" })
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026.xlsx")
      expect(createObjectURL).toHaveBeenCalledOnce()

      sendMessage.mockClear()
      await generateReports(new Date(2026, 7, 14), document, "JMG Outdoors")
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_UNFULFILLABLE" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_FEEDBACK" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_STRANDED" })
      expect(sendMessage).not.toHaveBeenCalledWith({ type: "ACCOUNTS_STATUS" })
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026.xlsx")
    } finally {
      click.mockRestore()
    }
  })

  it("starts unfulfillable, feedback, and stranded fetches in parallel", async () => {
    const resolvers: Record<string, (value: unknown) => void> = {}
    const sendMessage = vi.fn((message: { type?: string }) => new Promise((resolve) => {
      resolvers[message.type ?? ""] = resolve
    }))
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    const createObjectURL = vi.fn().mockReturnValue("blob:report")
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined)
    const onProgress = vi.fn()

    try {
      const pending = generateReports(new Date(2026, 7, 14), document, "JMG Outdoors", onProgress)
      await vi.waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_UNFULFILLABLE" })
        expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_FEEDBACK" })
        expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_STRANDED" })
      })
      expect(resolvers.REPORTS_FETCH_UNFULFILLABLE).toBeTypeOf("function")
      expect(resolvers.REPORTS_FETCH_FEEDBACK).toBeTypeOf("function")
      expect(resolvers.REPORTS_FETCH_STRANDED).toBeTypeOf("function")
      expect(onProgress).toHaveBeenCalledWith({ source: "unfulfillable", status: "active" })
      expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "active" })
      expect(onProgress).toHaveBeenCalledWith({ source: "stranded", status: "active" })
      resolvers.REPORTS_FETCH_UNFULFILLABLE?.({ ok: true, listings: [] })
      resolvers.REPORTS_FETCH_FEEDBACK?.({ ok: true, feedbacks: [] })
      resolvers.REPORTS_FETCH_STRANDED?.({ ok: true, listings: [] })
      await pending
      expect(onProgress).toHaveBeenCalledWith({ source: "unfulfillable", status: "complete" })
      expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "complete" })
      expect(onProgress).toHaveBeenCalledWith({ source: "stranded", status: "complete" })
    } finally {
      click.mockRestore()
    }
  })

  it("still downloads the report when an individual source fails", async () => {
    const sendMessage = vi.fn(async (message: { type?: string }) => {
      if (message.type === "REPORTS_FETCH_UNFULFILLABLE") {
        return { ok: false, error: "Couldn’t load unfulfillable inventory." }
      }
      if (message.type === "REPORTS_FETCH_FEEDBACK") {
        return { ok: true, feedbacks: [{ feedbackId: "fb-1", orderId: "112-1", numericRating: 1 }] }
      }
      if (message.type === "REPORTS_FETCH_STRANDED") {
        return { ok: true, listings: [{ SKU: "ABC-123" }] }
      }
      return { ok: true, currentStore: { name: "JMG Outdoors" } }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    const createObjectURL = vi.fn().mockReturnValue("blob:report")
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const clicked: { download?: string } = {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.download = this.download
    })
    const onProgress = vi.fn()

    try {
      await generateReports(new Date(2026, 7, 14), document, "JMG Outdoors", onProgress)
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_UNFULFILLABLE" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_FEEDBACK" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_STRANDED" })
      expect(onProgress).toHaveBeenCalledWith({ source: "unfulfillable", status: "error" })
      expect(onProgress).toHaveBeenCalledWith({ source: "feedback", status: "complete" })
      expect(onProgress).toHaveBeenCalledWith({ source: "stranded", status: "complete" })
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026.xlsx")
      expect(createObjectURL).toHaveBeenCalledOnce()
    } finally {
      click.mockRestore()
    }
  })

  it("names the report Unknown when no current store is set", async () => {
    const sendMessage = vi.fn(async (message: { type?: string }) => {
      if (message.type === "REPORTS_FETCH_UNFULFILLABLE") return { ok: true, listings: [] }
      if (message.type === "REPORTS_FETCH_FEEDBACK") return { ok: true, feedbacks: [] }
      if (message.type === "REPORTS_FETCH_STRANDED") return { ok: true, listings: [] }
      return {
        ok: true,
        initialized: true,
        unlocked: false,
        stores: [],
        currentStore: null,
      }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn().mockReturnValue("blob:report"),
      revokeObjectURL: vi.fn(),
    })
    const clicked: { download?: string } = {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.download = this.download
    })

    try {
      await generateReports(new Date(2026, 7, 14))
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_UNFULFILLABLE" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_FEEDBACK" })
      expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_FETCH_STRANDED" })
      expect(clicked.download).toBe("Unknown - 14-Aug-2026.xlsx")
    } finally {
      click.mockRestore()
    }
  })

  it("isolates the UI in a shadow root and ignores a duplicate mount", () => {
    mounted = mountCommandPalette({ document, shadowMode: "open" })

    expect(mounted).not.toBeNull()
    expect(mounted?.host.parentElement).toBe(document.body)
    expect(mounted?.host).toHaveAttribute("data-s4e-palette-open", "false")
    expect(mounted?.shadowRoot.querySelector("style")).not.toBeNull()
    expect(mounted?.shadowRoot.querySelector("[role=dialog]")).toBeNull()
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
