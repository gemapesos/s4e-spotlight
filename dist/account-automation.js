(function () {
const LOG_ENTRIES_MESSAGE = "LOG_ENTRIES";
const LOGS_GET_MESSAGE = "LOGS_GET";
const LOGS_CLEAR_MESSAGE = "LOGS_CLEAR";
const LOGS_STORAGE_KEY = "s4e-logs";
const MAX_STORED_LOG_ENTRIES = 1e3;
/** Requests slower than this are logged individually. */
const SLOW_REQUEST_MS = 5e3;
const LOG_PREFIX = "[S4E]";
const LOG_TEXT_LIMIT = 300;
const LOG_STACK_LIMIT = 600;
const LOG_DATA_LIMIT = 4e3;
const LOG_FORWARD_DELAY_MS = 400;
const LOG_FORWARD_BATCH = 25;
const LOG_MESSAGE_ENTRY_LIMIT = 100;
const LOG_STORE_FLUSH_MS = 1e3;
/** Individual failure entries per endpoint before the rest are only counted. */
const REQUEST_FAILURE_LOG_LIMIT = 5;
let logSink = null;
const logToConsole = !(typeof process !== "undefined" && process.env?.VITEST);
/** Routes every entry written in this context to `sink`, or stops routing when null. */
function setLogSink(sink) {
	logSink = sink;
}
function logNow() {
	return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}
function clipLogText(value, limit = LOG_TEXT_LIMIT) {
	const safe = value.replace(/otpauth:\/\/[^\s"'<>]+/giu, "[REDACTED]");
	return safe.length > limit ? `${safe.slice(0, limit - 1)}…` : safe;
}
/** Scrub before console output as well as before forwarding or storing an entry. */
function redactLogData(value, seen = new WeakSet(), depth = 0) {
	if (typeof value === "string") return value.replace(/otpauth:\/\/[^\s"'<>]+/giu, "[REDACTED]");
	if (!value || typeof value !== "object") return value;
	if (seen.has(value) || depth >= 8) return "[OMITTED]";
	seen.add(value);
	if (Array.isArray(value)) return value.map((item) => redactLogData(item, seen, depth + 1));
	return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, /password|passphrase|secret|otpauth|authorization|cookie|accesstoken|refreshtoken|apikey|privatekey|^(otp|otpcode)$/iu.test(key.replace(/[^a-z]/giu, "")) ? "[REDACTED]" : redactLogData(item, seen, depth + 1)]));
}
function errorMessage(error, fallback = "Unknown error.") {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return fallback;
}
/** A compact, serializable description of an error for log data. */
function describeError(error) {
	if (!(error instanceof Error)) return { message: clipLogText(errorMessage(error)) };
	const described = {
		name: error.name,
		message: clipLogText(errorMessage(error))
	};
	if (error.stack) described.stack = clipLogText(error.stack, LOG_STACK_LIMIT);
	return described;
}
function writeLogEntry(entry) {
	const safe = sanitizeLogEntry(entry);
	if (!safe) return;
	entry = safe;
	if (logToConsole) {
		const write = entry.level === "error" ? console.error : entry.level === "warn" ? console.warn : console.info;
		const timing = entry.ms === undefined ? "" : ` ${entry.ms}ms`;
		const run = entry.run ? ` [${entry.run}]` : "";
		write(`${LOG_PREFIX} ${entry.ctx} · ${entry.event}${timing}${run}`, ...entry.data ? [entry.data] : []);
	}
	try {
		logSink?.(entry);
	} catch {}
}
function createLogger(ctx, run) {
	const write = (level, event, data, ms) => {
		const entry = {
			t: Date.now(),
			level,
			ctx,
			event
		};
		if (run) entry.run = run;
		if (ms !== undefined) entry.ms = ms;
		if (data && Object.keys(data).length > 0) entry.data = data;
		writeLogEntry(entry);
	};
	return {
		info: (event, data) => write("info", event, data),
		warn: (event, data) => write("warn", event, data),
		error: (event, data) => write("error", event, data),
		time: (event, data) => {
			const startedAt = logNow();
			return (more, level = "info") => {
				const elapsed = Math.round(logNow() - startedAt);
				write(level, event, data || more ? {
					...data,
					...more
				} : undefined, elapsed);
				return elapsed;
			};
		},
		withRun: (nextRun) => createLogger(ctx, nextRun)
	};
}
function createLogRunId(prefix) {
	return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
/** Sends entries to the background worker in small batches. Install with setLogSink. */
function forwardLogsToBackground() {
	let queue = [];
	let timer;
	const flush = () => {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
		const entries = queue;
		queue = [];
		if (entries.length === 0 || typeof chrome === "undefined" || !chrome.runtime?.id) return;
		try {
			void chrome.runtime.sendMessage({
				type: LOG_ENTRIES_MESSAGE,
				entries
			}).catch(() => undefined);
		} catch {}
	};
	return (entry) => {
		queue.push(entry);
		if (queue.length >= LOG_FORWARD_BATCH) flush();
		else timer ??= setTimeout(flush, LOG_FORWARD_DELAY_MS);
	};
}
/** Validates an entry received from another context and caps its size. */
function sanitizeLogEntry(value) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const levels = [
		"info",
		"warn",
		"error"
	];
	if (typeof record.t !== "number" || !levels.includes(record.level)) return undefined;
	if (typeof record.ctx !== "string" || typeof record.event !== "string") return undefined;
	const entry = {
		t: record.t,
		level: record.level,
		ctx: clipLogText(record.ctx, 40),
		event: clipLogText(record.event, 120)
	};
	if (typeof record.run === "string") entry.run = clipLogText(record.run, 60);
	if (typeof record.tab === "number" && Number.isInteger(record.tab) && record.tab >= 0) entry.tab = record.tab;
	if (typeof record.ms === "number" && Number.isFinite(record.ms)) entry.ms = record.ms;
	if (record.data && typeof record.data === "object") {
		let serialized = "";
		try {
			serialized = JSON.stringify(redactLogData(record.data));
		} catch {
			serialized = "";
		}
		entry.data = serialized.length <= LOG_DATA_LIMIT ? JSON.parse(serialized || "{}") : {
			truncated: true,
			preview: clipLogText(serialized, LOG_TEXT_LIMIT)
		};
	}
	return entry;
}
function sanitizeLogEntries(value) {
	if (!Array.isArray(value)) return [];
	return value.slice(0, LOG_MESSAGE_ENTRY_LIMIT).map(sanitizeLogEntry).filter((entry) => entry !== undefined);
}
/** A ring buffer of the newest entries in extension storage. Only the background worker writes it. */
function createLogStore(storage, maxEntries = MAX_STORED_LOG_ENTRIES) {
	let pending = [];
	let timer;
	let chain = Promise.resolve();
	const readStored = async () => {
		const stored = (await storage.get(LOGS_STORAGE_KEY))[LOGS_STORAGE_KEY];
		// Apply the current policy to entries saved by older extension versions as well.
		return Array.isArray(stored) ? stored.map(sanitizeLogEntry).filter((entry) => entry !== undefined) : [];
	};
	const enqueue = (task) => {
		const next = chain.then(task, task);
		chain = next.catch(() => undefined);
		return next;
	};
	const flush = () => {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
		return enqueue(async () => {
			const batch = pending;
			pending = [];
			if (batch.length === 0) return;
			const next = [...await readStored(), ...batch].slice(-maxEntries);
			await storage.set({ [LOGS_STORAGE_KEY]: next });
		});
	};
	return {
		append: (entries) => {
			if (entries.length === 0) return;
			pending.push(...entries.map(sanitizeLogEntry).filter((entry) => entry !== undefined));
			timer ??= setTimeout(() => void flush().catch(() => undefined), LOG_STORE_FLUSH_MS);
		},
		read: async () => {
			await flush().catch(() => undefined);
			return enqueue(readStored);
		},
		clear: async () => {
			if (timer !== undefined) clearTimeout(timer);
			timer = undefined;
			pending = [];
			await enqueue(() => storage.remove(LOGS_STORAGE_KEY));
		}
	};
}
function requestUrl(input) {
	if (typeof input === "string") return input;
	if (input instanceof URL) return input.href;
	return input.url;
}
/** "METHOD /path" with ID-like path segments collapsed and the GraphQL operation appended. */
function requestEndpoint(input, init) {
	const method = (init?.method ?? (typeof input === "object" && "method" in input ? input.method : "GET")).toUpperCase();
	let path = requestUrl(input);
	try {
		path = new URL(path, "https://sellercentral.amazon.com").pathname;
	} catch {
		path = path.split("?")[0];
	}
	path = path.split("/").map((segment) => segment.length >= 6 && /\d/.test(segment) ? ":id" : segment).join("/");
	const operation = typeof init?.body === "string" ? /"operationName":"([^"]+)"/.exec(init.body)?.[1] : undefined;
	return `${method} ${path}${operation ? ` ${operation}` : ""}`;
}
const RESPONSE_BODY_READERS = [
	"arrayBuffer",
	"blob",
	"bytes",
	"formData",
	"json",
	"text"
];
/** Calls `onRead` once, when the first body read (json(), text(), and so on) settles. */
function onResponseBodyRead(response, onRead) {
	let waiting = true;
	const target = response;
	try {
		for (const method of RESPONSE_BODY_READERS) {
			const read = target[method];
			if (typeof read !== "function") continue;
			target[method] = (...args) => Promise.resolve(Reflect.apply(read, response, args)).finally(() => {
				if (!waiting) return;
				waiting = false;
				onRead();
			});
		}
	} catch {}
}
/**
* Wraps fetch to time each request by endpoint. Slow and failed requests are logged as they
* happen; summary() reports counts, latency, body time, and how much the requests overlapped.
* Latency runs from sending the request to receiving the response headers; body time runs from
* the headers until the caller finishes reading the body.
*/
function createRequestMonitor(fetchImpl, logger, slowMs = SLOW_REQUEST_MS) {
	const endpoints = new Map();
	const statsFor = (key) => {
		let stats = endpoints.get(key);
		if (!stats) {
			stats = {
				n: 0,
				failed: 0,
				statuses: {},
				totalMs: 0,
				maxMs: 0,
				bodyMs: 0,
				bodies: 0,
				firstStart: Number.POSITIVE_INFINITY,
				lastEnd: 0,
				inFlight: 0,
				maxInFlight: 0,
				loggedFailures: 0
			};
			endpoints.set(key, stats);
		}
		return stats;
	};
	const monitored = async (input, init) => {
		const endpoint = requestEndpoint(input, init);
		const stats = statsFor(endpoint);
		const startedAt = logNow();
		stats.n += 1;
		stats.firstStart = Math.min(stats.firstStart, startedAt);
		stats.inFlight += 1;
		stats.maxInFlight = Math.max(stats.maxInFlight, stats.inFlight);
		const finish = (status, failed) => {
			const endedAt = logNow();
			const elapsed = endedAt - startedAt;
			stats.inFlight -= 1;
			stats.totalMs += elapsed;
			stats.maxMs = Math.max(stats.maxMs, elapsed);
			stats.lastEnd = Math.max(stats.lastEnd, endedAt);
			stats.statuses[status] = (stats.statuses[status] ?? 0) + 1;
			const ms = Math.round(elapsed);
			if (failed) {
				stats.failed += 1;
				if (stats.loggedFailures < REQUEST_FAILURE_LOG_LIMIT) {
					stats.loggedFailures += 1;
					logger?.warn("request.failed", {
						endpoint,
						status,
						ms
					});
				}
			} else if (elapsed >= slowMs) {
				logger?.warn("request.slow", {
					endpoint,
					status,
					ms
				});
			}
			return endedAt;
		};
		try {
			const response = await fetchImpl(input, init);
			const headersAt = finish(String(response.status), !response.ok);
			onResponseBodyRead(response, () => {
				const readAt = logNow();
				stats.bodies += 1;
				stats.bodyMs += readAt - headersAt;
				stats.lastEnd = Math.max(stats.lastEnd, readAt);
			});
			return response;
		} catch (error) {
			// A request the caller cancelled because it no longer needed it isn't a failure.
			const aborted = error instanceof Error && error.name === "AbortError";
			finish(aborted ? "aborted" : "network", !aborted);
			throw error;
		}
	};
	return {
		fetch: monitored,
		summary: () => {
			const summary = {};
			for (const [endpoint, stats] of endpoints) {
				const wallMs = Math.max(0, stats.lastEnd - stats.firstStart);
				const statuses = Object.keys(stats.statuses).some((status) => status !== "200") ? stats.statuses : undefined;
				summary[endpoint] = {
					n: stats.n,
					failed: stats.failed,
					...statuses ? { statuses } : {},
					avgMs: stats.n ? Math.round(stats.totalMs / stats.n) : 0,
					maxMs: Math.round(stats.maxMs),
					...stats.bodies ? { bodyMs: Math.round(stats.bodyMs / stats.bodies) } : {},
					wallMs: Math.round(wallMs),
					parallelism: wallMs > 0 ? Math.round((stats.totalMs + stats.bodyMs) / wallMs * 10) / 10 : 1,
					maxInFlight: stats.maxInFlight
				};
			}
			return summary;
		}
	};
}

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
const LOGIN_FORM_SELECTORS = [
	"#ap_email",
	"input[name=\"email\"]",
	"input[type=\"email\"]",
	"input[autocomplete=\"username\"]",
	"#ap_password",
	"input[name=\"password\"]",
	"input[type=\"password\"]",
	"#auth-mfa-otpcode",
	"input[name=\"otpCode\"]",
	"input[autocomplete=\"one-time-code\"]",
	"input[inputmode=\"numeric\"]"
];
function visible(element) {
	return element instanceof HTMLElement && element.offsetParent !== null;
}
function hasAuthenticatedSellerUi(root = document) {
	const isVisible = (selector) => visible(root.querySelector(selector));
	if (MODERN_SHELL_SELECTORS.some(isVisible)) return true;
	return CLASSIC_SHELL_SELECTORS.filter(isVisible).length >= 2;
}
function hasSellerCentralLoginForm(root = document) {
	return LOGIN_FORM_SELECTORS.some((selector) => visible(root.querySelector(selector)));
}
function sellerCentralSessionStatus(pathname = location.pathname, root = document, readyState = typeof document !== "undefined" ? document.readyState : "loading") {
	if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
		return {
			loggedInToStore: false,
			settled: true
		};
	}
	if (hasAuthenticatedSellerUi(root)) return {
		loggedInToStore: true,
		settled: true
	};
	if (hasSellerCentralLoginForm(root)) return {
		loggedInToStore: false,
		settled: true
	};
	// A fully loaded page with no store shell and no login form is signed out; don't wait out the probe.
	return {
		loggedInToStore: false,
		settled: readyState === "complete"
	};
}

