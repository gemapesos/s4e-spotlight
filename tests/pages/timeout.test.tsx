import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_ENABLED_FEATURES,
  DEFAULT_TIME_OUT_FORM_VALUES,
  SETTINGS_STORAGE_KEY,
} from "../../src/shared/settings"
import { TimeoutApp } from "../../src/pages/timeout/TimeoutApp"

function mockChrome(stored?: unknown) {
  const store: Record<string, unknown> = stored === undefined ? {} : { [SETTINGS_STORAGE_KEY]: stored }
  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (key: string) => ({ [key]: store[key] })),
        set: vi.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items)
        }),
      },
    },
  })
  return store
}

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.replaceChildren()
})

describe("Time Out form settings", () => {
  it("saves edited prefill values", async () => {
    const user = userEvent.setup()
    mockChrome()
    render(<TimeoutApp />)

    const hours = await screen.findByLabelText("Total hours worked")
    expect(hours).toHaveValue("4")
    await user.clear(hours)
    await user.type(hours, "8")

    await vi.waitFor(
      () => {
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          [SETTINGS_STORAGE_KEY]: {
            features: DEFAULT_ENABLED_FEATURES,
            timeOutForm: { ...DEFAULT_TIME_OUT_FORM_VALUES, hoursWorked: "8" },
          },
        })
      },
      { timeout: 1500 },
    )
  })

  it("saves a Short Daily Update", async () => {
    const user = userEvent.setup()
    mockChrome()
    render(<TimeoutApp />)

    const update = await screen.findByLabelText("Short Daily Update")
    await user.type(update, "Wrapped the queue")

    await vi.waitFor(
      () => {
        expect(chrome.storage.local.set).toHaveBeenCalledWith({
          [SETTINGS_STORAGE_KEY]: {
            features: DEFAULT_ENABLED_FEATURES,
            timeOutForm: { ...DEFAULT_TIME_OUT_FORM_VALUES, shortDailyUpdate: "Wrapped the queue" },
          },
        })
      },
      { timeout: 1500 },
    )
  })

  it("saves Follow-up needed", async () => {
    const user = userEvent.setup()
    mockChrome()
    render(<TimeoutApp />)

    await user.click(await screen.findByLabelText("Follow-up needed?"))
    await user.click(await screen.findByRole("option", { name: "Yes" }))

    await vi.waitFor(() => {
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        [SETTINGS_STORAGE_KEY]: {
          features: DEFAULT_ENABLED_FEATURES,
          timeOutForm: { ...DEFAULT_TIME_OUT_FORM_VALUES, followUpNeeded: "Yes" },
        },
      })
    })
  })

  it("keeps a command the popup switched off while this page was open", async () => {
    const user = userEvent.setup()
    const store = mockChrome()
    render(<TimeoutApp />)
    const followUp = await screen.findByLabelText("Follow-up needed?")

    store[SETTINGS_STORAGE_KEY] = { features: { ...DEFAULT_ENABLED_FEATURES, accounts: false }, timeOutForm: DEFAULT_TIME_OUT_FORM_VALUES }
    await user.click(followUp)
    await user.click(await screen.findByRole("option", { name: "Yes" }))

    await vi.waitFor(() => {
      expect(store[SETTINGS_STORAGE_KEY]).toEqual({
        features: { ...DEFAULT_ENABLED_FEATURES, accounts: false },
        timeOutForm: { ...DEFAULT_TIME_OUT_FORM_VALUES, followUpNeeded: "Yes" },
      })
    })
  })

  it("keeps a select change made while a text edit is waiting to save", async () => {
    const user = userEvent.setup()
    const store = mockChrome()
    render(<TimeoutApp />)

    await user.type(await screen.findByLabelText("Short Daily Update"), "Busy day")
    await user.click(screen.getByLabelText("Follow-up needed?"))
    await user.click(await screen.findByRole("option", { name: "Yes" }))
    await new Promise((resolve) => setTimeout(resolve, 500))

    expect(store[SETTINGS_STORAGE_KEY]).toMatchObject({
      timeOutForm: { shortDailyUpdate: "Busy day", followUpNeeded: "Yes" },
    })
  })
})
