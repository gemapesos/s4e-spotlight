import { afterEach, describe, expect, it, vi } from "vitest"

import {
  DEFAULT_ENABLED_FEATURES,
  DEFAULT_SETTINGS,
  DEFAULT_TIME_OUT_FORM_VALUES,
  FEATURE_IDS,
  enabledFeaturesEqual,
  isFeatureEnabled,
  loadSettings,
  optionsWithCurrent,
  parseSettings,
  saveSettings,
} from "../src/lib/settings"

describe("parseSettings", () => {
  it("returns defaults for missing or invalid values", () => {
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings("nope")).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS)
  })

  it("keeps known booleans and fills missing feature keys as enabled", () => {
    expect(
      parseSettings({
        features: { "open-case-ids": false, "time-out": "yes" },
      }),
    ).toEqual({
      features: { ...DEFAULT_ENABLED_FEATURES, "open-case-ids": false },
      timeOutForm: DEFAULT_TIME_OUT_FORM_VALUES,
    })
  })

  it("keeps valid Time Out form strings and defaults the rest", () => {
    expect(
      parseSettings({
        timeOutForm: {
          staffName: "Lou Rodriguez",
          hoursWorked: 8,
          extra: "ignore",
          shortDailyUpdate: "Wrapped the queue",
          issueType: "Access issue",
          waitingOnWhom: 12,
        },
      }),
    ).toEqual({
      features: DEFAULT_ENABLED_FEATURES,
      timeOutForm: {
        ...DEFAULT_TIME_OUT_FORM_VALUES,
        staffName: "Lou Rodriguez",
        shortDailyUpdate: "Wrapped the queue",
        issueType: "Access issue",
      },
    })
  })
})

describe("enabledFeaturesEqual", () => {
  it("compares every feature flag", () => {
    expect(enabledFeaturesEqual(DEFAULT_ENABLED_FEATURES, { ...DEFAULT_ENABLED_FEATURES })).toBe(true)
    expect(enabledFeaturesEqual(DEFAULT_ENABLED_FEATURES, { ...DEFAULT_ENABLED_FEATURES, accounts: false })).toBe(false)
  })
})

describe("isFeatureEnabled", () => {
  it("treats missing and unknown ids as enabled", () => {
    expect(isFeatureEnabled({ ...DEFAULT_ENABLED_FEATURES, "time-out": false }, "time-out")).toBe(false)
    expect(isFeatureEnabled({ ...DEFAULT_ENABLED_FEATURES, "time-out": false }, "open-case-ids")).toBe(true)
    expect(isFeatureEnabled(DEFAULT_ENABLED_FEATURES, "not-a-feature")).toBe(true)
    expect(FEATURE_IDS).toHaveLength(8)
  })
})

describe("optionsWithCurrent", () => {
  it("appends a stored value that is not in the known list", () => {
    expect(optionsWithCurrent(["S4E"], "S4E")).toEqual(["S4E"])
    expect(optionsWithCurrent(["S4E"], "Other")).toEqual(["S4E", "Other"])
  })
})

describe("saveSettings", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("keeps a popup switch when a Time Out page opened earlier saves its form", async () => {
    const local: Record<string, unknown> = {}
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async (key: string) => (key in local ? { [key]: local[key] } : {})),
          set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(local, items) }),
        },
      },
    })
    const timeOutPage = await loadSettings()

    await saveSettings({ features: { ...DEFAULT_ENABLED_FEATURES, accounts: false } })
    await saveSettings({ timeOutForm: { ...timeOutPage.timeOutForm, staffName: "Lou Rodriguez" } })

    const saved = await loadSettings()
    expect(saved.features.accounts).toBe(false)
    expect(saved.timeOutForm.staffName).toBe("Lou Rodriguez")
  })
})
