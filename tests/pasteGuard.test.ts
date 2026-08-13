import { afterEach, describe, expect, it, vi } from "vitest"

import "../src/pasteGuard"

const HOST_ID = "command-palette-extension-root"
const OPEN_ATTRIBUTE = "data-s4e-palette-open"

function createFocusedPalette(open = true) {
  const host = document.createElement("div")
  host.id = HOST_ID
  host.setAttribute(OPEN_ATTRIBUTE, String(open))
  const shadowRoot = host.attachShadow({ mode: "open" })
  const textarea = document.createElement("textarea")
  shadowRoot.append(textarea)
  document.documentElement.append(host)
  textarea.focus()

  return { host, textarea }
}

afterEach(() => {
  document.getElementById(HOST_ID)?.remove()
})

describe("early paste guard", () => {
  it.each([
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      composed: true,
      ctrlKey: true,
      key: "v",
    }),
    new Event("paste", { bubbles: true, cancelable: true, composed: true }),
    Object.assign(
      new Event("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
      { inputType: "insertFromPaste" },
    ),
  ])("isolates %s without cancelling its native default", (event) => {
    const { textarea } = createFocusedPalette()
    const pageHandler = vi.fn()
    window.addEventListener(event.type, pageHandler)

    expect(textarea.dispatchEvent(event)).toBe(true)
    expect(event.defaultPrevented).toBe(false)
    expect(pageHandler).not.toHaveBeenCalled()

    window.removeEventListener(event.type, pageHandler)
  })

  it("does not intercept paste when the palette is closed", () => {
    const { textarea } = createFocusedPalette(false)
    const pageHandler = vi.fn()
    window.addEventListener("paste", pageHandler)

    textarea.dispatchEvent(
      new Event("paste", { bubbles: true, cancelable: true, composed: true }),
    )

    expect(pageHandler).toHaveBeenCalledOnce()
    window.removeEventListener("paste", pageHandler)
  })

  it("does not intercept paste outside the focused palette", () => {
    createFocusedPalette()
    const pageInput = document.createElement("textarea")
    document.body.append(pageInput)
    pageInput.focus()
    const pageHandler = vi.fn()
    window.addEventListener("paste", pageHandler)

    pageInput.dispatchEvent(
      new Event("paste", { bubbles: true, cancelable: true, composed: true }),
    )

    expect(pageHandler).toHaveBeenCalledOnce()
    window.removeEventListener("paste", pageHandler)
    pageInput.remove()
  })

  it.each([
    { key: "a", modifier: "ctrlKey" as const },
    { key: "A", modifier: "metaKey" as const },
  ])(
    "isolates $modifier+$key without cancelling native select all",
    ({ key, modifier }) => {
      const { textarea } = createFocusedPalette()
      const pageHandler = vi.fn()
      window.addEventListener("keydown", pageHandler)
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key,
        [modifier]: true,
      })

      expect(textarea.dispatchEvent(event)).toBe(true)
      expect(event.defaultPrevented).toBe(false)
      expect(pageHandler).not.toHaveBeenCalled()

      window.removeEventListener("keydown", pageHandler)
    },
  )

  it("does not intercept select all when the palette is closed", () => {
    const { textarea } = createFocusedPalette(false)
    const pageHandler = vi.fn()
    window.addEventListener("keydown", pageHandler)

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey: true,
        key: "a",
      }),
    )

    expect(pageHandler).toHaveBeenCalledOnce()
    window.removeEventListener("keydown", pageHandler)
  })

  it("does not intercept select all outside the focused palette", () => {
    createFocusedPalette()
    const pageInput = document.createElement("textarea")
    document.body.append(pageInput)
    pageInput.focus()
    const pageHandler = vi.fn()
    window.addEventListener("keydown", pageHandler)

    pageInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        metaKey: true,
        key: "a",
      }),
    )

    expect(pageHandler).toHaveBeenCalledOnce()
    window.removeEventListener("keydown", pageHandler)
    pageInput.remove()
  })

  it("ignores unrelated keyboard and input events", () => {
    const { textarea } = createFocusedPalette()
    const keyHandler = vi.fn()
    const inputHandler = vi.fn()
    window.addEventListener("keydown", keyHandler)
    window.addEventListener("beforeinput", inputHandler)

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey: true,
        key: "c",
      }),
    )
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        altKey: true,
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey: true,
        key: "a",
      }),
    )
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        ctrlKey: true,
        key: "a",
        shiftKey: true,
      }),
    )
    textarea.dispatchEvent(
      Object.assign(
        new Event("beforeinput", {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
        { inputType: "insertText" },
      ),
    )

    expect(keyHandler).toHaveBeenCalledTimes(3)
    expect(inputHandler).toHaveBeenCalledOnce()
    window.removeEventListener("keydown", keyHandler)
    window.removeEventListener("beforeinput", inputHandler)
  })

  it("ignores keydown-like events that do not provide a key", () => {
    const { textarea } = createFocusedPalette()
    const pageHandler = vi.fn()
    window.addEventListener("keydown", pageHandler)
    const event = new Event("keydown", {
      bubbles: true,
      cancelable: true,
      composed: true,
    })

    expect(() => textarea.dispatchEvent(event)).not.toThrow()
    expect(pageHandler).toHaveBeenCalledOnce()

    window.removeEventListener("keydown", pageHandler)
  })

  it("removes every guard listener during teardown", () => {
    const { textarea } = createFocusedPalette()
    const pasteHandler = vi.fn()
    const keyHandler = vi.fn()
    const inputHandler = vi.fn()

    ;(
      window as typeof window & {
        __s4eSpotlightPasteGuard?: { destroy: () => void }
      }
    ).__s4eSpotlightPasteGuard?.destroy()

    window.addEventListener("paste", pasteHandler)
    window.addEventListener("keydown", keyHandler)
    window.addEventListener("beforeinput", inputHandler)

    textarea.dispatchEvent(
      new Event("paste", { bubbles: true, cancelable: true, composed: true }),
    )
    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        metaKey: true,
        key: "v",
      }),
    )
    textarea.dispatchEvent(
      Object.assign(
        new Event("beforeinput", {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
        { inputType: "insertFromPaste" },
      ),
    )

    expect(pasteHandler).toHaveBeenCalledOnce()
    expect(keyHandler).toHaveBeenCalledOnce()
    expect(inputHandler).toHaveBeenCalledOnce()
    window.removeEventListener("paste", pasteHandler)
    window.removeEventListener("keydown", keyHandler)
    window.removeEventListener("beforeinput", inputHandler)
  })
})
