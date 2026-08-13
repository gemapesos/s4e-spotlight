import { ACTIVE_JOB_STORAGE_KEY, SESSION_KEY_STORAGE_KEY, STORE_INDEX_KEY, VAULT_STORAGE_KEY, decryptVault, decryptVaultWithKey, deserializeKey, emptyVault, encryptVault, encryptVaultWithKey, generateTotp, parseOtpAuthUri, publicStoreIndex, serializeKey, validateStoreUrl } from "./lib/accounts.js";
const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=";
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/";
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx";
export const SIGN_IN_URL = "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_sw_signup_us&openid.mode=checkid_setup&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0";
export function normalizeCaseIds(value) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string" && /^\d{11}$/u.test(id)))] : [];
}
export function normalizeShipmentIds(value) {
	return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === "string").map((id) => id.toUpperCase()).filter((id) => /^FBA[A-Z0-9]{9}$/u.test(id)))] : [];
}
export function buildCaseUrl(id) {
	return `${CASE_URL}${id}`;
}
export function buildShipmentUrl(id) {
	return `${SHIPMENT_URL}${id}/contents`;
}
async function createBackgroundTabs(ids, senderTab, buildUrl, createTab) {
	if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.");
	for (const id of ids) await createTab({
		active: false,
		openerTabId: senderTab.id,
		url: buildUrl(id),
		windowId: senderTab.windowId
	});
}
export async function openCaseTabs(ids, senderTab, createTab = (properties) => chrome.tabs.create(properties)) {
	const normalized = normalizeCaseIds(ids);
	if (!normalized.length) throw new Error("No valid Case IDs were provided.");
	await createBackgroundTabs(normalized, senderTab, buildCaseUrl, createTab);
}
export async function openShipmentTabs(ids, senderTab, createTab = (properties) => chrome.tabs.create(properties)) {
	const normalized = normalizeShipmentIds(ids);
	if (!normalized.length) throw new Error("No valid Shipment IDs were provided.");
	await createBackgroundTabs(normalized, senderTab, buildShipmentUrl, createTab);
}
export function createOpenIdsMessageListener(openCases = openCaseTabs, openShipments = openShipmentTabs) {
	return (message, sender, sendResponse) => {
		if (!message || typeof message !== "object" || !("type" in message)) return undefined;
		const record = message;
		const handler = record.type === "OPEN_CASE_IDS" ? openCases : record.type === "OPEN_SHIPMENT_IDS" ? openShipments : null;
		if (!handler) return undefined;
		const ids = record.type === "OPEN_CASE_IDS" ? record.caseIds : record.shipmentIds;
		void handler(ids, sender.tab).then(() => sendResponse({ ok: true }), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t open tabs."
		}));
		return true;
	};
}
const AUTOMATION_CLICK_ACTIONS = new Set([
	"continue",
	"password-submit",
	"otp-submit",
	"passkey-cancel"
]);
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
}
async function getActiveJob() {
	return (await chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY))[ACTIVE_JOB_STORAGE_KEY];
}
async function setActiveJob(job) {
	if (job) await chrome.storage.session.set({ [ACTIVE_JOB_STORAGE_KEY]: job });
	else await chrome.storage.session.remove(ACTIVE_JOB_STORAGE_KEY);
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
			const [envelope, key, index] = await Promise.all([
				getEnvelope(),
				getSessionKey(),
				chrome.storage.local.get(STORE_INDEX_KEY)
			]);
			return {
				ok: true,
				initialized: Boolean(envelope),
				unlocked: Boolean(key),
				stores: index[STORE_INDEX_KEY] ?? []
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
			await chrome.storage.local.remove([VAULT_STORAGE_KEY, STORE_INDEX_KEY]);
			await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY]);
			return { ok: true };
		case "ACCOUNTS_OPEN_OPTIONS":
			await chrome.runtime.openOptionsPage();
			return { ok: true };
		case "ACCOUNTS_START_SWITCH": {
			if (await getActiveJob()) throw new Error("Another account switch is already running.");
			const { vault } = await getUnlockedVault();
			const store = vault.stores.find(({ id }) => id === message.storeId);
			if (!store) throw new Error("The selected store was not found.");
			const tab = await chrome.tabs.create({
				active: true,
				url: LOGOUT_URL
			});
			if (tab.id === undefined) throw new Error("Chrome did not create the login tab.");
			const job = {
				id: crypto.randomUUID(),
				tabId: tab.id,
				storeId: store.id,
				stage: "logout",
				startedAt: Date.now()
			};
			await setActiveJob(job);
			return {
				ok: true,
				jobId: job.id
			};
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
		case "ACCOUNT_AUTOMATION_ESCAPE": {
			const job = await assertWorkflowSender(sender, message.jobId);
			await withJobDebugger(job, async (target) => {
				await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
					type: "keyDown",
					key: "Escape",
					code: "Escape",
					windowsVirtualKeyCode: 27
				});
				await chrome.debugger.sendCommand(target, "Input.dispatchKeyEvent", {
					type: "keyUp",
					key: "Escape",
					code: "Escape",
					windowsVirtualKeyCode: 27
				});
			});
			return { ok: true };
		}
		case "ACCOUNT_AUTOMATION_CLICK": {
			const job = await assertWorkflowSender(sender, message.jobId);
			if (typeof message.action !== "string" || !AUTOMATION_CLICK_ACTIONS.has(message.action)) {
				throw new Error("Unsupported login click action.");
			}
			const x = message.x;
			const y = message.y;
			if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
				throw new Error("Invalid login click coordinates.");
			}
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
		case "ACCOUNT_AUTOMATION_COMPLETE": {
			const job = await assertWorkflowSender(sender, message.jobId);
			const { store } = await getJobRecords(job);
			job.stage = "authenticated";
			await setActiveJob(job);
			await chrome.tabs.update(job.tabId, { url: store.storeUrl });
			await setActiveJob(undefined);
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
const idsListener = createOpenIdsMessageListener();
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
	void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
	void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		const handled = idsListener(message, sender, sendResponse);
		if (handled) return true;
		if (!message || typeof message !== "object" || !("type" in message) || !String(message.type).startsWith("ACCOUNT")) return undefined;
		void handleAccountsMessage(message, sender).then(sendResponse, (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Account operation failed."
		}));
		return true;
	});
	chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
		if (changeInfo.status !== "complete") return;
		void getActiveJob().then(async (job) => {
			if (job?.tabId === tabId && job.stage === "logout") {
				job.stage = "signin";
				await setActiveJob(job);
				await chrome.tabs.update(tabId, { url: SIGN_IN_URL });
			}
		});
	});
	chrome.tabs.onRemoved.addListener((tabId) => {
		void getActiveJob().then((job) => job?.tabId === tabId ? setActiveJob(undefined) : undefined);
	});
}
