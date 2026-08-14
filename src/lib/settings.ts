export const SETTINGS_STORAGE_KEY = "s4e-settings"

export const FEATURE_IDS = [
  "open-case-ids",
  "open-shipment-ids",
  "search-skus",
  "time-out",
  "generate-reports",
  "accounts",
] as const

export type FeatureId = (typeof FEATURE_IDS)[number]

export const FEATURES: ReadonlyArray<{ id: FeatureId; label: string }> = [
  { id: "open-case-ids", label: "Open Case ID/s" },
  { id: "open-shipment-ids", label: "Open Shipment IDs" },
  { id: "search-skus", label: "Search SKU/s" },
  { id: "time-out", label: "Time Out" },
  { id: "generate-reports", label: "Generate Reports" },
  { id: "accounts", label: "Accounts" },
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
  "open-shipment-ids": true,
  "search-skus": true,
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

export const DEFAULT_SETTINGS: ExtensionSettings = {
  features: DEFAULT_ENABLED_FEATURES,
  timeOutForm: DEFAULT_TIME_OUT_FORM_VALUES,
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

function asBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback
}

export function parseSettings(value: unknown): ExtensionSettings {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {}
  const featuresRecord =
    record.features && typeof record.features === "object"
      ? (record.features as Record<string, unknown>)
      : {}
  const formRecord =
    record.timeOutForm && typeof record.timeOutForm === "object"
      ? (record.timeOutForm as Record<string, unknown>)
      : {}

  return {
    features: {
      "open-case-ids": asBoolean(featuresRecord["open-case-ids"], true),
      "open-shipment-ids": asBoolean(featuresRecord["open-shipment-ids"], true),
      "search-skus": asBoolean(featuresRecord["search-skus"], true),
      "time-out": asBoolean(featuresRecord["time-out"], true),
      "generate-reports": asBoolean(featuresRecord["generate-reports"], true),
      accounts: asBoolean(featuresRecord.accounts, true),
    },
    timeOutForm: {
      staffName: asString(formRecord.staffName, DEFAULT_TIME_OUT_FORM_VALUES.staffName),
      business: asString(formRecord.business, DEFAULT_TIME_OUT_FORM_VALUES.business),
      supervisor: asString(formRecord.supervisor, DEFAULT_TIME_OUT_FORM_VALUES.supervisor),
      hoursWorked: asString(formRecord.hoursWorked, DEFAULT_TIME_OUT_FORM_VALUES.hoursWorked),
      scheduledAccountsCompleted: asString(
        formRecord.scheduledAccountsCompleted,
        DEFAULT_TIME_OUT_FORM_VALUES.scheduledAccountsCompleted,
      ),
      shortDailyUpdate: asString(
        formRecord.shortDailyUpdate,
        DEFAULT_TIME_OUT_FORM_VALUES.shortDailyUpdate,
      ),
      blockersOrRedFlags: asString(
        formRecord.blockersOrRedFlags,
        DEFAULT_TIME_OUT_FORM_VALUES.blockersOrRedFlags,
      ),
      clientAccountName: asString(
        formRecord.clientAccountName,
        DEFAULT_TIME_OUT_FORM_VALUES.clientAccountName,
      ),
      issueType: asString(formRecord.issueType, DEFAULT_TIME_OUT_FORM_VALUES.issueType),
      waitingOnWhom: asString(formRecord.waitingOnWhom, DEFAULT_TIME_OUT_FORM_VALUES.waitingOnWhom),
      followUpNeeded: asString(formRecord.followUpNeeded, DEFAULT_TIME_OUT_FORM_VALUES.followUpNeeded),
      escalatedToSupervisor: asString(
        formRecord.escalatedToSupervisor,
        DEFAULT_TIME_OUT_FORM_VALUES.escalatedToSupervisor,
      ),
      supervisorReviewNeeded: asString(
        formRecord.supervisorReviewNeeded,
        DEFAULT_TIME_OUT_FORM_VALUES.supervisorReviewNeeded,
      ),
      karenReviewNeeded: asString(
        formRecord.karenReviewNeeded,
        DEFAULT_TIME_OUT_FORM_VALUES.karenReviewNeeded,
      ),
    },
  }
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

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: parseSettings(settings) })
}

export function optionsWithCurrent(options: readonly string[], current: string): string[] {
  return options.includes(current) ? [...options] : [...options, current]
}
