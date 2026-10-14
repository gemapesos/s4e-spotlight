import { ACTIVE_JOB_STORAGE_KEY, CURRENT_STORE_KEY, SESSION_KEY_STORAGE_KEY, STORE_INDEX_KEY, VAULT_STORAGE_KEY, decryptVault, decryptVaultWithKey, deserializeKey, emptyVault, encryptVault, encryptVaultWithKey, generateTotp, parseOtpAuthUri, publicStoreIndex, serializeKey, validateStoreUrl } from "./lib/accounts.js";
import { DEFAULT_TIME_OUT_FORM_VALUES, loadSettings, TIME_OUT_FORM_BASE_URL, TIME_OUT_FORM_ENTRY_IDS } from "./lib/settings.js";
const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=";
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/";
const SKU_URL = "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm=";
const SKU_URL_SUFFIX = "&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx";
export const TIME_OUT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1E7gfUVzy47vboZHOJ6xd8Jwx-1N6oewaVggrtI7G4yw/edit?gid=0#gid=0";
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx";
export const SIGN_IN_URL = "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_sw_signup_us&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0";
export const SELLER_CENTRAL_HOME_URL = "https://sellercentral.amazon.com/";
export const SELLER_CENTRAL_TAB_URL_PATTERN = "https://sellercentral.amazon.com/*";
const MAX_BULK_IDS = 50;
const ACTIVE_JOB_TTL_MS = 15 * 60 * 1e3;
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
export function normalizeCaseIds(value) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string" && /^\d{11}$/u.test(id)))] : [];
}
export function normalizeShipmentIds(value) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string").map((id) => id.toUpperCase()).filter((id) => /^FBA[A-Z0-9]{9}$/u.test(id)))] : [];
}
export function normalizeSkuIds(value) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string").map((id) => id.trim()).filter((id) => id.length > 0 && id.length <= 40))] : [];
}
export function buildCaseUrl(id) {
	return `${CASE_URL}${id}`;
}
export function buildShipmentUrl(id) {
	return `${SHIPMENT_URL}${id}/contents`;
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
	const reason = cause instanceof Error ? cause.message : "Chrome could not create a tab.";
	const suffix = openedIds.length ? ` ${openedIds.length} tab(s) could not be closed: ${openedIds.join(", ")}.` : " Any tabs opened by this attempt were closed.";
	return new TabBatchError(`${reason}${suffix}`, openedIds, rolledBackIds);
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
async function createBackgroundTabs(ids, senderTab, buildUrl, createTab, removeTabs) {
	if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.");
	if (ids.length > MAX_BULK_IDS) throw new Error(`Open no more than ${MAX_BULK_IDS} IDs at a time.`);
	return createTabsInParallel(ids.map((id) => ({
		id,
		active: ids.length === 1,
		url: buildUrl(id)
	})), senderTab, createTab, removeTabs);
}
export async function openCaseTabs(ids, senderTab, createTab = (properties) => chrome.tabs.create(properties), removeTabs = (tabIds) => chrome.tabs.remove(tabIds)) {
	const normalized = normalizeCaseIds(ids);
	if (!normalized.length) throw new Error("No valid Case IDs were provided.");
	return createBackgroundTabs(normalized, senderTab, buildCaseUrl, createTab, removeTabs);
}
export async function openShipmentTabs(ids, senderTab, createTab = (properties) => chrome.tabs.create(properties), removeTabs = (tabIds) => chrome.tabs.remove(tabIds)) {
	const normalized = normalizeShipmentIds(ids);
	if (!normalized.length) throw new Error("No valid Shipment IDs were provided.");
	return createBackgroundTabs(normalized, senderTab, buildShipmentUrl, createTab, removeTabs);
}
export async function openSkuTabs(ids, senderTab, createTab = (properties) => chrome.tabs.create(properties), removeTabs = (tabIds) => chrome.tabs.remove(tabIds)) {
	const normalized = normalizeSkuIds(ids);
	if (!normalized.length) throw new Error("No valid SKUs were provided.");
	return createBackgroundTabs(normalized, senderTab, buildSkuUrl, createTab, removeTabs);
}
export async function openTimeOutTabs(senderTab, createTab = (properties) => chrome.tabs.create(properties), removeTabs = (tabIds) => chrome.tabs.remove(tabIds), date = new Date(), loadFormValues = async () => (await loadSettings()).timeOutForm) {
	if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.");
	const values = await loadFormValues();
	return createTabsInParallel([{
		id: "Google Sheet",
		active: false,
		url: TIME_OUT_SHEET_URL
	}, {
		id: "Google Form",
		active: true,
		url: buildTimeOutFormUrl(date, values)
	}], senderTab, createTab, removeTabs);
}
export function createOpenIdsMessageListener(openCases = openCaseTabs, openShipments = openShipmentTabs, openSkus = openSkuTabs, openTimeOut = openTimeOutTabs) {
	return (message, sender, sendResponse) => {
		if (!message || typeof message !== "object" || !("type" in message)) return undefined;
		const record = message;
		if (record.type === "OPEN_TIME_OUT") {
			void openTimeOut(sender.tab).then((result) => sendResponse({
				ok: true,
				openedCount: result.openedCount
			}), (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t open Time Out.",
				...error instanceof TabBatchError ? {
					openedIds: error.openedIds,
					rolledBackIds: error.rolledBackIds
				} : {}
			}));
			return true;
		}
		const handler = record.type === "OPEN_CASE_IDS" ? openCases : record.type === "OPEN_SHIPMENT_IDS" ? openShipments : record.type === "OPEN_SKU_IDS" ? openSkus : null;
		if (!handler) return undefined;
		const ids = record.type === "OPEN_CASE_IDS" ? record.caseIds : record.type === "OPEN_SHIPMENT_IDS" ? record.shipmentIds : record.skuIds;
		void handler(ids, sender.tab).then((result) => sendResponse({
			ok: true,
			openedCount: result?.openedCount ?? 0
		}), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t open tabs.",
			...error instanceof TabBatchError ? {
				openedIds: error.openedIds,
				rolledBackIds: error.rolledBackIds
			} : {}
		}));
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
	return {
		vault: await decryptVaultWithKey(envelope, key),
		envelope,
		key
	};
}
async function saveVault(vault, envelope, key) {
	validateVault(vault);
	const nextEnvelope = await encryptVaultWithKey(vault, key, Uint8Array.from(atob(envelope.salt), (c) => c.charCodeAt(0)), envelope.iterations);
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
	if (withId.length === 0) return undefined;
	const picked = [...withId].sort((a, b) => {
		const aPreferred = a.windowId === preferredWindowId ? 1 : 0;
		const bPreferred = b.windowId === preferredWindowId ? 1 : 0;
		if (aPreferred !== bPreferred) return bPreferred - aPreferred;
		return (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0);
	})[0];
	// #region agent log
	fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "f8f494"
		},
		body: JSON.stringify({
			sessionId: "f8f494",
			runId: "pre-fix",
			hypothesisId: "B",
			location: "background.ts:pickSellerCentralTab",
			message: "picked Seller Central tab",
			data: {
				preferredWindowId: preferredWindowId ?? null,
				candidateCount: withId.length,
				candidates: withId.map((tab) => ({
					id: tab.id,
					windowId: tab.windowId,
					lastAccessed: tab.lastAccessed ?? null,
					url: typeof tab.url === "string" ? tab.url.slice(0, 120) : null,
					active: tab.active
				})),
				pickedId: picked?.id ?? null,
				pickedUrl: typeof picked?.url === "string" ? picked.url.slice(0, 120) : null
			},
			timestamp: Date.now()
		})
	}).catch(() => {});
	// #endregion
	return picked;
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
async function sendUnfulfillableFetch(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_FETCH_UNFULFILLABLE" });
			if (response?.ok) {
				return {
					ok: true,
					listings: Array.isArray(response.listings) ? response.listings : []
				};
			}
			throw new Error(response?.error ?? "Couldn’t load unfulfillable inventory.");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!/Receiving end does not exist/i.test(message)) throw error instanceof Error ? error : new Error(message);
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	throw new Error(lastError ?? "Couldn’t load unfulfillable inventory.");
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
export async function fetchUnfulfillableReport(senderTab) {
	rememberReportProgressTab(senderTab?.id);
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	return sendUnfulfillableFetch(tabId);
}
async function sendFeedbackFetch(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_FETCH_FEEDBACK" });
			if (response?.ok) {
				return {
					ok: true,
					feedbacks: Array.isArray(response.feedbacks) ? response.feedbacks : []
				};
			}
			throw new Error(response?.error ?? "Couldn’t load seller feedback.");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!/Receiving end does not exist/i.test(message)) throw error instanceof Error ? error : new Error(message);
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	throw new Error(lastError ?? "Couldn’t load seller feedback.");
}
export async function fetchFeedbackReport(senderTab) {
	rememberReportProgressTab(senderTab?.id);
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	return sendFeedbackFetch(tabId);
}
async function sendStrandedFetch(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_FETCH_STRANDED" });
			if (response?.ok) {
				return {
					ok: true,
					listings: Array.isArray(response.listings) ? response.listings : []
				};
			}
			throw new Error(response?.error ?? "Couldn’t load stranded inventory.");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!/Receiving end does not exist/i.test(message)) throw error instanceof Error ? error : new Error(message);
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	throw new Error(lastError ?? "Couldn’t load stranded inventory.");
}
export async function fetchStrandedReport(senderTab) {
	rememberReportProgressTab(senderTab?.id);
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	return sendStrandedFetch(tabId);
}
async function sendSuppressedFetch(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_FETCH_SUPPRESSED" });
			if (response?.ok) {
				return {
					ok: true,
					listings: Array.isArray(response.listings) ? response.listings : []
				};
			}
			throw new Error(response?.error ?? "Couldn’t load search-suppressed inventory.");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!/Receiving end does not exist/i.test(message)) throw error instanceof Error ? error : new Error(message);
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	throw new Error(lastError ?? "Couldn’t load search-suppressed inventory.");
}
export async function fetchSuppressedReport(senderTab) {
	rememberReportProgressTab(senderTab?.id);
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	return sendSuppressedFetch(tabId);
}
async function sendShippingQueueFetch(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let lastError;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_FETCH_SHIPPING_QUEUE" });
			if (response?.ok) {
				return {
					ok: true,
					shipments: Array.isArray(response.shipments) ? response.shipments : []
				};
			}
			throw new Error(response?.error ?? "Couldn’t load shipping queue.");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (!/Receiving end does not exist/i.test(message)) {
				console.error("[ShippingQueue Background] Fetch failed:", error);
				throw error instanceof Error ? error : new Error(message);
			}
			lastError = message;
		}
		await sleep(SESSION_PROBE_INTERVAL_MS);
	}
	console.error("[ShippingQueue Background] Timed out waiting for content script:", lastError);
	throw new Error(lastError ?? "Couldn’t load shipping queue.");
}
export async function fetchShippingQueueReport(senderTab) {
	rememberReportProgressTab(senderTab?.id);
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	return sendShippingQueueFetch(tabId);
}
export async function probeSellerCentralSession(tabId) {
	const deadline = Date.now() + SESSION_PROBE_TIMEOUT_MS;
	let last;
	while (Date.now() < deadline) {
		try {
			const response = await chrome.tabs.sendMessage(tabId, { type: "REPORTS_SESSION_STATUS" });
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
	return last.loggedInToStore;
}
export async function prepareReports(senderTab) {
	const currentStoreId = await getCurrentStoreId();
	const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false });
	await waitForTabComplete(tabId);
	const tab = await chrome.tabs.get(tabId);
	const loggedInToStore = await probeSellerCentralSession(tabId);
	// #region agent log
	fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "f8f494"
		},
		body: JSON.stringify({
			sessionId: "f8f494",
			runId: "pre-fix",
			hypothesisId: "B",
			location: "background.ts:prepareReports",
			message: "reports prepare result",
			data: {
				currentStoreId: currentStoreId ?? null,
				senderTabId: senderTab?.id ?? null,
				sellerCentralTabId: tabId,
				tabUrl: typeof tab.url === "string" ? tab.url.slice(0, 160) : null,
				loggedInToStore,
				sameAsSender: senderTab?.id === tabId
			},
			timestamp: Date.now()
		})
	}).catch(() => {});
	// #endregion
	if (loggedInToStore) return {
		ok: true,
		loggedInToStore: true,
		sellerCentralTabId: tabId
	};
	if (senderTab?.id === tabId) return {
		ok: true,
		loggedInToStore: false,
		sellerCentralTabId: tabId
	};
	await chrome.tabs.update(tabId, { active: true });
	if (tab.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true });
	const opened = await chrome.tabs.sendMessage(tabId, {
		type: "OPEN_PALETTE",
		mode: "report-login"
	});
	if (!opened?.ok) throw new Error(opened?.error ?? "Couldn’t open the command palette on Seller Central.");
	return {
		ok: true,
		loggedInToStore: false,
		sellerCentralTabId: tabId,
		openedPromptOnSellerCentral: true
	};
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
async function getActiveJob() {
	const job = (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY];
	if (job && Date.now() - job.startedAt >= ACTIVE_JOB_TTL_MS) {
		await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY);
		return undefined;
	}
	return job;
}
async function setActiveJob(job) {
	if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job });
	else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY);
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
	const hostname = sender.url ? new URL(sender.url).hostname : "";
	if (hostname !== "sellercentral.amazon.com") throw new Error("Unexpected login origin.");
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
export async function handleAccountsMessage(message, sender) {
	switch (message.type) {
		case "ACCOUNTS_STATUS": {
			const [envelope, key, stored] = await Promise.all([
				getEnvelope(),
				getSessionKey(),
				chrome.storage.local.get([STORE_INDEX_KEY, CURRENT_STORE_KEY])
			]);
			const stores = stored[STORE_INDEX_KEY] ?? [];
			const job = await getActiveJob();
			const activeStore = job ? stores.find((store) => store.id === job.storeId) : undefined;
			return {
				ok: true,
				initialized: Boolean(envelope),
				unlocked: Boolean(key),
				stores,
				currentStore: currentStoreFromIndex(stores, typeof stored[CURRENT_STORE_KEY] === "string" ? stored[CURRENT_STORE_KEY] : undefined),
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
			if (typeof message.masterPassword !== "string" || message.masterPassword.length < 10) throw new Error("Use a master password of at least 10 characters.");
			const { envelope, keyBytes } = await encryptVault(emptyVault(), message.masterPassword);
			await chrome.storage.local.set({
				[VAULT_STORAGE_KEY]: envelope,
				[STORE_INDEX_KEY]: []
			});
			await chrome.storage.local.remove(CURRENT_STORE_KEY);
			await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			return { ok: true };
		}
		case "ACCOUNTS_UNLOCK": {
			const envelope = await getEnvelope();
			if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.");
			try {
				const { keyBytes } = await decryptVault(envelope, message.masterPassword);
				await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			} catch {
				throw new Error("Incorrect master password or damaged vault.");
			}
			return { ok: true };
		}
		case "ACCOUNTS_LOCK":
			await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY]);
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
			return { ok: true };
		}
		case "ACCOUNTS_CHANGE_MASTER_PASSWORD": {
			const { vault } = await getUnlockedVault();
			if (typeof message.masterPassword !== "string" || message.masterPassword.length < 10) throw new Error("Use a master password of at least 10 characters.");
			const { envelope, keyBytes } = await encryptVault(vault, message.masterPassword);
			await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope });
			await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) });
			return { ok: true };
		}
		case "ACCOUNTS_RESET":
			await chrome.storage.local.remove([
				VAULT_STORAGE_KEY,
				STORE_INDEX_KEY,
				CURRENT_STORE_KEY
			]);
			await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY]);
			return { ok: true };
		case "ACCOUNTS_OPEN_OPTIONS":
			await chrome.runtime.openOptionsPage();
			return { ok: true };
		case "ACCOUNTS_START_SWITCH": {
			return serializeSwitchStart(async () => {
				if (await getActiveJob()) throw new Error("Another account switch is already running.");
				const { vault } = await getUnlockedVault();
				const store = vault.stores.find(({ id }) => id === message.storeId);
				if (!store) throw new Error("The selected store was not found.");
				const currentStoreId = await getCurrentStoreId();
				const currentStore = currentStoreId ? vault.stores.find(({ id }) => id === currentStoreId) : undefined;
				const sameCredential = Boolean(currentStore && currentStore.credentialId === store.credentialId);
				// #region agent log
				fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Debug-Session-Id": "f8f494"
					},
					body: JSON.stringify({
						sessionId: "f8f494",
						runId: "pre-fix",
						hypothesisId: "D",
						location: "background.ts:ACCOUNTS_START_SWITCH",
						message: "account switch started",
						data: {
							targetStoreId: store.id,
							targetStoreName: store.name,
							currentStoreId: currentStoreId ?? null,
							sameCredential,
							path: sameCredential ? "navigate-only" : "logout-login",
							senderTabId: sender.tab?.id ?? null,
							senderUrl: typeof sender.tab?.url === "string" ? sender.tab.url.slice(0, 120) : null
						},
						timestamp: Date.now()
					})
				}).catch(() => {});
				// #endregion
				if (sameCredential) {
					await openStoreUrl(store.storeUrl, sender.tab);
					await setCurrentStoreId(store.id);
					return { ok: true };
				}
				let tabId;
				let ownsTab = false;
				try {
					const tabs = await chrome.tabs.query({ url: SELLER_CENTRAL_TAB_URL_PATTERN });
					const existing = pickSellerCentralTab(tabs, sender.tab?.windowId);
					if (existing?.id !== undefined) {
						tabId = existing.id;
						ownsTab = false;
						const job = {
							id: crypto.randomUUID(),
							tabId: existing.id,
							storeId: store.id,
							stage: "logout",
							startedAt: Date.now(),
							ownsTab: false
						};
						await setActiveJob(job);
						await chrome.tabs.update(existing.id, { url: LOGOUT_URL });
						void activateLoadedTab(existing.id);
						return {
							ok: true,
							jobId: job.id
						};
					}
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
					ownsTab = true;
					const job = {
						id: crypto.randomUUID(),
						tabId: tab.id,
						storeId: store.id,
						stage: "logout",
						startedAt: Date.now(),
						ownsTab: true
					};
					await setActiveJob(job);
					await chrome.tabs.update(tab.id, { url: LOGOUT_URL });
					void activateLoadedTab(tab.id);
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
			});
		}
		case "ACCOUNTS_FOCUS_CURRENT_STORE": {
			if (!await getCurrentStoreId()) throw new Error("No store is currently selected.");
			return focusOrOpenSellerCentralTab(sender.tab);
		}
		case "ACCOUNTS_FOCUS_SWITCH": {
			const job = await getActiveJob();
			if (!job || job.tabId < 0) throw new Error("No account switch is running.");
			await chrome.tabs.update(job.tabId, { active: true });
			return { ok: true };
		}
		case "ACCOUNTS_CANCEL_SWITCH": {
			const job = await getActiveJob();
			if (!job) return { ok: true };
			await setActiveJob(undefined);
			if (job.ownsTab && job.tabId >= 0) try {
				await chrome.tabs.remove(job.tabId);
			} catch {}
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_GET_JOB": {
			const job = await getActiveJob();
			if (!job || sender.tab?.id !== job.tabId) return {
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
			const { credential } = await getJobRecords(job);
			if (message.kind === "email") {
				job.stage = "email";
				await setActiveJob(job);
				return {
					ok: true,
					value: credential.domain
				};
			}
			if (message.kind === "password") {
				job.stage = "password";
				await setActiveJob(job);
				return {
					ok: true,
					value: credential.password
				};
			}
			if (message.kind === "otp") {
				const parsed = parseOtpAuthUri(credential.otpAuthUri);
				const remaining = parsed.period - Math.floor(Date.now() / 1e3) % parsed.period;
				if (remaining <= 5) return {
					ok: true,
					waitMs: (remaining + 1) * 1e3
				};
				job.stage = "otp";
				await setActiveJob(job);
				return {
					ok: true,
					value: await generateTotp(credential.otpAuthUri)
				};
			}
			throw new Error("Unknown credential stage.");
		}
		case "ACCOUNT_AUTOMATION_CLICK": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) throw new Error("Unsupported login click action.");
			const { x, y } = message;
			if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) throw new Error("Invalid login click coordinates.");
			await withJobDebugger(job, async (target) => {
				await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
					type: "mouseMoved",
					x,
					y
				});
				await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
					type: "mousePressed",
					x,
					y,
					button: "left",
					clickCount: 1
				});
				await chrome.debugger.sendCommand(target, "Input.dispatchMouseEvent", {
					type: "mouseReleased",
					x,
					y,
					button: "left",
					clickCount: 1
				});
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_PAUSED": {
			const job = await assertWorkflowSender(sender, message.jobId);
			job.stage = "paused";
			await setActiveJob(job);
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
			// #region agent log
			fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Debug-Session-Id": "f8f494"
				},
				body: JSON.stringify({
					sessionId: "f8f494",
					runId: "pre-fix",
					hypothesisId: "A",
					location: "background.ts:ACCOUNT_AUTOMATION_COMPLETE",
					message: "automation complete accepted",
					data: {
						jobStage: job.stage,
						storeId: store.id,
						storeName: store.name,
						senderPath: sender.url ? (() => {
							try {
								return new URL(sender.url).pathname;
							} catch {
								return null;
							}
						})() : null,
						storeUrlHost: (() => {
							try {
								return new URL(store.storeUrl).hostname;
							} catch {
								return null;
							}
						})()
					},
					timestamp: Date.now()
				})
			}).catch(() => {});
			// #endregion
			job.stage = "authenticated";
			await setActiveJob(job);
			await chrome.tabs.update(job.tabId, {
				active: true,
				url: store.storeUrl
			});
			await setCurrentStoreId(store.id);
			await setActiveJob(undefined);
			void restorePageFocus(job.tabId);
			void closeDuplicateSellerCentralTabs(job.tabId);
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_ERROR": {
			await assertWorkflowSender(sender, message.jobId);
			await setActiveJob(undefined);
			return { ok: true };
		}
		default: throw new Error("Unknown account command.");
	}
}
async function advanceLogoutToSignIn(job) {
	job.stage = "signin";
	await setActiveJob(job);
	await chrome.tabs.update(job.tabId, { url: SIGN_IN_URL });
}
export async function handleAccountTabUpdated(tabId, changeInfo, tab) {
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
	const pathOk = url.pathname.startsWith("/ap/") || url.pathname.startsWith("/sign-out");
	// #region agent log
	fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-Debug-Session-Id": "f8f494"
		},
		body: JSON.stringify({
			sessionId: "f8f494",
			runId: "pre-fix",
			hypothesisId: "C",
			location: "background.ts:handleAccountTabUpdated",
			message: "logout tab complete",
			data: {
				tabId,
				stage: job.stage,
				pathname: url.pathname,
				pathOk,
				willAdvance: pathOk
			},
			timestamp: Date.now()
		})
	}).catch(() => {});
	// #endregion
	if (!pathOk) return;
	// Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
	await advanceLogoutToSignIn(job);
}
const idsListener = createOpenIdsMessageListener();
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
	void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
	void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		const handled = idsListener(message, sender, sendResponse);
		if (handled) return true;
		if (!message || typeof message !== "object" || !("type" in message)) return undefined;
		const type = String(message.type);
		if (type === "GET_SETTINGS") {
			void loadSettings().then((settings) => sendResponse({
				ok: true,
				settings
			}), (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load settings."
			}));
			return true;
		}
		if (type === "REPORTS_PREPARE") {
			void prepareReports(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t open Seller Central."
			}));
			return true;
		}
		if (type === "REPORTS_FETCH_UNFULFILLABLE") {
			void fetchUnfulfillableReport(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load unfulfillable inventory."
			}));
			return true;
		}
		if (type === "REPORTS_FETCH_FEEDBACK") {
			void fetchFeedbackReport(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load seller feedback."
			}));
			return true;
		}
		if (type === "REPORTS_FETCH_STRANDED") {
			void fetchStrandedReport(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load stranded inventory."
			}));
			return true;
		}
		if (type === "REPORTS_FETCH_SUPPRESSED") {
			void fetchSuppressedReport(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load search-suppressed inventory."
			}));
			return true;
		}
		if (type === "REPORTS_FETCH_SHIPPING_QUEUE") {
			void fetchShippingQueueReport(sender.tab).then(sendResponse, (error) => sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load shipping queue."
			}));
			return true;
		}
		if (type === "REPORTS_PROGRESS") {
			void relayReportProgress(message).then(sendResponse, () => sendResponse({ ok: true }));
			return true;
		}
		if (!type.startsWith("ACCOUNT")) return undefined;
		void handleAccountsMessage(message, sender).then(sendResponse, (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Account operation failed."
		}));
		return true;
	});
	chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
		void handleAccountTabUpdated(tabId, changeInfo, tab);
	});
	chrome.tabs.onRemoved.addListener((tabId) => {
		void getActiveJob().then((job) => job?.tabId === tabId ? setActiveJob(undefined) : undefined);
	});
}
