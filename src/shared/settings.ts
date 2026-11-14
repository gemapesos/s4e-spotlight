export const SETTINGS_STORAGE_KEY = "s4e-settings"

export const FEATURE_IDS = [
  "open-case-ids",
  "scrape-case",
  "open-shipment-ids",
  "search-skus",
  "bulk-removal",
  "time-out",
  "generate-reports",
  "accounts",
] as const

export type FeatureId = (typeof FEATURE_IDS)[number]

export const FEATURES: ReadonlyArray<{ id: FeatureId; label: string }> = [
  { id: "open-case-ids", label: "Open case IDs" },
  { id: "scrape-case", label: "Scrape case" },
  { id: "open-shipment-ids", label: "Open shipment IDs" },
  { id: "search-skus", label: "Search SKUs" },
  { id: "bulk-removal", label: "Bulk removal" },
  { id: "time-out", label: "Open Time Out" },
  { id: "generate-reports", label: "Generate reports" },
  { id: "accounts", label: "Switch store" },
]

export type EnabledFeatures = Record<FeatureId, boolean>

export interface TimeOutFormValues {
  staffName: string
  business: string
  supervisor: string
  hoursWorked: string
  scheduledAccountsCompleted: string
  shortDailyUpdate: string
  blockersOrRedFlags: string
  clientAccountName: string
  issueType: string
  waitingOnWhom: string
  followUpNeeded: string
  escalatedToSupervisor: string
  supervisorReviewNeeded: string
  karenReviewNeeded: string
}

export interface ExtensionSettings {
  features: EnabledFeatures
  timeOutForm: TimeOutFormValues
}

export const DEFAULT_ENABLED_FEATURES: EnabledFeatures = {
  "open-case-ids": true,
  "scrape-case": true,
  "open-shipment-ids": true,
  "search-skus": true,
  "bulk-removal": true,
  "time-out": true,
  "generate-reports": true,
  accounts: true,
}

export const DEFAULT_TIME_OUT_FORM_VALUES: TimeOutFormValues = {
  staffName: "Dhylan Mapesos",
  business: "S4E",
  supervisor: "Lou",
  hoursWorked: "4",
  scheduledAccountsCompleted: "Yes",
  shortDailyUpdate: "",
  blockersOrRedFlags: "No",
  clientAccountName: "",
  issueType: "",
  waitingOnWhom: "",
  followUpNeeded: "No",
  escalatedToSupervisor: "No",
  supervisorReviewNeeded: "No",
  karenReviewNeeded: "No",
}

export const TIME_OUT_FORM_BASE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScmidfrFAqBMXv6EdQ6GEyj1GrGo-cxPh3OcqTMpICYUg6kRw/viewform"

export const TIME_OUT_FORM_ENTRY_IDS = {
  staffName: "1152525498",
  business: "625851554",
  supervisor: "30165443",
  hoursWorked: "412660572",
  scheduledAccountsCompleted: "894305442",
  shortDailyUpdate: "789311136",
  blockersOrRedFlags: "453721608",
  clientAccountName: "1775030400",
  issueType: "2008215653",
  waitingOnWhom: "1391961076",
  followUpNeeded: "570672286",
  escalatedToSupervisor: "1418374063",
  supervisorReviewNeeded: "1631702449",
  karenReviewNeeded: "433948939",
  date: "1251728025",
} as const

export const TIME_OUT_STAFF_NAMES = [
  "Lou Rodriguez",
  "Angelina Abella",
  "Erlinda Villamil",
  "Lyndel Alcantara",
  "Jorge Manalili",
  "Dave Mapesos",
  "Dhylan Mapesos",
  "Keren Alboroto",
] as const

export const TIME_OUT_BUSINESSES = ["S4E"] as const

export const TIME_OUT_SUPERVISORS = ["Lou", "Karen Locker"] as const

export const TIME_OUT_SCHEDULED_OPTIONS = ["Yes", "No", "Partial"] as const

export const TIME_OUT_YES_NO_OPTIONS = ["Yes", "No"] as const

export const TIME_OUT_BLOCKERS_OPTIONS = TIME_OUT_YES_NO_OPTIONS

export const TIME_OUT_ISSUE_TYPES = [
  "Access issue",
  "Client not responding",
  "Amazon/account issue",
  "FBA inventory risk",
  "Missing documents/info",
  "Scope/billing concern",
] as const

export const TIME_OUT_WAITING_ON_OPTIONS = [
  "Client",
  "Amazon",
  "Internal staff",
  "Supervisor",
  "Karen",
] as const

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

/** Reads stored settings, keeping each value only when it has the expected type. */
export function parseSettings(value: unknown): ExtensionSettings {
  const record = asRecord(value)
  const featuresRecord = asRecord(record.features)
  const formRecord = asRecord(record.timeOutForm)
  const features = { ...DEFAULT_ENABLED_FEATURES }
  for (const id of FEATURE_IDS) {
    const enabled = featuresRecord[id]
    if (typeof enabled === "boolean") features[id] = enabled
  }
  const timeOutForm = { ...DEFAULT_TIME_OUT_FORM_VALUES }
  for (const key of Object.keys(DEFAULT_TIME_OUT_FORM_VALUES) as Array<keyof TimeOutFormValues>) {
    const fieldValue = formRecord[key]
    if (typeof fieldValue === "string") timeOutForm[key] = fieldValue
  }
  return { features, timeOutForm }
}

export function isFeatureEnabled(features: EnabledFeatures, id: FeatureId | string): boolean {
  if (!FEATURE_IDS.includes(id as FeatureId)) return true
  return features[id as FeatureId] !== false
}

export function enabledFeaturesEqual(a: EnabledFeatures, b: EnabledFeatures): boolean {
  return FEATURE_IDS.every((id) => a[id] === b[id])
}

export async function loadSettings(): Promise<ExtensionSettings> {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return parseSettings(undefined)
  const stored = (await chrome.storage.local.get(SETTINGS_STORAGE_KEY))[SETTINGS_STORAGE_KEY]
  return parseSettings(stored)
}

/** Writes only the given part (form values field by field) over what is stored now, so no page undoes another's save. */
// shortcut: the read and write aren't atomic, so two pages saving within the same few ms can still lose one; use navigator.locks if that ever shows up in practice.
export async function saveSettings(part: { features?: EnabledFeatures; timeOutForm?: Partial<TimeOutFormValues> }): Promise<void> {
  const current = await loadSettings()
  const timeOutForm = { ...current.timeOutForm, ...part.timeOutForm }
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: parseSettings({ ...current, ...part, timeOutForm }) })
}

export function optionsWithCurrent(options: readonly string[], current: string): string[] {
  return options.includes(current) ? [...options] : [...options, current]
}
