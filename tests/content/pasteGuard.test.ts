import { afterEach, describe, expect, it, vi } from "vitest"

import "../../src/content/pasteGuard"

const HOST_ID = "command-palette-extension-root"
const OPEN_ATTRIBUTE = "data-s4e-palette-open"

function createFocusedPalette(open = true, inputType?: "password") {
  const host = document.createElement("div")
  host.id = HOST_ID
  host.setAttribute(OPEN_ATTRIBUTE, String(open))
  const shadowRoot = host.attachShadow({ mode: "open" })
  const textarea = inputType
    ? document.createElement("input")
    : document.createElement("textarea")
  if (inputType) textarea.setAttribute("type", inputType)
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
    { type: "keydown", key: "a" },
    { type: "keydown", key: "Z", shiftKey: true },
    { type: "keydown", key: "!", shiftKey: true },
    { type: "keydown", key: "ø", altKey: true },
    { type: "keydown", key: "@", altKey: true, ctrlKey: true },
    { type: "keydown", key: "Dead", altKey: true },
    { type: "keydown", key: "Process" },
    { type: "keydown", key: "Backspace" },
    { type: "keydown", key: "Delete" },
    { type: "keypress", key: "a" },
  ])(
    "isolates password-editing $type for $key from hostile page handlers",
    ({ type, ...init }) => {
      const { textarea } = createFocusedPalette(true, "password")
      const pageHandler = vi.fn((event: Event) => event.preventDefault())
      window.addEventListener(type, pageHandler)
      const event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        ...init,
      })

      expect(textarea.dispatchEvent(event)).toBe(true)
      expect(event.defaultPrevented).toBe(false)
      expect(pageHandler).not.toHaveBeenCalled()

      window.removeEventListener(type, pageHandler)
    },
  )

  it.each([
    "insertText",
    "insertCompositionText",
    "insertReplacementText",
    "deleteContentBackward",
    "deleteContentForward",
    "historyUndo",
  ])("isolates %s beforeinput without cancelling its native default", (inputType) => {
    const { textarea } = createFocusedPalette()
    const pageHandler = vi.fn((event: Event) => event.preventDefault())
    window.addEventListener("beforeinput", pageHandler)
    const event = Object.assign(
      new Event("beforeinput", {
        bubbles: true,
        cancelable: true,
        composed: true,
      }),
      { inputType },
    )

    expect(textarea.dispatchEvent(event)).toBe(true)
    expect(event.defaultPrevented).toBe(false)
    expect(pageHandler).not.toHaveBeenCalled()

    window.removeEventListener("beforeinput", pageHandler)
  })

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

  it("still isolates Space typed into a palette text field", () => {
    const { textarea } = createFocusedPalette()
    const pageHandler = vi.fn()
    window.addEventListener("keydown", pageHandler)

    textarea.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, key: " " }))

    expect(pageHandler).not.toHaveBeenCalled()
    window.removeEventListener("keydown", pageHandler)
  })

  it("lets Space reach a palette list so it can toggle the selected row", () => {
    const host = document.createElement("div")
    host.id = HOST_ID
    host.setAttribute(OPEN_ATTRIBUTE, "true")
    const list = document.createElement("div")
    list.tabIndex = -1
    host.attachShadow({ mode: "open" }).append(list)
    document.documentElement.append(host)
    list.focus()
    const paletteHandler = vi.fn()
    list.addEventListener("keydown", paletteHandler)

    list.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, composed: true, key: " " }))

    expect(paletteHandler).toHaveBeenCalledOnce()
  })

  it("does not intercept guarded input when the palette is closed", () => {
    const { textarea } = createFocusedPalette(false)
    const keyHandler = vi.fn()
    const inputHandler = vi.fn()
    window.addEventListener("keydown", keyHandler)
    window.addEventListener("beforeinput", inputHandler)

    textarea.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "a",
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

    expect(keyHandler).toHaveBeenCalledOnce()
    expect(inputHandler).toHaveBeenCalledOnce()
    window.removeEventListener("keydown", keyHandler)
    window.removeEventListener("beforeinput", inputHandler)
  })

  it("does not intercept guarded input outside the focused palette", () => {
    createFocusedPalette()
    const pageInput = document.createElement("textarea")
    document.body.append(pageInput)
    pageInput.focus()
    const keyHandler = vi.fn()
    const inputHandler = vi.fn()
    window.addEventListener("keydown", keyHandler)
    window.addEventListener("beforeinput", inputHandler)

    pageInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "a",
      }),
    )
    pageInput.dispatchEvent(
      Object.assign(
        new Event("beforeinput", {
          bubbles: true,
          cancelable: true,
          composed: true,
        }),
        { inputType: "insertText" },
      ),
    )

    expect(keyHandler).toHaveBeenCalledOnce()
    expect(inputHandler).toHaveBeenCalledOnce()
    window.removeEventListener("keydown", keyHandler)
    window.removeEventListener("beforeinput", inputHandler)
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

  it.each(["Enter", "Escape", "Tab", "ArrowDown", "Home", "End"])(
    "leaves the %s control or navigation key on its existing path",
    (key) => {
      const { textarea } = createFocusedPalette()
      const pageHandler = vi.fn()
      window.addEventListener("keydown", pageHandler)

      textarea.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          composed: true,
          key,
        }),
      )

      expect(pageHandler).toHaveBeenCalledOnce()
      window.removeEventListener("keydown", pageHandler)
    },
  )

  it("leaves unrelated primary-modifier shortcuts on their existing path", () => {
    const { textarea } = createFocusedPalette()
    const keyHandler = vi.fn()
    window.addEventListener("keydown", keyHandler)

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
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "k",
        metaKey: true,
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

    expect(keyHandler).toHaveBeenCalledTimes(3)
    window.removeEventListener("keydown", keyHandler)
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
    const keypressHandler = vi.fn()
    const inputHandler = vi.fn()

    ;(
      window as typeof window & {
        __s4eSpotlightPasteGuard?: { destroy: () => void }
      }
    ).__s4eSpotlightPasteGuard?.destroy()

    window.addEventListener("paste", pasteHandler)
    window.addEventListener("keydown", keyHandler)
    window.addEventListener("keypress", keypressHandler)
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
      new KeyboardEvent("keypress", {
        bubbles: true,
        cancelable: true,
        composed: true,
        key: "a",
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
    expect(keypressHandler).toHaveBeenCalledOnce()
    expect(inputHandler).toHaveBeenCalledOnce()
    window.removeEventListener("paste", pasteHandler)
    window.removeEventListener("keydown", keyHandler)
    window.removeEventListener("keypress", keypressHandler)
    window.removeEventListener("beforeinput", inputHandler)
  })
})
