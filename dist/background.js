import { ACTIVE_JOB_STORAGE_KEY, CURRENT_STORE_KEY, SESSION_KEY_STORAGE_KEY, STORE_INDEX_KEY, VAULT_STORAGE_KEY, decryptSharedVault, decryptVault, decryptVaultWithKey, deserializeKey, emptyVault, encryptSharedVault, encryptVault, encryptVaultWithKey, mergeVaults, generateTotp, parseOtpAuthUri, publicStoreIndex, serializeKey, validateStoreUrl } from "./lib/accounts.js";
import { createLogger, createLogRunId, createLogStore, describeError, errorMessage, LOG_ENTRIES_MESSAGE, LOGS_CLEAR_MESSAGE, LOGS_GET_MESSAGE, sanitizeLogEntries, setLogSink } from "./lib/log.js";
import { DEFAULT_TIME_OUT_FORM_VALUES, loadSettings, TIME_OUT_FORM_BASE_URL, TIME_OUT_FORM_ENTRY_IDS } from "./lib/settings.js";
const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=";
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/";
const REMOVAL_ORDER_URL = "https://sellercentral.amazon.com/recoveryui/removal-order/detail?sourceRemovalOrderId=";
const SKU_URL = "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm=";
const SKU_URL_SUFFIX = "&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx";
const OPENID_SPEC = "http://specs.openid.net/auth/2.0";
export const TIME_OUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1E7gfUVzy47vboZHOJ6xd8Jwx-1N6oewaVggrtI7G4yw/edit?gid=0#gid=0";
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx";
/** Amazon's sign-in, returning to `returnTo` (a Seller Central URL) once signed in. */
export function signInUrlFor(returnTo = "https://sellercentral.amazon.com/") {
	return `https://sellercentral.amazon.com/ap/signin?${new URLSearchParams({
		"openid.return_to": returnTo,
		"openid.identity": `${OPENID_SPEC}/identifier_select`,
		"openid.assoc_handle": "amzn_sw_signup_us",
		"openid.mode": "checkid_setup",
		"openid.claimed_id": `${OPENID_SPEC}/identifier_select`,
		"openid.ns": OPENID_SPEC
	})}`;
}
export const SIGN_IN_URL = signInUrlFor();
export const SELLER_CENTRAL_HOME_URL = "https://sellercentral.amazon.com/";
export const SELLER_CENTRAL_TAB_URL_PATTERN = "https://sellercentral.amazon.com/*";
const MAX_BULK_IDS = 50;
const ACTIVE_JOB_TTL_MS = 15 * 60 * 1e3;
const UNLOCK_ATTEMPTS_KEY = "accountsUnlockAttempts";
const UNLOCK_RESUME_KEY = "accountsUnlockResume";
/** "Switched to …" stays on the finished tab, across its reloads, until the user dismisses it. */
const SWITCH_NOTICE_KEY = "accountsSwitchNotice";
const log = createLogger("background");
const createChromeTab = (properties) => chrome.tabs.create(properties);
const removeChromeTabs = (tabIds) => chrome.tabs.remove(tabIds);
export class TabBatchError extends Error {
	openedIds;
	rolledBackIds;
	constructor(message, openedIds, rolledBackIds) {
		super(message);
		this.openedIds = openedIds;
		this.rolledBackIds = rolledBackIds;
		this.name = "TabBatchError";
	}
}
function uniqueStrings(value, normalize, isValid) {
	if (!Array.isArray(value)) return [];
	const ids = value.filter((id) => typeof id === "string").map(normalize).filter(isValid);
	return [...new Set(ids)];
}
export function normalizeCaseIds(value) {
	return uniqueStrings(value, (id) => id, (id) => /^\d{11}$/u.test(id));
}
export function normalizeShipmentIds(value) {
	return uniqueStrings(value, (id) => id.toUpperCase(), (id) => /^FBA[A-Z0-9]{9}$/u.test(id));
}
export function normalizeRemovalOrderIds(value) {
	return uniqueStrings(value, (id) => id.toUpperCase(), (id) => /^S4E[A-Z]{2}\d{4}$/u.test(id));
}
export function normalizeSkuIds(value) {
	return uniqueStrings(value, (id) => id.trim(), (id) => id.length > 0 && id.length <= 40);
}
export function buildCaseUrl(id) {
	return `${CASE_URL}${id}`;
}
export function buildShipmentUrl(id) {
	return `${SHIPMENT_URL}${id}/contents`;
}
export function buildRemovalOrderUrl(id) {
	return `${REMOVAL_ORDER_URL}${encodeURIComponent(id)}`;
}
export function buildSkuUrl(id) {
	return `${SKU_URL}${encodeURIComponent(id)}${SKU_URL_SUFFIX}`;
}
export function buildTimeOutFormUrl(date, values = DEFAULT_TIME_OUT_FORM_VALUES) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const params = new URLSearchParams({ [`entry.${TIME_OUT_FORM_ENTRY_IDS.date}`]: `${year}-${month}-${day}` });
	for (const [key, entryId] of Object.entries(TIME_OUT_FORM_ENTRY_IDS)) {
		if (key === "date") continue;
		const value = values[key];
		if (value) params.set(`entry.${entryId}`, value);
	}
	return `${TIME_OUT_FORM_BASE_URL}?${params.toString()}`;
}
async function rollbackCreatedTabs(created, removeTabs) {
	const rolledBackIds = [];
	const openedIds = [];
	for (const item of created) {
		try {
			await removeTabs([item.tabId]);
			rolledBackIds.push(item.id);
		} catch {
			openedIds.push(item.id);
		}
	}
	return {
		openedIds,
		rolledBackIds
	};
}
function tabBatchError(cause, openedIds, rolledBackIds) {
	const reason = errorMessage(cause, "Chrome could not create a tab.");
	const suffix = openedIds.length ? ` ${openedIds.length} tab(s) could not be closed: ${openedIds.join(", ")}.` : " Any tabs opened by this attempt were closed.";
	return new TabBatchError(`${reason}${suffix}`, openedIds, rolledBackIds);
}
function requireSenderTab(senderTab) {
	if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.");
	return senderTab;
}
async function createTabsInParallel(targets, senderTab, createTab, removeTabs) {
	const results = await Promise.allSettled(targets.map(async (target) => {
		const tab = await createTab({
			active: target.active,
			openerTabId: senderTab.id,
			url: target.url,
			windowId: senderTab.windowId
		});
		if (tab.id === undefined) throw new Error("Chrome created a tab without an ID.");
		return {
			id: target.id,
			tabId: tab.id
		};
	}));
	const created = [];
	let failure;
	for (const result of results) {
		if (result.status === "fulfilled") created.push(result.value);
		else if (failure === undefined) failure = result.reason;
	}
	if (failure !== undefined) {
		const { openedIds, rolledBackIds } = await rollbackCreatedTabs(created, removeTabs);
		throw tabBatchError(failure, openedIds, rolledBackIds);
	}
	return { openedCount: created.length };
}
/** Opens one background tab per normalized ID, or rejects without leaving a partial batch open. */
function idTabOpener(normalize, buildUrl, noun) {
	return async (ids, senderTab, createTab = createChromeTab, removeTabs = removeChromeTabs) => {
		const normalized = normalize(ids);
		if (!normalized.length) throw new Error(`No valid ${noun} were provided.`);
		const sender = requireSenderTab(senderTab);
		if (normalized.length > MAX_BULK_IDS) throw new Error(`Open no more than ${MAX_BULK_IDS} IDs at a time.`);
		const targets = normalized.map((id) => ({
			id,
			active: normalized.length === 1,
			url: buildUrl(id)
		}));
		return createTabsInParallel(targets, sender, createTab, removeTabs);
	};
}
export const openCaseTabs = idTabOpener(normalizeCaseIds, buildCaseUrl, "Case IDs");
export const openShipmentTabs = idTabOpener(normalizeShipmentIds, buildShipmentUrl, "Shipment IDs");
export const openSkuTabs = idTabOpener(normalizeSkuIds, buildSkuUrl, "SKUs");
export const openRemovalOrderTabs = idTabOpener(normalizeRemovalOrderIds, buildRemovalOrderUrl, "Removal Order IDs");
export async function openTimeOutTabs(senderTab, createTab = createChromeTab, removeTabs = removeChromeTabs, date = new Date(), loadFormValues = async () => (await loadSettings()).timeOutForm) {
	const sender = requireSenderTab(senderTab);
	const values = await loadFormValues();
	return createTabsInParallel([{
		id: "Google Sheet",
		active: false,
		url: TIME_OUT_SHEET_URL
	}, {
		id: "Google Form",
		active: true,
		url: buildTimeOutFormUrl(date, values)
	}], sender, createTab, removeTabs);
}
function openTabsFailure(error, fallback) {
	return {
		ok: false,
		error: errorMessage(error, fallback),
		...error instanceof TabBatchError ? {
			openedIds: error.openedIds,
			rolledBackIds: error.rolledBackIds
		} : {}
	};
}
export function createOpenIdsMessageListener(openCases = openCaseTabs, openShipments = openShipmentTabs, openSkus = openSkuTabs, openTimeOut = openTimeOutTabs, openRemovalOrders = openRemovalOrderTabs) {
	const openers = {
		OPEN_CASE_IDS: {
			kind: "case",
			idsKey: "caseIds",
			open: openCases
		},
		OPEN_SHIPMENT_IDS: {
			kind: "shipment",
			idsKey: "shipmentIds",
			open: openShipments
		},
		OPEN_SKU_IDS: {
			kind: "sku",
			idsKey: "skuIds",
			open: openSkus
		},
		OPEN_REMOVAL_ORDER_IDS: {
			kind: "removalOrder",
			idsKey: "removalOrderIds",
			open: openRemovalOrders
		}
	};
	return (message, sender, sendResponse) => {
		if (!message || typeof message !== "object" || !("type" in message)) return undefined;
		const record = message;
		const type = String(record.type);
		const opener = Object.hasOwn(openers, type) ? openers[type] : undefined;
		if (type !== "OPEN_TIME_OUT" && !opener) return undefined;
		const kind = opener?.kind ?? "timeOut";
		const done = log.time("tabs.open", { kind });
		const request = opener ? opener.open(record[opener.idsKey], sender.tab) : openTimeOut(sender.tab);
		void request.then((result) => {
			done({ count: result?.openedCount ?? 0 });
			sendResponse({
				ok: true,
				openedCount: result?.openedCount ?? 0
			});
		}, (error) => {
			const rollback = error instanceof TabBatchError ? {
				stillOpen: error.openedIds.length,
				closed: error.rolledBackIds.length
			} : {};
			done({
				error: describeError(error),
				...rollback
			}, "error");
			sendResponse(openTabsFailure(error, opener ? "Couldn’t open tabs." : "Couldn’t open Time Out."));
		});
		return true;
	};
}
const MAX_OTP_CODES = 2;
const AUTOMATION_CLICK_ACTIONS = new Set([
	"continue",
	"password-submit",
	"otp-submit"
]);
let startSwitchLock = Promise.resolve();
let sellerCentralTabLock = Promise.resolve();
let reportProgressTabId;
const VAULT_ADMIN_TYPES = new Set([
	"ACCOUNTS_CREATE",
	"ACCOUNTS_UNLOCK",
	"ACCOUNTS_GET_VAULT",
	"ACCOUNTS_SAVE_VAULT",
	"ACCOUNTS_EXPORT_SHARE",
	"ACCOUNTS_IMPORT_SHARE",
	"ACCOUNTS_CREATE_FROM_SHARE",
	"ACCOUNTS_CHANGE_MASTER_PASSWORD",
	"ACCOUNTS_RESET",
	"ACCOUNTS_RESUME_SWITCH"
]);
/** The workspace window may take the master password and resume a switch; editing stays on Accounts. */
const WORKSPACE_VAULT_TYPES = new Set(["ACCOUNTS_UNLOCK", "ACCOUNTS_RESUME_SWITCH"]);
let vaultOperations = Promise.resolve();
let vaultGeneration = 0;
let operationGeneration = 0;
let switchGeneration = 0;
let operationSwitchGeneration = 0;
function assertVaultOperationCurrent() {
	if (operationGeneration !== vaultGeneration) throw new Error("The vault changed while this operation was running. Please try again.");
}
function assertSwitchOperationCurrent() {
	assertVaultOperationCurrent();
	if (operationSwitchGeneration !== switchGeneration) throw new Error("The account switch was cancelled.");
}
function queueVaultOperation(action) {
	const generation = vaultGeneration;
	const switchVersion = switchGeneration;
	const result = vaultOperations.catch(() => undefined).then(async () => {
		operationGeneration = generation;
		operationSwitchGeneration = switchVersion;
		assertVaultOperationCurrent();
		const response = await action();
		assertVaultOperationCurrent();
		return response;
	});
	vaultOperations = result.catch(() => undefined);
	return result;
}
function isOwnSender(sender) {
	return Boolean(chrome.runtime.id && sender.id === chrome.runtime.id);
}
function isPageSender(sender, page) {
	return isOwnSender(sender) && (sender.frameId === undefined || sender.frameId === 0) && sender.url?.split(/[?#]/u)[0] === chrome.runtime.getURL(page);
}
async function requestAccountUnlock(storeId, sender) {
	const source = requireSenderTab(sender.tab);
	const sourceDocumentId = sender.documentId;
	if (!sourceDocumentId || sender.frameId !== 0 || typeof storeId !== "string") throw new Error("Open unlock from the store picker.");
	const stored = await chrome.storage.local.get(STORE_INDEX_KEY);
	const stores = stored[STORE_INDEX_KEY] ?? [];
	const store = stores.find((item) => item.id === storeId);
	if (!store) throw new Error("The selected store no longer exists.");
	const id = crypto.randomUUID();
	// The master password is typed in the workspace window, an extension page no website can read.
	await serializeWorkspace(() => openWorkspace({
		mode: "accounts",
		caseIds: [],
		resumeId: id,
		storeName: store.name
	}, source, async (tabId, created) => {
		assertVaultOperationCurrent();
		const pending = {
			id,
			storeId,
			sourceTabId: source.id,
			sourceDocumentId,
			accountsTabId: tabId,
			closeAccounts: created,
			startedAt: Date.now()
		};
		await chrome.storage.session.set({ [UNLOCK_RESUME_KEY]: pending });
		// Commit the handoff before the window can load and try to consume it.
		assertVaultOperationCurrent();
	}));
	return { ok: true };
}
async function resumeAccountSwitch(id, sender) {
	const pending = (await chrome.storage.session.get(UNLOCK_RESUME_KEY))[UNLOCK_RESUME_KEY];
	if (!pending || pending.id !== id || pending.accountsTabId !== sender.tab?.id || Date.now() - pending.startedAt >= ACTIVE_JOB_TTL_MS) {
		throw new Error("This store switch has expired. Select the store again from the palette.");
	}
	await chrome.storage.session.remove(UNLOCK_RESUME_KEY);
	// Ask the original document, not a replacement page in the same tab, to confirm it still exists.
	const source = await chrome.tabs.get(pending.sourceTabId);
	const alive = await chrome.tabs.sendMessage(source.id, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: pending.sourceDocumentId });
	if (!alive?.ok) throw new Error("The original page is no longer open. Select the store again.");
	await chrome.tabs.update(source.id, { active: true });
	const result = await handleAccountsMessageNow({
		type: "ACCOUNTS_START_SWITCH",
		storeId: pending.storeId
	}, {
		...sender,
		tab: source
	});
	if (result.ok) {
		void showSwitchingPalette(source.id, pending.sourceDocumentId);
		// A window opened only for this unlock closes; one already open for other work stays, and
		// follows the switch on its Accounts tab. Either way the page
		// the switch was chosen on comes back to the front, not the sign-in window behind it.
		void (async () => {
			if (pending.closeAccounts) await chrome.tabs.remove(pending.accountsTabId).catch(() => undefined);
			if (source.windowId !== undefined) await chrome.windows.update(source.windowId, { focused: true }).catch(() => undefined);
		})();
	}
	return result.ok ? {
		...result,
		resumed: true
	} : result;
}
/** The page the switch was chosen on follows it, as it would had the vault been unlocked. */
async function showSwitchingPalette(tabId, documentId) {
	try {
		await chrome.tabs.sendMessage(tabId, {
			type: "OPEN_PALETTE",
			mode: "switching"
		}, { documentId });
	} catch {}
}
/** Serialize key/vault changes; Lock invalidates work immediately and completes after prior commits. */
export async function handleAccountsMessage(message, sender) {
	if (!isOwnSender(sender)) throw new Error("Unauthorized extension message.");
	const type = String(message.type);
	if (VAULT_ADMIN_TYPES.has(type) && !isPageSender(sender, "options.html") && !(WORKSPACE_VAULT_TYPES.has(type) && isPageSender(sender, "results.html"))) {
		throw new Error("This vault operation is only available on the Accounts page.");
	}
	if (type === "ACCOUNTS_LOCK" && ![
		"options.html",
		"popup.html",
		"results.html"
	].some((page) => isPageSender(sender, page))) {
		throw new Error("Lock accounts from an extension page.");
	}
	if (type === "ACCOUNTS_STATUS" || type === "ACCOUNT_AUTOMATION_GET_JOB" || type === "ACCOUNTS_OPEN_OPTIONS" || type === "ACCOUNTS_SWITCH_NOTICE" || type === "ACCOUNTS_SWITCH_NOTICE_DISMISS") {
		return handleAccountsMessageNow(message, sender);
	}
	if (type === "ACCOUNTS_LOCK" || type === "ACCOUNTS_RESET" || type === "ACCOUNTS_CHANGE_MASTER_PASSWORD") vaultGeneration += 1;
	if (type === "ACCOUNTS_CANCEL_SWITCH") switchGeneration += 1;
	return queueVaultOperation(() => handleAccountsMessageNow(message, sender));
}
export function validateVault(vault) {
	const names = new Set();
	const domains = new Set();
	const credentialIds = new Set(vault.credentials.map(({ id }) => id));
	for (const credential of vault.credentials) {
		const domain = credential.domain.trim().toLowerCase();
		if (!domain || domains.has(domain)) throw new Error("Credential domains must be present and unique.");
		domains.add(domain);
		if (!credential.password) throw new Error("Each credential needs a password.");
		parseOtpAuthUri(credential.otpAuthUri);
	}
	for (const store of vault.stores) {
		const name = store.name.trim().toLowerCase();
		if (!name || names.has(name)) throw new Error("Store names must be present and unique.");
		names.add(name);
		if (!credentialIds.has(store.credentialId)) throw new Error(`Store “${store.name}” references a missing credential.`);
		if (!validateStoreUrl(store.storeUrl)) throw new Error(`Store “${store.name}” needs an HTTPS Seller Central URL.`);
	}
}
async function getEnvelope() {
	return (await chrome.storage.local.get(VAULT_STORAGE_KEY))[VAULT_STORAGE_KEY];
}
async function getSessionKey() {
	const value = (await chrome.storage.session.get(SESSION_KEY_STORAGE_KEY))[SESSION_KEY_STORAGE_KEY];
	return typeof value === "string" ? deserializeKey(value) : undefined;
}
async function getUnlockedVault() {
	const [envelope, key] = await Promise.all([getEnvelope(), getSessionKey()]);
	if (!envelope) throw new Error("Create the account vault first.");
	if (!key) throw new Error("The account vault is locked.");
	const vault = await decryptVaultWithKey(envelope, key);
	assertVaultOperationCurrent();
	return {
		vault,
		envelope,
		key
	};
}
async function saveVault(vault, envelope, key) {
	validateVault(vault);
	const salt = Uint8Array.from(atob(envelope.salt), (c) => c.charCodeAt(0));
	const nextEnvelope = await encryptVaultWithKey(vault, key, salt, envelope.iterations);
	assertVaultOperationCurrent();
	await chrome.storage.local.set({
		[VAULT_STORAGE_KEY]: nextEnvelope,
		[STORE_INDEX_KEY]: publicStoreIndex(vault)
	});
	await pruneCurrentStore(vault.stores.map(({ id }) => id));
}
async function getCurrentStoreId() {
	const value = (await chrome.storage.local.get(CURRENT_STORE_KEY))[CURRENT_STORE_KEY];
	return typeof value === "string" ? value : undefined;
}
async function setCurrentStoreId(storeId) {
	if (storeId) await chrome.storage.local.set({ [CURRENT_STORE_KEY]: storeId });
	else await chrome.storage.local.remove(CURRENT_STORE_KEY);
}
async function pruneCurrentStore(storeIds) {
	const currentId = await getCurrentStoreId();
	if (currentId && !storeIds.includes(currentId)) await setCurrentStoreId(undefined);
}
function currentStoreFromIndex(stores, storeId) {
	if (!storeId) return null;
	return stores.find((store) => store.id === storeId) ?? null;
}
export function pickSellerCentralTab(tabs, preferredWindowId) {
	const withId = tabs.filter((tab) => tab.id !== undefined);
	return [...withId].sort((a, b) => {
		const aPreferred = a.windowId === preferredWindowId ? 1 : 0;
		const bPreferred = b.windowId === preferredWindowId ? 1 : 0;
		if (aPreferred !== bPreferred) return bPreferred - aPreferred;
		return (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0);
	})[0];
}
const TAB_LOAD_TIMEOUT_MS = 3e4;
const SESSION_PROBE_TIMEOUT_MS = 15e3;
const SESSION_PROBE_INTERVAL_MS = 250;
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function ensureSellerCentralTab(senderTab, options = {}) {
	const previous = sellerCentralTabLock;
	let release;
	sellerCentralTabLock = new Promise((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		return await ensureSellerCentralTabNow(senderTab, options);
	} finally {
		release();
	}
}
async function ensureSellerCentralTabNow(senderTab, options = {}) {
	const focus = options.focus !== false;
	const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
	const tab = pickSellerCentralTab(tabs, senderTab?.windowId);
	if (tab?.id !== undefined) {
		if (focus) {
			await chrome.tabs.update(tab.id, { active: true });
			if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
			return {
				tabId: tab.id,
				focused: true
			};
		}
		return { tabId: tab.id };
	}
	const created = await chrome.tabs.create({
		active: true,
		url: SELLER_CENTRAL_HOME_URL,
		...senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }
	});
	if (created.id === undefined) throw new Error("Chrome did not create the Seller Central tab.");
	return {
		tabId: created.id,
		opened: true
	};
}
export async function focusOrOpenSellerCentralTab(senderTab) {
	const { focused, opened } = await ensureSellerCentralTab(senderTab);
	return {
		ok: true,
		...focused ? { focused: true } : {},
		...opened ? { opened: true } : {}
	};
}
export async function waitForTabComplete(tabId, timeoutMs = TAB_LOAD_TIMEOUT_MS) {
	await waitForTabCompleteMatching(tabId, (url) => Boolean(url && url !== "about:blank"), timeoutMs);
}
export async function waitForTabCompleteMatching(tabId, urlMatches, timeoutMs = TAB_LOAD_TIMEOUT_MS) {
	const current = await chrome.tabs.get(tabId);
	if (current.status === "complete" && urlMatches(current.url)) return;
	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			chrome.tabs.onUpdated.removeListener(onUpdated);
			reject(new Error("Seller Central did not finish loading."));
		}, timeoutMs);
		function onUpdated(updatedTabId, changeInfo, tab) {
			if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
			const url = changeInfo.url ?? tab.url;
			if (!urlMatches(url)) return;
			clearTimeout(timer);
			chrome.tabs.onUpdated.removeListener(onUpdated);
			resolve();
		}
		chrome.tabs.onUpdated.addListener(onUpdated);
	});
}
const RESULTS_RUN_PREFIX = "resultsRun:";
const RESULTS_LAUNCH_PREFIX = "resultsLaunch:";
const RESULTS_RUN_TTL_MS = 30 * 60 * 1e3;
let resultControls = Promise.resolve();
const resultsNavigationEpoch = new Map();
function observeResultsTab(tabId) {
	if (!resultsNavigationEpoch.has(tabId)) resultsNavigationEpoch.set(tabId, 0);
	return resultsNavigationEpoch.get(tabId);
}
function serializeResultControl(action) {
	const result = resultControls.catch(() => undefined).then(action);
	resultControls = result.catch(() => undefined);
	return result;
}
/**
* The workspace window is results.html opened as a small Chrome popup window. Reports, case
* scrapes and unlocking run there, away from web pages; one window is reused for every launch.
*/
const WORKSPACE_WINDOW_KEY = "workspaceWindow";
const WORKSPACE_WIDTH = 440;
const WORKSPACE_HEIGHT = 680;
let workspaceOpening = Promise.resolve();
function serializeWorkspace(action) {
	const result = workspaceOpening.catch(() => undefined).then(action);
	workspaceOpening = result.catch(() => undefined);
	return result;
}
async function openWorkspaceWindowRecord() {
	const stored = (await chrome.storage.session.get(WORKSPACE_WINDOW_KEY))[WORKSPACE_WINDOW_KEY];
	if (!stored) return undefined;
	try {
		const tab = await chrome.tabs.get(stored.tabId);
		if (tab.windowId === stored.windowId) return stored;
	} catch {}
	await chrome.storage.session.remove(WORKSPACE_WINDOW_KEY);
	return undefined;
}
/** Centers the new window over the one it was opened from. */
async function workspacePosition(source) {
	if (source?.windowId === undefined) return {};
	try {
		const window = await chrome.windows.get(source.windowId);
		if (window.left === undefined || window.top === undefined || window.width === undefined) return {};
		return {
			left: Math.round(window.left + Math.max(0, (window.width - WORKSPACE_WIDTH) / 2)),
			top: Math.round(window.top + 72)
		};
	} catch {
		return {};
	}
}
/**
* Shows a launch in the workspace window, reusing an open one. `commit` runs with the window's tab
* before the page can ask for the launch, so a handoff that names that tab is already stored.
*/
async function openWorkspace(launch, source, commit) {
	const launchId = crypto.randomUUID();
	const launchRecord = (tabId) => ({ [`${RESULTS_LAUNCH_PREFIX}${launchId}`]: {
		...launch,
		tabId,
		startedAt: Date.now()
	} });
	const pageUrl = `${chrome.runtime.getURL("results.html")}?launch=${launchId}`;
	const existing = await openWorkspaceWindowRecord();
	if (existing) {
		await chrome.storage.session.set(launchRecord(existing.tabId));
		await commit?.(existing.tabId, false);
		// The open page switches to the launch itself, keeping any run in its other tabs.
		const shown = await chrome.tabs.sendMessage(existing.tabId, {
			type: "RESULTS_SHOW",
			launchId
		}).catch(() => undefined);
		if (!shown?.ok) await chrome.tabs.update(existing.tabId, { url: pageUrl });
		await chrome.windows.update(existing.windowId, { focused: true });
		return {
			tabId: existing.tabId,
			created: false
		};
	}
	const created = await chrome.windows.create({
		type: "popup",
		url: "about:blank",
		focused: true,
		width: WORKSPACE_WIDTH,
		height: WORKSPACE_HEIGHT,
		...await workspacePosition(source)
	});
	const windowId = created?.id;
	const tabId = created?.tabs?.[0]?.id ?? (windowId === undefined ? undefined : (await chrome.tabs.query({ windowId }))[0]?.id);
	if (windowId === undefined || tabId === undefined) throw new Error("Chrome could not open the S4E Spotlight window.");
	await chrome.storage.session.set({
		...launchRecord(tabId),
		[WORKSPACE_WINDOW_KEY]: {
			windowId,
			tabId
		}
	});
	await commit?.(tabId, true);
	// Initial navigation must not race RESULTS_INIT or revoke the launch handoff.
	await chrome.tabs.update(tabId, { url: pageUrl });
	return {
		tabId,
		created: true
	};
}
async function readResultsRun(id) {
	if (typeof id !== "string" || !/^[a-f\d-]{36}$/iu.test(id)) return undefined;
	const key = `${RESULTS_RUN_PREFIX}${id}`;
	const run = (await chrome.storage.session.get(key))[key];
	if (run && Date.now() - run.startedAt >= RESULTS_RUN_TTL_MS) {
		await chrome.storage.session.remove(key);
		return undefined;
	}
	return run;
}
async function assertResultsRun(id, sender) {
	if (!isPageSender(sender, "results.html") || !sender.documentId) throw new Error("Open this action from the Results page.");
	const run = await readResultsRun(id);
	if (!run || run.ownerTabId !== sender.tab?.id || run.ownerDocumentId !== sender.documentId) {
		throw new Error("This report is no longer authorized. Start it again from Results.");
	}
	const tab = await chrome.tabs.get(run.sellerCentralTabId);
	if (tab.url !== run.sellerCentralUrl || new URL(tab.url).origin !== "https://sellercentral.amazon.com" || await getActiveJob()) {
		await chrome.storage.session.remove(`${RESULTS_RUN_PREFIX}${run.id}`);
		throw new Error("The Seller Central session changed. Start the report again.");
	}
	return run;
}
export async function revokeResultsForTab(tabId, closed = false) {
	if (resultsNavigationEpoch.has(tabId)) {
		if (closed) resultsNavigationEpoch.delete(tabId);
		else resultsNavigationEpoch.set(tabId, resultsNavigationEpoch.get(tabId) + 1);
	}
	return serializeResultControl(async () => {
		const stored = await chrome.storage.session.get(null);
		const runs = [];
		const keys = Object.entries(stored).filter(([key, value]) => {
			if (key.startsWith(RESULTS_RUN_PREFIX)) {
				const run = value;
				if (run.ownerTabId === tabId || run.sellerCentralTabId === tabId) {
					runs.push(run);
					return true;
				}
				return false;
			}
			if (closed && key.startsWith(RESULTS_LAUNCH_PREFIX)) return value.tabId === tabId;
			return false;
		}).map(([key]) => key);
		if (keys.length) await chrome.storage.session.remove(keys);
		for (const run of runs) void chrome.tabs.sendMessage(run.sellerCentralTabId, {
			type: "REPORTS_ABORT",
			runId: run.id
		}, { frameId: 0 }).catch(() => undefined);
	});
}
/** Raw results are only returned to a confirmed run in our own Results document. */
export async function handleResultsMessage(message, sender) {
	if (!isOwnSender(sender)) throw new Error("Unauthorized extension message.");
	const type = String(message.type);
	if (type === "RESULTS_OPEN") {
		const source = requireSenderTab(sender.tab);
		const mode = message.mode === "cases" ? "cases" : message.mode === "accounts" ? "accounts" : "reports";
		const caseIds = mode === "cases" ? normalizeCaseIds(message.caseIds) : [];
		if (caseIds.length > MAX_BULK_IDS) throw new Error("Choose no more than 50 case IDs.");
		await serializeWorkspace(() => openWorkspace({
			mode,
			caseIds
		}, source));
		return { ok: true };
	}
	if (!isPageSender(sender, "results.html") || !sender.documentId || sender.tab?.id === undefined) {
		throw new Error("Open this action from the Results page.");
	}
	if (type === "RESULTS_INIT") {
		if (typeof message.launchId !== "string" || !/^[a-f\d-]{36}$/iu.test(message.launchId)) return {
			ok: true,
			mode: "reports",
			caseIds: []
		};
		const key = `${RESULTS_LAUNCH_PREFIX}${message.launchId}`;
		const launch = (await chrome.storage.session.get(key))[key];
		if (!launch || launch.tabId !== sender.tab.id || Date.now() - launch.startedAt >= RESULTS_RUN_TTL_MS) throw new Error("This window has expired. Open it again from the palette.");
		return {
			ok: true,
			mode: launch.mode,
			caseIds: launch.caseIds,
			...launch.resumeId ? {
				resumeId: launch.resumeId,
				storeName: launch.storeName ?? "the selected store"
			} : {}
		};
	}
	if (type === "RESULTS_OPEN_SELLER") return focusOrOpenSellerCentralTab(sender.tab);
	if (type === "REPORTS_PREPARE") {
		const ownerEpoch = observeResultsTab(sender.tab.id);
		if (await getActiveJob()) throw new Error("Wait for the store switch to finish, then try again.");
		const { tabId } = await ensureSellerCentralTab(sender.tab, { focus: false });
		await waitForTabComplete(tabId);
		const sellerEpoch = observeResultsTab(tabId);
		if (!await probeSellerCentralSession(tabId)) {
			if (message.mode === "cases") throw new Error("Sign in to a store in Seller Central, then try again.");
			return {
				ok: true,
				loggedInToStore: false
			};
		}
		const tab = await chrome.tabs.get(tabId);
		if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com") throw new Error("The Seller Central tab has navigated away.");
		const cases = message.mode === "cases";
		const sections = Array.isArray(message.sections) ? message.sections : [];
		const allowed = cases ? ["SCRAPE_CASES"] : Object.entries(REPORT_REQUESTS).filter(([, request]) => sections.includes(request.source)).map(([name]) => name);
		const caseIds = cases ? normalizeCaseIds(message.caseIds) : [];
		if (allowed.length === 0 || cases && (caseIds.length === 0 || caseIds.length > MAX_BULK_IDS)) throw new Error("Choose what to include before starting.");
		const run = {
			id: crypto.randomUUID(),
			ownerTabId: sender.tab.id,
			ownerDocumentId: sender.documentId,
			sellerCentralTabId: tabId,
			sellerCentralUrl: tab.url,
			startedAt: Date.now(),
			allowed,
			claimed: [],
			caseIds
		};
		await serializeResultControl(async () => {
			const alive = await chrome.tabs.sendMessage(run.ownerTabId, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: run.ownerDocumentId });
			if (!alive?.ok || resultsNavigationEpoch.get(run.ownerTabId) !== ownerEpoch || resultsNavigationEpoch.get(tabId) !== sellerEpoch) {
				throw new Error("A report tab changed while preparing. Start the report again.");
			}
			if (await getActiveJob()) throw new Error("Wait for the store switch to finish, then try again.");
			await chrome.storage.session.set({ [`${RESULTS_RUN_PREFIX}${run.id}`]: run });
		});
		return {
			ok: true,
			runId: run.id
		};
	}
	if (type === "RESULTS_CANCEL" || type === "RESULTS_FINISH") {
		return serializeResultControl(async () => {
			const run = await readResultsRun(message.runId);
			if (run && (run.ownerTabId !== sender.tab?.id || run.ownerDocumentId !== sender.documentId)) throw new Error("This report belongs to another Results page.");
			if (run) {
				await chrome.storage.session.remove(`${RESULTS_RUN_PREFIX}${run.id}`);
				void chrome.tabs.sendMessage(run.sellerCentralTabId, {
					type: "REPORTS_ABORT",
					runId: run.id
				}, { frameId: 0 }).catch(() => undefined);
			}
			return { ok: true };
		});
	}
	const run = await serializeResultControl(async () => {
		const current = await assertResultsRun(message.runId, sender);
		if (!current.allowed.includes(type) || current.claimed.includes(type)) throw new Error("This request was not selected or has already started.");
		current.claimed.push(type);
		await chrome.storage.session.set({ [`${RESULTS_RUN_PREFIX}${current.id}`]: current });
		return current;
	});
	await serializeResultControl(() => assertResultsRun(run.id, sender));
	const result = type === "SCRAPE_CASES" ? await scrapeSellerCentralCases(run.caseIds, sender.tab, run.sellerCentralTabId, run.id) : await fetchReportSource(type, sender.tab, run.sellerCentralTabId, run.id);
	await serializeResultControl(() => assertResultsRun(run.id, sender));
	return result;
}
/** The report run started by the latest successful prepare; used to tag logs from every context. */
let activeReportRun;
function reportRunForPaletteTab(tabId) {
	return activeReportRun && activeReportRun.paletteTabId === tabId ? activeReportRun.id : undefined;
}
function reportRunForTab(tabId) {
	if (!activeReportRun || tabId === undefined) return undefined;
	return tabId === activeReportRun.paletteTabId || tabId === activeReportRun.sellerCentralTabId ? activeReportRun.id : undefined;
}
const asArray = (value) => Array.isArray(value) ? value : [];
const REPORT_REQUESTS = {
	REPORTS_FETCH_UNFULFILLABLE: {
		source: "unfulfillable",
		fallbackError: "Couldn’t load unfulfillable inventory.",
		pick: ({ listings, nextRemovalOrderId }) => ({
			listings: asArray(listings),
			nextRemovalOrderId: typeof nextRemovalOrderId === "string" && nextRemovalOrderId ? nextRemovalOrderId : null
		})
	},
	REPORTS_FETCH_FEEDBACK: {
		source: "feedback",
		fallbackError: "Couldn’t load seller feedback.",
		pick: ({ feedbacks }) => ({ feedbacks: asArray(feedbacks) })
	},
	REPORTS_FETCH_STRANDED: {
		source: "stranded",
		fallbackError: "Couldn’t load stranded inventory.",
		pick: ({ listings }) => ({ listings: asArray(listings) })
	},
	REPORTS_FETCH_SUPPRESSED: {
		source: "suppressed",
		fallbackError: "Couldn’t load search-suppressed inventory.",
		pick: ({ listings }) => ({ listings: asArray(listings) })
	},
	REPORTS_FETCH_SHIPPING_QUEUE: {
		source: "shippingQueue",
		fallbackError: "Couldn’t load shipping queue.",
		pick: ({ shipments }) => ({ shipments: asArray(shipments) })
	}
};
function isReportFetchType(type) {
	return Object.hasOwn(REPORT_REQUESTS, type);
}
const CONTENT_SCRIPT_MISSING = /Receiving end does not exist/i;
/** Asks the Seller Central tab's content script for one report source, waiting for the script to load. */
async function sendReportFetch(tabId, type, runId) {
	const request = REPORT_REQUESTS[type];
	const startedAt = Date.now();
	const deadline = startedAt + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	let attempts = 0;
	while (Date.now() < deadline) {
		attempts += 1;
		try {
			const response = await chrome.tabs.sendMessage(tabId, runId ? {
				type,
				runId
			} : { type }, { frameId: 0 });
			if (attempts > 1) {
				log.withRun(runId).info("report.contentScriptWait", {
					source: request.source,
					attempts,
					ms: Date.now() - startedAt
				});
			}
			if (response?.ok) return {
				ok: true,
				...request.pick(response)
			};
			throw new Error(typeof response?.error === "string" ? response.error : request.fallbackError);
		} catch (error) {
			const message = errorMessage(error, String(error));
			if (!CONTENT_SCRIPT_MISSING.test(message)) throw error instanceof Error ? error : new Error(message);
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	throw new Error(lastError ?? request.fallbackError);
}
async function fetchReportSource(type, senderTab, authorizedTabId, authorizedRunId) {
	rememberReportProgressTab(senderTab?.id);
	const runId = authorizedRunId ?? reportRunForPaletteTab(senderTab?.id);
	const source = REPORT_REQUESTS[type].source;
	const done = log.withRun(runId).time("report.source", { source });
	try {
		const { tabId } = authorizedTabId === undefined ? await ensureSellerCentralTab(senderTab, { focus: false }) : { tabId: authorizedTabId };
		await waitForTabComplete(tabId);
		const result = await sendReportFetch(tabId, type, runId);
		const items = Object.values(result).find(Array.isArray);
		done({ count: items?.length ?? 0 });
		return result;
	} catch (error) {
		done({ error: describeError(error) }, "error");
		throw error;
	}
}
export function rememberReportProgressTab(tabId) {
	if (typeof tabId === "number") reportProgressTabId = tabId;
}
export async function relayReportProgress(message) {
	if (reportProgressTabId === undefined) return { ok: true };
	try {
		await chrome.tabs.sendMessage(reportProgressTabId, message);
	} catch {}
	return { ok: true };
}
async function relayAuthorizedReportProgress(message, sender) {
	if (!isOwnSender(sender) || sender.frameId !== 0 || !sender.url || new URL(sender.url).origin !== "https://sellercentral.amazon.com") return { ok: true };
	const run = await readResultsRun(message.runId);
	if (!run || run.sellerCentralTabId !== sender.tab?.id) return { ok: true };
	try {
		await chrome.tabs.sendMessage(run.ownerTabId, message, { documentId: run.ownerDocumentId });
	} catch {}
	return { ok: true };
}
export async function fetchUnfulfillableReport(senderTab) {
	return await fetchReportSource("REPORTS_FETCH_UNFULFILLABLE", senderTab);
}
export async function fetchFeedbackReport(senderTab) {
	return await fetchReportSource("REPORTS_FETCH_FEEDBACK", senderTab);
}
export async function fetchStrandedReport(senderTab) {
	return await fetchReportSource("REPORTS_FETCH_STRANDED", senderTab);
}
export async function fetchSuppressedReport(senderTab) {
	return await fetchReportSource("REPORTS_FETCH_SUPPRESSED", senderTab);
}
export async function fetchShippingQueueReport(senderTab) {
	return await fetchReportSource("REPORTS_FETCH_SHIPPING_QUEUE", senderTab);
}
const CASE_SCRAPE_LIMIT = 50;
const CASE_SCRAPE_SIGN_IN_ERROR = "Sign in to Seller Central, then try again.";
export async function scrapeSellerCentralCases(caseIds, senderTab, authorizedTabId, runId) {
	const ids = normalizeCaseIds(caseIds);
	if (ids.length === 0) throw new Error("Enter at least one 11-digit Case ID.");
	if (ids.length > CASE_SCRAPE_LIMIT) throw new Error(`Scrape no more than ${CASE_SCRAPE_LIMIT} cases at a time.`);
	const done = log.time("case.scrape", { requested: ids.length });
	try {
		const { tabId } = authorizedTabId === undefined ? await ensureSellerCentralTab(senderTab, { focus: false }) : { tabId: authorizedTabId };
		await waitForTabComplete(tabId);
		const loggedIn = await probeSellerCentralSession(tabId);
		if (!loggedIn) throw new Error(CASE_SCRAPE_SIGN_IN_ERROR);
		const response = await chrome.tabs.sendMessage(tabId, {
			type: "SCRAPE_CASES",
			caseIds: ids,
			...runId ? { runId } : {}
		}, { frameId: 0 });
		if (!response?.ok || !response.file || typeof response.file !== "object") {
			throw new Error(typeof response?.error === "string" ? response.error : "Couldn’t scrape cases.");
		}
		const file = response.file;
		done({
			cases: Array.isArray(file.cases) ? file.cases.length : 0,
			errors: Array.isArray(file.errors) ? file.errors.length : 0
		});
		return {
			ok: true,
			file: response.file
		};
	} catch (error) {
		done({ error: describeError(error) }, "error");
		throw error;
	}
}
/** Polls a tab's content script until it reports a settled session, or the time runs out. */
async function pollSellerCentralSession(tabId, timeoutMs) {
	const deadline = Date.now() + timeoutMs;
	let last;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_SESSION_STATUS" }, { frameId: 0 });
			if (response?.ok && typeof response.loggedInToStore === "boolean") {
				last = {
					loggedInToStore: response.loggedInToStore,
					settled: Boolean(response.settled)
				};
				if (last.settled) return last;
			}
		} catch {}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	return last;
}
export async function probeSellerCentralSession(tabId) {
	const last = await pollSellerCentralSession(tabId, SESSION_PROBE_TIMEOUT_MS);
	if (!last) throw new Error("Couldn’t confirm the Seller Central session.");
	if (!last.settled) log.warn("report.sessionUnsettled", {
		tabId,
		loggedInToStore: last.loggedInToStore
	});
	return last.loggedInToStore;
}
const SESSION_CHECK_TIMEOUT_MS = 3e3;
const SESSION_CHECK_MAX_TABS = 5;
/**
* Whether Seller Central is signed in, read from the tabs already open; it never opens one.
* Tabs share cookies, so one signed-in tab is enough, and a stale sign-in page alone isn't trusted over it.
*/
export async function checkSellerCentralSession(senderTab) {
	// A switch signs out on purpose; its own screens cover that time.
	if (await getActiveJob()) return "unknown";
	const tabs = (await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN })).filter((tab) => tab.id !== undefined && Boolean(tab.incognito) === Boolean(senderTab?.incognito)).sort((a, b) => Number(b.id === senderTab?.id) - Number(a.id === senderTab?.id) || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0)).slice(0, SESSION_CHECK_MAX_TABS);
	const states = await Promise.all(tabs.map((tab) => pollSellerCentralSession(tab.id, SESSION_CHECK_TIMEOUT_MS)));
	const settled = states.filter((state) => state?.settled);
	const session = settled.some((state) => state.loggedInToStore) ? "signed-in" : settled.length ? "signed-out" : "unknown";
	log.info("session.check", {
		session,
		tabs: tabs.length,
		settled: settled.length
	});
	return session;
}
export async function prepareReports(senderTab) {
	const runId = createLogRunId("report");
	const runLog = log.withRun(runId);
	const done = runLog.time("report.prepare");
	const timings = {};
	const step = async (name, action) => {
		const startedAt = Date.now();
		try {
			return await action();
		} finally {
			timings[name] = Date.now() - startedAt;
		}
	};
	try {
		const { tabId, opened } = await step("tabMs", () => ensureSellerCentralTab(senderTab, { focus: false }));
		await step("loadMs", () => waitForTabComplete(tabId));
		const tab = await chrome.tabs.get(tabId);
		const loggedInToStore = await step("sessionMs", () => probeSellerCentralSession(tabId));
		done({
			loggedInToStore,
			sellerCentralTab: opened ? "opened" : "reused",
			...timings
		});
		if (loggedInToStore) {
			activeReportRun = {
				id: runId,
				paletteTabId: senderTab?.id,
				sellerCentralTabId: tabId
			};
			return {
				ok: true,
				loggedInToStore: true,
				sellerCentralTabId: tabId
			};
		}
		if (senderTab?.id === tabId) return {
			ok: true,
			loggedInToStore: false,
			sellerCentralTabId: tabId
		};
		await chrome.tabs.update(tabId, { active: true });
		if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
		const prompt = await chrome.tabs.sendMessage(tabId, {
			type: "OPEN_PALETTE",
			mode: "sign-in"
		});
		if (!prompt?.ok) throw new Error(prompt?.error ?? "Couldn’t open the command palette on Seller Central.");
		return {
			ok: true,
			loggedInToStore: false,
			sellerCentralTabId: tabId,
			openedPromptOnSellerCentral: true
		};
	} catch (error) {
		runLog.error("report.prepareFailed", {
			error: describeError(error),
			...timings
		});
		throw error;
	}
}
/** Rechecks a queried tab, since it may have navigated away or closed since the query. */
async function isSellerCentralTabFor(job, tabId) {
	let current;
	try {
		current = await chrome.tabs.get(tabId);
	} catch {
		return false;
	}
	return Boolean(current.url) && new URL(current.url).origin === "https://sellercentral.amazon.com" && Boolean(current.incognito) === Boolean(job.incognito);
}
async function closeDuplicateSellerCentralTabs(job, keepTabId) {
	const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
	for (const tab of tabs) {
		if (tab.id === undefined || tab.id === job.tabId || tab.id === keepTabId || Boolean(tab.incognito) !== Boolean(job.incognito)) continue;
		if (!await isSellerCentralTabFor(job, tab.id)) continue;
		assertSwitchOperationCurrent();
		try {
			await chrome.tabs.remove(tab.id);
		} catch {}
	}
}
/** The user's Seller Central tab to reload in place: the one the switch started from, else the most recent. */
async function reusableSellerCentralTab(job) {
	const tabs = (await chrome.tabs.query({
		url: SELLER_CENTRAL_TAB_URL_PATTERN,
		windowType: "normal"
	})).filter((tab) => tab.id !== undefined && tab.id !== job.tabId && Boolean(tab.incognito) === Boolean(job.incognito));
	const rank = (tab) => (tab.id === job.sourceTabId ? 2 : 0) + (tab.windowId === job.returnWindowId ? 1 : 0);
	const ordered = [...tabs].sort((a, b) => rank(b) - rank(a) || (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0));
	for (const tab of ordered) {
		if (await isSellerCentralTabFor(job, tab.id)) return tab.id;
	}
	return undefined;
}
/** Where a kept helper tab goes: beside the tab the switch started from, else at the end. */
async function indexAfterSource(job, windowId) {
	if (job.sourceTabId === undefined) return -1;
	try {
		const source = await chrome.tabs.get(job.sourceTabId);
		return source.windowId === windowId ? source.index + 1 : -1;
	} catch {
		return -1;
	}
}
async function closeOwnedSwitchTab(job) {
	if (job?.ownsTab && job.tabId >= 0) {
		if (job.helperWindowId !== undefined) {
			try {
				if ((await chrome.tabs.get(job.tabId)).windowId !== job.helperWindowId) return;
			} catch {
				return;
			}
		}
		// Closing its sole tab also closes the helper window. Other user-added tabs survive.
		try {
			await chrome.tabs.remove(job.tabId);
		} catch {}
	}
}
async function showSwitchTab(job) {
	const tab = await chrome.tabs.get(job.tabId);
	assertSwitchOperationCurrent();
	await chrome.tabs.update(job.tabId, { active: true });
	if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, {
		focused: true,
		state: "normal"
	});
}
async function pauseSwitch(job, reason) {
	const messages = {
		captcha: "Complete the CAPTCHA in the sign-in window.",
		verification: "Complete Amazon’s verification in the sign-in window.",
		manual: "Complete sign-in manually in the sign-in window.",
		error: "Sign-in needs your attention. Review the sign-in window or cancel and retry."
	};
	const attentionMessage = messages[reason] ?? messages.verification;
	const alreadyShown = job.stage === "paused" && job.attentionMessage === attentionMessage;
	if (job.stage !== "paused") job.resumeStage = job.stage;
	job.attentionMessage = attentionMessage;
	await setJobStage(job, "paused");
	if (!alreadyShown) await showSwitchTab(job);
}
async function switchDestinationWindow(job) {
	if (job.returnWindowId !== undefined) {
		try {
			const window = await chrome.windows.get(job.returnWindowId);
			if (window.type === "normal" && Boolean(window.incognito) === Boolean(job.incognito)) return window.id;
		} catch {}
	}
	const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
	return windows.find((window) => window.id !== job.helperWindowId && Boolean(window.incognito) === Boolean(job.incognito))?.id;
}
/**
* Sign-in is shared, so the user's own Seller Central tab can load the store directly: the store
* loads once instead of in the helper and then again in their tab. Their tab keeps its place and is
* not activated. Returns false, keeping the helper's tab, when no Seller Central tab is open.
*/
async function moveJobToUserTab(job) {
	if (!job.ownsTab) return false;
	const userTabId = await reusableSellerCentralTab(job);
	assertSwitchOperationCurrent();
	if (userTabId === undefined) return false;
	job.tabId = userTabId;
	job.ownsTab = false;
	return true;
}
/** Finish only after the saved store URL has produced a new, loaded, signed-in document. */
async function finishAccountSwitch(job, sender) {
	if ((job.resumeStage ?? job.stage) !== "store" || sender.documentId === job.storeNavigationDocumentId) {
		throw new Error("The selected store has not loaded yet.");
	}
	const url = new URL(sender.url);
	if (url.pathname.startsWith("/ap/") || url.pathname.startsWith("/account-switcher/") || url.pathname.startsWith("/sign-out")) {
		throw new Error("The selected store has not loaded yet.");
	}
	const tab = await chrome.tabs.get(job.tabId);
	if (tab.status !== "complete" || tab.url?.split("#")[0] !== sender.url?.split("#")[0]) return {
		ok: true,
		waitMs: 500
	};
	const session = await chrome.tabs.sendMessage(job.tabId, { type: "REPORTS_SESSION_STATUS" }, { documentId: sender.documentId });
	assertSwitchOperationCurrent();
	if (!session?.ok || !session.loggedInToStore || !session.settled) return {
		ok: true,
		waitMs: 500
	};
	// A store loaded in the user's own tab is already where it belongs. Otherwise reload their tab in
	// place: it keeps its place, and neither it nor its window is activated.
	const { store } = await getJobRecords(job);
	let finalTabId = job.ownsTab ? await reusableSellerCentralTab(job) : undefined;
	assertSwitchOperationCurrent();
	if (finalTabId !== undefined) {
		// Recheck the store document before reloading or closing any of the user's tabs.
		await assertWorkflowSender(sender, job.id);
		await chrome.storage.session.set({ [SWITCH_NOTICE_KEY]: {
			tabId: finalTabId,
			storeName: store.name
		} });
		try {
			await chrome.tabs.update(finalTabId, { url: store.storeUrl });
		} catch {
			finalTabId = undefined;
		}
	}
	if (finalTabId === undefined) {
		const destination = job.ownsTab ? await switchDestinationWindow(job) : undefined;
		assertSwitchOperationCurrent();
		if (destination !== undefined && destination !== tab.windowId) {
			// Moving its only tab closes the helper window. A moved tab is not activated.
			await chrome.tabs.move(job.tabId, {
				windowId: destination,
				index: await indexAfterSource(job, destination)
			});
		}
		// Recheck the document after the move before replacing any existing SC tabs.
		await assertWorkflowSender(sender, job.id);
		finalTabId = job.tabId;
		await chrome.storage.session.set({ [SWITCH_NOTICE_KEY]: {
			tabId: finalTabId,
			storeName: store.name
		} });
	}
	await closeDuplicateSellerCentralTabs(job, finalTabId);
	assertSwitchOperationCurrent();
	await setCurrentStoreId(job.storeId);
	await setActiveJob(undefined);
	jobLog(job).info("account.switch.complete", {
		store: store.name,
		ms: Date.now() - job.startedAt,
		tab: !job.ownsTab ? "user" : finalTabId === job.tabId ? "helper" : "reloaded"
	});
	if (finalTabId === job.tabId) void confirmSwitchDone(job.tabId, store.name, sender.documentId);
	else try {
		await chrome.tabs.remove(job.tabId);
	} catch {}
	return { ok: true };
}
/** A loaded page asks for its notice on startup; a kept helper page is already loaded, so tell it. */
async function confirmSwitchDone(tabId, storeName, documentId) {
	try {
		await chrome.tabs.sendMessage(tabId, {
			type: "ACCOUNTS_SWITCH_DONE",
			storeName
		}, { documentId });
	} catch {}
}
async function getSwitchNotice() {
	return (await chrome.storage.session.get(SWITCH_NOTICE_KEY))[SWITCH_NOTICE_KEY];
}
function jobLog(job) {
	return log.withRun(job.id);
}
function jobContext(job) {
	return {
		store: job.storeName ?? job.storeId,
		stage: job.stage,
		elapsedMs: Date.now() - job.startedAt
	};
}
async function getActiveJob() {
	const job = (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY];
	if (job && Date.now() - job.startedAt >= ACTIVE_JOB_TTL_MS) {
		jobLog(job).warn("account.switch.expired", jobContext(job));
		await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY);
		await closeOwnedSwitchTab(job);
		return undefined;
	}
	return job;
}
async function setActiveJob(job) {
	assertSwitchOperationCurrent();
	// Clicks happen only while signing in; detach once the job ends, pauses for the user, or moves tabs.
	if (!job || job.tabId !== debuggerTabId || job.stage === "paused" || job.stage === "store") await detachSwitchDebugger();
	if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job });
	else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY);
}
/** Moves a job to `stage`, logging the transition once. */
async function setJobStage(job, stage) {
	if (job.stage !== stage) jobLog(job).info("account.switch.stage", {
		...jobContext(job),
		stage,
		from: job.stage
	});
	job.stage = stage;
	if (stage !== "paused") {
		delete job.resumeStage;
		delete job.attentionMessage;
	}
	await setActiveJob(job);
}
async function serializeSwitchStart(action) {
	const previous = startSwitchLock;
	let release;
	startSwitchLock = new Promise((resolve) => {
		release = resolve;
	});
	await previous;
	try {
		return await action();
	} finally {
		release();
	}
}
async function assertWorkflowSender(sender, jobId) {
	const job = await getActiveJob();
	if (!job || job.id !== jobId || sender.tab?.id !== job.tabId) throw new Error("This login workflow is no longer authorized.");
	if (!isOwnSender(sender) || sender.frameId !== 0 || !sender.documentId || !sender.url || new URL(sender.url).origin !== SELLER_CENTRAL_HOME_URL.slice(0, -1)) {
		throw new Error("Unexpected login origin or frame.");
	}
	const tab = await chrome.tabs.get(job.tabId);
	if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com") throw new Error("The login tab has navigated away.");
	if (sender.documentLifecycle && sender.documentLifecycle !== "active") throw new Error("The login document is no longer active.");
	const alive = await chrome.tabs.sendMessage(job.tabId, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: sender.documentId });
	if (!alive?.ok) throw new Error("The login document has navigated away.");
	assertSwitchOperationCurrent();
	return job;
}
async function getJobRecords(job) {
	const { vault } = await getUnlockedVault();
	const store = vault.stores.find(({ id }) => id === job.storeId);
	const credential = store && vault.credentials.find(({ id }) => id === store.credentialId);
	if (!store || !credential) throw new Error("The selected account no longer exists.");
	return {
		store,
		credential
	};
}
/** The login tab the debugger stays attached to between clicks; attaching costs a round trip per step. */
let debuggerTabId;
async function withJobDebugger(job, action) {
	const target = { tabId: job.tabId };
	try {
		assertSwitchOperationCurrent();
		const tab = await chrome.tabs.get(job.tabId);
		if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com" || !new URL(tab.url).pathname.startsWith("/ap/")) throw new Error("The login tab has navigated away.");
		if (debuggerTabId !== job.tabId) {
			await detachSwitchDebugger();
			try {
				await chrome.debugger.attach(target, "1.3");
			} catch (error) {
				// A restarted service worker forgets a session Chrome still holds for this tab.
				if (!String(error?.message ?? error).includes("already attached")) throw error;
			}
			debuggerTabId = job.tabId;
		}
		assertSwitchOperationCurrent();
		return await action(target);
	} catch (error) {
		await detachSwitchDebugger();
		throw error;
	}
}
/** Ends the switch's debugging session, and with it Chrome's debugging bar. */
async function detachSwitchDebugger() {
	const tabId = debuggerTabId;
	if (tabId === undefined) return;
	debuggerTabId = undefined;
	try {
		await chrome.debugger.detach({ tabId });
	} catch {}
}
function requireMasterPassword(value) {
	if (typeof value !== "string" || value.length < 10) throw new Error("Use a master password of at least 10 characters.");
	return value;
}
function requireSharePassword(value) {
	if (typeof value !== "string" || value.length < 10) throw new Error("Use a share password of at least 10 characters.");
	return value;
}
/** All store switches run in an unfocused, normal window until verified or needing input. */
async function startSignInSwitch(store, sender, sameCredential = false) {
	const original = sender.tab?.windowId === undefined ? await chrome.windows.getLastFocused({ windowTypes: ["normal"] }) : await chrome.windows.get(sender.tab.windowId);
	const incognito = Boolean(original.incognito);
	let helperWindowId;
	let tabId;
	try {
		assertSwitchOperationCurrent();
		const job = {
			id: crypto.randomUUID(),
			tabId: -1,
			storeId: store.id,
			storeName: store.name,
			stage: sameCredential ? "store" : "logout",
			startedAt: Date.now(),
			ownsTab: true,
			returnWindowId: original.id,
			...sender.tab?.id === undefined ? {} : { sourceTabId: sender.tab.id },
			incognito,
			signIn: !sameCredential
		};
		// Without sign-in there is nothing to hide: load the store once, in the user's own tab.
		if (!sameCredential || !await moveJobToUserTab(job)) {
			const helper = await chrome.windows.create({
				url: "about:blank",
				type: "normal",
				focused: false,
				incognito
			});
			helperWindowId = helper?.id;
			if (helperWindowId === undefined) throw new Error("Chrome did not create the sign-in window.");
			tabId = helper?.tabs?.[0]?.id ?? (await chrome.tabs.query({ windowId: helperWindowId }))[0]?.id;
			if (tabId === undefined) throw new Error("Chrome did not create the login tab.");
			job.tabId = tabId;
			job.helperWindowId = helperWindowId;
		}
		await setActiveJob(job);
		await chrome.storage.session.remove(SWITCH_NOTICE_KEY);
		if (!sameCredential) await setCurrentStoreId(undefined);
		assertSwitchOperationCurrent();
		if (sameCredential) await chrome.tabs.update(job.tabId, { url: store.storeUrl });
		else void queueVaultOperation(() => signOutWithoutPages(job.id)).catch((error) => jobLog(job).warn("account.switch.signOutFailed", { error: describeError(error) }));
		jobLog(job).info("account.switch.start", {
			store: store.name,
			path: sameCredential ? "same-credential" : "sign-in",
			tab: job.ownsTab ? "helper-window" : "user"
		});
		return {
			ok: true,
			jobId: job.id
		};
	} catch (error) {
		if (tabId !== undefined) try {
			await chrome.tabs.remove(tabId);
		} catch {}
		else if (helperWindowId !== undefined) try {
			await chrome.windows.remove(helperWindowId);
		} catch {}
		// Lock/Cancel owns cleanup once it invalidates this operation.
		if (operationGeneration === vaultGeneration && operationSwitchGeneration === switchGeneration) await setActiveJob(undefined);
		throw error;
	}
}
async function handleAccountsMessageNow(message, sender) {
	switch (message.type) {
		case "ACCOUNTS_REQUEST_UNLOCK": return requestAccountUnlock(message.storeId, sender);
		case "ACCOUNTS_STATUS": {
			const [envelope, key, stored] = await Promise.all([
				getEnvelope(),
				getSessionKey(),
				chrome.storage.local.get([STORE_INDEX_KEY, CURRENT_STORE_KEY])
			]);
			const stores = stored[STORE_INDEX_KEY] ?? [];
			const currentStoreId = typeof stored[CURRENT_STORE_KEY] === "string" ? stored[CURRENT_STORE_KEY] : undefined;
			const job = await getActiveJob();
			const activeStore = job ? stores.find((store) => store.id === job.storeId) : undefined;
			return {
				ok: true,
				initialized: Boolean(envelope),
				unlocked: Boolean(key),
				stores,
				currentStore: currentStoreFromIndex(stores, currentStoreId),
				activeSwitch: job ? {
					storeId: job.storeId,
					storeName: activeStore?.name ?? "Selected store",
					stage: job.stage,
					startedAt: job.startedAt,
					signIn: Boolean(job.signIn),
					...job.resumeStage ? { resumeStage: job.resumeStage } : {},
					...job.attentionMessage ? { attentionMessage: job.attentionMessage } : {}
				} : undefined
			};
		}
		case "ACCOUNTS_CREATE": {
			if (await getEnvelope()) throw new Error("The account vault already exists.");
			const masterPassword = requireMasterPassword(message.masterPassword);
			const done = log.time("vault.create");
			const { envelope, keyBytes } = await encryptVault(emptyVault(), masterPassword);
			assertVaultOperationCurrent();
			await chrome.storage.local.set({
				[VAULT_STORAGE_KEY]: envelope,
				[STORE_INDEX_KEY]: []
			});
			await chrome.storage.local.remove(CURRENT_STORE_KEY);
			await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			done();
			return { ok: true };
		}
		case "ACCOUNTS_UNLOCK": {
			const envelope = await getEnvelope();
			if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.");
			const attempts = (await chrome.storage.session.get(UNLOCK_ATTEMPTS_KEY))[UNLOCK_ATTEMPTS_KEY];
			if (attempts && attempts.nextAttemptAt > Date.now()) throw new Error(`Try unlocking again in ${Math.ceil((attempts.nextAttemptAt - Date.now()) / 1e3)} seconds.`);
			const done = log.time("vault.unlock");
			try {
				const { keyBytes } = await decryptVault(envelope, message.masterPassword);
				assertVaultOperationCurrent();
				await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
				await chrome.storage.session.remove(UNLOCK_ATTEMPTS_KEY);
			} catch (error) {
				assertVaultOperationCurrent();
				const failures = Math.min(9, (attempts?.failures ?? 0) + 1);
				const delay = failures < 3 ? 0 : Math.min(6e4, 1e3 * 2 ** (failures - 3));
				await chrome.storage.session.set({ [UNLOCK_ATTEMPTS_KEY]: {
					failures,
					nextAttemptAt: Date.now() + delay
				} });
				done({ ok: false }, "warn");
				throw new Error("Incorrect master password or damaged vault.");
			}
			done({ ok: true });
			return { ok: true };
		}
		case "ACCOUNTS_LOCK": {
			const job = await getActiveJob();
			await chrome.storage.session.remove([
				SESSION_KEY_STORAGE_KEY,
				ACTIVE_JOB_STORAGE_KEY,
				UNLOCK_RESUME_KEY
			]);
			await closeOwnedSwitchTab(job);
			log.info("vault.lock");
			return { ok: true };
		}
		case "ACCOUNTS_GET_VAULT": {
			const { vault } = await getUnlockedVault();
			return {
				ok: true,
				vault
			};
		}
		case "ACCOUNTS_SAVE_VAULT": {
			const current = await getUnlockedVault();
			const vault = message.vault;
			await saveVault(vault, current.envelope, current.key);
			log.info("vault.save", {
				stores: vault.stores.length,
				credentials: vault.credentials.length
			});
			return { ok: true };
		}
		case "ACCOUNTS_EXPORT_SHARE": {
			const { vault } = await getUnlockedVault();
			const sharePassword = requireSharePassword(message.sharePassword);
			const file = await encryptSharedVault(vault, sharePassword);
			log.info("vault.share.export", {
				stores: vault.stores.length,
				credentials: vault.credentials.length
			});
			return {
				ok: true,
				file
			};
		}
		case "ACCOUNTS_IMPORT_SHARE": {
			const current = await getUnlockedVault();
			const sharePassword = requireSharePassword(message.sharePassword);
			const incoming = await decryptSharedVault(message.file, sharePassword);
			validateVault(incoming);
			const merged = mergeVaults(current.vault, incoming);
			validateVault(merged.vault);
			await saveVault(merged.vault, current.envelope, current.key);
			log.info("vault.share.import", {
				addedCredentials: merged.added.credentials,
				addedStores: merged.added.stores,
				updatedCredentials: merged.updated.credentials,
				updatedStores: merged.updated.stores
			});
			return {
				ok: true,
				vault: merged.vault,
				added: merged.added,
				updated: merged.updated
			};
		}
		case "ACCOUNTS_CREATE_FROM_SHARE": {
			if (await getEnvelope()) throw new Error("The account vault already exists.");
			const sharePassword = requireSharePassword(message.sharePassword);
			const masterPassword = requireMasterPassword(message.masterPassword);
			const vault = await decryptSharedVault(message.file, sharePassword);
			validateVault(vault);
			const done = log.time("vault.share.create");
			const { envelope, keyBytes } = await encryptVault(vault, masterPassword);
			assertVaultOperationCurrent();
			await chrome.storage.local.set({
				[VAULT_STORAGE_KEY]: envelope,
				[STORE_INDEX_KEY]: publicStoreIndex(vault)
			});
			await chrome.storage.local.remove(CURRENT_STORE_KEY);
			await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			done({
				stores: vault.stores.length,
				credentials: vault.credentials.length
			});
			return { ok: true };
		}
		case "ACCOUNTS_CHANGE_MASTER_PASSWORD": {
			const { vault } = await getUnlockedVault();
			const masterPassword = requireMasterPassword(message.masterPassword);
			const { envelope, keyBytes } = await encryptVault(vault, masterPassword);
			assertVaultOperationCurrent();
			await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope });
			await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			await chrome.storage.session.remove(UNLOCK_RESUME_KEY);
			log.info("vault.changePassword");
			return { ok: true };
		}
		case "ACCOUNTS_RESET": {
			const job = await getActiveJob();
			await chrome.storage.local.remove([
				VAULT_STORAGE_KEY,
				STORE_INDEX_KEY,
				CURRENT_STORE_KEY
			]);
			await chrome.storage.session.remove([
				SESSION_KEY_STORAGE_KEY,
				ACTIVE_JOB_STORAGE_KEY,
				UNLOCK_RESUME_KEY,
				UNLOCK_ATTEMPTS_KEY,
				SWITCH_NOTICE_KEY
			]);
			await closeOwnedSwitchTab(job);
			log.warn("vault.reset");
			return { ok: true };
		}
		case "ACCOUNTS_OPEN_OPTIONS":
			await chrome.runtime.openOptionsPage();
			return { ok: true };
		case "ACCOUNTS_RESUME_SWITCH": return resumeAccountSwitch(message.resumeId, sender);
		case "ACCOUNTS_START_SWITCH": {
			return serializeSwitchStart(async () => {
				if (await getActiveJob()) throw new Error("Another account switch is already running.");
				const { vault } = await getUnlockedVault();
				const store = vault.stores.find(({ id }) => id === message.storeId);
				if (!store) throw new Error("The selected store was not found.");
				const currentStoreId = await getCurrentStoreId();
				const currentStore = currentStoreId ? vault.stores.find(({ id }) => id === currentStoreId) : undefined;
				return startSignInSwitch(store, sender, currentStore?.credentialId === store.credentialId);
			});
		}
		case "ACCOUNTS_FOCUS_CURRENT_STORE": {
			if (!await getCurrentStoreId()) throw new Error("No store is currently selected.");
			return focusOrOpenSellerCentralTab(sender.tab);
		}
		case "ACCOUNTS_SWITCH_NOTICE": {
			const notice = await getSwitchNotice();
			if (!notice || notice.tabId !== sender.tab?.id || sender.frameId !== 0) return { ok: true };
			return {
				ok: true,
				storeName: notice.storeName
			};
		}
		case "ACCOUNTS_SWITCH_NOTICE_DISMISS": {
			const notice = await getSwitchNotice();
			if (notice && notice.tabId === sender.tab?.id) await chrome.storage.session.remove(SWITCH_NOTICE_KEY);
			return { ok: true };
		}
		case "ACCOUNTS_FOCUS_SWITCH": {
			const job = await getActiveJob();
			if (!job || job.tabId < 0) throw new Error("No account switch is running.");
			await showSwitchTab(job);
			return { ok: true };
		}
		case "ACCOUNTS_CANCEL_SWITCH": {
			const job = await getActiveJob();
			if (!job) return { ok: true };
			await setActiveJob(undefined);
			await closeOwnedSwitchTab(job);
			jobLog(job).info("account.switch.cancelled", jobContext(job));
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_GET_JOB": {
			const job = await getActiveJob();
			if (!job || sender.tab?.id !== job.tabId || sender.frameId !== 0 || !sender.documentId || !sender.url || new URL(sender.url).origin !== "https://sellercentral.amazon.com") return {
				ok: true,
				job: null
			};
			return {
				ok: true,
				job: {
					id: job.id,
					stage: job.stage,
					...job.resumeStage ? { resumeStage: job.resumeStage } : {}
				}
			};
		}
		case "ACCOUNT_AUTOMATION_SECRET": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (!sender.url || !new URL(sender.url).pathname.startsWith("/ap/")) throw new Error("Credentials are only available on an Amazon sign-in page.");
			const stage = job.resumeStage ?? job.stage;
			if (stage === "logout" || stage === "store" || stage === "authenticated" || new URL(sender.url).searchParams.get("openid.return_to")?.includes("/sign-out")) {
				throw new Error("Credentials are not available during this login step.");
			}
			const { credential } = await getJobRecords(job);
			if (message.kind === "email") {
				await setJobStage(job, "email");
				return {
					ok: true,
					value: credential.domain
				};
			}
			if (message.kind === "password") {
				await setJobStage(job, "password");
				return {
					ok: true,
					value: credential.password
				};
			}
			if (message.kind === "otp") {
				// Submit at once, even late in a time step: RFC 6238 verifiers accept the previous step.
				// A rejected code is retried once with a later step's code, never the same one.
				const attempts = job.otpAttempts ?? 0;
				if (attempts >= MAX_OTP_CODES || message.retry === true && attempts === 0) {
					throw new Error("Amazon rejected the verification code. Check the saved authenticator key or this computer's clock.");
				}
				const { period } = parseOtpAuthUri(credential.otpAuthUri);
				const current = Math.floor(Date.now() / 1e3 / period);
				const counter = job.otpCounter === undefined ? current : Math.max(current, job.otpCounter + 1);
				if (message.retry === true) jobLog(job).warn("account.switch.otpRetry", {
					...jobContext(job),
					stepsAhead: counter - current
				});
				job.otpCounter = counter;
				job.otpAttempts = attempts + 1;
				await setJobStage(job, "otp");
				return {
					ok: true,
					value: await generateTotp(credential.otpAuthUri, counter * period * 1e3)
				};
			}
			throw new Error("Unknown credential stage.");
		}
		case "ACCOUNT_AUTOMATION_CLICK": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) {
				throw new Error("Unsupported login click action.");
			}
			const { x, y } = message;
			if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
				throw new Error("Invalid login click coordinates.");
			}
			const expectedStage = {
				continue: "email",
				"password-submit": "password",
				"otp-submit": "otp"
			}[message.action];
			if (job.stage !== expectedStage) throw new Error("This click does not match the current login step.");
			await withJobDebugger(job, async (target) => {
				const send = (type, extra = {}) => {
					assertSwitchOperationCurrent();
					return chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
						type,
						x,
						y,
						...extra
					});
				};
				await send("mouseMoved");
				await send("mousePressed", {
					button: "left",
					clickCount: 1
				});
				await send("mouseReleased", {
					button: "left",
					clickCount: 1
				});
			});
			jobLog(job).info("account.switch.click", {
				...jobContext(job),
				action: message.action
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_PAUSED": {
			const job = await assertWorkflowSender(sender, message.jobId);
			const reason = typeof message.reason === "string" ? message.reason : "captcha";
			await pauseSwitch(job, reason);
			jobLog(job).warn("account.switch.paused", {
				...jobContext(job),
				reason
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_LEAVE_LOGOUT": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if ((job.resumeStage ?? job.stage) !== "logout" || sender.url === job.signOutFallbackFrom) return { ok: true };
			await advanceLogoutToSignIn(job);
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_COMPLETE": {
			const job = await assertWorkflowSender(sender, message.jobId);
			await openStoreAfterSignIn(job, sender.url, sender.documentId);
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_STORE_READY": {
			const job = await assertWorkflowSender(sender, message.jobId);
			return finishAccountSwitch(job, sender);
		}
		case "ACCOUNT_AUTOMATION_REAUTH": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if ((job.resumeStage ?? job.stage) !== "store" || !new URL(sender.url).pathname.startsWith("/ap/")) throw new Error("Unexpected sign-in step.");
			await setCurrentStoreId(undefined);
			job.signIn = true;
			job.otpAttempts = 0;
			await setJobStage(job, "signin");
			await chrome.tabs.update(job.tabId, { url: signInUrlFor((await getJobRecords(job)).store.storeUrl) });
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_ERROR": {
			const job = await assertWorkflowSender(sender, message.jobId);
			await pauseSwitch(job, "error");
			const error = typeof message.error === "string" ? message.error : "Unknown error.";
			jobLog(job).error("account.switch.failed", {
				...jobContext(job),
				error
			});
			return { ok: true };
		}
		default: throw new Error("Unknown account command.");
	}
}
const logoutExits = new Map();
/** The tab listener and the content script both leave logout; share one navigation so neither cancels the other ("Navigation rejected"). */
function advanceLogoutToSignIn(job) {
	let exit = logoutExits.get(job.id);
	if (!exit) {
		exit = (async () => {
			const { store } = await getJobRecords(job);
			await setJobStage(job, "signin");
			// Returning straight to the store skips loading Seller Central's home page after sign-in.
			await chrome.tabs.update(job.tabId, { url: signInUrlFor(store.storeUrl) });
		})();
		exit.catch(() => logoutExits.delete(job.id));
		logoutExits.set(job.id, exit);
	}
	return exit;
}
/** Browser identity and solved-CAPTCHA cookies; keeping them avoids new-device checks and repeat CAPTCHAs. */
const SIGN_OUT_KEPT_COOKIES = new Set([
	"ubid-main",
	"session-id",
	"session-id-time",
	"i18n-prefs",
	"lc-main",
	"sp-cdn",
	"x-amz-captcha-1",
	"x-amz-captcha-2"
]);
/**
* The cookies that keep Amazon signed in (seen live on 2026-10-25); all on .amazon.com except __Host-mselc.
* Sign-in also restored the session from cookies Seller Central never sends, such as sso-cd-state on
* .account.amazon.com, so sign-out deletes every cookie on the sign-in hosts, not just these.
*/
const SESSION_COOKIES = [
	"at-main",
	"sess-at-main",
	"sst-main",
	"x-main",
	"session-token",
	"sso-state-main",
	"__Host-mselc"
];
/**
* Sites besides amazon.com itself whose cookies can restore a sign-in: Seller Central, and Amazon's
* single sign-on (its sso-cd-state did, live). Other Amazon sites keep their cookies, so a switch does
* not sign the user out of them.
*/
const SIGN_IN_COOKIE_SITES = ["sellercentral.amazon.com", "account.amazon.com"];
/** Every cookie the sign-in flow sends lives under one of these; /ap/ adds signin-sso-state-us. */
const SELLER_CENTRAL_COOKIE_URLS = [SELLER_CENTRAL_HOME_URL, "https://sellercentral.amazon.com/ap/signin"];
/**
* Signs out without loading Amazon's sign-out pages: drop the session's cookies and open sign-in.
* A background sign-out request would also end it on Amazon's side, but live it took over 1.5 s and
* its redirects can land on sign-in and race the helper's own sign-in cookies. Falls back to the sign-out page if any of that is unavailable.
*/
async function signOutWithoutPages(jobId) {
	const job = await getActiveJob();
	if (!job || job.id !== jobId || job.stage !== "logout") return;
	try {
		if (await clearSessionWithoutPages(job)) await advanceLogoutToSignIn(job);
		else await chrome.tabs.update(job.tabId, { url: LOGOUT_URL });
	} catch (error) {
		// The switch never got going: end it rather than leave its helper window behind.
		if (operationGeneration === vaultGeneration && operationSwitchGeneration === switchGeneration) {
			await setActiveJob(undefined);
			await closeOwnedSwitchTab(job);
		}
		throw error;
	}
}
/**
* Clears the session through the debugger: chrome.cookies only lists hosts the extension may access,
* which hides every .amazon.com session cookie. Returns false, leaving it to the sign-out page, when
* that fails or any session cookie survives.
*/
async function clearSessionWithoutPages(job) {
	const startedAt = Date.now();
	try {
		const { deleted, left, untouched } = await withTabDebugger(job.tabId, async (target) => {
			const before = await amazonCookies(target);
			const deleted = before.filter(isSignOutCookie);
			await Promise.all(deleted.map(({ name, domain, path }) => chrome.debugger.sendCommand(target, "Network.deleteCookies", {
				name,
				domain,
				path
			})));
			const left = (await amazonCookies(target)).filter(isSignOutCookie);
			return {
				deleted,
				left,
				untouched: before.filter((cookie) => !onSignInHost(cookie))
			};
		});
		assertSwitchOperationCurrent();
		jobLog(job).info("account.switch.signedOut", {
			...jobContext(job),
			deleted: deleted.length,
			// Other Amazon sites, by host only: their cookies stay, so the user stays signed in there.
			untouchedHosts: [...new Set(untouched.map(cookieHost))].sort(),
			// Session cookies that ignored deletion; any means the sign-out page must finish the job.
			left: describeJar(left),
			sessionLeft: SESSION_COOKIES.filter((name) => left.some((cookie) => cookie.name === name)),
			ms: Date.now() - startedAt
		});
		if (left.length > 0) return false;
		job.cookieSignOut = true;
		signInTrail = {
			tabId: job.tabId,
			hops: []
		};
		return true;
	} catch (error) {
		assertSwitchOperationCurrent();
		jobLog(job).warn("account.switch.cookieSignOutUnavailable", {
			...jobContext(job),
			error: describeError(error)
		});
		return false;
	}
}
/**
* Every Amazon cookie in the tab's profile, on any host or path, so diagnostics also show the sites
* sign-out leaves alone. Falls back to what Seller Central sends.
*/
async function amazonCookies(target) {
	let all;
	try {
		all = (await chrome.debugger.sendCommand(target, "Network.getAllCookies"))?.cookies ?? [];
	} catch {
		all = (await chrome.debugger.sendCommand(target, "Network.getCookies", { urls: SELLER_CENTRAL_COOKIE_URLS }))?.cookies ?? [];
	}
	return all.filter((cookie) => /(?:^|\.)amazon\.com$/u.test(cookieHost(cookie)));
}
/** The site a cookie belongs to, without a domain cookie's leading dot. */
function cookieHost(cookie) {
	return cookie.domain.replace(/^\./u, "");
}
/** On amazon.com itself or a sign-in site, where a cookie can restore the old session. */
function onSignInHost(cookie) {
	const host = cookieHost(cookie);
	return host === "amazon.com" || SIGN_IN_COOKIE_SITES.some((site) => host === site || host.endsWith(`.${site}`));
}
/** Sign-out deletes every cookie on the sign-in hosts except browser identity and solved CAPTCHAs. */
function isSignOutCookie(cookie) {
	return onSignInHost(cookie) && !SIGN_OUT_KEPT_COOKIES.has(cookie.name);
}
/** Reuses the switch's debugger session, or attaches just for `action`, so its debugging bar only flashes. */
async function withTabDebugger(tabId, action) {
	const target = { tabId };
	const attachedHere = debuggerTabId !== tabId;
	if (attachedHere) await chrome.debugger.attach(target, "1.3");
	try {
		return await action(target);
	} finally {
		if (attachedHere) try {
			await chrome.debugger.detach(target);
		} catch {}
	}
}
/**
* Diagnostics: cookies by name and scope only, never values: name|domain+path|h(ttpOnly)s(ecure)x(session)|sameSite,
* plus the expiry of session cookies, which shows whether one was set again after sign-out.
*/
function describeJar(entries) {
	return entries.map((entry) => `${entry.name}|${entry.domain}${entry.path}|${entry.httpOnly ? "h" : ""}${entry.secure ? "s" : ""}${entry.session ? "x" : ""}|${entry.sameSite ?? ""}` + (SESSION_COOKIES.includes(entry.name) && entry.expires && entry.expires > 0 ? `|exp=${Math.round(entry.expires)}` : "")).sort();
}
/** Log entries are size-capped, so long lists go out in parts. */
function logJar(job, phase, jar) {
	for (let start = 0; start < Math.max(jar.length, 1); start += 25) {
		jobLog(job).info("account.switch.signOutJar", {
			phase,
			part: start / 25 + 1,
			count: jar.length,
			entries: jar.slice(start, start + 25)
		});
	}
}
/** Diagnostics: where the sign-in tab went after a cookie sign-out (host and path only), until sign-in is decided. */
let signInTrail;
function recordSignInHop(tabId, value) {
	if (!value || signInTrail?.tabId !== tabId || signInTrail.hops.length >= 20) return;
	try {
		const url = new URL(value);
		signInTrail.hops.push(`${url.host}${url.pathname}`);
	} catch {}
}
/** Sign-in went straight back to Seller Central, so Amazon still knows the old session: sign out properly. */
async function fallBackToSignOutPage(job, landedUrl) {
	const hops = signInTrail?.tabId === job.tabId ? signInTrail.hops : [];
	signInTrail = undefined;
	jobLog(job).warn("account.switch.cookieSignOutFallback", {
		...jobContext(job),
		landed: new URL(landedUrl).pathname,
		hops
	});
	try {
		logJar(job, "fallback", describeJar(await withTabDebugger(job.tabId, amazonCookies)));
	} catch (error) {
		jobLog(job).warn("account.switch.signOutJarFailed", { error: describeError(error) });
	}
	job.cookieSignOut = false;
	job.signOutFallbackFrom = landedUrl;
	logoutExits.delete(job.id);
	await setJobStage(job, "logout");
	await chrome.tabs.update(job.tabId, { url: LOGOUT_URL });
}
/**
* Sign-in is done once Amazon redirects back to Seller Central. Load the store once, where it
* belongs: in the user's own tab when one is open (closing the helper), else in the helper,
* which may already be on it.
*/
async function openStoreAfterSignIn(job, landedUrl, documentId) {
	if ((job.resumeStage ?? job.stage) === "store") return;
	signInTrail = undefined;
	const { store } = await getJobRecords(job);
	const helperTabId = job.tabId;
	const handedOff = await moveJobToUserTab(job);
	const onStore = !handedOff && isStorePage(landedUrl, store.storeUrl);
	// The document that was showing cannot also confirm a store navigation in the same tab.
	if (!onStore) job.storeNavigationDocumentId = documentId;
	delete job.cookieSignOut;
	await setJobStage(job, "store");
	if (!onStore) await chrome.tabs.update(job.tabId, { url: store.storeUrl });
	// Closing its only tab closes the helper window; the user's tab now carries the switch.
	if (handedOff) try {
		await chrome.tabs.remove(helperTabId);
	} catch {}
	jobLog(job).info("account.switch.signedIn", {
		...jobContext(job),
		tab: handedOff ? "user" : onStore ? "landed" : "helper"
	});
}
/** Amazon may append its own parameters; the store is open when its path and saved parameters match. */
function isStorePage(value, storeUrl) {
	if (!value) return false;
	try {
		const landed = new URL(value);
		const store = new URL(storeUrl);
		return landed.origin === store.origin && landed.pathname === store.pathname && [...store.searchParams].every(([key, expected]) => landed.searchParams.get(key) === expected);
	} catch {
		return false;
	}
}
const CREDENTIAL_STAGES = new Set([
	"email",
	"password",
	"otp"
]);
async function handleAccountTabUpdatedNow(tabId, changeInfo, tab) {
	const job = await getActiveJob();
	if (!job || job.tabId !== tabId) return;
	if (job.stage === "logout") {
		// Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
		if (isLogoutExitEvent(changeInfo, tab)) await advanceLogoutToSignIn(job);
		return;
	}
	const landed = landedSellerCentralPage(changeInfo, tab);
	if (!landed) return;
	if (job.stage === "signin" && job.cookieSignOut) await fallBackToSignOutPage(job, landed);
	else if (CREDENTIAL_STAGES.has(job.stage)) await openStoreAfterSignIn(job, landed);
}
/** A committed Seller Central page outside sign-in and sign-out. */
function landedSellerCentralPage(changeInfo, tab) {
	const value = changeInfo.url ?? (changeInfo.status === "complete" ? tab.url : undefined);
	if (!value) return undefined;
	try {
		const url = new URL(value);
		if (url.origin !== "https://sellercentral.amazon.com" || url.pathname.startsWith("/ap/") || url.pathname.startsWith("/sign-out")) return undefined;
		return value;
	} catch {
		return undefined;
	}
}
/**
* Sign-out has finished once its redirect commits an /ap/ page: leave right then instead of loading
* Amazon's logout re-auth page. A /sign-out document itself is left once it has loaded.
*/
function isLogoutExitEvent(changeInfo, tab) {
	if (changeInfo.status !== "complete" && changeInfo.status !== "loading" && !changeInfo.url) return false;
	const currentUrl = changeInfo.url ?? tab.url;
	if (!currentUrl || currentUrl === "about:blank") return false;
	let url;
	try {
		url = new URL(currentUrl);
	} catch {
		return false;
	}
	if (url.hostname !== "sellercentral.amazon.com") return false;
	if (url.pathname.startsWith("/ap/")) return true;
	return url.pathname.startsWith("/sign-out") && changeInfo.status === "complete";
}
export async function handleAccountTabUpdated(tabId, changeInfo, tab) {
	if (!isLogoutExitEvent(changeInfo, tab) && !landedSellerCentralPage(changeInfo, tab)) return;
	const generation = vaultGeneration;
	const switchVersion = switchGeneration;
	try {
		await queueVaultOperation(() => handleAccountTabUpdatedNow(tabId, changeInfo, tab));
	} catch (error) {
		if (generation === vaultGeneration && switchVersion === switchGeneration) throw error;
	}
}
/** Only extension pages (popup, options) may read or clear the diagnostics log. */
function isExtensionPage(sender) {
	return [
		"options.html",
		"popup.html",
		"timeout.html",
		"results.html"
	].some((page) => isPageSender(sender, page));
}
export function handleLogMessage(type, message, sender, store, sendResponse) {
	if (type === LOG_ENTRIES_MESSAGE) {
		const tab = sender.tab?.id;
		const entries = sanitizeLogEntries(message.entries).map((entry) => {
			const run = entry.run ?? reportRunForTab(tab);
			return {
				...entry,
				tab,
				...run ? { run } : {}
			};
		});
		store.append(entries);
		sendResponse({ ok: true });
		return undefined;
	}
	if (type !== LOGS_GET_MESSAGE && type !== LOGS_CLEAR_MESSAGE) return undefined;
	if (!isExtensionPage(sender)) {
		sendResponse({
			ok: false,
			error: "Logs are only available to extension pages."
		});
		return undefined;
	}
	const request = type === LOGS_GET_MESSAGE ? store.read().then((entries) => ({
		ok: true,
		entries
	})) : store.clear().then(() => ({ ok: true }));
	void request.then(sendResponse, (error) => sendResponse({
		ok: false,
		error: errorMessage(error, "Couldn’t read logs.")
	}));
	return true;
}
/** Resolves a message handler's promise into sendResponse. Handlers that log their own failures pass logged. */
function respond(type, request, sendResponse, fallbackError, logged = false) {
	void request.then(sendResponse, (error) => {
		if (!logged) log.warn("message.failed", {
			type,
			error: describeError(error)
		});
		sendResponse({
			ok: false,
			error: errorMessage(error, fallbackError)
		});
	});
	return true;
}
const idsListener = createOpenIdsMessageListener();
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
	const logStore = createLogStore(chrome.storage.local);
	setLogSink((entry) => logStore.append([entry]));
	chrome.runtime.onInstalled?.addListener(({ reason, previousVersion }) => {
		log.info("extension.installed", {
			reason,
			version: chrome.runtime.getManifest().version,
			previousVersion
		});
	});
	const storageReady = Promise.all([chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }), chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" })]);
	void storageReady.catch(() => log.error("storage.restrictionFailed"));
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (!isOwnSender(sender)) {
			sendResponse({
				ok: false,
				error: "Unauthorized extension message."
			});
			return undefined;
		}
		const handled = idsListener(message, sender, sendResponse);
		if (handled) return true;
		if (!message || typeof message !== "object" || !("type" in message)) return undefined;
		const record = message;
		const type = String(record.type);
		if (type === LOG_ENTRIES_MESSAGE || type === LOGS_GET_MESSAGE || type === LOGS_CLEAR_MESSAGE) {
			return handleLogMessage(type, record, sender, logStore, sendResponse);
		}
		if (type === "GET_SETTINGS") {
			return respond(type, storageReady.then(loadSettings).then((settings) => ({
				ok: true,
				settings: isExtensionPage(sender) ? settings : { features: settings.features }
			})), sendResponse, "Couldn’t load settings.");
		}
		if (type.startsWith("RESULTS_") || type === "REPORTS_PREPARE" || type === "SCRAPE_CASES" || isReportFetchType(type)) {
			return respond(type, storageReady.then(() => handleResultsMessage(record, sender)), sendResponse, "Couldn’t complete this Results action.");
		}
		if (type === "REPORTS_PROGRESS") {
			void storageReady.then(() => relayAuthorizedReportProgress(record, sender)).then(sendResponse, () => sendResponse({ ok: true }));
			return true;
		}
		if (type === "SELLER_CENTRAL_SESSION") {
			return respond(type, storageReady.then(() => checkSellerCentralSession(sender.tab)).then((session) => ({
				ok: true,
				session
			})), sendResponse, "Couldn’t check Seller Central.");
		}
		if (type === "SELLER_CENTRAL_OPEN") {
			return respond(type, focusOrOpenSellerCentralTab(sender.tab), sendResponse, "Couldn’t open Seller Central.");
		}
		if (!type.startsWith("ACCOUNT")) return undefined;
		return respond(type, storageReady.then(() => handleAccountsMessage(record, sender)), sendResponse, "Account operation failed.");
	});
	// The user can end the session from Chrome's debugging bar; the next click reattaches.
	chrome.debugger?.onDetach?.addListener((source) => {
		if (source.tabId === debuggerTabId) debuggerTabId = undefined;
	});
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		recordSignInHop(tabId, changeInfo.url);
		if (changeInfo.status === "loading" || changeInfo.url) void revokeResultsForTab(tabId);
		void handleAccountTabUpdated(tabId, changeInfo, tab).catch(() => log.warn("account.switch.navigationFailed"));
	});
	chrome.tabs.onRemoved.addListener((tabId) => {
		void revokeResultsForTab(tabId, true);
		void queueVaultOperation(async () => {
			const stored = await chrome.storage.session.get(UNLOCK_RESUME_KEY);
			const pending = stored[UNLOCK_RESUME_KEY];
			if (pending && (pending.sourceTabId === tabId || pending.accountsTabId === tabId)) await chrome.storage.session.remove(UNLOCK_RESUME_KEY);
			if ((await getSwitchNotice())?.tabId === tabId) await chrome.storage.session.remove(SWITCH_NOTICE_KEY);
			const job = await getActiveJob();
			if (job?.tabId !== tabId) return;
			jobLog(job).warn("account.switch.tabClosed", jobContext(job));
			await setActiveJob(undefined);
		}).catch(() => undefined);
	});
}