const STATUS_ID = "s4e-account-switch-status";
const documentStartedAt = Date.now();
const attempts = new Map();
let inFlight = null;
let leavingLogout = false;
const RETRY_DELAY_MS = 5e3;
const MAX_ATTEMPTS = 2;
const STEP_TIMEOUT_MS = 9e4;
const CAPTCHA_TEXT_SCAN_INTERVAL_MS = 3e3;
let lastCaptchaTextScanAt = 0;
let lastCaptchaTextScanResult = false;
let runTimer;
let waitingForLoad = false;
let reportedWaitingPath = null;
let manualSignIn = false;
let stalledHiddenStage = null;
const automationLog = createLogger("automation");
const EMAIL_INPUT_SELECTORS = [
	"#ap_email",
	"input[name=\"email\"]",
	"input[type=\"email\"]",
	"input[autocomplete=\"username\"]"
];
const PASSWORD_INPUT_SELECTORS = [
	"#ap_password",
	"input[name=\"password\"]",
	"input[type=\"password\"]"
];
const OTP_INPUT_SELECTORS = [
	"#auth-mfa-otpcode",
	"input[name=\"otpCode\"]",
	"input[autocomplete=\"one-time-code\"]",
	"input[inputmode=\"numeric\"]"
];
async function send(message) {
	return chrome.runtime.sendMessage(message);
}
/** Runs the workflow again after `delayMs`, replacing any run already scheduled so only one loop polls. */
function scheduleRun(delayMs) {
	if (runTimer !== undefined) window.clearTimeout(runTimer);
	runTimer = window.setTimeout(() => {
		runTimer = undefined;
		void run();
	}, delayMs);
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
/** The confirmed store document stays open after the switch, so it must not keep the overlay. */
function clearWorkflowStatus() {
	document.getElementById(STATUS_ID)?.remove();
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
/** Amazon wraps each submit input in a same-id span; a page-level click must reach the input itself. */
function submitControl(element) {
	if (element instanceof HTMLInputElement || element instanceof HTMLButtonElement) return element;
	return element.querySelector("input[type=\"submit\"], button[type=\"submit\"], button, input[type=\"button\"]") ?? element;
}
async function activate(jobId, element, action, missingMessage) {
	if (!element) throw new Error(missingMessage);
	if (!visible(element)) throw new Error(`${missingMessage} The control is not visible.`);
	// A sign-in window covered by other windows is hidden, and Chrome does not deliver debugger
	// input to hidden pages, so submit through the page there. It also avoids the debugging bar.
	if (document.visibilityState === "hidden") {
		automationLog.withRun(jobId).info("automation.click", {
			action,
			mode: "page"
		});
		submitControl(element).click();
		return;
	}
	const rect = element.getBoundingClientRect();
	const finite = [
		rect.left,
		rect.top,
		rect.width,
		rect.height
	].every(Number.isFinite);
	if (!finite || rect.width <= 0 || rect.height <= 0) {
		throw new Error(`${missingMessage} The control has invalid click coordinates.`);
	}
	const click = () => send({
		type: "ACCOUNT_AUTOMATION_CLICK",
		jobId,
		action,
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2
	});
	const response = await click();
	// Other extensions own their UI. Leave it intact when Chrome refuses the attachment.
	if (!response.ok && isDebuggerBlocked(response.error)) {
		automationLog.warn("account.switch.debuggerBlocked", { action });
		throw new Error("Another Chrome extension is preventing automated sign-in. Its interface was left open. Complete sign-in manually, or resolve the conflict and retry the switch.");
	}
	if (!response.ok) throw new Error(response.error ?? "Chrome could not activate Amazon’s login control.");
}
function isDebuggerBlocked(error) {
	return Boolean(error?.includes("chrome-extension:// URL of different extension"));
}
function prepareStage(stage, failureMessage) {
	if (inFlight?.stage !== stage) {
		inFlight = null;
		return true;
	}
	const elapsed = Date.now() - inFlight.startedAt;
	if (elapsed < RETRY_DELAY_MS) {
		scheduleRun(RETRY_DELAY_MS - elapsed);
		return false;
	}
	if ((attempts.get(stage) ?? 0) >= MAX_ATTEMPTS) {
		if (document.visibilityState === "hidden") stalledHiddenStage = stage;
		throw new Error(failureMessage);
	}
	inFlight = null;
	return true;
}
/** Needs attention shows the window; once visible, trusted clicks work, so retry the stalled step. */
function retryStalledStageWhenVisible() {
	const stage = stalledHiddenStage;
	if (!stage) return;
	stalledHiddenStage = null;
	document.addEventListener("visibilitychange", function onVisible() {
		if (document.visibilityState !== "visible") return;
		document.removeEventListener("visibilitychange", onVisible);
		attempts.delete(stage);
		inFlight = null;
		manualSignIn = false;
		scheduleRun(0);
	});
}
function markStageSubmitted(stage) {
	attempts.set(stage, (attempts.get(stage) ?? 0) + 1);
	inFlight = {
		stage,
		startedAt: Date.now()
	};
	scheduleRun(RETRY_DELAY_MS);
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
function hasManualVerification() {
	return /^\/ap\/(?:cvf|mfa|challenge|dcq|pv)(?:\/|$)/u.test(location.pathname) && document.readyState === "complete" && !input(EMAIL_INPUT_SELECTORS) && !input(PASSWORD_INPUT_SELECTORS) && !input(OTP_INPUT_SELECTORS);
}
async function requestAttention(jobId, reason) {
	if (!attempts.has(reason)) {
		attempts.set(reason, 1);
		await send({
			type: "ACCOUNT_AUTOMATION_PAUSED",
			jobId,
			reason
		});
	}
	scheduleRun(1500);
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
	if (!response.ok) throw new Error(response.error ?? "The saved account details are unavailable.");
	if (response.waitMs) {
		setWorkflowStatus("Waiting for a fresh verification code…");
		scheduleRun(response.waitMs);
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
/** Ends the switch with a visible error; the background worker logs the reason. */
async function failWorkflow(jobId, error) {
	const message = errorMessage(error, "Account switching failed.");
	setWorkflowStatus(message, "error");
	retryStalledStageWhenVisible();
	// Report once per document; later polls keep retrying without flooding the log.
	if (!manualSignIn) {
		manualSignIn = true;
		await send({
			type: "ACCOUNT_AUTOMATION_ERROR",
			jobId,
			error: message
		});
	}
	scheduleRun(1500);
}
function onLogoutIntercept() {
	return location.pathname.startsWith("/ap/") || location.pathname.includes("signin") || Boolean(input(EMAIL_INPUT_SELECTORS) || input(PASSWORD_INPUT_SELECTORS) || input(OTP_INPUT_SELECTORS));
}
async function run() {
	const response = await send({ type: "ACCOUNT_AUTOMATION_GET_JOB" });
	const job = response.job;
	if (!response.ok || !job) {
		clearWorkflowStatus();
		return;
	}
	const stage = job.resumeStage ?? job.stage;
	try {
		if (hasCaptcha()) {
			setWorkflowStatus("Amazon needs you to complete the CAPTCHA. Automation will resume afterward.");
			await requestAttention(job.id, "captcha");
			return;
		}
		if (hasManualVerification()) {
			setWorkflowStatus("Amazon needs you to complete verification in this window. Automation will resume afterward.");
			await requestAttention(job.id, "verification");
			return;
		}
		if (stage === "store") {
			if (hasAuthenticatedSellerUi() && document.readyState === "complete") {
				setWorkflowStatus("Store loaded. Finishing the switch…");
				const ready = await send({
					type: "ACCOUNT_AUTOMATION_STORE_READY",
					jobId: job.id
				});
				if (!ready.ok) throw new Error(ready.error ?? "Couldn’t finish the store switch.");
				if (ready.waitMs) scheduleRun(ready.waitMs);
				else clearWorkflowStatus();
				return;
			}
			if (location.pathname.startsWith("/ap/") && (input(EMAIL_INPUT_SELECTORS) || input(PASSWORD_INPUT_SELECTORS) || input(OTP_INPUT_SELECTORS))) {
				const reauth = await send({
					type: "ACCOUNT_AUTOMATION_REAUTH",
					jobId: job.id
				});
				if (!reauth.ok) throw new Error(reauth.error ?? "Sign in to this account again.");
				return;
			}
			if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) throw new Error("The selected store did not finish loading. Review this window or cancel and retry.");
			setWorkflowStatus("Opening and checking the selected store…");
			scheduleRun(1e3);
			return;
		}
		if (manualSignIn) {
			if (hasAuthenticatedSellerUi() || location.pathname.startsWith("/account-switcher/")) {
				const completed = await send({
					type: "ACCOUNT_AUTOMATION_COMPLETE",
					jobId: job.id
				});
				if (!completed.ok) throw new Error(completed.error ?? "Couldn’t open the selected store.");
			} else scheduleRun(1500);
			return;
		}
		if (hasAuthError()) {
			await failWorkflow(job.id, "Amazon rejected the login details. Review the page or edit the saved account.");
			return;
		}
		// Never fill credentials on Amazon's logout re-auth (return_to=sign-out); wait for canonical sign-in navigation.
		if (stage === "logout" || leavingLogout) {
			if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) {
				throw new Error("Amazon did not finish signing out. Cancel the switch and try again.");
			}
			setWorkflowStatus("Signing out of the current Seller Central account…");
			if (!leavingLogout && (onLogoutIntercept() || document.readyState === "complete")) {
				await leaveLogout(job.id);
			} else if (document.readyState !== "complete" && !waitingForLoad) {
				waitingForLoad = true;
				window.addEventListener("load", () => scheduleRun(0), { once: true });
			}
			scheduleRun(1e3);
			return;
		}
		const email = input(EMAIL_INPUT_SELECTORS);
		if (email) {
			if (!prepareStage("email", "Amazon’s Continue button did not advance the login.")) return;
			setWorkflowStatus("Entering the saved account email…");
			const value = await requestSecret(job.id, "email");
			if (!value) return;
			fill(email, value);
			const next = button(["#continue", "input[name=\"continue\"]"], /continue/iu);
			await activate(job.id, next, "continue", "Amazon’s Continue button was not found.");
			markStageSubmitted("email");
			return;
		}
		const password = input(PASSWORD_INPUT_SELECTORS);
		if (password) {
			if (!prepareStage("password", "Amazon’s password button did not advance the login.")) return;
			setWorkflowStatus("Entering the saved password…");
			const value = await requestSecret(job.id, "password");
			if (!value) return;
			fill(password, value);
			const submit = button([
				"#signInSubmit",
				"input[name=\"signIn\"]",
				"button[type=\"submit\"]"
			], /sign in|next|continue/iu);
			await activate(job.id, submit, "password-submit", "Amazon’s password submit button was not found.");
			markStageSubmitted("password");
			return;
		}
		const otp = input(OTP_INPUT_SELECTORS);
		if (otp) {
			if (!prepareStage("otp", "Amazon’s verification-code button did not advance the login.")) return;
			setWorkflowStatus("Generating and entering a fresh verification code…");
			const value = await requestSecret(job.id, "otp");
			if (!value) return;
			fill(otp, value);
			const submit = button([
				"#auth-signin-button",
				"input[type=\"submit\"]",
				"button[type=\"submit\"]"
			], /sign in|submit|continue/iu);
			await activate(job.id, submit, "otp-submit", "Amazon’s verification-code submit button was not found.");
			markStageSubmitted("otp");
			return;
		}
		if (isReadyForStoreNavigation() && (job.stage === "paused" || shouldCompleteAuthenticatedSession(stage))) {
			setWorkflowStatus("Signed in. Opening the selected store…");
			const completed = await send({
				type: "ACCOUNT_AUTOMATION_COMPLETE",
				jobId: job.id
			});
			if (!completed.ok) throw new Error(completed.error ?? "Couldn’t open the selected store.");
			return;
		}
		if (Date.now() - documentStartedAt > STEP_TIMEOUT_MS) throw new Error("Amazon’s login page did not match a supported step.");
		if (reportedWaitingPath !== location.pathname) {
			// An unrecognized page is the first sign that Amazon changed its login flow.
			reportedWaitingPath = location.pathname;
			automationLog.withRun(job.id).info("automation.waiting", {
				stage: job.stage,
				path: location.pathname,
				title: document.title
			});
		}
		setWorkflowStatus("Waiting for Amazon’s next login step…");
		scheduleRun(1e3);
	} catch (error) {
		await failWorkflow(job.id, error);
	}
}
if (typeof chrome !== "undefined" && chrome.runtime?.id) setLogSink(forwardLogsToBackground());
void run();

})();
