const PALETTE_HOST_ID = "command-palette-extension-root";
const PALETTE_OPEN_ATTRIBUTE = "data-s4e-palette-open";
const PASTE_GUARD_KEY = "__s4eSpotlightPasteGuard";
function isPasteShortcut(event) {
	return event.key.toLowerCase() === "v" && (event.metaKey || event.ctrlKey) && !event.altKey;
}
function isSelectAllShortcut(event) {
	return event.key.toLowerCase() === "a" && (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey;
}
function isPasteEvent(event) {
	if (event.type === "paste") return true;
	if (event.type === "keydown") return isPasteShortcut(event);
	return event.type === "beforeinput" && event.inputType === "insertFromPaste";
}
function isGuardedEvent(event) {
	return isPasteEvent(event) || event.type === "keydown" && isSelectAllShortcut(event);
}
function paletteOwnsEvent(targetDocument, event) {
	const host = targetDocument.getElementById(PALETTE_HOST_ID);
	if (!host || host.getAttribute(PALETTE_OPEN_ATTRIBUTE) !== "true") {
		return false;
	}
	return targetDocument.activeElement === host || event.composedPath().includes(host);
}
function installPasteGuard(targetWindow) {
	const targetDocument = targetWindow.document;
	const guard = (event) => {
		if (!isGuardedEvent(event) || !paletteOwnsEvent(targetDocument, event)) {
			return;
		}
		event.stopImmediatePropagation();
	};
	targetWindow.addEventListener("keydown", guard, true);
	targetWindow.addEventListener("paste", guard, true);
	targetWindow.addEventListener("beforeinput", guard, true);
	return { destroy: () => {
		targetWindow.removeEventListener("keydown", guard, true);
		targetWindow.removeEventListener("paste", guard, true);
		targetWindow.removeEventListener("beforeinput", guard, true);
	} };
}
const pasteGuardWindow = window;
pasteGuardWindow[PASTE_GUARD_KEY]?.destroy();
pasteGuardWindow[PASTE_GUARD_KEY] = installPasteGuard(window);
