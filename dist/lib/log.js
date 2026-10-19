export const LOG_ENTRIES_MESSAGE = "LOG_ENTRIES";
export const LOGS_GET_MESSAGE = "LOGS_GET";
export const LOGS_CLEAR_MESSAGE = "LOGS_CLEAR";
export const LOGS_STORAGE_KEY = "s4e-logs";
export const MAX_STORED_LOG_ENTRIES = 1e3;
/** Requests slower than this are logged individually. */
export const SLOW_REQUEST_MS = 5e3;
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
export function setLogSink(sink) {
	logSink = sink;
}
export function logNow() {
	return typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
}
function clipLogText(value, limit = LOG_TEXT_LIMIT) {
	return value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
}
export function errorMessage(error, fallback = "Unknown error.") {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return fallback;
}
/** A compact, serializable description of an error for log data. */
export function describeError(error) {
	if (!(error instanceof Error)) return { message: clipLogText(errorMessage(error)) };
	const described = {
		name: error.name,
		message: clipLogText(errorMessage(error))
	};
	if (error.stack) described.stack = clipLogText(error.stack, LOG_STACK_LIMIT);
	return described;
}
function writeLogEntry(entry) {
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
export function createLogger(ctx, run) {
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
export function createLogRunId(prefix) {
	return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
/** Sends entries to the background worker in small batches. Install with setLogSink. */
export function forwardLogsToBackground() {
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
export function sanitizeLogEntry(value) {
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
	if (typeof record.ms === "number" && Number.isFinite(record.ms)) entry.ms = record.ms;
	if (record.data && typeof record.data === "object") {
		let serialized = "";
		try {
			serialized = JSON.stringify(record.data);
		} catch {
			serialized = "";
		}
		entry.data = serialized.length <= LOG_DATA_LIMIT ? record.data : {
			truncated: true,
			preview: clipLogText(serialized, LOG_TEXT_LIMIT)
		};
	}
	return entry;
}
export function sanitizeLogEntries(value) {
	if (!Array.isArray(value)) return [];
	return value.slice(0, LOG_MESSAGE_ENTRY_LIMIT).map(sanitizeLogEntry).filter((entry) => entry !== undefined);
}
/** A ring buffer of the newest entries in extension storage. Only the background worker writes it. */
export function createLogStore(storage, maxEntries = MAX_STORED_LOG_ENTRIES) {
	let pending = [];
	let timer;
	let chain = Promise.resolve();
	const readStored = async () => {
		const stored = (await storage.get(LOGS_STORAGE_KEY))[LOGS_STORAGE_KEY];
		return Array.isArray(stored) ? stored : [];
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
			pending.push(...entries);
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
export function requestEndpoint(input, init) {
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
export function createRequestMonitor(fetchImpl, logger, slowMs = SLOW_REQUEST_MS) {
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
