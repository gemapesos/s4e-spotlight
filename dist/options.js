let pageDocument;
let app;
let notice;
let noticeTitle;
let noticeDescription;
let noticeClose;
let actions;
let vault = null;
let noticeTimer = null;
const revealTimers = new WeakMap();
async function api(message) {
	const response = await chrome.runtime.sendMessage(message);
	if (!response?.ok) throw new Error(response?.error ?? "The extension did not respond.");
	return response;
}
function showNotice(message = "", error = false) {
	if (noticeTimer) clearTimeout(noticeTimer);
	noticeTimer = null;
	if (!message) {
		notice.hidden = true;
		return;
	}
	notice.dataset.type = error ? "error" : "success";
	notice.setAttribute("role", error ? "alert" : "status");
	noticeTitle.textContent = error ? "Something went wrong" : "Success";
	noticeDescription.textContent = message;
	notice.hidden = false;
	if (!error) noticeTimer = setTimeout(() => {
		notice.hidden = true;
	}, 5e3);
}
function escapeHtml(value) {
	return value.replace(/[&<>'"]/gu, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"'": "&#39;",
		"\"": "&quot;"
	})[character]);
}
function field(form, name) {
	return String(new FormData(form).get(name) ?? "").trim();
}
function secretField(form, name) {
	return String(new FormData(form).get(name) ?? "");
}
function renderCreate() {
	actions.replaceChildren();
	app.innerHTML = `<section class="card auth-card"><div class="card-header"><div class="card-heading"><h2 class="card-title">Create encrypted vault</h2><p class="card-description">Your master password encrypts every account locally. It cannot be recovered.</p></div></div><div class="card-content"><form id="create-form" class="field-group"><label>Master password<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><label>Confirm master password<input name="confirm" type="password" minlength="10" required autocomplete="new-password"></label><div><button type="submit">Create vault</button></div></form></div></section>`;
	pageDocument.querySelector("#create-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const password = secretField(form, "password");
		if (password !== secretField(form, "confirm")) return showNotice("Master passwords do not match.", true);
		void api({
			type: "ACCOUNTS_CREATE",
			masterPassword: password
		}).then(load, (error) => showNotice(error.message, true));
	});
}
function renderLocked() {
	actions.replaceChildren();
	app.innerHTML = `<div class="stack auth-card"><section class="card"><div class="card-header"><div class="card-heading"><h2 class="card-title">Unlock accounts</h2><p class="card-description">Enter the master password to edit stores and credentials.</p></div></div><div class="card-content"><form id="unlock-form" class="field-group"><label>Master password<input name="password" type="password" required autofocus autocomplete="current-password"></label><div><button type="submit">Unlock</button></div></form></div></section><section class="card danger-zone"><div class="card-header"><div class="card-heading"><h2 class="card-title">Forgotten master password</h2><p class="card-description">Resetting permanently deletes the encrypted account vault. This action cannot be undone.</p></div></div><div class="card-content"><form id="reset-form" class="field-group"><label>Type RESET<input name="confirmation" autocomplete="off"></label><div><button class="destructive" type="submit">Reset vault</button></div></form></div></section></div>`;
	pageDocument.querySelector("#unlock-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const password = secretField(event.currentTarget, "password");
		void api({
			type: "ACCOUNTS_UNLOCK",
			masterPassword: password
		}).then(load, (error) => showNotice(error.message, true));
	});
	pageDocument.querySelector("#reset-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		if (field(form, "confirmation") !== "RESET") return showNotice("Type RESET exactly to delete the vault.", true);
		void api({ type: "ACCOUNTS_RESET" }).then(load, (error) => showNotice(error.message, true));
	});
}
async function save(next, success) {
	setEditorBusy(true);
	try {
		await api({
			type: "ACCOUNTS_SAVE_VAULT",
			vault: next
		});
		vault = next;
		renderEditor();
		showNotice(success);
	} finally {
		setEditorBusy(false);
	}
}
function setEditorBusy(busy) {
	app.setAttribute("aria-busy", String(busy));
	app.querySelectorAll("button, input, select").forEach((control) => {
		control.disabled = busy;
	});
}
function openCredentialDialog(record) {
	const dialog = pageDocument.querySelector("#credential-dialog");
	const form = dialog.querySelector("form");
	form.reset();
	form.dataset.id = record?.id ?? "";
	for (const [name, value] of Object.entries(record ?? {})) {
		const input = form.elements.namedItem(name);
		if (input instanceof HTMLInputElement) input.value = String(value);
	}
	dialog.showModal();
}
function openStoreDialog(record) {
	const dialog = pageDocument.querySelector("#store-dialog");
	const form = dialog.querySelector("form");
	form.reset();
	form.dataset.id = record?.id ?? "";
	for (const [name, value] of Object.entries(record ?? {})) {
		const input = form.elements.namedItem(name);
		if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) input.value = String(value);
	}
	dialog.showModal();
}
function renderEditor() {
	if (!vault) return;
	actions.innerHTML = `<div class="row"><button id="change-password" class="outline">Change master password</button><button id="lock" class="outline">Lock</button></div>`;
	const credentials = vault.credentials.map((item) => `<article class="item"><div class="between row"><div><h3>${escapeHtml(item.domain)}</h3><p class="muted">Shared credential</p></div><div class="row"><button class="outline small" data-edit-credential="${item.id}">Edit</button><button class="destructive small" data-delete-credential="${item.id}">Delete</button></div></div><div class="secret-row"><input aria-label="Password for ${escapeHtml(item.domain)}" value="${escapeHtml(item.password)}" type="password" readonly><button class="outline small" data-reveal>Reveal</button></div><div class="secret-row"><input aria-label="OTP URI for ${escapeHtml(item.domain)}" value="${escapeHtml(item.otpAuthUri)}" type="password" readonly><button class="outline small" data-reveal>Reveal</button></div></article>`).join("");
	const stores = vault.stores.map((item) => {
		const domain = vault.credentials.find(({ id }) => id === item.credentialId)?.domain ?? "Missing credential";
		return `<article class="item"><div class="between row"><div><h3>${escapeHtml(item.name)}</h3><p class="muted">${escapeHtml(domain)}</p></div><div class="row"><button class="outline small" data-edit-store="${item.id}">Edit</button><button class="destructive small" data-delete-store="${item.id}">Delete</button></div></div><p class="muted">${escapeHtml(item.storeUrl)}</p></article>`;
	}).join("");
	const credentialOptions = vault.credentials.map((item) => `<option value="${item.id}">${escapeHtml(item.domain)}</option>`).join("");
	app.innerHTML = `<div class="grid"><section class="card"><div class="card-header"><div class="card-heading"><h2 class="card-title">Credentials</h2><p class="card-description">Domains, passwords, and TOTP secrets.</p></div><div class="card-action"><button id="add-credential">Add credential</button></div></div><div class="card-content"><div class="item-group">${credentials || "<div class=\"empty\">No credentials yet.</div>"}</div></div></section><section class="card"><div class="card-header"><div class="card-heading"><h2 class="card-title">Stores</h2><p class="card-description">Seller Central destinations.</p></div><div class="card-action"><button id="add-store" ${vault.credentials.length ? "" : "disabled"}>Add store</button></div></div><div class="card-content"><div class="item-group">${stores || "<div class=\"empty\">Add a credential, then add your first store.</div>"}</div></div></section></div>
  <dialog id="credential-dialog" aria-labelledby="credential-dialog-title" aria-describedby="credential-dialog-description"><form class="dialog-form"><button class="dialog-close" type="button" data-close aria-label="Close">×</button><div class="dialog-header"><h2 id="credential-dialog-title" class="dialog-title">Credential</h2><p id="credential-dialog-description" class="dialog-description">Add the sign-in details shared by one or more stores.</p></div><div class="field-group"><label>Domain / email<input name="domain" type="email" required></label><label>Password<input name="password" type="password" required autocomplete="off"></label><label>TOTP URI<input name="otpAuthUri" type="password" required autocomplete="off" placeholder="otpauth://totp/…"></label></div><div class="dialog-actions"><button class="outline" type="button" data-close>Cancel</button><button type="submit">Save credential</button></div></form></dialog>
  <dialog id="store-dialog" aria-labelledby="store-dialog-title" aria-describedby="store-dialog-description"><form class="dialog-form"><button class="dialog-close" type="button" data-close aria-label="Close">×</button><div class="dialog-header"><h2 id="store-dialog-title" class="dialog-title">Store</h2><p id="store-dialog-description" class="dialog-description">Connect a Seller Central destination to a saved credential.</p></div><div class="field-group"><label>Store name<input name="name" required placeholder="JMG Outdoors"></label><label>Credential<select name="credentialId" required>${credentialOptions}</select></label><label>Seller Central store URL<input name="storeUrl" type="url" required placeholder="https://sellercentral.amazon.com/home?…"></label></div><div class="dialog-actions"><button class="outline" type="button" data-close>Cancel</button><button type="submit">Save store</button></div></form></dialog>
  <dialog id="password-dialog" aria-labelledby="password-dialog-title" aria-describedby="password-dialog-description"><form class="dialog-form"><button class="dialog-close" type="button" data-close aria-label="Close">×</button><div class="dialog-header"><h2 id="password-dialog-title" class="dialog-title">Change master password</h2><p id="password-dialog-description" class="dialog-description">Choose a new password with at least 10 characters.</p></div><div class="field-group"><label>New master password<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><label>Confirm password<input name="confirm" type="password" minlength="10" required autocomplete="new-password"></label></div><div class="dialog-actions"><button class="outline" type="button" data-close>Cancel</button><button type="submit">Change password</button></div></form></dialog>
  <dialog id="delete-dialog" aria-labelledby="delete-dialog-title" aria-describedby="delete-dialog-description"><form class="dialog-form"><button class="dialog-close" type="button" data-close aria-label="Close">×</button><div class="dialog-header"><h2 id="delete-dialog-title" class="dialog-title">Delete item?</h2><p id="delete-dialog-description" class="dialog-description"></p></div><div class="dialog-actions"><button class="outline" type="button" data-close>Cancel</button><button class="destructive" type="submit">Delete</button></div></form></dialog>`;
	pageDocument.querySelector("#lock").addEventListener("click", () => void api({ type: "ACCOUNTS_LOCK" }).then(load));
	pageDocument.querySelector("#change-password").addEventListener("click", () => pageDocument.querySelector("#password-dialog").showModal());
	pageDocument.querySelector("#add-credential").addEventListener("click", () => openCredentialDialog());
	pageDocument.querySelector("#add-store").addEventListener("click", () => openStoreDialog());
	pageDocument.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));
	pageDocument.querySelectorAll("[data-reveal]").forEach((button) => button.addEventListener("click", () => {
		const input = button.previousElementSibling;
		const hide = () => {
			input.type = "password";
			button.textContent = "Reveal";
			const timer = revealTimers.get(input);
			if (timer) clearTimeout(timer);
			revealTimers.delete(input);
		};
		if (input.type === "text") return hide();
		input.type = "text";
		button.textContent = "Hide";
		input.addEventListener("blur", hide, { once: true });
		revealTimers.set(input, setTimeout(hide, 3e4));
	}));
	pageDocument.querySelectorAll("[data-edit-credential]").forEach((button) => button.addEventListener("click", () => openCredentialDialog(vault.credentials.find(({ id }) => id === button.dataset.editCredential))));
	pageDocument.querySelectorAll("[data-edit-store]").forEach((button) => button.addEventListener("click", () => openStoreDialog(vault.stores.find(({ id }) => id === button.dataset.editStore))));
	const deleteDialog = pageDocument.querySelector("#delete-dialog");
	const requestDelete = (kind, id, name) => {
		if (kind === "credential" && vault.stores.some(({ credentialId }) => credentialId === id)) return showNotice("Delete or reassign stores using this credential first.", true);
		const form = deleteDialog.querySelector("form");
		form.dataset.kind = kind;
		form.dataset.id = id;
		deleteDialog.querySelector("#delete-dialog-title").textContent = `Delete ${kind}?`;
		deleteDialog.querySelector("#delete-dialog-description").textContent = `“${name}” will be permanently removed from this vault.`;
		deleteDialog.showModal();
	};
	pageDocument.querySelectorAll("[data-delete-store]").forEach((button) => button.addEventListener("click", () => {
		const item = vault.stores.find(({ id }) => id === button.dataset.deleteStore);
		if (item) requestDelete("store", item.id, item.name);
	}));
	pageDocument.querySelectorAll("[data-delete-credential]").forEach((button) => button.addEventListener("click", () => {
		const item = vault.credentials.find(({ id }) => id === button.dataset.deleteCredential);
		if (item) requestDelete("credential", item.id, item.domain);
	}));
	pageDocument.querySelector("#delete-dialog form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const id = form.dataset.id;
		const next = form.dataset.kind === "store" ? {
			...vault,
			stores: vault.stores.filter((item) => item.id !== id)
		} : {
			...vault,
			credentials: vault.credentials.filter((item) => item.id !== id)
		};
		void save(next, form.dataset.kind === "store" ? "Store deleted." : "Credential deleted.").catch((error) => showNotice(error.message, true));
	});
	pageDocument.querySelector("#credential-dialog form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const id = form.dataset.id || crypto.randomUUID();
		const record = {
			id,
			domain: field(form, "domain"),
			password: secretField(form, "password"),
			otpAuthUri: field(form, "otpAuthUri")
		};
		const credentials = vault.credentials.some((item) => item.id === id) ? vault.credentials.map((item) => item.id === id ? record : item) : [...vault.credentials, record];
		void save({
			...vault,
			credentials
		}, "Credential saved.").catch((error) => showNotice(error.message, true));
	});
	pageDocument.querySelector("#store-dialog form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const id = form.dataset.id || crypto.randomUUID();
		const record = {
			id,
			name: field(form, "name"),
			credentialId: field(form, "credentialId"),
			storeUrl: field(form, "storeUrl")
		};
		const stores = vault.stores.some((item) => item.id === id) ? vault.stores.map((item) => item.id === id ? record : item) : [...vault.stores, record];
		void save({
			...vault,
			stores
		}, "Store saved.").catch((error) => showNotice(error.message, true));
	});
	pageDocument.querySelector("#password-dialog form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const password = secretField(form, "password");
		if (password !== secretField(form, "confirm")) return showNotice("Master passwords do not match.", true);
		void api({
			type: "ACCOUNTS_CHANGE_MASTER_PASSWORD",
			masterPassword: password
		}).then(() => {
			pageDocument.querySelector("#password-dialog").close();
			showNotice("Master password changed.");
		}, (error) => showNotice(error.message, true));
	});
}
async function load() {
	showNotice();
	app.setAttribute("aria-busy", "true");
	try {
		const status = await api({ type: "ACCOUNTS_STATUS" });
		if (!status.initialized) {
			vault = null;
			renderCreate();
		} else if (!status.unlocked) {
			vault = null;
			renderLocked();
		} else {
			vault = (await api({ type: "ACCOUNTS_GET_VAULT" })).vault;
			renderEditor();
		}
	} catch (error) {
		showNotice(error instanceof Error ? error.message : "Could not load accounts.", true);
	} finally {
		app.setAttribute("aria-busy", "false");
	}
}
export function mountOptionsPage(targetDocument = document) {
	pageDocument = targetDocument;
	app = targetDocument.querySelector("#app");
	notice = targetDocument.querySelector("#notice");
	noticeTitle = notice.querySelector(".toast-title");
	noticeDescription = notice.querySelector(".toast-description");
	noticeClose = notice.querySelector(".toast-close");
	actions = targetDocument.querySelector("#header-actions");
	noticeClose.addEventListener("click", () => showNotice());
	void load();
}
if (typeof document !== "undefined" && document.querySelector("#app")) mountOptionsPage(document);
