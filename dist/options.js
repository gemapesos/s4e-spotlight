export {};
const app = document.querySelector("#app");
const notice = document.querySelector("#notice");
const actions = document.querySelector("#header-actions");
let vault = null;
async function api(message) {
	const response = await chrome.runtime.sendMessage(message);
	if (!response?.ok) throw new Error(response?.error ?? "The extension did not respond.");
	return response;
}
function showNotice(message = "", error = false) {
	notice.textContent = message;
	notice.className = error ? "error" : "";
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
	app.innerHTML = `<section class="card stack"><h2>Create encrypted vault</h2><p>Your master password encrypts every account locally. It cannot be recovered.</p><form id="create-form" class="stack"><label>Master password<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><label>Confirm master password<input name="confirm" type="password" minlength="10" required autocomplete="new-password"></label><div><button class="primary" type="submit">Create vault</button></div></form></section>`;
	document.querySelector("#create-form").addEventListener("submit", (event) => {
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
	app.innerHTML = `<section class="card stack"><h2>Unlock accounts</h2><p>Enter the master password to edit stores and credentials.</p><form id="unlock-form" class="stack"><label>Master password<input name="password" type="password" required autofocus autocomplete="current-password"></label><div><button class="primary" type="submit">Unlock</button></div></form></section><section class="card stack danger-zone" style="margin-top:18px"><h2>Forgotten master password</h2><p>Resetting permanently deletes the encrypted account vault.</p><form id="reset-form" class="row"><label>Type RESET<input name="confirmation" autocomplete="off"></label><button class="danger" type="submit">Reset vault</button></form></section>`;
	document.querySelector("#unlock-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const password = secretField(event.currentTarget, "password");
		void api({
			type: "ACCOUNTS_UNLOCK",
			masterPassword: password
		}).then(load, (error) => showNotice(error.message, true));
	});
	document.querySelector("#reset-form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		if (field(form, "confirmation") !== "RESET") return showNotice("Type RESET exactly to delete the vault.", true);
		void api({ type: "ACCOUNTS_RESET" }).then(load, (error) => showNotice(error.message, true));
	});
}
async function save(next, success) {
	await api({
		type: "ACCOUNTS_SAVE_VAULT",
		vault: next
	});
	vault = next;
	renderEditor();
	showNotice(success);
}
function openCredentialDialog(record) {
	const dialog = document.querySelector("#credential-dialog");
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
	const dialog = document.querySelector("#store-dialog");
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
	actions.innerHTML = `<div class="row"><button id="change-password">Change master password</button><button id="lock">Lock</button></div>`;
	const credentials = vault.credentials.map((item) => `<article class="item"><div class="between row"><div><h3>${escapeHtml(item.domain)}</h3><span class="muted">Shared credential</span></div><div class="row"><button data-edit-credential="${item.id}">Edit</button><button class="danger" data-delete-credential="${item.id}">Delete</button></div></div><div class="secret-row"><input aria-label="Password for ${escapeHtml(item.domain)}" value="${escapeHtml(item.password)}" type="password" readonly><button data-reveal>Reveal</button></div><div class="secret-row"><input aria-label="OTP URI for ${escapeHtml(item.domain)}" value="${escapeHtml(item.otpAuthUri)}" type="password" readonly><button data-reveal>Reveal</button></div></article>`).join("");
	const stores = vault.stores.map((item) => {
		const domain = vault.credentials.find(({ id }) => id === item.credentialId)?.domain ?? "Missing credential";
		return `<article class="item"><div class="between row"><div><h3>${escapeHtml(item.name)}</h3><span class="muted">${escapeHtml(domain)}</span></div><div class="row"><button data-edit-store="${item.id}">Edit</button><button class="danger" data-delete-store="${item.id}">Delete</button></div></div><p class="muted">${escapeHtml(item.storeUrl)}</p></article>`;
	}).join("");
	const credentialOptions = vault.credentials.map((item) => `<option value="${item.id}">${escapeHtml(item.domain)}</option>`).join("");
	app.innerHTML = `<div class="grid"><section class="card stack"><div class="between row"><div><h2>Credentials</h2><p class="muted">Domains, passwords, and TOTP secrets.</p></div><button id="add-credential" class="primary">Add credential</button></div>${credentials || "<div class=\"empty\">No credentials yet.</div>"}</section><section class="card stack"><div class="between row"><div><h2>Stores</h2><p class="muted">Seller Central destinations.</p></div><button id="add-store" class="primary" ${vault.credentials.length ? "" : "disabled"}>Add store</button></div>${stores || "<div class=\"empty\">Add a credential, then add JMG Outdoors.</div>"}</section></div>
  <dialog id="credential-dialog"><form class="stack"><h2>Credential</h2><label>Domain / email<input name="domain" type="email" required></label><label>Password<input name="password" type="password" required autocomplete="off"></label><label>TOTP URI<input name="otpAuthUri" type="password" required autocomplete="off" placeholder="otpauth://totp/…"></label><div class="dialog-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save credential</button></div></form></dialog>
  <dialog id="store-dialog"><form class="stack"><h2>Store</h2><label>Store name<input name="name" required placeholder="JMG Outdoors"></label><label>Credential<select name="credentialId" required>${credentialOptions}</select></label><label>Seller Central store URL<input name="storeUrl" type="url" required placeholder="https://sellercentral.amazon.com/home?…"></label><div class="dialog-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save store</button></div></form></dialog>
  <dialog id="password-dialog"><form class="stack"><h2>Change master password</h2><label>New master password<input name="password" type="password" minlength="10" required autocomplete="new-password"></label><label>Confirm password<input name="confirm" type="password" minlength="10" required autocomplete="new-password"></label><div class="dialog-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Change password</button></div></form></dialog>`;
	document.querySelector("#lock").addEventListener("click", () => void api({ type: "ACCOUNTS_LOCK" }).then(load));
	document.querySelector("#change-password").addEventListener("click", () => document.querySelector("#password-dialog").showModal());
	document.querySelector("#add-credential").addEventListener("click", () => openCredentialDialog());
	document.querySelector("#add-store").addEventListener("click", () => openStoreDialog());
	document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog")?.close()));
	document.querySelectorAll("[data-reveal]").forEach((button) => button.addEventListener("click", () => {
		const input = button.previousElementSibling;
		input.type = input.type === "password" ? "text" : "password";
		button.textContent = input.type === "password" ? "Reveal" : "Hide";
	}));
	document.querySelectorAll("[data-edit-credential]").forEach((button) => button.addEventListener("click", () => openCredentialDialog(vault.credentials.find(({ id }) => id === button.dataset.editCredential))));
	document.querySelectorAll("[data-edit-store]").forEach((button) => button.addEventListener("click", () => openStoreDialog(vault.stores.find(({ id }) => id === button.dataset.editStore))));
	document.querySelectorAll("[data-delete-store]").forEach((button) => button.addEventListener("click", () => void save({
		...vault,
		stores: vault.stores.filter(({ id }) => id !== button.dataset.deleteStore)
	}, "Store deleted.").catch((error) => showNotice(error.message, true))));
	document.querySelectorAll("[data-delete-credential]").forEach((button) => button.addEventListener("click", () => {
		const id = button.dataset.deleteCredential;
		if (vault.stores.some(({ credentialId }) => credentialId === id)) return showNotice("Delete or reassign stores using this credential first.", true);
		void save({
			...vault,
			credentials: vault.credentials.filter((item) => item.id !== id)
		}, "Credential deleted.").catch((error) => showNotice(error.message, true));
	}));
	document.querySelector("#credential-dialog form").addEventListener("submit", (event) => {
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
	document.querySelector("#store-dialog form").addEventListener("submit", (event) => {
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
	document.querySelector("#password-dialog form").addEventListener("submit", (event) => {
		event.preventDefault();
		const form = event.currentTarget;
		const password = secretField(form, "password");
		if (password !== secretField(form, "confirm")) return showNotice("Master passwords do not match.", true);
		void api({
			type: "ACCOUNTS_CHANGE_MASTER_PASSWORD",
			masterPassword: password
		}).then(() => {
			document.querySelector("#password-dialog").close();
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
void load();
