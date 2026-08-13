const STATUS_ID = "s4e-account-switch-status";
const documentStartedAt = Date.now();
const attempts = new Map();
let inFlight = null;
const RETRY_DELAY_MS = 5e3;
const MAX_ATTEMPTS = 2;
async function send(message) {
	return chrome.runtime.sendMessage(message);
}
function setWorkflowStatus(text, tone = "normal") {
	let element = document.getElementById(STATUS_ID);
	if (!element) {
		element = document.createElement("div");
		element.id = STATUS_ID;
		element.setAttribute("role", "status");
		Object.assign(element.style, {
			position: "fixed",
			right: "16px",
			bottom: "16px",
			zIndex: "2147483647",
			maxWidth: "360px",
			padding: "10px 14px",
			borderRadius: "8px",
			color: "white",
			font: "13px/1.4 system-ui, sans-serif",
			boxShadow: "0 4px 18px rgba(0,0,0,.25)"
		});
		document.documentElement.append(element);
	}
	element.style.background = tone === "error" ? "#991b1b" : "#1f2937";
	element.textContent = text;
}
function visible(element) {
	return element instanceof HTMLElement && element.offsetParent !== null;
}
function input(selectors) {
	for (const selector of selectors) {
		const element = document.querySelector(selector);
		if (element instanceof HTMLInputElement && visible(element)) return element;
	}
	return null;
}
function button(selectors, names) {
	for (const selector of selectors) {
		const element = document.querySelector(selector);
		if (visible(element)) return element;
	}
	return Array.from(document.querySelectorAll("button, input[type=submit], a[role=button]")).find((element) => visible(element) && names.test(element.textContent || element.value || "")) ?? null;
}
function fill(element, value) {
	const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
	setter?.call(element, value);
	element.dispatchEvent(new Event("input", { bubbles: true }));
	element.dispatchEvent(new Event("change", { bubbles: true }));
}
async function trustedClick(jobId, element, action, missingMessage) {
	if (!element) throw new Error(missingMessage);
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) throw new Error(`${missingMessage} The control is not visible.`);
	const response = await send({
		type: "ACCOUNT_AUTOMATION_CLICK",
		jobId,
		action,
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2
	});
	if (!response.ok) throw new Error(response.error ?? "Chrome could not click Amazon’s login control.");
}
function prepareStage(stage, failureMessage) {
	if (inFlight?.stage !== stage) {
		inFlight = null;
		return true;
	}
	const elapsed = Date.now() - inFlight.startedAt;
	if (elapsed < RETRY_DELAY_MS) {
		window.setTimeout(() => void run(), RETRY_DELAY_MS - elapsed);
		return false;
	}
	if ((attempts.get(stage) ?? 0) >= MAX_ATTEMPTS) throw new Error(failureMessage);
	inFlight = null;
	return true;
}
function markStageSubmitted(stage) {
	attempts.set(stage, (attempts.get(stage) ?? 0) + 1);
	inFlight = {
		stage,
		startedAt: Date.now()
	};
	window.setTimeout(() => void run(), RETRY_DELAY_MS);
}
function hasCaptcha() {
	return Boolean(document.querySelector("iframe[src*=\"captcha\" i], input[name*=\"captcha\" i], #captchacharacters")) || /enter the characters you see|solve this puzzle|captcha/iu.test(document.body?.innerText ?? "");
}
function hasAuthError() {
	const alert = document.querySelector("[role=\"alert\"], .a-alert-error, #auth-error-message-box");
	return visible(alert) && (alert.textContent?.trim().length ?? 0) > 0;
}
async function requestSecret(jobId, kind) {
	const response = await send({
		type: "ACCOUNT_AUTOMATION_SECRET",
		jobId,
		kind
	});
	if (!response.ok) throw new Error(response.error);
	if (response.waitMs) {
		setWorkflowStatus("Waiting for a fresh verification code…");
		window.setTimeout(() => void run(), response.waitMs);
		return null;
	}
	return response.value ?? null;
}
async function run() {
	const response = await send({ type: "ACCOUNT_AUTOMATION_GET_JOB" });
	const job = response.job;
	if (!response.ok || !job) return;
	try {
		if (job.stage === "logout") {
			setWorkflowStatus("Signing out of the current Seller Central account…");
			return;
		}
		if (hasCaptcha()) {
			setWorkflowStatus("Amazon needs you to complete the CAPTCHA. Automation will resume afterward.");
			if (!attempts.has("captcha")) {
				attempts.set("captcha", 1);
				await send({
					type: "ACCOUNT_AUTOMATION_PAUSED",
					jobId: job.id
				});
			}
			window.setTimeout(() => void run(), 1500);
			return;
		}
		if (hasAuthError()) {
			setWorkflowStatus("Amazon rejected the login details. Review the page or edit the saved account.", "error");
			await send({
				type: "ACCOUNT_AUTOMATION_ERROR",
				jobId: job.id
			});
			return;
		}
		const email = input([
			"#ap_email",
			"input[name=\"email\"]",
			"input[type=\"email\"]",
			"input[autocomplete=\"username\"]"
		]);
		if (email) {
			if (!prepareStage("email", "Amazon’s Continue button did not advance the login.")) return;
			setWorkflowStatus("Entering the saved account email…");
			const value = await requestSecret(job.id, "email");
			if (!value) return;
			fill(email, value);
			await trustedClick(job.id, button(["#continue", "input[name=\"continue\"]"], /continue/iu), "continue", "Amazon’s Continue button was not found.");
			markStageSubmitted("email");
			return;
		}
		const password = input([
			"#ap_password",
			"input[name=\"password\"]",
			"input[type=\"password\"]"
		]);
		if (password) {
			if (!prepareStage("password", "Amazon’s password button did not advance the login.")) return;
			setWorkflowStatus("Dismissing passkey prompt and entering the saved password…");
			const cancel = button([], /cancel|not now|use password|skip/iu);
			if (cancel) await trustedClick(job.id, cancel, "passkey-cancel", "Amazon’s passkey Cancel button was not found.");
			const escape = await send({
				type: "ACCOUNT_AUTOMATION_ESCAPE",
				jobId: job.id
			});
			if (!escape.ok) throw new Error(escape.error ?? "Could not dismiss the passkey prompt.");
			const value = await requestSecret(job.id, "password");
			if (!value) return;
			fill(password, value);
			await trustedClick(job.id, button([
				"#signInSubmit",
				"input[name=\"signIn\"]",
				"button[type=\"submit\"]"
			], /sign in|next|continue/iu), "password-submit", "Amazon’s password submit button was not found.");
			markStageSubmitted("password");
			return;
		}
		const otp = input([
			"#auth-mfa-otpcode",
			"input[name=\"otpCode\"]",
			"input[autocomplete=\"one-time-code\"]",
			"input[inputmode=\"numeric\"]"
		]);
		if (otp) {
			if (!prepareStage("otp", "Amazon’s verification-code button did not advance the login.")) return;
			setWorkflowStatus("Generating and entering a fresh verification code…");
			const value = await requestSecret(job.id, "otp");
			if (!value) return;
			fill(otp, value);
			await trustedClick(job.id, button([
				"#auth-signin-button",
				"input[type=\"submit\"]",
				"button[type=\"submit\"]"
			], /sign in|submit|continue/iu), "otp-submit", "Amazon’s verification-code submit button was not found.");
			markStageSubmitted("otp");
			return;
		}
		if (!location.pathname.startsWith("/ap/") && !location.pathname.includes("signin")) {
			setWorkflowStatus("Signed in. Opening the selected store…");
			const completed = await send({
				type: "ACCOUNT_AUTOMATION_COMPLETE",
				jobId: job.id
			});
			if (!completed.ok) throw new Error(completed.error);
			return;
		}
		if (Date.now() - documentStartedAt > 9e4) throw new Error("Amazon’s login page did not match a supported step.");
		setWorkflowStatus("Waiting for Amazon’s next login step…");
		window.setTimeout(() => void run(), 1e3);
	} catch (error) {
		setWorkflowStatus(error instanceof Error ? error.message : "Account switching failed.", "error");
		await send({
			type: "ACCOUNT_AUTOMATION_ERROR",
			jobId: job.id
		});
	}
}
void run();
