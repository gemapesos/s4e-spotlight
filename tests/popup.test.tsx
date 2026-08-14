import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_ENABLED_FEATURES,
  DEFAULT_TIME_OUT_FORM_VALUES,
  SETTINGS_STORAGE_KEY,
} from "../src/lib/settings"
import { PopupApp } from "../src/popup/PopupApp"

function mockChrome(stored?: unknown) {
  const store: Record<string, unknown> = stored === undefined ? {} : { [SETTINGS_STORAGE_KEY]: stored }
  const create = vi.fn().mockResolvedValue({ id: 1 })
  const getURL = vi.fn((path: string) => `chrome-extension://id/${path}`)
  vi.stubGlobal("chrome", {
    runtime: { getURL },
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items)
        }),
      },
    },
    tabs: { create },
  })
  return { create, getURL, store }
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe("settings popup", () => {
  beforeEach(() => {
    mockChrome()
  })

  it("toggles a feature and persists the change", async () => {
    const user = userEvent.setup()
    render(<PopupApp />)

    const toggle = await screen.findByRole("switch", { name: "Open Case ID/s" })
    expect(toggle).toHaveAttribute("aria-checked", "true")
    await user.click(toggle)

    await vi.waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [SETTINGS_STORAGE_KEY]: {
          features: { ...DEFAULT_ENABLED_FEATURES, "open-case-ids": false },
          timeOutForm: DEFAULT_TIME_OUT_FORM_VALUES,
        },
      })
    })
    expect(screen.getByRole("switch", { name: "Open Case ID/s" })).toHaveAttribute("aria-checked", "false")
  })

  it("opens the Time Out form page from the form-values link", async () => {
    const user = userEvent.setup()
    const { create, getURL } = mockChrome()
    render(<PopupApp />)

    await user.click(await screen.findByRole("button", { name: "Edit form values" }))

    expect(getURL).toHaveBeenCalledWith("timeout.html")
    expect(create).toHaveBeenCalledWith({ url: "chrome-extension://id/timeout.html" })
  })
})
