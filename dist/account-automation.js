(function () {
const MODERN_SHELL_SELECTORS = [
	"#sc-navtab-home",
	"#sc-top-nav-root",
	"[data-testid=\"global-nav\"]",
	"#sc-navbar-container",
	"#ngstrim-nav-menu"
];
const CLASSIC_SHELL_SELECTORS = [
	"#sc-search-field",
	"a.logo-container[href=\"/home\"]",
	"a[aria-label=\"Messages\"][href^=\"/messaging/\"]"
];
function visible(element) {
	return element instanceof HTMLElement && element.offsetParent !== null;
}
function shellSelectorHits(root = document) {
	return {
		modernHits: MODERN_SHELL_SELECTORS.filter((selector) => visible(root.querySelector(selector))),
		classicHits: CLASSIC_SHELL_SELECTORS.filter((selector) => visible(root.querySelector(selector)))
	};
}
function hasAuthenticatedSellerUi(root = document) {
	const { modernHits, classicHits } = shellSelectorHits(root);
	if (modernHits.length > 0) return true;
	return classicHits.length >= 2;
}
function sellerCentralSessionStatus(pathname = location.pathname, root = document) {
	let result;
	if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
		result = {
			loggedInToStore: false,
			settled: true
		};
	} else if (hasAuthenticatedSellerUi(root)) {
		result = {
			loggedInToStore: true,
			settled: true
		};
	} else {
		result = {
			loggedInToStore: false,
			settled: false
		};
	}
	// #region agent log
	{
		const hits = shellSelectorHits(root);
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
				location: "sellerCentralSession.ts:sellerCentralSessionStatus",
				message: "session status evaluated",
				data: {
					hostname: typeof location !== "undefined" ? location.hostname : "",
					pathname,
					...result,
					modernHits: hits.modernHits,
					classicHits: hits.classicHits
				},
				timestamp: Date.now()
			})
		}).catch(() => {});
	}
	// #endregion
	return result;
}

