import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_ENABLED_FEATURES,
  DEFAULT_TIME_OUT_FORM_VALUES,
  SETTINGS_STORAGE_KEY,
} from "../../src/shared/settings"
import { TimeoutApp } from "../../src/pages/timeout/TimeoutApp"
import { storageArea } from "../helpers/chrome"

const storageListeners: Array<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void> = []

function mockChrome(stored?: unknown) {
  const store: Record<string, unknown> = stored === undefined ? {} : { [SETTINGS_STORAGE_KEY]: stored }
  storageListeners.length = 0
  vi.stubGlobal("chrome", {
    storage: {
      local: storageArea(store),
      onChanged: { addListener: (listener: (typeof storageListeners)[number]) => storageListeners.push(listener), removeListener: vi.fn() },
    },
  })
  return store
}

/** Another Time Out tab saves: storage changes, and every open tab hears about it. */
function saveFromOtherTab(store: Record<string, unknown>, value: unknown) {
  store[SETTINGS_STORAGE_KEY] = value
  act(() => { for (const listener of [...storageListeners]) listener({ [SETTINGS_STORAGE_KEY]: { newValue: value } }, "local") })
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

  it("shows another tab's saved values and never reverts them when this tab saves", async () => {
    const user = userEvent.setup()
    const store = mockChrome()
    render(<TimeoutApp />)
    const hours = await screen.findByLabelText("Total hours worked")

    saveFromOtherTab(store, { features: DEFAULT_ENABLED_FEATURES, timeOutForm: { ...DEFAULT_TIME_OUT_FORM_VALUES, hoursWorked: "8", staffName: "Lou Rodriguez" } })
    expect(hours).toHaveValue("8")
    await user.type(screen.getByLabelText("Short Daily Update"), "Busy day")

    await vi.waitFor(() => {
      expect(store[SETTINGS_STORAGE_KEY]).toMatchObject({ timeOutForm: { hoursWorked: "8", staffName: "Lou Rodriguez", shortDailyUpdate: "Busy day" } })
    }, { timeout: 1500 })
  })

  it("keeps the last keystroke when the tab closes before the text save runs", async () => {
    const user = userEvent.setup()
    const store = mockChrome()
    render(<TimeoutApp />)
    await user.type(await screen.findByLabelText("Short Daily Update"), "Busy day")

    fireEvent(window, new Event("pagehide"))

    await vi.waitFor(() => expect(store[SETTINGS_STORAGE_KEY]).toMatchObject({ timeOutForm: { shortDailyUpdate: "Busy day" } }), { timeout: 100 })
  })
})
