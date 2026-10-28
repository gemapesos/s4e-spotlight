import { describe, expect, it } from "vitest"

import { isPaletteShortcut } from "../../src/shared/shortcut"

function keyboardEvent(init: KeyboardEventInit) {
  return new KeyboardEvent("keydown", init)
}

describe("isPaletteShortcut", () => {
  it("accepts Command+/", () => {
    expect(isPaletteShortcut(keyboardEvent({ code: "Slash", metaKey: true }))).toBe(true)
  })

  it("accepts Ctrl+/", () => {
    expect(isPaletteShortcut(keyboardEvent({ key: "/", ctrlKey: true }))).toBe(true)
  })

  it.each([
    { code: "Slash" },
    { code: "Slash", ctrlKey: true, shiftKey: true },
    { code: "Slash", metaKey: true, altKey: true },
    { code: "Period", ctrlKey: true },
  ])("rejects non-matching modifiers and keys", (init) => {
    expect(isPaletteShortcut(keyboardEvent(init))).toBe(false)
  })
})