const STATUS_ID = "s4e-account-switch-status";
const documentStartedAt = Date.now();
const attempts = new Map();
let inFlight = null;
let leavingLogout = false;
const RETRY_DELAY_MS = 5e3;
const MAX_ATTEMPTS = 2;
const CAPTCHA_TEXT_SCAN_INTERVAL_MS = 3e3;
let lastCaptchaTextScanAt = 0;
let lastCaptchaTextScanResult = false;
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
	element.setAttribute("role", tone === "error" ? "alert" : "status");
	element.style.background = tone === "error" ? "#991b1b" : "#1f2937";
	element.textContent = text;
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
async function activate(jobId, element, action, missingMessage) {
	if (!element) throw new Error(missingMessage);
	if (!visible(element)) throw new Error(`${missingMessage} The control is not visible.`);
	const rect = element.getBoundingClientRect();
	if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top) || !Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) {
		throw new Error(`${missingMessage} The control has invalid click coordinates.`);
	}
	const response = await send({
		type: "ACCOUNT_AUTOMATION_CLICK",
		jobId,
		action,
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2
	});
	if (!response.ok) throw new Error(response.error ?? "Chrome could not activate Amazon’s login control.");
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
	if (document.querySelector("iframe[src*=\"captcha\" i], input[name*=\"captcha\" i], #captchacharacters")) {
		return true;
	}
	const now = Date.now();
	if (now - lastCaptchaTextScanAt < CAPTCHA_TEXT_SCAN_INTERVAL_MS) {
		return lastCaptchaTextScanResult;
	}
	lastCaptchaTextScanAt = now;
	lastCaptchaTextScanResult = /enter the characters you see|solve this puzzle|captcha/iu.test(document.body?.innerText ?? "");
	return lastCaptchaTextScanResult;
}
function hasAuthError() {
	const alert = Array.from(document.querySelectorAll("[role=\"alert\"], .a-alert-error, #auth-error-message-box")).find((element) => element.id !== STATUS_ID && visible(element) && (element.textContent?.trim().length ?? 0) > 0);
	return Boolean(alert);
}
/** Logged-in enough to open the saved store URL (shell UI or merchant/marketplace picker). */
function isReadyForStoreNavigation() {
	if (hasAuthenticatedSellerUi()) return true;
	return location.pathname.startsWith("/account-switcher/");
}
function shouldCompleteAuthenticatedSession(stage) {
	if (location.pathname.startsWith("/account-switcher/")) return true;
	return stage !== "logout" && stage !== "signin";
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
async function leaveLogout(jobId) {
	leavingLogout = true;
	const left = await send({
		type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT",
		jobId
	});
	if (!left.ok) {
		leavingLogout = false;
		throw new Error(left.error ?? "Could not leave Amazon’s logout page.");
	}
}
async function run() {
	const response = await send({ type: "ACCOUNT_AUTOMATION_GET_JOB" });
	const job = response.job;
	if (!response.ok || !job) return;
	try {
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
		// Never fill credentials on Amazon's logout re-auth (return_to=sign-out); wait for canonical sign-in navigation.
		if (job.stage === "logout" || leavingLogout) {
			if (Date.now() - documentStartedAt > 9e4) throw new Error("Amazon did not finish signing out. Cancel the switch and try again.");
			setWorkflowStatus("Signing out of the current Seller Central account…");
			const onLogoutIntercept = location.pathname.startsWith("/ap/") || location.pathname.includes("signin") || Boolean(input([
				"#ap_email",
				"input[name=\"email\"]",
				"input[type=\"email\"]",
				"input[autocomplete=\"username\"]"
			])) || Boolean(input([
				"#ap_password",
				"input[name=\"password\"]",
				"input[type=\"password\"]"
			])) || Boolean(input([
				"#auth-mfa-otpcode",
				"input[name=\"otpCode\"]",
				"input[autocomplete=\"one-time-code\"]",
				"input[inputmode=\"numeric\"]"
			]));
			const leaveReason = !leavingLogout && onLogoutIntercept ? "intercept" : !leavingLogout && document.readyState === "complete" ? "ready-complete" : document.readyState !== "complete" ? "wait-load" : "poll";
			// #region agent log
			{
				const hits = shellSelectorHits();
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
						location: "accountAutomation.ts:logout-branch",
						message: "logout stage tick",
						data: {
							stage: job.stage,
							leavingLogout,
							leaveReason,
							pathname: location.pathname,
							readyState: document.readyState,
							onLogoutIntercept,
							authenticatedUi: hasAuthenticatedSellerUi(),
							modernHits: hits.modernHits,
							classicHits: hits.classicHits
						},
						timestamp: Date.now()
					})
				}).catch(() => {});
			}
			// #endregion
			if (!leavingLogout && onLogoutIntercept) {
				await leaveLogout(job.id);
			} else if (!leavingLogout && document.readyState === "complete") {
				await leaveLogout(job.id);
			} else if (document.readyState !== "complete") {
				window.addEventListener("load", () => void run(), { once: true });
			}
			window.setTimeout(() => void run(), 1e3);
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
			await activate(job.id, button(["#continue", "input[name=\"continue\"]"], /continue/iu), "continue", "Amazon’s Continue button was not found.");
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
			setWorkflowStatus("Entering the saved password…");
			const value = await requestSecret(job.id, "password");
			if (!value) return;
			fill(password, value);
			await activate(job.id, button([
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
			await activate(job.id, button([
				"#auth-signin-button",
				"input[type=\"submit\"]",
				"button[type=\"submit\"]"
			], /sign in|submit|continue/iu), "otp-submit", "Amazon’s verification-code submit button was not found.");
			markStageSubmitted("otp");
			return;
		}
		{
			const ready = isReadyForStoreNavigation();
			const allowed = shouldCompleteAuthenticatedSession(job.stage);
			// #region agent log
			{
				const hits = shellSelectorHits();
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
						location: "accountAutomation.ts:complete-gate",
						message: "complete gate evaluated",
						data: {
							stage: job.stage,
							pathname: location.pathname,
							ready,
							allowed,
							willComplete: ready && allowed,
							modernHits: hits.modernHits,
							classicHits: hits.classicHits
						},
						timestamp: Date.now()
					})
				}).catch(() => {});
			}
			// #endregion
			if (ready && allowed) {
				setWorkflowStatus("Signed in. Opening the selected store…");
				const completed = await send({
					type: "ACCOUNT_AUTOMATION_COMPLETE",
					jobId: job.id
				});
				if (!completed.ok) throw new Error(completed.error);
				return;
			}
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

})();
