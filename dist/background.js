const OPEN_CASE_IDS_MESSAGE = "OPEN_CASE_IDS";
const OPEN_SHIPMENT_IDS_MESSAGE = "OPEN_SHIPMENT_IDS";
const CASE_ID_PATTERN = /^\d{11}$/;
const SHIPMENT_ID_PATTERN = /^FBA[A-Z0-9]{9}$/;
const CASE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=";
const SHIPMENT_URL = "https://sellercentral.amazon.com/fba/inbound-shipment/summary/";
export function normalizeCaseIds(caseIds) {
	if (!Array.isArray(caseIds)) return [];
	return [...new Set(caseIds.filter((caseId) => typeof caseId === "string" && CASE_ID_PATTERN.test(caseId)))];
}
export function buildCaseUrl(caseId) {
	return `${CASE_URL}${caseId}`;
}
export function normalizeShipmentIds(shipmentIds) {
	if (!Array.isArray(shipmentIds)) return [];
	return [...new Set(shipmentIds.filter((shipmentId) => typeof shipmentId === "string").map((shipmentId) => shipmentId.toUpperCase()).filter((shipmentId) => SHIPMENT_ID_PATTERN.test(shipmentId)))];
}
export function buildShipmentUrl(shipmentId) {
	return `${SHIPMENT_URL}${shipmentId}/contents`;
}
async function createBackgroundTabs(ids, senderTab, buildUrl, createTab) {
	if (senderTab?.id === undefined || senderTab.windowId === undefined) {
		throw new Error("The originating tab is unavailable.");
	}
	for (const id of ids) {
		await createTab({
			active: false,
			openerTabId: senderTab.id,
			url: buildUrl(id),
			windowId: senderTab.windowId
		});
	}
}
export async function openCaseTabs(caseIds, senderTab, createTab = (properties) => chrome.tabs.create(properties)) {
	const normalizedCaseIds = normalizeCaseIds(caseIds);
	if (normalizedCaseIds.length === 0) {
		throw new Error("No valid Case IDs were provided.");
	}
	await createBackgroundTabs(normalizedCaseIds, senderTab, buildCaseUrl, createTab);
}
export async function openShipmentTabs(shipmentIds, senderTab, createTab = (properties) => chrome.tabs.create(properties)) {
	const normalizedShipmentIds = normalizeShipmentIds(shipmentIds);
	if (normalizedShipmentIds.length === 0) {
		throw new Error("No valid Shipment IDs were provided.");
	}
	await createBackgroundTabs(normalizedShipmentIds, senderTab, buildShipmentUrl, createTab);
}
function getErrorMessage(error) {
	return error instanceof Error ? error.message : "Couldn’t open tabs.";
}
export function createOpenIdsMessageListener(openCases = openCaseTabs, openShipments = openShipmentTabs) {
	return (message, sender, sendResponse) => {
		if (typeof message !== "object" || message === null || !("type" in message)) {
			return undefined;
		}
		let openTabs;
		let ids;
		if (message.type === OPEN_CASE_IDS_MESSAGE) {
			openTabs = openCases;
			ids = "caseIds" in message ? message.caseIds : undefined;
		} else if (message.type === OPEN_SHIPMENT_IDS_MESSAGE) {
			openTabs = openShipments;
			ids = "shipmentIds" in message ? message.shipmentIds : undefined;
		} else {
			return undefined;
		}
		void openTabs(ids, sender.tab).then(() => sendResponse({ ok: true }), (error) => sendResponse({
			ok: false,
			error: getErrorMessage(error)
		}));
		return true;
	};
}
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
	chrome.runtime.onMessage.addListener(createOpenIdsMessageListener());
}
