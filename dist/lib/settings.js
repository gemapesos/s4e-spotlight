export const SETTINGS_STORAGE_KEY = "s4e-settings";
export const FEATURE_IDS = [
	"open-case-ids",
	"open-shipment-ids",
	"search-skus",
	"time-out",
	"generate-reports",
	"accounts"
];
export const FEATURES = [
	{
		id: "open-case-ids",
		label: "Open Case ID/s"
	},
	{
		id: "open-shipment-ids",
		label: "Open Shipment ID/s"
	},
	{
		id: "search-skus",
		label: "Search SKU/s"
	},
	{
		id: "time-out",
		label: "Time Out"
	},
	{
		id: "generate-reports",
		label: "Generate Reports"
	},
	{
		id: "accounts",
		label: "Accounts"
	}
];
export const DEFAULT_ENABLED_FEATURES = {
	"open-case-ids": true,
	"open-shipment-ids": true,
	"search-skus": true,
	"time-out": true,
	"generate-reports": true,
	accounts: true
};
export const DEFAULT_TIME_OUT_FORM_VALUES = {
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
	karenReviewNeeded: "No"
};
export const DEFAULT_SETTINGS = {
	features: DEFAULT_ENABLED_FEATURES,
	timeOutForm: DEFAULT_TIME_OUT_FORM_VALUES
};
export const TIME_OUT_FORM_BASE_URL = "https://docs.google.com/forms/d/e/1FAIpQLScmidfrFAqBMXv6EdQ6GEyj1GrGo-cxPh3OcqTMpICYUg6kRw/viewform";
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
	date: "1251728025"
};
export const TIME_OUT_STAFF_NAMES = [
	"Lou Rodriguez",
	"Angelina Abella",
	"Erlinda Villamil",
	"Lyndel Alcantara",
	"Jorge Manalili",
	"Dave Mapesos",
	"Dhylan Mapesos",
	"Keren Alboroto"
];
export const TIME_OUT_BUSINESSES = ["S4E"];
export const TIME_OUT_SUPERVISORS = ["Lou", "Karen Locker"];
export const TIME_OUT_SCHEDULED_OPTIONS = [
	"Yes",
	"No",
	"Partial"
];
export const TIME_OUT_YES_NO_OPTIONS = ["Yes", "No"];
export const TIME_OUT_BLOCKERS_OPTIONS = TIME_OUT_YES_NO_OPTIONS;
export const TIME_OUT_ISSUE_TYPES = [
	"Access issue",
	"Client not responding",
	"Amazon/account issue",
	"FBA inventory risk",
	"Missing documents/info",
	"Scope/billing concern"
];
export const TIME_OUT_WAITING_ON_OPTIONS = [
	"Client",
	"Amazon",
	"Internal staff",
	"Supervisor",
	"Karen"
];
function asRecord(value) {
	return value && typeof value === "object" ? value : {};
}
/** Reads stored settings, keeping each value only when it has the expected type. */
export function parseSettings(value) {
	const record = asRecord(value);
	const featuresRecord = asRecord(record.features);
	const formRecord = asRecord(record.timeOutForm);
	const features = { ...DEFAULT_ENABLED_FEATURES };
	for (const id of FEATURE_IDS) {
		const enabled = featuresRecord[id];
		if (typeof enabled === "boolean") features[id] = enabled;
	}
	const timeOutForm = { ...DEFAULT_TIME_OUT_FORM_VALUES };
	for (const key of Object.keys(DEFAULT_TIME_OUT_FORM_VALUES)) {
		const fieldValue = formRecord[key];
		if (typeof fieldValue === "string") timeOutForm[key] = fieldValue;
	}
	return {
		features,
		timeOutForm
	};
}
export function isFeatureEnabled(features, id) {
	if (!FEATURE_IDS.includes(id)) return true;
	return features[id] !== false;
}
export function enabledFeaturesEqual(a, b) {
	return FEATURE_IDS.every((id) => a[id] === b[id]);
}
export async function loadSettings() {
	if (typeof chrome === "undefined" || !chrome.storage?.local) return parseSettings(undefined);
	const stored = (await chrome.storage.local.get(SETTINGS_STORAGE_KEY))[SETTINGS_STORAGE_KEY];
	return parseSettings(stored);
}
export async function saveSettings(settings) {
	await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: parseSettings(settings) });
}
export function optionsWithCurrent(options, current) {
	return options.includes(current) ? [...options] : [...options, current];
}
