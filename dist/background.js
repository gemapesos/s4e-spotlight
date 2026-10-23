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
export const SIGN_IN_URL = `https://sellercentral.amazon.com/ap/signin?${new URLSearchParams({
	"openid.return_to": "https://sellercentral.amazon.com/",
	"openid.identity": `${OPENID_SPEC}/identifier_select`,
	"openid.assoc_handle": "amzn_sw_signup_us",
	"openid.mode": "checkid_setup",
	"openid.claimed_id": `${OPENID_SPEC}/identifier_select`,
	"openid.ns": OPENID_SPEC
})}`;
export const SELLER_CENTRAL_HOME_URL = "https://sellercentral.amazon.com/";
export const SELLER_CENTRAL_TAB_URL_PATTERN = "https://sellercentral.amazon.com/*";
const MAX_BULK_IDS = 50;
const ACTIVE_JOB_TTL_MS = 15 * 60 * 1e3;
const UNLOCK_ATTEMPTS_KEY = "accountsUnlockAttempts";
const UNLOCK_RESUME_KEY = "accountsUnlockResume";
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
let vaultOperations = Promise.resolve();
let vaultGeneration = 0;
let operationGeneration = 0;
function assertVaultOperationCurrent() {
	if (operationGeneration !== vaultGeneration) throw new Error("The vault changed while this operation was running. Please try again.");
}
function queueVaultOperation(action) {
	const generation = vaultGeneration;
	const result = vaultOperations.catch(() => undefined).then(async () => {
		operationGeneration = generation;
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
	if (!sender.documentId || sender.frameId !== 0 || typeof storeId !== "string") throw new Error("Open unlock from the store picker.");
	const stored = await chrome.storage.local.get(STORE_INDEX_KEY);
	const stores = stored[STORE_INDEX_KEY] ?? [];
	if (!stores.some((store) => store.id === storeId)) throw new Error("The selected store no longer exists.");
	const id = crypto.randomUUID();
	const tab = await chrome.tabs.create({
		active: true,
		windowId: source.windowId,
		openerTabId: source.id,
		url: "about:blank"
	});
	if (tab.id === undefined) throw new Error("Chrome could not open Accounts.");
	assertVaultOperationCurrent();
	const pending = {
		id,
		storeId,
		sourceTabId: source.id,
		sourceDocumentId: sender.documentId,
		accountsTabId: tab.id,
		startedAt: Date.now()
	};
	await chrome.storage.session.set({ [UNLOCK_RESUME_KEY]: pending });
	// Commit the handoff before Accounts can load and try to consume it.
	assertVaultOperationCurrent();
	await chrome.tabs.update(tab.id, { url: `${chrome.runtime.getURL("options.html")}?resume=${encodeURIComponent(id)}` });
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
	return result.ok ? {
		...result,
		resumed: true
	} : result;
}
/** Serialize key/vault changes; Lock invalidates work immediately and completes after prior commits. */
export async function handleAccountsMessage(message, sender) {
	if (!isOwnSender(sender)) throw new Error("Unauthorized extension message.");
	const type = String(message.type);
	if (VAULT_ADMIN_TYPES.has(type) && !isPageSender(sender, "options.html")) {
		throw new Error("This vault operation is only available on the Accounts page.");
	}
	if (type === "ACCOUNTS_LOCK" && !isPageSender(sender, "options.html") && !isPageSender(sender, "popup.html")) {
		throw new Error("Lock accounts from an extension page.");
	}
	if (type === "ACCOUNTS_STATUS" || type === "ACCOUNT_AUTOMATION_GET_JOB" || type === "ACCOUNTS_OPEN_OPTIONS") {
		return handleAccountsMessageNow(message, sender);
	}
	if (type === "ACCOUNTS_LOCK" || type === "ACCOUNTS_RESET" || type === "ACCOUNTS_CHANGE_MASTER_PASSWORD") vaultGeneration += 1;
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
		const mode = message.mode === "cases" ? "cases" : "reports";
		const caseIds = normalizeCaseIds(message.caseIds);
		if (mode === "cases" && (caseIds.length === 0 || caseIds.length > MAX_BULK_IDS)) throw new Error("Choose between 1 and 50 case IDs.");
		const launchId = crypto.randomUUID();
		const tab = await chrome.tabs.create({
			active: true,
			openerTabId: source.id,
			windowId: source.windowId,
			url: "about:blank"
		});
		if (tab.id === undefined) throw new Error("Chrome could not open Results.");
		await chrome.storage.session.set({ [`${RESULTS_LAUNCH_PREFIX}${launchId}`]: {
			tabId: tab.id,
			mode,
			caseIds,
			startedAt: Date.now()
		} });
		// Initial navigation must not race RESULTS_INIT or revoke the launch handoff.
		await chrome.tabs.update(tab.id, { url: `${chrome.runtime.getURL("results.html")}?launch=${launchId}` });
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
		if (!launch || launch.tabId !== sender.tab.id || Date.now() - launch.startedAt >= RESULTS_RUN_TTL_MS) throw new Error("This Results page has expired. Open it again from the palette.");
		return {
			ok: true,
			mode: launch.mode,
			caseIds: launch.caseIds
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
export async function probeSellerCentralSession(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let last;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_SESSION_STATUS" }, { frameId: 0 });
			if (response?.ok && typeof response.loggedInToStore === "boolean") {
				last = {
					loggedInToStore: response.loggedInToStore,
					settled: Boolean(response.settled)
				};
				if (last.settled) return last.loggedInToStore;
			}
		} catch {}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	if (!last) throw new Error("Couldn’t confirm the Seller Central session.");
	log.warn("report.sessionUnsettled", {
		tabId,
		loggedInToStore: last.loggedInToStore
	});
	return last.loggedInToStore;
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
			mode: "report-login"
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
async function openStoreUrl(storeUrl, senderTab) {
	const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
	const tab = pickSellerCentralTab(tabs, senderTab?.windowId);
	if (tab?.id !== undefined) {
		await chrome.tabs.update(tab.id, {
			active: true,
			url: storeUrl
		});
		if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
		void restorePageFocus(tab.id);
		void closeDuplicateSellerCentralTabs(tab.id);
		return;
	}
	const created = await chrome.tabs.create({
		active: true,
		url: storeUrl,
		...senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }
	});
	if (created.id !== undefined) {
		void restorePageFocus(created.id);
		void closeDuplicateSellerCentralTabs(created.id);
	}
}
async function closeDuplicateSellerCentralTabs(keepTabId) {
	const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
	const toClose = tabs.map((tab) => tab.id).filter((id) => id !== undefined && id !== keepTabId);
	if (toClose.length === 0) return;
	try {
		await chrome.tabs.remove(toClose);
	} catch {}
}
/** Show a background-created tab once it renders a real page, so focus lands in the page. */
export async function activateLoadedTab(tabId) {
	try {
		await waitForTabComplete(tabId);
	} catch {}
	try {
		const tab = await chrome.tabs.get(tabId);
		await chrome.tabs.update(tabId, { active: true });
		if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
	} catch {}
}
/** Yank keyboard focus out of the omnibox after extension-driven navigations. */
export async function restorePageFocus(tabId) {
	try {
		if (typeof chrome.tabs?.get !== "function" || typeof chrome.tabs?.onUpdated?.addListener !== "function") {
			return;
		}
		await waitForTabComplete(tabId);
		const tab = await chrome.tabs.get(tabId);
		if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
		await chrome.tabs.update(tabId, { active: true });
	} catch {}
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
		return undefined;
	}
	return job;
}
async function setActiveJob(job) {
	assertVaultOperationCurrent();
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
async function withJobDebugger(job, action) {
	const target = { tabId: job.tabId };
	let attached = false;
	try {
		assertVaultOperationCurrent();
		const tab = await chrome.tabs.get(job.tabId);
		if (!tab.url || new URL(tab.url).origin !== "https://sellercentral.amazon.com" || !new URL(tab.url).pathname.startsWith("/ap/")) throw new Error("The login tab has navigated away.");
		await chrome.debugger.attach(target, "1.3");
		attached = true;
		return await action(target);
	} finally {
		if (attached) {
			try {
				await chrome.debugger.detach(target);
			} catch {}
		}
	}
}
function requireMasterPassword(value) {
	if (typeof value !== "string" || value.length < 10) throw new Error("Use a master password of at least 10 characters.");
	return value;
}
function requireSharePassword(value) {
	if (typeof value !== "string" || value.length < 10) throw new Error("Use a share password of at least 10 characters.");
	return value;
}
/** Starts a switch to a store on another credential: sign out in a Seller Central tab, then sign in. */
async function startSignInSwitch(store, sender) {
	const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
	const existingTabId = pickSellerCentralTab(tabs, sender.tab?.windowId)?.id;
	const ownsTab = existingTabId === undefined;
	let tabId = existingTabId;
	try {
		if (tabId === undefined) {
			// Opening a foreground tab on about:blank makes Chrome focus the omnibox and keep it
			// focused across the whole switch, so create it in the background and activate it
			// once it is showing a real page.
			const tab = await chrome.tabs.create({
				active: false,
				url: "about:blank",
				...sender.tab?.windowId === undefined ? {} : { windowId: sender.tab.windowId }
			});
			if (tab.id === undefined) throw new Error("Chrome did not create the login tab.");
			tabId = tab.id;
		}
		const job = {
			id: crypto.randomUUID(),
			tabId,
			storeId: store.id,
			storeName: store.name,
			stage: "logout",
			startedAt: Date.now(),
			ownsTab
		};
		await setActiveJob(job);
		await chrome.tabs.update(tabId, { url: LOGOUT_URL });
		void activateLoadedTab(tabId);
		jobLog(job).info("account.switch.start", {
			store: store.name,
			path: "sign-in",
			tab: ownsTab ? "new" : "reused"
		});
		return {
			ok: true,
			jobId: job.id
		};
	} catch (error) {
		if (ownsTab && tabId !== undefined) try {
			await chrome.tabs.remove(tabId);
		} catch {}
		await setActiveJob(undefined);
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
					startedAt: job.startedAt
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
		case "ACCOUNTS_LOCK":
			await chrome.storage.session.remove([
				SESSION_KEY_STORAGE_KEY,
				ACTIVE_JOB_STORAGE_KEY,
				UNLOCK_RESUME_KEY
			]);
			log.info("vault.lock");
			return { ok: true };
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
		case "ACCOUNTS_RESET":
			await chrome.storage.local.remove([
				VAULT_STORAGE_KEY,
				STORE_INDEX_KEY,
				CURRENT_STORE_KEY
			]);
			await chrome.storage.session.remove([
				SESSION_KEY_STORAGE_KEY,
				ACTIVE_JOB_STORAGE_KEY,
				UNLOCK_RESUME_KEY,
				UNLOCK_ATTEMPTS_KEY
			]);
			log.warn("vault.reset");
			return { ok: true };
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
				if (currentStore && currentStore.credentialId === store.credentialId) {
					await openStoreUrl(store.storeUrl, sender.tab);
					await setCurrentStoreId(store.id);
					log.info("account.switch.start", {
						store: store.name,
						path: "same-credential"
					});
					return { ok: true };
				}
				return startSignInSwitch(store, sender);
			});
		}
		case "ACCOUNTS_FOCUS_CURRENT_STORE": {
			if (!await getCurrentStoreId()) throw new Error("No store is currently selected.");
			return focusOrOpenSellerCentralTab(sender.tab);
		}
		case "ACCOUNTS_FOCUS_SWITCH": {
			const job = await getActiveJob();
			if (!job || job.tabId < 0) throw new Error("No account switch is running.");
			const tab = await chrome.tabs.update(job.tabId, { active: true });
			if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
			return { ok: true };
		}
		case "ACCOUNTS_CANCEL_SWITCH": {
			const job = await getActiveJob();
			if (!job) return { ok: true };
			await setActiveJob(undefined);
			if (job.ownsTab && job.tabId >= 0) try {
				await chrome.tabs.remove(job.tabId);
			} catch {}
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
					stage: job.stage
				}
			};
		}
		case "ACCOUNT_AUTOMATION_SECRET": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (!sender.url || !new URL(sender.url).pathname.startsWith("/ap/")) throw new Error("Credentials are only available on an Amazon sign-in page.");
			if (job.stage === "logout" || job.stage === "authenticated" || new URL(sender.url).searchParams.get("openid.return_to")?.includes("/sign-out")) {
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
				const parsed = parseOtpAuthUri(credential.otpAuthUri);
				const remaining = parsed.period - Math.floor(Date.now() / 1e3) % parsed.period;
				if (remaining <= 5) {
					jobLog(job).info("account.switch.otpWait", { waitMs: (remaining + 1) * 1e3 });
					return {
						ok: true,
						waitMs: (remaining + 1) * 1e3
					};
				}
				await setJobStage(job, "otp");
				return {
					ok: true,
					value: await generateTotp(credential.otpAuthUri)
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
				const send = (type, extra = {}) => chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
					type,
					x,
					y,
					...extra
				});
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
			await setJobStage(job, "paused");
			jobLog(job).warn("account.switch.paused", {
				...jobContext(job),
				reason: "captcha"
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_LEAVE_LOGOUT": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (job.stage !== "logout") return { ok: true };
			await advanceLogoutToSignIn(job);
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_COMPLETE": {
			const job = await assertWorkflowSender(sender, message.jobId);
			const { store } = await getJobRecords(job);
			await setJobStage(job, "authenticated");
			await chrome.tabs.update(job.tabId, {
				active: true,
				url: store.storeUrl
			});
			await setCurrentStoreId(store.id);
			await setActiveJob(undefined);
			void restorePageFocus(job.tabId);
			void closeDuplicateSellerCentralTabs(job.tabId);
			jobLog(job).info("account.switch.complete", {
				store: store.name,
				ms: Date.now() - job.startedAt
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_ERROR": {
			const job = await assertWorkflowSender(sender, message.jobId);
			await setActiveJob(undefined);
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
			await setJobStage(job, "signin");
			await chrome.tabs.update(job.tabId, { url: SIGN_IN_URL });
		})();
		exit.catch(() => logoutExits.delete(job.id));
		logoutExits.set(job.id, exit);
	}
	return exit;
}
async function handleAccountTabUpdatedNow(tabId, changeInfo, tab) {
	if (changeInfo.status !== "complete") return;
	const job = await getActiveJob();
	if (!job || job.tabId !== tabId || job.stage !== "logout") return;
	const currentUrl = changeInfo.url ?? tab.url;
	if (!currentUrl || currentUrl === "about:blank") return;
	let url;
	try {
		url = new URL(currentUrl);
	} catch {
		return;
	}
	if (url.hostname !== "sellercentral.amazon.com") return;
	if (!url.pathname.startsWith("/ap/") && !url.pathname.startsWith("/sign-out")) return;
	// Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
	await advanceLogoutToSignIn(job);
}
export async function handleAccountTabUpdated(tabId, changeInfo, tab) {
	if (changeInfo.status !== "complete") return;
	const generation = vaultGeneration;
	try {
		await queueVaultOperation(() => handleAccountTabUpdatedNow(tabId, changeInfo, tab));
	} catch (error) {
		if (generation === vaultGeneration) throw error;
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
		if (!type.startsWith("ACCOUNT")) return undefined;
		return respond(type, storageReady.then(() => handleAccountsMessage(record, sender)), sendResponse, "Account operation failed.");
	});
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		if (changeInfo.status === "loading" || changeInfo.url) void revokeResultsForTab(tabId);
		void handleAccountTabUpdated(tabId, changeInfo, tab).catch(() => log.warn("account.switch.navigationFailed"));
	});
	chrome.tabs.onRemoved.addListener((tabId) => {
		void revokeResultsForTab(tabId, true);
		void queueVaultOperation(async () => {
			const stored = await chrome.storage.session.get(UNLOCK_RESUME_KEY);
			const pending = stored[UNLOCK_RESUME_KEY];
			if (pending && (pending.sourceTabId === tabId || pending.accountsTabId === tabId)) await chrome.storage.session.remove(UNLOCK_RESUME_KEY);
			const job = await getActiveJob();
			if (job?.tabId !== tabId) return;
			jobLog(job).warn("account.switch.tabClosed", jobContext(job));
			await setActiveJob(undefined);
		}).catch(() => undefined);
	});
}
