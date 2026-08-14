function isPaletteShortcut(event) {
	const isSlash = event.code === "Slash" || event.key === "/";
	const hasPrimaryModifier = event.metaKey || event.ctrlKey;
	return isSlash && hasPrimaryModifier && !event.altKey && !event.shiftKey;
}

function visible(element) {
	return element instanceof HTMLElement && element.offsetParent !== null;
}
function hasAuthenticatedSellerUi(root = document) {
	const modernShell = [
		"#sc-navtab-home",
		"#sc-top-nav-root",
		"[data-testid=\"global-nav\"]"
	].some((selector) => visible(root.querySelector(selector)));
	if (modernShell) return true;
	const classicShellMarkers = [
		"#sc-search-field",
		"a.logo-container[href=\"/home\"]",
		"a[aria-label=\"Messages\"][href^=\"/messaging/\"]"
	].filter((selector) => visible(root.querySelector(selector)));
	return classicShellMarkers.length >= 2;
}
function sellerCentralSessionStatus(pathname = location.pathname, root = document) {
	if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
		return {
			loggedInToStore: false,
			settled: true
		};
	}
	if (hasAuthenticatedSellerUi(root)) {
		return {
			loggedInToStore: true,
			settled: true
		};
	}
	return {
		loggedInToStore: false,
		settled: false
	};
}

const PALETTE_APP_FILE = "palette-app.js";
let mounted = null;
let pending = null;
async function loadPalette() {
	if (mounted) return mounted;
	if (!pending) {
		pending = import(chrome.runtime.getURL(PALETTE_APP_FILE)).then((mod) => {
			mounted = mod.mountCommandPalette();
			if (!mounted) throw new Error("Could not mount the command palette.");
			return mounted;
		}).catch((error) => {
			pending = null;
			throw error;
		});
	}
	return pending;
}
function onKeyDown(event) {
	if (!isPaletteShortcut(event)) return;
	event.preventDefault();
	event.stopImmediatePropagation();
	window.removeEventListener("keydown", onKeyDown, true);
	void loadPalette().then((palette) => {
		palette.setOpen(true);
	}).catch(() => {
		window.addEventListener("keydown", onKeyDown, true);
	});
}
function handleContentMessage(message, _sender, sendResponse, load = loadPalette) {
	if (!message || typeof message !== "object" || !("type" in message)) return undefined;
	const record = message;
	if (record.type === "REPORTS_SESSION_STATUS") {
		sendResponse({
			ok: true,
			...sellerCentralSessionStatus()
		});
		return;
	}
	if (record.type === "OPEN_PALETTE") {
		const mode = record.mode === "report-login" ? "report-login" : undefined;
		void load().then((palette) => {
			palette.setOpen(true, mode);
		}).then(() => sendResponse({ ok: true }), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t open the command palette."
		}));
		return true;
	}
	return undefined;
}
if (typeof window !== "undefined" && window.top === window) {
	window.addEventListener("keydown", onKeyDown, true);
	if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.addListener(handleContentMessage);
}
