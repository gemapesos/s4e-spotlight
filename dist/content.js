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

const MONTH_ABBREVIATIONS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec"
];
function twoDigits(value) {
	return String(value).padStart(2, "0");
}
/** dd-Mmm-yyyy in local time, such as 14-Aug-2026. */
function formatDayMonthYear(date) {
	return `${twoDigits(date.getDate())}-${MONTH_ABBREVIATIONS[date.getMonth()]}-${date.getFullYear()}`;
}
/** dd-Mmm-yyyy HH:mm:ss in UTC, such as 14-Aug-2026 09:05:00. */
function formatUtcDateTime(date) {
	const day = `${twoDigits(date.getUTCDate())}-${MONTH_ABBREVIATIONS[date.getUTCMonth()]}-${date.getUTCFullYear()}`;
	return `${day} ${twoDigits(date.getUTCHours())}:${twoDigits(date.getUTCMinutes())}:${twoDigits(date.getUTCSeconds())}`;
}

function isPaletteShortcut(event) {
	const isSlash = event.code === "Slash" || event.key === "/";
	const hasPrimaryModifier = event.metaKey || event.ctrlKey;
	return isSlash && hasPrimaryModifier && !event.altKey && !event.shiftKey;
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

const UNFULFILLABLE_GQL_URL = "https://sellercentral.amazon.com/myinventory/gql";
const UNFULFILLABLE_INVENTORIES_URL = "https://sellercentral.amazon.com/recovery/inventories";
const REMOVAL_ORDER_REPORT_COLUMNS = [
	"completed_qty",
	"order_status",
	"msku",
	"fnsku",
	"in_process_qty",
	"cancelled_qty",
	"request_qty",
	"amazon_order_id",
	"order_source",
	"creation_date",
	"order_type",
	"removal_order_id"
];
const REMOVAL_ORDER_REPORT_URL = `https://sellercentral.amazon.com/reportcentral/api/v1/getOnlineReportRecords?${new URLSearchParams([
	["type", "RemovalOrderDetail"],
	["size", "50"],
	["offset", "0"],
	["sDate", ""],
	["eDate", ""],
	["days", "30"],
	["sDateOff", "0"],
	["eDateOff", "0"],
	...REMOVAL_ORDER_REPORT_COLUMNS.map((column) => ["cols", column]),
	["sort", JSON.stringify({
		keyName: "creation_date",
		sortingOrder: "DESC"
	})]
])}`;
const REMOVAL_ORDER_ID_PATTERN = /S4E[A-Z]{2}\d{4}/;
const INVENTORY_MANAGE_URL = "https://sellercentral.amazon.com/myinventory/inventory";
const UNFULFILLABLE_PAGE_SIZE = 250;
const UNFULFILLABLE_MAX_PAGES = 40;
const UNFULFILLABLE_INVENTORIES_BATCH_SIZE = 50;
const UNFULFILLABLE_SHEET_HEADERS = [
	"SKU",
	"ASIN",
	"FNSKU",
	"Title",
	"Status",
	"Price",
	"Currency",
	"Unfulfillable",
	"Carrier Damaged",
	"Customer Damaged",
	"Defective",
	"Expired",
	"Warehouse Damaged",
	"Distributor Damaged",
	"Removal Status",
	"Last Updated",
	"Image URL"
];
const LISTING_FIELDS = `listings {
      coreListingFields {
        sku
        asin
        fnSku
        __typename
      }
      listingData {
        title
        lastUpdated
        __typename
      }
      imageUrl
      status {
        status
        __typename
      }
      availability {
        unfulfillable
        unfulfillableDetails {
          expired
          damagedByCarrier
          damagedByCustomer
          damagedByDistributor
          damagedByWarehouse
          defective
          __typename
        }
        __typename
      }
      offers {
        offerId
        price {
          price {
            amount
            currencyUnit
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }`;
const GET_LISTINGS_V2_QUERY = `query GetListingsV2($pagination: PaginationInput, $usecase: UsecaseInput!, $sortRequest: SortRequest!, $searchTerm: SearchTerm, $multiSelectFilters: [MultiSelectFilter!], $multiSKUList: [String!]) {
  listingsV2(
    usecase: $usecase
    pagination: $pagination
    sortRequest: $sortRequest
    searchTerm: $searchTerm
    multiSelectFilters: $multiSelectFilters
    multiSKUList: $multiSKUList
  ) {
    ${LISTING_FIELDS}
    count
    debugInfo
    __typename
  }
}`;
const REMOVAL_STATUS_ELIGIBLE = "Total available for removal";
const REMOVAL_STATUS_UNKNOWN = "unknown ineligible reason";
const REMOVAL_STATUS_UNAVAILABLE = "Couldn’t load removal status";
const UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE = "Some unfulfillable listings could not be loaded. This sheet includes only the listings that were obtainable.";
const UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE = `Removal status could not be loaded for some SKUs. Those rows are marked “${REMOVAL_STATUS_UNAVAILABLE}”.`;
const REMOVAL_STATUS_BY_CODE = {
	InventoryInPendingRequest: "Inventory already scheduled for removal - no further action required",
	InventoryIsBound: "Inventory temporarily unavailable for removal as a result of an in-progress transaction or other process – please check again in a few days.",
	InventoryIsWarehouseDamaged: "Inventory damaged in the fulfillment center - no action required",
	InventoryIsAllocated: "Inventory is being processed (for order, customer return, or recall) - please try again in a few days",
	InventoryUnavailable: "Inventory Unavailable",
	InventoryIsInBoundProcessing: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryIsDcTransfer: "Inventory is not available for removal; please try again in two days or contact Seller Support.",
	InventoryInUnsupportedFc: "Inventory in location that cannot process removals - please contact us",
	InventoryInUnsupportedBzFc: "Inventory in a Bonded Zone location that cannot process removals - please contact us",
	InventoryInPickupRemovalUnsupportedFc: "Inventory in location that cannot process pickup removals - please process these units through other available channels",
	InventoryIsHazmatItem: "Inventory is classified as Hazardous Material (Hazmat) - please contact us",
	InventorySubjectToLendingRestriction: "Inventory cannot be removed due to Lending restrictions - please contact Amazon Lending"
};
const REMOVAL_STATUS_ORDER = [
	REMOVAL_STATUS_ELIGIBLE,
	REMOVAL_STATUS_BY_CODE.InventoryInPendingRequest,
	REMOVAL_STATUS_BY_CODE.InventoryIsBound,
	REMOVAL_STATUS_BY_CODE.InventoryIsWarehouseDamaged,
	REMOVAL_STATUS_BY_CODE.InventoryIsAllocated,
	REMOVAL_STATUS_BY_CODE.InventoryUnavailable,
	REMOVAL_STATUS_BY_CODE.InventoryIsInBoundProcessing,
	REMOVAL_STATUS_BY_CODE.InventoryInUnsupportedFc,
	REMOVAL_STATUS_BY_CODE.InventoryInUnsupportedBzFc,
	REMOVAL_STATUS_BY_CODE.InventoryInPickupRemovalUnsupportedFc,
	REMOVAL_STATUS_BY_CODE.InventoryIsHazmatItem,
	REMOVAL_STATUS_BY_CODE.InventorySubjectToLendingRestriction,
	REMOVAL_STATUS_UNKNOWN
];
function readAntiCsrfToken(root = document, cookie = typeof document !== "undefined" ? document.cookie : "") {
	const meta = "querySelector" in root ? root.querySelector("meta[name=\"anti-csrftoken-a2z\"]") : null;
	const fromMeta = meta?.getAttribute("content")?.trim();
	if (fromMeta) return fromMeta;
	const match = cookie.match(/(?:^|;\s*)anti-csrftoken-a2z=([^;]+)/);
	if (!match) return undefined;
	try {
		return decodeURIComponent(match[1].trim());
	} catch {
		return match[1].trim();
	}
}
function readAntiCsrfTokenFromHtml(html) {
	const named = html.match(/<meta\b[^>]*\bname=["']anti-csrftoken-a2z["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i);
	if (named?.[1]) return named[1].trim();
	const contentFirst = html.match(/<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bname=["']anti-csrftoken-a2z["'][^>]*>/i);
	return contentFirst?.[1]?.trim();
}
async function requestInventoryAntiCsrfToken(fetchImpl) {
	const response = await fetchImpl(INVENTORY_MANAGE_URL, {
		method: "GET",
		credentials: "include",
		headers: { accept: "text/html" }
	});
	if (!response.ok) return undefined;
	let html = "";
	try {
		html = await response.text();
	} catch {
		return undefined;
	}
	return readAntiCsrfTokenFromHtml(html);
}
let inventoryAntiCsrfTokenRequest = null;
/**
* Reads the token from Manage Inventory's HTML when the current page has none. That page is
* large, so reports that start at the same time share one request.
*/
function fetchAntiCsrfTokenFromInventory(fetchImpl) {
	inventoryAntiCsrfTokenRequest ??= requestInventoryAntiCsrfToken(fetchImpl).finally(() => {
		inventoryAntiCsrfTokenRequest = null;
	});
	return inventoryAntiCsrfTokenRequest;
}
function formatListingStatus(status) {
	if (!status) return "";
	return status.split(/[_-]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
}
function cell(value) {
	if (value == null) return "";
	return String(value);
}
function quantity(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function firstOfferPrice(listing) {
	for (const offer of listing.offers ?? []) {
		const price = offer?.price?.price;
		if (!price?.amount) continue;
		const amount = Number(price.amount);
		if (Number.isFinite(amount)) return {
			amount,
			currency: price.currencyUnit ?? ""
		};
	}
	return {
		amount: "",
		currency: ""
	};
}
function formatRemovalStatus(segments) {
	const byLabel = new Map();
	for (const segment of segments ?? []) {
		if (segment.quantity <= 0) continue;
		byLabel.set(segment.label, (byLabel.get(segment.label) ?? 0) + segment.quantity);
	}
	const ordered = REMOVAL_STATUS_ORDER.filter((label) => byLabel.has(label)).map((label) => ({
		label,
		quantity: byLabel.get(label) ?? 0
	}));
	const known = new Set(REMOVAL_STATUS_ORDER);
	for (const [label, qty] of byLabel) {
		if (!known.has(label)) ordered.push({
			label,
			quantity: qty
		});
	}
	return ordered.map(({ label, quantity: qty }) => `${label} - ${qty} ${qty === 1 ? "unit" : "units"}`).join(" || ");
}
function unfulfillableSheetRow(listing) {
	const details = listing.availability?.unfulfillableDetails;
	const price = firstOfferPrice(listing);
	return [
		cell(listing.coreListingFields?.sku),
		cell(listing.coreListingFields?.asin),
		cell(listing.coreListingFields?.fnSku),
		cell(listing.listingData?.title),
		formatListingStatus(listing.status?.status),
		price.amount,
		price.currency,
		quantity(listing.availability?.unfulfillable),
		quantity(details?.damagedByCarrier),
		quantity(details?.damagedByCustomer),
		quantity(details?.defective),
		quantity(details?.expired),
		quantity(details?.damagedByWarehouse),
		quantity(details?.damagedByDistributor),
		listing.removalFetchFailed ? REMOVAL_STATUS_UNAVAILABLE : formatRemovalStatus(listing.removal),
		cell(listing.listingData?.lastUpdated),
		cell(listing.imageUrl)
	];
}
function unfulfillableSheetNotes(listings) {
	const notes = [];
	if (listings.some((listing) => listing.listingsIncomplete)) notes.push([UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE]);
	if (listings.some((listing) => listing.removalFetchFailed)) notes.push([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE]);
	if (notes.length) notes.push([]);
	return notes;
}
function unfulfillableSheetRows(listings) {
	return [
		...unfulfillableSheetNotes(listings),
		[...UNFULFILLABLE_SHEET_HEADERS],
		...listings.map(unfulfillableSheetRow)
	];
}
function graphqlMessages(payload) {
	if (!payload || typeof payload !== "object" || !("errors" in payload)) return [];
	const errors = payload.errors;
	if (!Array.isArray(errors)) return [];
	return errors.map((error) => {
		if (!error || typeof error !== "object" || !("message" in error)) return "";
		return String(error.message ?? "");
	}).filter(Boolean);
}
function isInvalidPaginationInput(messages) {
	return messages.some((message) => /paginationinput/i.test(message) && /not defined|undefined|unknown field/i.test(message));
}
function listingSkuPair(listing) {
	const merchantSku = listing.coreListingFields?.sku?.trim();
	const fulfillmentNetworkSku = listing.coreListingFields?.fnSku?.trim();
	if (!merchantSku || !fulfillmentNetworkSku) return undefined;
	return {
		merchantSku,
		fulfillmentNetworkSku
	};
}
function skuPairKey(merchantSku, fulfillmentNetworkSku) {
	return `${merchantSku}\0${fulfillmentNetworkSku}`;
}
function chunk(items, size) {
	const batches = [];
	for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size));
	return batches;
}
/** Maps items with at most `limit` calls in flight, starting the next as soon as one finishes. */
async function mapWithConcurrency(items, limit, mapper) {
	const results = new Array(items.length);
	let next = 0;
	const worker = async () => {
		while (next < items.length) {
			const index = next;
			next += 1;
			results[index] = await mapper(items[index], index);
		}
	};
	await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker));
	return results;
}
function removalStatusLabel(code) {
	if (!code || !(code in REMOVAL_STATUS_BY_CODE)) return REMOVAL_STATUS_UNKNOWN;
	return REMOVAL_STATUS_BY_CODE[code];
}
function removalStatusFromLineItem(item) {
	const byLabel = new Map();
	let ineligibleTotal = 0;
	for (const entry of item.unsellableIneligibleQuantities ?? []) {
		if (!entry) continue;
		const qty = quantity(entry.quantity);
		if (qty <= 0) continue;
		ineligibleTotal += qty;
		const label = removalStatusLabel(entry.unfulfillableErrorCode);
		byLabel.set(label, (byLabel.get(label) ?? 0) + qty);
	}
	const reportedIneligible = quantity(item.unsellableIneligibleQuantity);
	if (reportedIneligible > ineligibleTotal) {
		byLabel.set(REMOVAL_STATUS_UNKNOWN, (byLabel.get(REMOVAL_STATUS_UNKNOWN) ?? 0) + (reportedIneligible - ineligibleTotal));
		ineligibleTotal = reportedIneligible;
	}
	const eligible = Math.max(0, quantity(item.totalUnsellableQuantity) - ineligibleTotal);
	if (eligible > 0) byLabel.set(REMOVAL_STATUS_ELIGIBLE, (byLabel.get(REMOVAL_STATUS_ELIGIBLE) ?? 0) + eligible);
	return REMOVAL_STATUS_ORDER.filter((label) => (byLabel.get(label) ?? 0) > 0).map((label) => ({
		label,
		quantity: byLabel.get(label) ?? 0
	}));
}
function parseRecoveryInventories(payload) {
	if (!payload || typeof payload !== "object" || !("lineItems" in payload)) {
		throw new Error("Couldn’t load unfulfillable removal status.");
	}
	const lineItems = payload.lineItems;
	if (!Array.isArray(lineItems)) throw new Error("Couldn’t load unfulfillable removal status.");
	return lineItems.filter((item) => Boolean(item && typeof item === "object"));
}
function mergeRemovalStatus(listings, lineItems, failedPairKeys = new Set()) {
	const byKey = new Map();
	for (const item of lineItems) {
		const merchantSku = item.merchantSku?.trim();
		const fulfillmentNetworkSku = item.fulfillmentNetworkSku?.trim();
		if (!merchantSku || !fulfillmentNetworkSku) continue;
		byKey.set(skuPairKey(merchantSku, fulfillmentNetworkSku), removalStatusFromLineItem(item));
	}
	return listings.map((listing) => {
		const pair = listingSkuPair(listing);
		const key = pair ? skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku) : undefined;
		if (key && failedPairKeys.has(key)) {
			return {
				...listing,
				removal: [],
				removalFetchFailed: true
			};
		}
		return {
			...listing,
			removal: key ? byKey.get(key) ?? [] : []
		};
	});
}
function asListing(value) {
	if (!value || typeof value !== "object") return undefined;
	return value;
}
function parseListingsPage(payload) {
	const messages = graphqlMessages(payload);
	const data = payload && typeof payload === "object" && "data" in payload ? payload.data : undefined;
	const listingsV2 = data && typeof data === "object" && "listingsV2" in data ? data.listingsV2 : undefined;
	if (!listingsV2 || typeof listingsV2 !== "object") {
		if (messages.length) throw new Error(messages.join(" "));
		throw new Error("Couldn’t load unfulfillable inventory.");
	}
	const record = listingsV2;
	const rows = Array.isArray(record.listings) ? record.listings : [];
	const listings = rows.map(asListing).filter((listing) => listing !== undefined);
	const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length;
	return {
		listings,
		count,
		rows: rows.length
	};
}
/** Offset pagination, as Manage Inventory uses; omit `from` to request Amazon's default first page. */
function listingsVariables(from) {
	return {
		usecase: "INVENTORY_UNFULFILLABLE",
		sortRequest: {
			key: "QUANTITY_UNFULFILLABLE",
			order: "DESCENDING"
		},
		multiSelectFilters: [{
			key: "LISTING_STATUS",
			values: ["InventoryUnfulfillable"]
		}],
		...from === undefined ? {} : { pagination: {
			from,
			size: UNFULFILLABLE_PAGE_SIZE
		} }
	};
}
function listingKey(listing) {
	const pair = listingSkuPair(listing);
	return pair ? skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku) : JSON.stringify(listing.coreListingFields ?? listing);
}
async function postListingsPage(fetchImpl, token, from) {
	const response = await fetchImpl(UNFULFILLABLE_GQL_URL, {
		method: "POST",
		credentials: "include",
		headers: {
			accept: "application/graphql-response+json, application/json",
			"content-type": "application/json",
			"anti-csrftoken-a2z": token
		},
		body: JSON.stringify({
			operationName: "GetListingsV2",
			variables: listingsVariables(from),
			query: GET_LISTINGS_V2_QUERY
		})
	});
	if (!response.ok) throw new Error(`Couldn’t load unfulfillable inventory (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load unfulfillable inventory.");
	}
	return parseListingsPage(payload);
}
async function postInventoriesBatch(fetchImpl, token, pairs) {
	const headers = {
		accept: "application/json, text/plain, */*",
		"content-type": "application/json"
	};
	if (token) headers["anti-csrftoken-a2z"] = token;
	const response = await fetchImpl(UNFULFILLABLE_INVENTORIES_URL, {
		method: "POST",
		credentials: "include",
		headers,
		body: JSON.stringify({
			matchedMskusAndFnskus: pairs,
			fulfillmentChannel: "RETURN",
			inventoryCategory: "STANDARD"
		})
	});
	if (!response.ok) throw new Error(`Couldn’t load unfulfillable removal status (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load unfulfillable removal status.");
	}
	return parseRecoveryInventories(payload);
}
async function fetchRemovalLineItems(fetchImpl, token, listings, onProgress, log) {
	const pairs = listings.map(listingSkuPair).filter((pair) => pair !== undefined);
	if (pairs.length === 0) return {
		lineItems: [],
		failedPairKeys: new Set()
	};
	const lineItems = [];
	const failedPairKeys = new Set();
	let processed = 0;
	onProgress?.({
		source: "unfulfillable",
		status: "active",
		loaded: 0,
		total: pairs.length,
		phase: "removal"
	});
	for (const batch of chunk(pairs, UNFULFILLABLE_INVENTORIES_BATCH_SIZE)) {
		try {
			lineItems.push(...await postInventoriesBatch(fetchImpl, token, batch));
		} catch (error) {
			log?.warn("unfulfillable.removalBatchFailed", {
				skus: batch.length,
				error: describeError(error)
			});
			for (const pair of batch) failedPairKeys.add(skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku));
		}
		processed += batch.length;
		onProgress?.({
			source: "unfulfillable",
			status: "active",
			loaded: processed,
			total: pairs.length,
			phase: "removal"
		});
	}
	return {
		lineItems,
		failedPairKeys
	};
}
function removalOrderIdFromRow(row) {
	if (!Array.isArray(row)) return null;
	for (const cell of row) {
		if (typeof cell !== "string") continue;
		const match = REMOVAL_ORDER_ID_PATTERN.exec(cell.trim());
		if (match) return match[0];
	}
	return null;
}
function latestRemovalOrderId(payload) {
	if (!payload || typeof payload !== "object" || !("columnData" in payload)) return null;
	const rows = payload.columnData;
	if (!Array.isArray(rows)) return null;
	for (const row of rows) {
		const id = removalOrderIdFromRow(row);
		if (id) return id;
	}
	return null;
}
function incrementRemovalOrderId(orderId) {
	const match = /(S4E[A-Z]{2})(\d{4})/.exec(orderId);
	if (!match) return null;
	const number = Number.parseInt(match[2], 10) + 1;
	return `${match[1]}${String(number).padStart(4, "0")}`;
}
async function fetchNextRemovalOrderId(fetchImpl = globalThis.fetch) {
	try {
		const response = await fetchImpl(REMOVAL_ORDER_REPORT_URL, {
			method: "GET",
			credentials: "include",
			headers: { accept: "*/*" }
		});
		if (!response.ok) return null;
		let payload;
		try {
			payload = await response.json();
		} catch {
			return null;
		}
		const lastId = latestRemovalOrderId(payload);
		if (!lastId) return null;
		return incrementRemovalOrderId(lastId);
	} catch {
		return null;
	}
}
async function fetchUnfulfillableListings(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const root = options.root ?? document;
	const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "");
	const onProgress = options.onProgress;
	const log = options.log;
	let token = readAntiCsrfToken(root, cookie);
	if (!token) {
		log?.info("unfulfillable.tokenFromInventoryPage");
		token = await fetchAntiCsrfTokenFromInventory(fetchImpl);
	}
	if (!token) throw new Error("Couldn’t read the Seller Central security token.");
	onProgress?.({
		source: "unfulfillable",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	const listings = [];
	const seen = new Set();
	let paginate = true;
	let offset = 0;
	let reportedCount = 0;
	let listingsIncomplete = false;
	for (let page = 0; page < UNFULFILLABLE_MAX_PAGES; page += 1) {
		const pageDone = log?.time("unfulfillable.page", {
			page,
			from: offset
		});
		let result;
		try {
			result = await postListingsPage(fetchImpl, token, paginate ? offset : undefined);
		} catch (error) {
			if (page === 0 && paginate && isInvalidPaginationInput([errorMessage(error)])) {
				// Without paging Amazon returns only its default first page; the count check below flags the rest.
				log?.warn("unfulfillable.schemaRetry", { without: "pagination" });
				paginate = false;
				result = await postListingsPage(fetchImpl, token);
			} else if (listings.length > 0) {
				log?.warn("unfulfillable.listingsStopped", {
					page,
					loaded: listings.length,
					error: describeError(error)
				});
				listingsIncomplete = true;
				break;
			} else {
				throw error;
			}
		}
		const added = result.listings.filter((listing) => {
			const key = listingKey(listing);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
		listings.push(...added);
		offset += result.rows;
		reportedCount = result.count;
		pageDone?.({
			rows: result.rows,
			added: added.length,
			reported: result.count
		});
		onProgress?.({
			source: "unfulfillable",
			status: "active",
			loaded: listings.length,
			total: result.count,
			phase: "listings"
		});
		if (!paginate || result.rows === 0 || offset >= result.count) break;
		if (added.length === 0) {
			// Amazon ignored the offset and sent listings already loaded.
			log?.warn("unfulfillable.pagingIgnored", {
				page,
				loaded: listings.length,
				reported: result.count
			});
			break;
		}
	}
	if (reportedCount > listings.length) {
		log?.warn("unfulfillable.listingsIncomplete", {
			loaded: listings.length,
			reported: reportedCount
		});
		listingsIncomplete = true;
	}
	const { lineItems, failedPairKeys } = await fetchRemovalLineItems(fetchImpl, token, listings, onProgress, log);
	const merged = mergeRemovalStatus(listings, lineItems, failedPairKeys).map((listing) => listingsIncomplete ? {
		...listing,
		listingsIncomplete: true
	} : listing);
	onProgress?.({
		source: "unfulfillable",
		status: "complete",
		loaded: merged.length,
		total: merged.length,
		phase: lineItems.length > 0 ? "removal" : "listings"
	});
	return merged;
}

const FEEDBACKS_URL = "https://sellercentral.amazon.com/fbmapi/v1/feedbacks";
/** Amazon's largest page; bigger pages fail with HTTP 500. */
const FEEDBACK_PAGE_SIZE = 50;
/** Cursor chains loading at once, each walking its own stretch of dates. */
const FEEDBACK_CHAINS = 12;
/** A busy chain is split for an idle one only while about this many entries are left in it. */
const FEEDBACK_MIN_SPLIT_ENTRIES = 100;
/** Lifetime 1–3 star entries; stores with more than this many are flagged. */
const FEEDBACK_MAX_ENTRIES = 2e4;
const FEEDBACK_ATTEMPTS = 3;
const FEEDBACK_RETRY_DELAY_MS = 400;
const FEEDBACK_FROM_RATING = 1;
const FEEDBACK_TO_RATING = 3;
/** Used for the date ranges if Amazon won't say when the oldest entry was left. */
const FEEDBACK_FALLBACK_OLDEST_MS = Date.UTC(1995, 0, 1);
const FEEDBACK_INCOMPLETE_NOTE = `Only ${FEEDBACK_MAX_ENTRIES.toLocaleString("en-US")} feedback entries were loaded. Seller Central has more.`;
const FEEDBACK_SHEET_HEADERS = [
	"Date",
	"Rating",
	"Sentiment",
	"Order ID",
	"Feedback",
	"Item as described",
	"Seller response",
	"Response date",
	"Suppressed",
	"Partially suppressed",
	"Suppress reason",
	"Feedback ID"
];
const HTML_NAMED_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function isNeutralOrNegativeRating(rating) {
	return typeof rating === "number" && Number.isInteger(rating) && rating >= FEEDBACK_FROM_RATING && rating <= FEEDBACK_TO_RATING;
}
function feedbackSentiment(rating) {
	if (!isNeutralOrNegativeRating(rating)) return "";
	return rating <= 2 ? "Negative" : "Neutral";
}
function decodeHtmlEntities(value) {
	return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity) => {
		if (entity.startsWith("#x") || entity.startsWith("#X")) {
			const code = Number.parseInt(entity.slice(2), 16);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		if (entity.startsWith("#")) {
			const code = Number.parseInt(entity.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		return HTML_NAMED_ENTITIES[entity] ?? match;
	});
}
function formatFeedbackDate(value) {
	if (!value) return "";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return formatUtcDateTime(date);
}
function feedbackCell(value) {
	if (value == null) return "";
	return String(value);
}
function yesNo(value) {
	if (value === true) return "Yes";
	if (value === false) return "No";
	return "";
}
function itemAsDescribed(feedback) {
	return yesNo(feedback.answerMap?.ItemAsDescribed?.booleanRating);
}
function feedbackSheetRow(feedback) {
	const rating = typeof feedback.numericRating === "number" && Number.isFinite(feedback.numericRating) ? feedback.numericRating : "";
	return [
		formatFeedbackDate(feedback.feedbackDate),
		rating,
		feedbackSentiment(typeof rating === "number" ? rating : undefined),
		feedbackCell(feedback.orderId),
		decodeHtmlEntities(feedback.feedbackText ?? ""),
		itemAsDescribed(feedback),
		decodeHtmlEntities(feedback.responseText ?? ""),
		formatFeedbackDate(feedback.responseDate),
		yesNo(feedback.suppressed),
		yesNo(feedback.partiallySuppressed),
		feedbackCell(feedback.suppressReasonId),
		feedbackCell(feedback.feedbackId)
	];
}
function feedbackSheetRows(feedbacks) {
	return [[...FEEDBACK_SHEET_HEADERS], ...feedbacks.map(feedbackSheetRow)];
}
const FEEDBACK_STRING_FIELDS = [
	"feedbackId",
	"orderId",
	"feedbackText",
	"feedbackDate",
	"responseText",
	"responseDate",
	"suppressReasonId"
];
const FEEDBACK_BOOLEAN_FIELDS = ["suppressed", "partiallySuppressed"];
/** Keeps null and correctly typed values; drops anything else. */
function typedField(value, isType) {
	if (value === null) return null;
	return isType(value) ? value : undefined;
}
const isString = (value) => typeof value === "string";
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isBoolean = (value) => typeof value === "boolean";
function asFeedback(value) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const feedback = {};
	for (const field of FEEDBACK_STRING_FIELDS) {
		const fieldValue = typedField(record[field], isString);
		if (fieldValue !== undefined) feedback[field] = fieldValue;
	}
	const numericRating = typedField(record.numericRating, isFiniteNumber);
	if (numericRating !== undefined) feedback.numericRating = numericRating;
	for (const field of FEEDBACK_BOOLEAN_FIELDS) {
		const fieldValue = typedField(record[field], isBoolean);
		if (fieldValue !== undefined) feedback[field] = fieldValue;
	}
	const answerMap = record.answerMap && typeof record.answerMap === "object" ? record.answerMap : undefined;
	const itemAsDescribedAnswer = answerMap?.ItemAsDescribed && typeof answerMap.ItemAsDescribed === "object" ? answerMap.ItemAsDescribed : undefined;
	if (itemAsDescribedAnswer) {
		const booleanRating = typedField(itemAsDescribedAnswer.booleanRating, isBoolean);
		feedback.answerMap = { ItemAsDescribed: { booleanRating } };
	}
	return feedback;
}
function parseFeedbacksPage(payload) {
	if (!payload || typeof payload !== "object") throw new Error("Couldn’t load seller feedback.");
	const record = payload;
	if (!Array.isArray(record.feedbacks)) throw new Error("Couldn’t load seller feedback.");
	const feedbacks = record.feedbacks.map(asFeedback).filter((feedback) => feedback !== undefined);
	return {
		feedbacks,
		rows: record.feedbacks.length,
		lastPage: typeof record.lastPage === "boolean" ? record.lastPage : undefined,
		...typeof record.lastEvaluatedKey === "string" && record.lastEvaluatedKey ? { cursor: record.lastEvaluatedKey } : {}
	};
}
/** A page of entries newest first (or oldest first), starting after `cursor`. */
function feedbacksUrl(cursor = "", ascending = false) {
	const params = new URLSearchParams({
		pageNumber: "0",
		pageSize: String(FEEDBACK_PAGE_SIZE),
		fromRating: String(FEEDBACK_FROM_RATING),
		toRating: String(FEEDBACK_TO_RATING),
		sortBy: "Date",
		descendingOrder: String(!ascending),
		includePartiallySuppressed: "true",
		excludeTTRFeedback: "false",
		lastEvaluatedKey: cursor
	});
	return `${FEEDBACKS_URL}?${params.toString()}`;
}
const feedbackSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function getFeedbacksPage(fetchImpl, cursor, ascending, sleep) {
	let lastError = new Error("Couldn’t load seller feedback.");
	for (let attempt = 1; attempt <= FEEDBACK_ATTEMPTS; attempt += 1) {
		if (attempt > 1) await sleep(FEEDBACK_RETRY_DELAY_MS * (attempt - 1));
		let response;
		try {
			response = await fetchImpl(feedbacksUrl(cursor, ascending), {
				method: "GET",
				credentials: "include",
				headers: {
					accept: "application/json, text/plain, */*",
					"x-requested-with": "XMLHttpRequest"
				}
			});
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			continue;
		}
		if (!response.ok) {
			lastError = new Error(`Couldn’t load seller feedback (${response.status}).`);
			if (response.status === 429 || response.status >= 500) continue;
			throw lastError;
		}
		let payload;
		try {
			payload = await response.json();
		} catch {
			throw new Error("Couldn’t load seller feedback.");
		}
		return parseFeedbacksPage(payload);
	}
	throw lastError;
}
/** Amazon's cursor is base64 JSON of the last entry's table key. Undefined if that ever changes. */
function decodeFeedbackCursor(cursor) {
	try {
		const key = JSON.parse(atob(cursor));
		const date = Number(key?.feedbackDateUtcEpoch?.N);
		return Number.isFinite(date) && date > 0 && typeof key?.feedbackId?.N === "string" ? key : undefined;
	} catch {
		return undefined;
	}
}
/** A cursor that resumes the list just below `dateMs`, so the next page holds older entries. */
function feedbackCursorAt(template, dateMs) {
	return btoa(JSON.stringify({
		...template,
		feedbackId: { N: "0" },
		feedbackDateUtcEpoch: { N: String(Math.floor(dateMs)) }
	}));
}
function feedbackDateMs(feedback) {
	return Date.parse(feedback.feedbackDate ?? "");
}
function isLastFeedbackPage(page) {
	return page.lastPage === true || page.rows === 0 || !page.cursor;
}
/**
* Loads lifetime 1–3 star feedback, newest first.
*
* Amazon pages this list with a cursor; asking for a page number instead re-reads every earlier
* entry, gets slower with depth, and stops at page 100. A cursor is base64 JSON of an entry's key,
* so a cursor built for any date starts reading there. The dates between the newest and oldest
* entries are split among FEEDBACK_CHAINS chains that read at once, and a chain that finishes
* early takes half of whichever chain has the most left. If the cursor format is unfamiliar or a
* built cursor fails, one chain reads the list from start to end instead.
*/
async function fetchNeutralNegativeFeedbacks(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const sleep = options.sleep ?? feedbackSleep;
	const onProgress = options.onProgress;
	const log = options.log;
	const maxEntries = options.maxEntries ?? FEEDBACK_MAX_ENTRIES;
	let requests = 0;
	let kept = 0;
	let capped = false;
	const load = (cursor = "", ascending = false) => {
		requests += 1;
		return getFeedbacksPage(fetchImpl, cursor, ascending, sleep);
	};
	const reportKept = (count) => {
		kept += count;
		onProgress?.({
			source: "feedback",
			status: "active",
			loaded: kept
		});
	};
	onProgress?.({
		source: "feedback",
		status: "active",
		loaded: 0
	});
	// The oldest entry bounds the date ranges, so ask for it alongside the newest page.
	const [first, oldestPage] = await Promise.all([load(), load("", true).catch((error) => {
		log?.warn("feedback.oldestUnavailable", { error: describeError(error) });
		return undefined;
	})]);
	reportKept(first.feedbacks.length);
	let strategy = "single";
	let chains = [];
	let splits = 0;
	let rest = [];
	/** Reads one chain at a time from `cursor` to the end of the list. */
	const walk = async (cursor) => {
		const entries = [];
		for (let next = cursor; next;) {
			if (kept >= maxEntries) {
				capped = true;
				break;
			}
			const page = await load(next);
			entries.push(...page.feedbacks);
			reportKept(page.feedbacks.length);
			next = isLastFeedbackPage(page) ? undefined : page.cursor;
		}
		return entries;
	};
	if (!isLastFeedbackPage(first)) {
		const template = decodeFeedbackCursor(first.cursor ?? "");
		if (!template) {
			log?.warn("feedback.cursorUnknown");
			strategy = "sequential";
			rest = await walk(first.cursor ?? "");
		} else {
			strategy = "parallel";
			const top = Number(template.feedbackDateUtcEpoch?.N);
			const oldestDate = oldestPage?.feedbacks[0] ? feedbackDateMs(oldestPage.feedbacks[0]) : Number.NaN;
			const oldest = Number.isFinite(oldestDate) && oldestDate < top ? oldestDate : FEEDBACK_FALLBACK_OLDEST_MS;
			const span = Math.max(1, top - oldest);
			chains = Array.from({ length: FEEDBACK_CHAINS }, (_, index) => {
				const hi = index === 0 ? top : Math.round(top - span * index / FEEDBACK_CHAINS);
				return {
					hi,
					lo: index === FEEDBACK_CHAINS - 1 ? Number.NEGATIVE_INFINITY : Math.round(top - span * (index + 1) / FEEDBACK_CHAINS),
					// The first chain continues from Amazon's own cursor, so entries sharing page one's last date aren't skipped.
					cursor: index === 0 ? first.cursor ?? "" : feedbackCursorAt(template, hi),
					reached: hi,
					entries: [],
					done: false,
					running: false
				};
			});
			let failure;
			const run = async (chain) => {
				chain.running = true;
				try {
					while (!chain.done && failure === undefined) {
						if (kept >= maxEntries) {
							capped = true;
							return;
						}
						const page = await load(chain.cursor);
						let ended = isLastFeedbackPage(page);
						const before = chain.entries.length;
						for (const feedback of page.feedbacks) {
							const date = feedbackDateMs(feedback);
							if (date < chain.lo) {
								ended = true;
								break;
							}
							chain.entries.push(feedback);
							if (Number.isFinite(date)) chain.reached = date;
						}
						reportKept(chain.entries.length - before);
						if (ended) chain.done = true;
						else chain.cursor = page.cursor ?? "";
					}
				} catch (error) {
					failure ??= error;
				} finally {
					chain.running = false;
				}
			};
			/** An idle chain, or half of the busiest one when it still has plenty left. */
			const nextChain = () => {
				if (failure !== undefined || capped) return undefined;
				const idle = chains.find((chain) => !chain.done && !chain.running);
				if (idle) return idle;
				let busiest;
				let busiestLeft = FEEDBACK_MIN_SPLIT_ENTRIES;
				for (const chain of chains) {
					if (chain.done || chain.entries.length === 0) continue;
					const floor = Number.isFinite(chain.lo) ? chain.lo : oldest;
					const left = chain.entries.length / Math.max(1, chain.hi - chain.reached) * (chain.reached - floor);
					if (left > busiestLeft) {
						busiest = chain;
						busiestLeft = left;
					}
				}
				if (!busiest) return undefined;
				const floor = Number.isFinite(busiest.lo) ? busiest.lo : oldest - 1;
				const middle = Math.round(floor + (busiest.reached - floor) / 2);
				const half = {
					hi: middle,
					lo: busiest.lo,
					cursor: feedbackCursorAt(template, middle),
					reached: middle,
					entries: [],
					done: false,
					running: false
				};
				busiest.lo = middle;
				chains.push(half);
				splits += 1;
				return half;
			};
			await Promise.all(Array.from({ length: FEEDBACK_CHAINS }, async () => {
				for (let chain = nextChain(); chain; chain = nextChain()) await run(chain);
			}));
			if (failure !== undefined) {
				log?.warn("feedback.parallelFailed", {
					error: describeError(failure),
					requests
				});
				strategy = "sequential";
				chains = [];
				kept = first.feedbacks.length;
				capped = false;
				rest = await walk(first.cursor ?? "");
			} else {
				rest = [...chains].sort((a, b) => b.hi - a.hi).flatMap((chain) => chain.entries);
			}
		}
	}
	const seen = new Set();
	const feedbacks = [...first.feedbacks, ...rest].filter((feedback) => {
		if (!isNeutralOrNegativeRating(feedback.numericRating)) return false;
		const id = feedback.feedbackId;
		if (!id) return true;
		if (seen.has(id)) return false;
		seen.add(id);
		return true;
	});
	log?.info("feedback.load", {
		strategy,
		requests,
		entries: feedbacks.length,
		...chains.length ? {
			chains: chains.length,
			splits
		} : {}
	});
	onProgress?.({
		source: "feedback",
		status: "complete",
		loaded: feedbacks.length,
		total: feedbacks.length
	});
	if (!capped) return feedbacks;
	log?.warn("feedback.entryLimit", {
		limit: maxEntries,
		entries: feedbacks.length
	});
	return feedbacks.slice(0, maxEntries).map((feedback) => ({
		...feedback,
		feedbackIncomplete: true
	}));
}

const STRANDED_INVENTORY_URL = "https://sellercentral.amazon.com/inventoryplanning/stranded-inventory";
const STRANDED_DATE_TIME_ZONE = "America/New_York";
const STRANDED_SHEET_HEADERS = [
	"SKU",
	"Condition",
	"Product Name",
	"ASIN",
	"FNSKU",
	"Status",
	"Status secondary",
	"Price",
	"Currency",
	"Available",
	"Total",
	"Reserved",
	"Inbound",
	"Unfulfillable",
	"Auto removal date",
	"Auto removal type",
	"Date stranded",
	"Stranded reason",
	"Stranded reason code",
	"Error message",
	"Fulfilled by",
	"Program",
	"Actions"
];
const AUTO_REMOVAL_TYPE_LABELS = { RETURN: "Return to seller" };
function strandedCell(value) {
	if (value == null) return "";
	return String(value);
}
function strandedNumericCell(value) {
	if (value == null || value === "") return "";
	const amount = typeof value === "number" ? value : Number(value);
	return Number.isFinite(amount) ? amount : "";
}
function strandedQuantity(value) {
	const amount = strandedNumericCell(value);
	return amount === "" ? 0 : amount;
}
function formatStrandedDate(value) {
	if (!value) return "";
	const ms = Number(value);
	if (!Number.isFinite(ms)) return value;
	const date = new Date(ms);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat("en-US", {
		timeZone: STRANDED_DATE_TIME_ZONE,
		month: "2-digit",
		day: "2-digit",
		year: "numeric"
	}).format(date);
}
function autoRemovalTypeLabel(value) {
	if (!value) return "";
	return AUTO_REMOVAL_TYPE_LABELS[value] ?? value;
}
function formatSupportedActions(value) {
	if (!value) return "";
	return value.split("#").map((action) => action.trim()).filter(Boolean).join(", ");
}
function parseStrandedHeaderCount(html) {
	const match = html.match(/id=["']mt-header-count-value["'][^>]*>([^<]*)/i);
	if (!match) return undefined;
	const count = Number(match[1].replace(/,/g, "").trim());
	return Number.isFinite(count) ? count : undefined;
}
function parseFilterLabelMap(root) {
	const labels = new Map();
	for (const node of root.querySelectorAll("[data-stranded-filter-changed]")) {
		const raw = node.getAttribute("data-stranded-filter-changed");
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			if (parsed.filterGroupId !== "stranded_reason") continue;
			const id = typeof parsed.filterId === "string" ? parsed.filterId.trim() : "";
			if (!id || id === "All") continue;
			const label = typeof parsed.filterReadableValue === "string" ? parsed.filterReadableValue.trim() : "";
			if (label) labels.set(id, label);
		} catch {}
	}
	return labels;
}
/** String fields copied as-is from each row's data-row-data JSON. */
const STRANDED_ROW_FIELDS = [
	"SKU",
	"ASIN",
	"FNSKU",
	"ProductName",
	"Condition",
	"Status",
	"StatusSecondary",
	"Price",
	"PriceUnit",
	"Available",
	"TotalQuantity",
	"Reserved",
	"Inbound",
	"Unfulfillable",
	"DateAutoRemoval",
	"AutoRemovalType",
	"DateStranded",
	"StrandedReason",
	"StrandedReasonCode",
	"ErrorMessage",
	"FulfilledBy",
	"Program",
	"SupportedActions"
];
function asStrandedListing(value, labels) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const listing = {};
	for (const field of STRANDED_ROW_FIELDS) {
		const fieldValue = record[field];
		if (typeof fieldValue === "string") listing[field] = fieldValue;
	}
	const reasonCode = (listing.StrandedReasonCode || listing.StrandedReason || "").trim();
	const reasonLabel = reasonCode && labels.get(reasonCode) || listing.ErrorMessage?.trim() || reasonCode;
	if (reasonLabel) listing.StrandedReasonLabel = reasonLabel;
	return listing;
}
function parseStrandedInventoryHtml(html) {
	const root = new DOMParser().parseFromString(html, "text/html");
	const labels = parseFilterLabelMap(root);
	const listings = [];
	for (const row of root.querySelectorAll("tr[data-row-data]")) {
		const raw = row.getAttribute("data-row-data");
		if (!raw) continue;
		try {
			const listing = asStrandedListing(JSON.parse(raw), labels);
			if (listing) listings.push(listing);
		} catch {}
	}
	const count = parseStrandedHeaderCount(html);
	if (count === undefined && listings.length === 0) {
		throw new Error("Couldn’t load stranded inventory.");
	}
	if (count !== undefined && count > listings.length) {
		throw new Error(`Couldn’t load all stranded inventory (${listings.length} of ${count} listings).`);
	}
	return listings;
}
function strandedSheetRow(listing) {
	return [
		strandedCell(listing.SKU),
		strandedCell(listing.Condition),
		strandedCell(listing.ProductName),
		strandedCell(listing.ASIN),
		strandedCell(listing.FNSKU),
		strandedCell(listing.Status),
		strandedCell(listing.StatusSecondary),
		strandedNumericCell(listing.Price),
		strandedCell(listing.PriceUnit),
		strandedQuantity(listing.Available),
		strandedQuantity(listing.TotalQuantity),
		strandedQuantity(listing.Reserved),
		strandedQuantity(listing.Inbound),
		strandedQuantity(listing.Unfulfillable),
		formatStrandedDate(listing.DateAutoRemoval),
		autoRemovalTypeLabel(listing.AutoRemovalType),
		formatStrandedDate(listing.DateStranded),
		strandedCell(listing.StrandedReasonLabel || listing.ErrorMessage || listing.StrandedReasonCode || listing.StrandedReason),
		strandedCell(listing.StrandedReasonCode || listing.StrandedReason),
		strandedCell(listing.ErrorMessage),
		strandedCell(listing.FulfilledBy),
		strandedCell(listing.Program),
		formatSupportedActions(listing.SupportedActions)
	];
}
function strandedSheetRows(listings) {
	return [[...STRANDED_SHEET_HEADERS], ...listings.map(strandedSheetRow)];
}
async function fetchStrandedListings(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	options.onProgress?.({
		source: "stranded",
		status: "active"
	});
	const response = await fetchImpl(STRANDED_INVENTORY_URL, {
		method: "GET",
		credentials: "include",
		headers: { accept: "text/html" }
	});
	if (!response.ok) throw new Error(`Couldn’t load stranded inventory (${response.status}).`);
	let html;
	try {
		html = await response.text();
	} catch {
		throw new Error("Couldn’t load stranded inventory.");
	}
	const listings = parseStrandedInventoryHtml(html);
	options.onProgress?.({
		source: "stranded",
		status: "complete",
		loaded: listings.length,
		total: listings.length
	});
	return listings;
}

const SUPPRESSED_GQL_URL = UNFULFILLABLE_GQL_URL;
const SUPPRESSED_PAGE_SIZE = 250;
/**
* Listings arrive sorted by available quantity and the scan stops at the first one out of stock,
* so a small first page usually holds every in-stock listing without Amazon pricing 250 rows.
*/
const SUPPRESSED_FIRST_PAGE_SIZE = 50;
const SUPPRESSED_MAX_PAGES = 40;
const SUPPRESSED_LISTINGS_INCOMPLETE_NOTE = "Some search-suppressed listings could not be loaded. This sheet includes only the listings that were obtainable.";
const SUPPRESSED_ISSUES_INCOMPLETE_NOTE = "Suppression reasons could not be loaded for some SKUs. Those rows are marked “Couldn’t load suppression reason”.";
const SUPPRESSED_ISSUE_UNAVAILABLE = "Couldn’t load suppression reason";
const SUPPRESSED_ISSUES_CONCURRENCY = 5;
const SUPPRESSED_SHEET_HEADERS = [
	"SKU",
	"ASIN",
	"FNSKU",
	"Title",
	"Title differentiation",
	"Image URL",
	"Detail page URL",
	"SKU Central link",
	"Status",
	"Status text",
	"Highlighted state",
	"Inline action",
	"Inline action text",
	"Fix listing URL",
	"Issue",
	"Issue type",
	"Issue attribute",
	"Enforcement",
	"Issue source",
	"Issue tags",
	"Product type",
	"Listing type",
	"Bundle status",
	"Fulfillment channel",
	"Condition",
	"Sub-condition",
	"Parent ASIN",
	"Parent SKU",
	"Children",
	"Is parent",
	"Is customizable",
	"Marketplace count",
	"External IDs",
	"Favorite",
	"Tags",
	"Shipping template",
	"Shipping template ID",
	"Legacy template",
	"Date created",
	"Last updated",
	"Last 30 day GMS",
	"Last 30 day GV",
	"Last 30 day units sold",
	"Quality grade",
	"Quality grade updated",
	"Available",
	"Infinite quantity",
	"Inventory availability",
	"On hand",
	"Inbound",
	"Reserved",
	"Reserved FC transfer",
	"Reserved customer order",
	"Reserved FC processing",
	"Buyable in transit",
	"Pending customer orders in transit",
	"Unfulfillable",
	"Carrier damaged",
	"Customer damaged",
	"Defective",
	"Expired",
	"Warehouse damaged",
	"Distributor damaged",
	"Researching short term",
	"Researching mid term",
	"Researching long term",
	"FBA recommendation",
	"Fulfillment markets",
	"AA availabilities",
	"Inventory alert",
	"Days of supply",
	"Recommended inventory",
	"Price",
	"Currency",
	"Sale price",
	"Min allowed price",
	"Max allowed price",
	"Business price",
	"Quantity discount",
	"Max retail price",
	"Estimated shipping",
	"Points",
	"Automated pricing",
	"Tax rate",
	"Tax exclusive price",
	"Tax exclusive business price",
	"Lowest price",
	"Lowest shipping",
	"Buy box price",
	"Buy box shipping",
	"Sales rank",
	"Sales rank category",
	"Competitive benchmark price",
	"Competitive benchmark shipping",
	"Business program",
	"Haul offer",
	"FFO offer",
	"Non-ALL offer",
	"Actions",
	"Points Central link"
];
const GET_SUPPRESSED_LISTINGS_PREFIX = `fragment CurrencyFields on Currency {
  amount
  currencyUnit
  currencySymbol
  __typename
}

query getListingsV2($pagination: PaginationInput, $searchTerm: SearchTerm, $parentRecords: [String!], $multiSelectFilters: [MultiSelectFilter], $sortRequest: SortRequest, $multiSKUList: [String]) {
  listingsV2(
    pagination: $pagination
    usecase: MANAGE_INVENTORY_VIEW
    searchTerm: $searchTerm
    parentRecords: $parentRecords
    multiSelectFilters: $multiSelectFilters
    sortRequest: $sortRequest
    multiSKUList: $multiSKUList
    features: ["EML_CDQ_ENABLED"]
  ) {
    listings {
      coreListingFields {
        asin
        sku
        fnSku
        fulfillmentChannel
        __typename
      }
      listingData {
        asin
        sku
        fnSku
        productType
        bundleStatus
        externalIds {
          value
          type
          __typename
        }
        dateCreated
        lastUpdated
        parentAsin
        parentSku
        numberOfChildren
        listingType
        qualityRecommendationScore {
          grade
          lastUpdatedDate
          __typename
        }
        last30DayGms
        last30DayGv
        last30DayUnitsSold
        title
        titleDifferentiation
        __typename
      }
      annotations {
        favorite
        tagsAnnotation {
          value
          __typename
        }
        __typename
      }
      imageUrl
      detailPageUrl
      skuCentralLink
      estimatedShipping {
        ...CurrencyFields
        __typename
      }
      isCustomizable
      isParentListing
      shippingTemplate {
        Legacy
        TemplateName
        TemplateId
        __typename
      }
      marketplaceCount
      status {
        status
        statusText
        redirectionLink
        inlineAction
        inlineActionText
        highlightedState
        __typename
      }
      actions {
        __typename
        ... on ListingActionWorkflow {
          type
          displayGroup
          solutionId
          solutionParams {
            key
            value
            __typename
          }
          __typename
        }
        ... on ListingActionRedirect {
          type
          displayGroup
          isFetchRequest
          queryParams {
            key
            value
            __typename
          }
          url
          fragmentIdentifier
          __typename
        }
        ... on ListingActionAnnotation {
          type
          displayGroup
          listingAnnotations {
            favorite
            __typename
          }
          __typename
        }
        ... on ListingActionOperation {
          type
          displayGroup
          offerIds
          params {
            key
            value
            __typename
          }
          __typename
        }
      }
      availability {
        reserved {
          fcTransfer
          customerOrder
          fcProcessing
          __typename
        }
        buyableInTransit
        pendingCustomerOrdersInTransit
        quantity
        isQuantityInfinite
        inventoryAvailability
        unfulfillable
        unfulfillableDetails {
          expired
          damagedByCarrier
          damagedByCustomer
          damagedByDistributor
          damagedByWarehouse
          defective
          __typename
        }
        researching {
          shortTerm
          midTerm
          longTerm
          __typename
        }
        inbound
        onHandQuantity
        reservedQuantity
        fbaRecommendation {
          type
          attributes
          tags
          parameters {
            key
            value
            __typename
          }
          enforcementActions
          exemptionsExpiryDate
          creationTimestamp
          __typename
        }
        availabilities {
          fmid
          quantity
          fulfillmentChannelName
          isFulfilledByAmazon
          __typename
        }
        aaAvailabilities {
          quantity
          fulfillmentChannelName
          isAggregatedAvailability
          __typename
        }
        inventoryAlert {
          isThresholdReached
          threshold
          alertType
          __typename
        }
        recommendation {
          daysOfSupply
          recommendedInventory
          __typename
        }
        __typename
      }
      offers {
        offerId
        marketplace {
          marketplaceId
          defaultCountryCode
          __typename
        }
        ... on Offer3P {
          fulfillmentChannel
          businessProgram {
            value
            valueLabel
            __typename
          }
          minAllowedPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          maxAllowedPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          price {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          businessPrice {
            price {
              ...CurrencyFields
              __typename
            }
            percentQuantityPrice {
              quantity
              amount
              __typename
            }
            fixedQuantityPrice {
              quantity
              amount
              __typename
            }
            __typename
          }
          quantityDiscount {
            percentQuantityPrice {
              quantity
              amount
              __typename
            }
            fixedQuantityPrice {
              quantity
              amount
              __typename
            }
            __typename
          }
          salePrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          condition {
            condition
            subCondition
            __typename
          }
          points
          pointsLink
          automatedPricing {
            enrollmentStatus
            __typename
          }
          maxRetailPrice {
            price {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          haulOffer {
            offerId
            label
            state
            isHaulOffer
            hasHaulOffer
            haulPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          ffoOffer {
            offerId
            label
            state
            isFFOOffer
            ffoPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          nonAllOffer {
            label
            state
            isNonAllOffer
            hasNonAllOffer
            nonAllPrice {
              price {
                ...CurrencyFields
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
      pricing {
        competitionState {
          lowestPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          lowestOfferPoints
          buyBoxPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          buyBoxPoints
          salesRank {
            rank
            productCategory
            __typename
          }
          __typename
        }
        competitivePricingSummary {
          competitiveBenchmarkPrice {
            price {
              ...CurrencyFields
              __typename
            }
            shipping {
              ...CurrencyFields
              __typename
            }
            __typename
          }
          __typename
        }
        points
        automatedPricing {
          enrollmentStatus
          __typename
        }
        taxData {
          taxRate
          taxExclusivePrice
          taxExclusiveBusinessPrice
          __typename
        }
        __typename
      }
      pointsCentralLink
      __typename
    }
    count`;
const GET_SUPPRESSED_LISTINGS_QUERY = `${GET_SUPPRESSED_LISTINGS_PREFIX}
    __typename
  }
}`;
const GET_LISTING_ISSUES_QUERY = `query getListingIssuesActionsForSku($sku: String!, $contributorToken: String, $marketplaceIds: [String], $clientType: SparcClientType) {
  listingIssuesActions(
    input: {sku: $sku, marketplaceIds: $marketplaceIds, contributorId: $contributorToken, clientType: $clientType}
  ) {
    issues {
      localizedIssueMessage
      type
      tags
      enforcementActions
      issueSource
      parameters {
        key
        value
        __typename
      }
      issuePathForwards {
        type
        attributes {
          v3FlatPath
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}`;
function suppressedCell(value) {
	if (value == null) return "";
	return String(value);
}
function suppressedQuantity(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function optionalNumber(value) {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string" && value.trim()) {
		const amount = Number(value);
		if (Number.isFinite(amount)) return amount;
	}
	return "";
}
function suppressedYesNo(value) {
	if (value == null) return "";
	return value ? "Yes" : "No";
}
function currencyAmount(price) {
	return optionalNumber(price?.amount);
}
function joinParts(parts) {
	return parts.map((part) => part == null ? "" : String(part).trim()).filter(Boolean).join(" | ");
}
function keyValues(pairs) {
	return (pairs ?? []).filter((pair) => Boolean(pair)).map((pair) => `${pair.key ?? ""}=${pair.value ?? ""}`).filter((part) => part !== "=").join(", ");
}
function quantityPrices(entries, suffix = "") {
	return (entries ?? []).filter((entry) => Boolean(entry)).map((entry) => `${suppressedCell(entry.quantity)}${suffix}:${suppressedCell(entry.amount)}`).filter((part) => part !== `${suffix}:` && part !== ":");
}
function formatQuantityDiscount(discount) {
	if (!discount) return "";
	return [...quantityPrices(discount.percentQuantityPrice, "%"), ...quantityPrices(discount.fixedQuantityPrice)].join(", ");
}
function formatFbaRecommendation(recommendation) {
	if (!recommendation) return "";
	return joinParts([
		recommendation.type,
		(recommendation.tags ?? []).filter(Boolean).join(", "),
		(recommendation.attributes ?? []).filter(Boolean).join(", "),
		keyValues(recommendation.parameters),
		(recommendation.enforcementActions ?? []).filter(Boolean).join(", ")
	]);
}
function formatAvailabilities(listing) {
	return (listing.availability?.availabilities ?? []).filter((item) => Boolean(item)).map((item) => `${suppressedCell(item.fmid)}:${suppressedQuantity(item.quantity)}:${suppressedCell(item.fulfillmentChannelName)}`).filter(Boolean).join(" | ");
}
function formatAaAvailabilities(listing) {
	return (listing.availability?.aaAvailabilities ?? []).filter((item) => Boolean(item)).map((item) => joinParts([
		item.fulfillmentChannelName,
		suppressedQuantity(item.quantity),
		item.isAggregatedAvailability ? "aggregated" : ""
	])).filter(Boolean).join(" | ");
}
function formatInventoryAlert(listing) {
	const alert = listing.availability?.inventoryAlert;
	if (!alert) return "";
	return joinParts([
		alert.alertType,
		alert.threshold == null ? "" : `threshold=${alert.threshold}`,
		alert.isThresholdReached == null ? "" : `reached=${suppressedYesNo(alert.isThresholdReached)}`
	]);
}
function formatSpecialOffer(offer, price) {
	if (!offer) return "";
	const amount = currencyAmount(price);
	return joinParts([
		offer.label,
		offer.state,
		amount === "" ? "" : amount
	]);
}
function offerRichness(offer) {
	let score = 0;
	const bump = (value) => {
		if (value != null && value !== "") score += 1;
	};
	bump(offer.price?.price?.amount);
	bump(offer.businessPrice);
	bump(offer.quantityDiscount);
	bump(offer.salePrice?.price?.amount);
	bump(offer.minAllowedPrice?.price?.amount);
	bump(offer.maxAllowedPrice?.price?.amount);
	bump(offer.automatedPricing);
	bump(offer.maxRetailPrice?.price?.amount);
	bump(offer.haulOffer);
	bump(offer.ffoOffer);
	bump(offer.nonAllOffer);
	bump(offer.points);
	bump(offer.condition?.condition);
	return score;
}
function primaryOffer(listing) {
	const offers = (listing.offers ?? []).filter((offer) => Boolean(offer));
	if (offers.length === 0) return undefined;
	return offers.reduce((best, offer) => offerRichness(offer) > offerRichness(best) ? offer : best);
}
function asSuppressedListing(value) {
	if (!value || typeof value !== "object") return undefined;
	return value;
}
function parseSuppressedListingsPage(payload) {
	const messages = graphqlMessages(payload);
	const data = payload && typeof payload === "object" && "data" in payload ? payload.data : undefined;
	const listingsV2 = data && typeof data === "object" && "listingsV2" in data ? data.listingsV2 : undefined;
	if (!listingsV2 || typeof listingsV2 !== "object") {
		if (messages.length) throw new Error(messages.join(" "));
		throw new Error("Couldn’t load search-suppressed inventory.");
	}
	const record = listingsV2;
	const rows = Array.isArray(record.listings) ? record.listings : [];
	const listings = rows.map(asSuppressedListing).filter((listing) => listing !== undefined);
	const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length;
	return {
		listings,
		count,
		rows: rows.length
	};
}
function suppressedSheetRow(listing) {
	const offer = primaryOffer(listing);
	const details = listing.availability?.unfulfillableDetails;
	const competition = listing.pricing?.competitionState;
	const benchmark = listing.pricing?.competitivePricingSummary?.competitiveBenchmarkPrice;
	const price = currencyAmount(offer?.price?.price);
	return [
		suppressedCell(listing.coreListingFields?.sku ?? listing.listingData?.sku),
		suppressedCell(listing.coreListingFields?.asin ?? listing.listingData?.asin),
		suppressedCell(listing.coreListingFields?.fnSku ?? listing.listingData?.fnSku),
		suppressedCell(listing.listingData?.title),
		suppressedCell(listing.listingData?.titleDifferentiation),
		suppressedCell(listing.imageUrl),
		suppressedCell(listing.detailPageUrl),
		suppressedCell(listing.skuCentralLink),
		formatListingStatus(listing.status?.status),
		suppressedCell(listing.status?.statusText),
		suppressedCell(listing.status?.highlightedState),
		suppressedCell(listing.status?.inlineAction),
		suppressedCell(listing.status?.inlineActionText),
		suppressedCell(listing.status?.redirectionLink),
		...suppressedIssueCells(listing),
		suppressedCell(listing.listingData?.productType),
		suppressedCell(listing.listingData?.listingType),
		suppressedCell(listing.listingData?.bundleStatus),
		suppressedCell(listing.coreListingFields?.fulfillmentChannel ?? offer?.fulfillmentChannel),
		suppressedCell(offer?.condition?.condition),
		suppressedCell(offer?.condition?.subCondition),
		suppressedCell(listing.listingData?.parentAsin),
		suppressedCell(listing.listingData?.parentSku),
		suppressedQuantity(listing.listingData?.numberOfChildren),
		suppressedYesNo(listing.isParentListing),
		suppressedYesNo(listing.isCustomizable),
		suppressedQuantity(listing.marketplaceCount),
		(listing.listingData?.externalIds ?? []).filter((id) => Boolean(id)).map((id) => `${suppressedCell(id.type)}:${suppressedCell(id.value)}`).filter((part) => part !== ":").join(", "),
		suppressedYesNo(listing.annotations?.favorite),
		(listing.annotations?.tagsAnnotation ?? []).map((tag) => tag?.value).filter((value) => Boolean(value)).join(", "),
		suppressedCell(listing.shippingTemplate?.TemplateName),
		suppressedCell(listing.shippingTemplate?.TemplateId),
		suppressedYesNo(listing.shippingTemplate?.Legacy),
		suppressedCell(listing.listingData?.dateCreated),
		suppressedCell(listing.listingData?.lastUpdated),
		optionalNumber(listing.listingData?.last30DayGms),
		optionalNumber(listing.listingData?.last30DayGv),
		optionalNumber(listing.listingData?.last30DayUnitsSold),
		suppressedCell(listing.listingData?.qualityRecommendationScore?.grade),
		suppressedCell(listing.listingData?.qualityRecommendationScore?.lastUpdatedDate),
		suppressedQuantity(listing.availability?.quantity),
		suppressedYesNo(listing.availability?.isQuantityInfinite),
		suppressedCell(listing.availability?.inventoryAvailability),
		suppressedQuantity(listing.availability?.onHandQuantity),
		suppressedQuantity(listing.availability?.inbound),
		suppressedQuantity(listing.availability?.reservedQuantity),
		suppressedQuantity(listing.availability?.reserved?.fcTransfer),
		suppressedQuantity(listing.availability?.reserved?.customerOrder),
		suppressedQuantity(listing.availability?.reserved?.fcProcessing),
		suppressedQuantity(listing.availability?.buyableInTransit),
		suppressedQuantity(listing.availability?.pendingCustomerOrdersInTransit),
		suppressedQuantity(listing.availability?.unfulfillable),
		suppressedQuantity(details?.damagedByCarrier),
		suppressedQuantity(details?.damagedByCustomer),
		suppressedQuantity(details?.defective),
		suppressedQuantity(details?.expired),
		suppressedQuantity(details?.damagedByWarehouse),
		suppressedQuantity(details?.damagedByDistributor),
		suppressedQuantity(listing.availability?.researching?.shortTerm),
		suppressedQuantity(listing.availability?.researching?.midTerm),
		suppressedQuantity(listing.availability?.researching?.longTerm),
		formatFbaRecommendation(listing.availability?.fbaRecommendation),
		formatAvailabilities(listing),
		formatAaAvailabilities(listing),
		formatInventoryAlert(listing),
		optionalNumber(listing.availability?.recommendation?.daysOfSupply),
		optionalNumber(listing.availability?.recommendation?.recommendedInventory),
		price,
		suppressedCell(offer?.price?.price?.currencyUnit),
		currencyAmount(offer?.salePrice?.price),
		currencyAmount(offer?.minAllowedPrice?.price),
		currencyAmount(offer?.maxAllowedPrice?.price),
		currencyAmount(offer?.businessPrice?.price),
		formatQuantityDiscount(offer?.quantityDiscount ?? offer?.businessPrice),
		currencyAmount(offer?.maxRetailPrice?.price),
		currencyAmount(listing.estimatedShipping),
		suppressedCell(offer?.points ?? listing.pricing?.points),
		suppressedCell(offer?.automatedPricing?.enrollmentStatus ?? listing.pricing?.automatedPricing?.enrollmentStatus),
		optionalNumber(listing.pricing?.taxData?.taxRate),
		optionalNumber(listing.pricing?.taxData?.taxExclusivePrice),
		optionalNumber(listing.pricing?.taxData?.taxExclusiveBusinessPrice),
		currencyAmount(competition?.lowestPrice?.price),
		currencyAmount(competition?.lowestPrice?.shipping),
		currencyAmount(competition?.buyBoxPrice?.price),
		currencyAmount(competition?.buyBoxPrice?.shipping),
		optionalNumber(competition?.salesRank?.rank),
		suppressedCell(competition?.salesRank?.productCategory),
		currencyAmount(benchmark?.price),
		currencyAmount(benchmark?.shipping),
		suppressedCell(offer?.businessProgram?.valueLabel ?? offer?.businessProgram?.value),
		formatSpecialOffer(offer?.haulOffer, offer?.haulOffer?.haulPrice?.price),
		formatSpecialOffer(offer?.ffoOffer, offer?.ffoOffer?.ffoPrice?.price),
		formatSpecialOffer(offer?.nonAllOffer, offer?.nonAllOffer?.nonAllPrice?.price),
		(listing.actions ?? []).map((action) => action?.type).filter((type) => Boolean(type)).join(", "),
		suppressedCell(listing.pointsCentralLink)
	];
}
function listingSku(listing) {
	const sku = listing.coreListingFields?.sku?.trim() || listing.listingData?.sku?.trim();
	return sku || undefined;
}
function issueParameter(issue, key) {
	for (const parameter of issue.parameters ?? []) {
		if (parameter?.key === key && parameter.value) return parameter.value;
	}
	return "";
}
function issueAttribute(issue) {
	const fromParams = issueParameter(issue, "v3_flat_attribute_name") || issueParameter(issue, "attribute_name");
	if (fromParams) return fromParams.replace(/^\[|\]$/g, "");
	for (const forward of issue.issuePathForwards ?? []) {
		for (const attribute of forward?.attributes ?? []) {
			if (attribute?.v3FlatPath) return attribute.v3FlatPath;
		}
	}
	return "";
}
function formatSuppressedIssues(issues) {
	const rows = (issues ?? []).filter((issue) => Boolean(issue));
	const join = (values) => values.map((value) => value?.trim() ?? "").filter(Boolean).join(" || ");
	const tags = new Set();
	for (const issue of rows) {
		for (const tag of issue.tags ?? []) {
			if (tag) tags.add(tag);
		}
	}
	return {
		message: join(rows.map((issue) => issue.localizedIssueMessage)),
		type: join(rows.map((issue) => issue.type)),
		attribute: join(rows.map(issueAttribute)),
		enforcement: join(rows.map((issue) => (issue.enforcementActions ?? []).filter(Boolean).join(", "))),
		source: join(rows.map((issue) => issue.issueSource)),
		tags: [...tags].join(", ")
	};
}
function suppressedIssueCells(listing) {
	if (listing.issuesFetchFailed) {
		return [
			SUPPRESSED_ISSUE_UNAVAILABLE,
			"",
			"",
			"",
			"",
			""
		];
	}
	const formatted = formatSuppressedIssues(listing.issues);
	return [
		formatted.message,
		formatted.type,
		formatted.attribute,
		formatted.enforcement,
		formatted.source,
		formatted.tags
	];
}
function parseListingIssues(payload) {
	const messages = graphqlMessages(payload);
	const data = payload && typeof payload === "object" && "data" in payload ? payload.data : undefined;
	const listingIssuesActions = data && typeof data === "object" && "listingIssuesActions" in data ? data.listingIssuesActions : undefined;
	if (!listingIssuesActions || typeof listingIssuesActions !== "object") {
		if (messages.length) throw new Error(messages.join(" "));
		throw new Error("Couldn’t load listing suppression reasons.");
	}
	const issues = listingIssuesActions.issues;
	if (!Array.isArray(issues)) return [];
	return issues.filter((issue) => Boolean(issue && typeof issue === "object"));
}
function hasNonZeroQuantity(listing) {
	if (listing.availability?.isQuantityInfinite) return true;
	const available = listing.availability?.quantity;
	return typeof available === "number" && Number.isFinite(available) && available !== 0;
}
function inStockSuppressedListings(listings) {
	return listings.filter(hasNonZeroQuantity);
}
function suppressedSheetNotes(listings) {
	const notes = [];
	if (listings.some((listing) => listing.listingsIncomplete)) notes.push([SUPPRESSED_LISTINGS_INCOMPLETE_NOTE]);
	if (listings.some((listing) => listing.issuesFetchFailed)) notes.push([SUPPRESSED_ISSUES_INCOMPLETE_NOTE]);
	if (notes.length) notes.push([]);
	return notes;
}
function suppressedSheetRows(listings) {
	const rows = inStockSuppressedListings(listings);
	return [
		...suppressedSheetNotes(listings),
		[...SUPPRESSED_SHEET_HEADERS],
		...rows.map(suppressedSheetRow)
	];
}
function suppressedListingsVariables(from, size) {
	return {
		pagination: {
			from,
			size
		},
		sortRequest: {
			key: "QUANTITY_AVAILABLE",
			order: "DESCENDING"
		},
		multiSelectFilters: [
			{
				key: "LISTING_STATUS",
				values: ["SearchSuppressed"]
			},
			{
				key: "FULFILLMENT",
				values: ["AllChannels"]
			},
			{
				key: "CONDITION",
				values: []
			}
		]
	};
}
async function postSuppressedListingsPage(fetchImpl, token, from, size) {
	const response = await fetchImpl(SUPPRESSED_GQL_URL, {
		method: "POST",
		credentials: "include",
		headers: {
			accept: "application/graphql-response+json, application/json",
			"content-type": "application/json",
			"anti-csrftoken-a2z": token
		},
		body: JSON.stringify({
			operationName: "getListingsV2",
			variables: suppressedListingsVariables(from, size),
			query: GET_SUPPRESSED_LISTINGS_QUERY
		})
	});
	if (!response.ok) throw new Error(`Couldn’t load search-suppressed inventory (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load search-suppressed inventory.");
	}
	return parseSuppressedListingsPage(payload);
}
async function postListingIssues(fetchImpl, token, sku) {
	const response = await fetchImpl(SUPPRESSED_GQL_URL, {
		method: "POST",
		credentials: "include",
		headers: {
			accept: "application/graphql-response+json, application/json",
			"content-type": "application/json",
			"anti-csrftoken-a2z": token
		},
		body: JSON.stringify({
			operationName: "getListingIssuesActionsForSku",
			variables: {
				sku,
				contributorToken: ""
			},
			query: GET_LISTING_ISSUES_QUERY
		})
	});
	if (!response.ok) throw new Error(`Couldn’t load listing suppression reasons (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load listing suppression reasons.");
	}
	return parseListingIssues(payload);
}
/** Loads each SKU's suppression reasons, keeping SUPPRESSED_ISSUES_CONCURRENCY requests in flight. */
async function fetchListingIssues(fetchImpl, token, listings, onProgress, log) {
	if (listings.length === 0) return [];
	const total = listings.length;
	onProgress?.({
		source: "suppressed",
		status: "active",
		loaded: 0,
		total,
		phase: "issues"
	});
	let processed = 0;
	let failed = 0;
	const withIssues = await mapWithConcurrency(listings, SUPPRESSED_ISSUES_CONCURRENCY, async (listing) => {
		const sku = listingSku(listing);
		let result;
		if (!sku) {
			result = {
				...listing,
				issues: []
			};
		} else {
			try {
				result = {
					...listing,
					issues: await postListingIssues(fetchImpl, token, sku)
				};
			} catch (error) {
				failed += 1;
				if (failed === 1) log?.warn("suppressed.issuesFailed", { error: describeError(error) });
				result = {
					...listing,
					issues: [],
					issuesFetchFailed: true
				};
			}
		}
		processed += 1;
		onProgress?.({
			source: "suppressed",
			status: "active",
			loaded: processed,
			total,
			phase: "issues"
		});
		return result;
	});
	if (failed > 0) log?.warn("suppressed.issuesIncomplete", {
		failed,
		total
	});
	return withIssues;
}
async function fetchSuppressedListings(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const root = options.root ?? document;
	const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "");
	const onProgress = options.onProgress;
	const log = options.log;
	let token = readAntiCsrfToken(root, cookie);
	if (!token) {
		log?.info("suppressed.tokenFromInventoryPage");
		token = await fetchAntiCsrfTokenFromInventory(fetchImpl);
	}
	if (!token) throw new Error("Couldn’t read the Seller Central security token.");
	onProgress?.({
		source: "suppressed",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	const listings = [];
	let offset = 0;
	let reportedCount = 0;
	let listingsIncomplete = false;
	let stoppedAtZeroAvailable = false;
	for (let page = 0; page < SUPPRESSED_MAX_PAGES; page += 1) {
		const size = page === 0 ? SUPPRESSED_FIRST_PAGE_SIZE : SUPPRESSED_PAGE_SIZE;
		const pageDone = log?.time("suppressed.page", {
			page,
			from: offset,
			size
		});
		let result;
		try {
			result = await postSuppressedListingsPage(fetchImpl, token, offset, size);
		} catch (error) {
			if (listings.length > 0) {
				log?.warn("suppressed.listingsStopped", {
					page,
					loaded: listings.length,
					error: describeError(error)
				});
				listingsIncomplete = true;
				break;
			}
			throw error;
		}
		// Available quantity is descending, so the first out-of-stock row ends the scan.
		const cutoff = result.listings.findIndex((listing) => !hasNonZeroQuantity(listing));
		const inStock = cutoff === -1 ? result.listings : result.listings.slice(0, cutoff);
		listings.push(...inStock);
		stoppedAtZeroAvailable = cutoff !== -1;
		offset += result.rows;
		reportedCount = result.count;
		pageDone?.({
			rows: result.rows,
			inStock: inStock.length,
			reported: result.count
		});
		onProgress?.({
			source: "suppressed",
			status: "active",
			loaded: listings.length,
			total: result.count,
			phase: "listings"
		});
		if (stoppedAtZeroAvailable || result.rows === 0 || offset >= result.count) break;
	}
	if (!stoppedAtZeroAvailable && reportedCount > offset) {
		log?.warn("suppressed.listingsIncomplete", {
			scanned: offset,
			reported: reportedCount
		});
		listingsIncomplete = true;
	}
	const tagged = listingsIncomplete ? listings.map((listing) => ({
		...listing,
		listingsIncomplete: true
	})) : listings;
	const inStock = inStockSuppressedListings(tagged);
	const merged = await fetchListingIssues(fetchImpl, token, inStock, onProgress, log);
	onProgress?.({
		source: "suppressed",
		status: "complete",
		loaded: merged.length,
		total: merged.length,
		phase: merged.length > 0 ? "issues" : "listings"
	});
	return merged;
}

const SHIPPING_QUEUE_URL = "https://sellercentral.amazon.com/fba/shippingqueue/api/v1/shipment/listShipments";
const SHIPPING_QUEUE_REFERRER = "https://sellercentral.amazon.com/manage/shipments?ref=sc_shipments";
/** Amazon's largest page; bigger pages fail with HTTP 400. */
const SHIPPING_QUEUE_DEFAULT_PAGE_SIZE = 250;
const SHIPPING_QUEUE_ORDER_BY = "SHIPMENT_UPDATE_DATE";
/** The list is read in slices of Amazon's update-date index this many days long. */
const SHIPPING_QUEUE_SLICE_DAYS = 30;
/** How far before the cutoff the slices reach; one last slice holds everything older. */
const SHIPPING_QUEUE_SLICE_YEARS = 4;
const SHIPPING_QUEUE_SLICE_CONCURRENCY = 10;
/** Slices widen past SHIPPING_QUEUE_SLICE_DAYS when needed to stay within this many. */
const SHIPPING_QUEUE_MAX_SLICES = 80;
/** Reading stops once this many shipments in a row, in Amazon's order, fall before the cutoff. */
const SHIPPING_QUEUE_TRAILING_ROWS = 250;
const SHIPPING_QUEUE_MAX_REQUESTS = 200;
const SHIPMENT_ELIGIBILITY_URL = "https://sellercentral.amazon.com/fba/wmsr/eligibilities";
const SHIPMENT_DISCREPANCIES_URL = "https://sellercentral.amazon.com/fba/wmsr/discrepancies";
/** Amazon's largest page of SKU lines; the eligibility response carries only the first 50. */
const SHIPMENT_DISCREPANCY_PAGE_SIZE = 100;
const SHIPMENT_DOCUMENTS_URL = "https://sellercentral.amazon.com/fba/wmsr/document-requirements";
const SHIPMENT_CLAIM_PAGE_URL = "https://sellercentral.amazon.com/fba/wmsr";
const SHIPPING_STATUS_OUTSIDE_WINDOW = "Shipment ID - Outside Reconciliation Window";
const SHIPPING_STATUS_MONITORING = "Shipment ID - For Monitoring (Automatically Closed After 90 Days)";
const SHIPPING_STATUS_INVESTIGATION_COMPLETED = "Shipment ID - Investigation Completed - Contents Counted and Confirmed";
const SHIPPING_STATUS_UNITS_LOCATED = "Shipment ID - Units Located - No Further Action Required";
const SHIPPING_STATUS_RECEIVED_IN_FULL = "Received in Full - No Discrepancies Found";
const SHIPPING_STATUS_NEW = "Shipment ID - New (Send List)";
const SHIPPING_STATUS_OVERAGED = "Shipment ID - Overaged";
const SHIPPING_STATUS_REVIEW = "Review Needed";
const SHIPPING_STATUS_UNAVAILABLE = "N/A";
const REQUIRED_DOCUMENT_INVOICE = "Proof of Inventory Ownership";
const REQUIRED_DOCUMENT_DELIVERY = "Delivery";
const SHIPMENT_DETAILS_CONCURRENCY = 60;
const SHIPMENT_DETAILS_MAX_ATTEMPTS = 3;
const SHIPMENT_DETAILS_RETRY_DELAY_MS = 500;
const SHIPMENT_DETAILS_SESSION_WAIT_MS = 6e4;
const SHIPMENT_DETAILS_SESSION_PAUSES = 3;
const SHIPPING_QUEUE_DETAILS_LOADED = "Loaded";
const SHIPPING_QUEUE_DETAILS_UNAVAILABLE = "Couldn’t load shipment details";
const SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE = "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable.";
const SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE = "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”.";
const SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE = "Some shipments’ SKU lines couldn’t all be loaded. Those shipments list only the SKU lines that were obtainable.";
const SHIPPING_QUEUE_SHIPMENT_HEADERS = [
	"Shipment Name",
	"Shipment ID",
	"Shipment URL",
	"Status",
	"Destination FC",
	"FC Country",
	"Ship From Address ID",
	"Created Date",
	"Last Updated Date",
	"MSKUs",
	"Shipped Quantity",
	"Received Quantity",
	"Expected Quantity",
	"Located Quantity",
	"Stowed Quantity",
	"Quantity Discrepancy",
	"Workflow ID",
	"Workflow Type",
	"PO ID",
	"Placement Status",
	"Window Type",
	"Window Start Date",
	"Window End Date",
	"Grace Period End Date",
	"Window Compliance Status",
	"Need By Date",
	"Reason Code",
	"Finalized",
	"Finalized Date",
	"Estimated Finalized Date UTC",
	"Former Estimated Finalized Date UTC",
	"Blocked",
	"Partnered Import",
	"Merchant Launched",
	"ISMS Details",
	"T2P Accelerate"
];
const SHIPPING_QUEUE_DETAIL_HEADERS = [
	"Details Status",
	"Claim Page URL",
	"Reimbursement Eligible",
	"Ineligibility Reason",
	"Estimated Eligibility Date",
	"Former Estimated Eligibility Date",
	"Days To Wait",
	"Eligibility Details",
	"Inquiry Status",
	"Inquiry Text",
	"Inquiry Case ID",
	"Inquiry Case Created Date",
	"Inquiry Case Created By",
	"Has Discrepancy",
	"Retail Domain",
	"Claims Allowed",
	"SKU Lines",
	"Total Discrepancy Quantity"
];
const SHIPPING_QUEUE_ITEM_HEADERS = [
	"SKU",
	"Title",
	"FNSKU",
	"ASIN",
	"ASIN URL",
	"UPC",
	"Barcode Type",
	"Barcode Value",
	"Condition",
	"Sortable",
	"Eligible For Research",
	"Item Expected Quantity",
	"Item Located Quantity",
	"Item Received Quantity",
	"Adjustment Quantity",
	"Reimbursed Quantity",
	"Clawback Quantity",
	"Acknowledged Quantity",
	"Denied Quantity",
	"Virtually Adjusted Quantity",
	"Other Received Quantity",
	"Other Receive Start Date",
	"Other Receive End Date",
	"IAR Auto Reconciliations",
	"Item Discrepancy Quantity",
	"Item Ineligibility Reason",
	"Item Case ID",
	"Item Reason Code"
];
const SHIPPING_QUEUE_SHEET_HEADERS = [
	...SHIPPING_QUEUE_SHIPMENT_HEADERS,
	...SHIPPING_QUEUE_DETAIL_HEADERS,
	...SHIPPING_QUEUE_ITEM_HEADERS
];
function calculateShippingQueueCutoffDate(referenceDate = new Date()) {
	const year = referenceDate.getUTCFullYear();
	const month = referenceDate.getUTCMonth();
	const day = referenceDate.getUTCDate() - 1;
	const yesterday = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
	const targetYear = yesterday.getUTCFullYear();
	const targetMonth = yesterday.getUTCMonth() - 9;
	const targetDay = yesterday.getUTCDate();
	const cutoff = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
	const daysInTargetMonth = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
	cutoff.setUTCDate(Math.min(targetDay, daysInTargetMonth));
	return cutoff;
}
function getShipmentLastUpdatedMs(shipment) {
	const value = shipment.lastUpdatedDate ?? shipment.createdDate;
	if (value == null || value === "") return null;
	const ms = typeof value === "number" ? value : Number(value);
	if (Number.isFinite(ms)) return ms;
	const parsed = Date.parse(String(value));
	return Number.isFinite(parsed) ? parsed : null;
}
function formatShippingQueueDate(value) {
	if (value == null || value === "") return "";
	const ms = typeof value === "number" ? value : Number(value);
	const date = Number.isFinite(ms) ? new Date(ms) : new Date(String(value));
	if (Number.isNaN(date.getTime())) return String(value);
	return formatUtcDateTime(date);
}
/** Amazon reports "no estimate" as 0; show those as blank rather than 01-Jan-1970. */
function formatEligibilityDate(value) {
	if (value === 0 || value === "0") return "";
	return formatShippingQueueDate(value);
}
function shippingQueueCell(value) {
	if (value == null) return "";
	return String(value);
}
function shippingQueueNumericCell(value) {
	if (value == null || value === "") return "";
	const num = typeof value === "number" ? value : Number(value);
	return Number.isFinite(num) ? num : "";
}
function shippingQueueYesNo(value) {
	if (value === true) return "Yes";
	if (value === false) return "No";
	return "";
}
function calculateDiscrepancyQuantity(receivedQuantity, shippedQuantity) {
	const received = shippingQueueNumericCell(receivedQuantity);
	const shipped = shippingQueueNumericCell(shippedQuantity);
	if (received === "" || shipped === "") return "";
	return received - shipped;
}
function buildShipmentUrl(shipmentId) {
	const trimmed = shipmentId?.trim();
	return trimmed ? `https://sellercentral.amazon.com/fba/inbound-shipment/summary/${encodeURIComponent(trimmed)}/contents` : "";
}
function buildShipmentClaimUrl(shipmentId) {
	const trimmed = shipmentId?.trim();
	return trimmed ? `${SHIPMENT_CLAIM_PAGE_URL}/${encodeURIComponent(trimmed)}` : "";
}
function buildAsinUrl(asin) {
	const trimmed = asin?.trim();
	return trimmed ? `https://www.amazon.com/dp/${encodeURIComponent(trimmed)}` : "";
}
function shippingQueueFormatComplexField(value) {
	if (value == null) return "";
	if (typeof value === "boolean") return shippingQueueYesNo(value);
	if (typeof value === "object") {
		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	}
	return String(value);
}
function formatEligibilityDetails(details) {
	if (!details) return "";
	return Object.entries(details).map(([key, value]) => `${key}: ${shippingQueueFormatComplexField(value)}`).join("; ");
}
function optString(value) {
	if (value == null) return undefined;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	return undefined;
}
function optNumber(value) {
	if (value == null || value === "") return undefined;
	const num = typeof value === "number" ? value : Number(value);
	return Number.isFinite(num) ? num : undefined;
}
function optBoolean(value) {
	return typeof value === "boolean" ? value : undefined;
}
function optDate(value) {
	if (typeof value === "number" || typeof value === "string") return value;
	return undefined;
}
function assignDefined(target, values) {
	for (const [key, value] of Object.entries(values)) {
		if (value !== undefined) target[key] = value;
	}
	return target;
}
function asShippingQueueShipment(value) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const shipment = {};
	assignDefined(shipment, {
		shipmentName: typeof record.shipmentName === "string" ? record.shipmentName : undefined,
		shipmentId: typeof record.shipmentId === "string" ? record.shipmentId : undefined,
		destinationFC: typeof record.destinationFC === "string" ? record.destinationFC : undefined,
		shipFromAddressId: typeof record.shipFromAddressId === "string" ? record.shipFromAddressId : undefined,
		shipmentStatus: typeof record.shipmentStatus === "string" ? record.shipmentStatus : undefined,
		createdDate: optDate(record.createdDate),
		lastUpdatedDate: optDate(record.lastUpdatedDate),
		mskus: optNumber(record.mskus),
		shippedQuantity: optNumber(record.shippedQuantity),
		receivedQuantity: optNumber(record.receivedQuantity),
		expectedQuantity: optNumber(record.expectedQuantity),
		locatedQuantity: optNumber(record.locatedQuantity),
		stowedQuantity: optNumber(record.stowedQuantity),
		workflowId: typeof record.workflowId === "string" ? record.workflowId : undefined,
		workflowType: typeof record.workflowType === "string" ? record.workflowType : undefined,
		poId: typeof record.poId === "string" ? record.poId : undefined,
		needByDate: optDate(record.needByDate),
		placementStatus: typeof record.placementStatus === "string" ? record.placementStatus : undefined,
		fcAddress: typeof record.fcAddress === "string" ? record.fcAddress : undefined,
		reasonCode: optString(record.reasonCode),
		finalizedDate: optDate(record.finalizedDate),
		estimatedFinalizedDateUTC: optDate(record.estimatedFinalizedDateUTC),
		formerEstimatedFinalizedDateUTC: optDate(record.formerEstimatedFinalizedDateUTC),
		shipOrDeliveryWindowComplianceStatus: optString(record.shipOrDeliveryWindowComplianceStatus),
		ismsDetails: record.ismsDetails,
		t2pAccelerate: record.t2pAccelerate,
		blocked: optBoolean(record.blocked),
		partneredImport: optBoolean(record.partneredImport),
		merchantLaunched: optBoolean(record.merchantLaunched),
		finalized: optBoolean(record.finalized)
	});
	if (record.shipOrDeliveryWindow && typeof record.shipOrDeliveryWindow === "object") {
		const window = record.shipOrDeliveryWindow;
		shipment.shipOrDeliveryWindow = {
			windowStartDate: optDate(window.windowStartDate),
			windowEndDate: optDate(window.windowEndDate),
			windowType: typeof window.windowType === "string" ? window.windowType : null,
			gracePeriodEndDate: optDate(window.gracePeriodEndDate)
		};
	}
	return shipment;
}
function parseShippingQueueResponse(payload) {
	if (!payload) {
		throw new Error("Couldn’t load shipping queue.");
	}
	let items;
	if (Array.isArray(payload)) {
		items = payload;
	} else if (typeof payload === "object" && payload !== null) {
		const record = payload;
		if (Array.isArray(record.shipments)) items = record.shipments;
		else if (Array.isArray(record.data)) items = record.data;
		else if (Array.isArray(record.shipmentList)) items = record.shipmentList;
		else if (Array.isArray(record.items)) items = record.items;
		else if (Array.isArray(record.payload)) items = record.payload;
	}
	if (!items) {
		throw new Error("Couldn’t load shipping queue.");
	}
	return items.map(asShippingQueueShipment).filter((s) => s !== undefined);
}
function asShipmentDiscrepancyItem(value) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	return assignDefined({}, {
		merchantSKU: optString(record.merchantSKU),
		title: optString(record.title),
		fnsku: optString(record.fnsku),
		asin: optString(record.asin),
		upc: optString(record.upc),
		barcodeType: optString(record.barcodeType),
		barcodeValue: optString(record.barcodeValue),
		isSortable: optBoolean(record.isSortable),
		eligibleForResearch: optBoolean(record.eligibleForResearch),
		expectedQuantity: optNumber(record.expectedQuantity),
		totalLocatedQuantity: optNumber(record.totalLocatedQuantity),
		totalReceivedQuantity: optNumber(record.totalReceivedQuantity),
		totalAdjustmentQuantity: optNumber(record.totalAdjustmentQuantity),
		totalReimbursedQuantity: optNumber(record.totalReimbursedQuantity),
		totalClawbackQuantity: optNumber(record.totalClawbackQuantity),
		totalAcknowledgedQuantity: optNumber(record.totalAcknowledgedQuantity),
		totalDeniedQuantity: optNumber(record.totalDeniedQuantity),
		totalVirtuallyAdjustedQuantity: optNumber(record.totalVirtuallyAdjustedQuantity),
		otherReceivedQuantity: optNumber(record.otherReceivedQuantity),
		otherReceiveStartDate: optDate(record.otherReceiveStartDate),
		otherReceiveEndDate: optDate(record.otherReceiveEndDate),
		iarAutoReconciliations: record.iarAutoReconciliations ?? undefined,
		totalDiscrepancyQuantity: optNumber(record.totalDiscrepancyQuantity),
		ineligibilityReason: optString(record.ineligibilityReason),
		caseId: optString(record.caseId),
		itemCondition: optString(record.itemCondition),
		reasonCode: optString(record.reasonCode)
	});
}
function parseShipmentDetails(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		throw new Error("Couldn’t load shipment details.");
	}
	const record = payload;
	const details = { items: [] };
	assignDefined(details, {
		eligible: optBoolean(record.eligible),
		ineligibilityReason: optString(record.ineligibilityReason),
		estimatedTimestamp: optDate(record.estimatedTimestamp),
		formerEstimatedTimestamp: optDate(record.formerEstimatedTimestamp),
		daysToWait: optNumber(record.daysToWait),
		hasDiscrepancy: optBoolean(record.hasDiscrepancy),
		retailDomainName: optString(record.retailDomainName),
		wmsrAllowed: optBoolean(record.wmsrAllowed)
	});
	if (record.details && typeof record.details === "object" && !Array.isArray(record.details)) {
		details.details = record.details;
	}
	if (record.inquiry && typeof record.inquiry === "object") {
		const inquiry = record.inquiry;
		details.inquiry = assignDefined({}, {
			inquiryText: optString(inquiry.inquiryText),
			inquiryStatus: optString(inquiry.inquiryStatus),
			caseId: optString(inquiry.caseId),
			caseCreationDate: optDate(inquiry.caseCreationDate),
			caseCreatedBy: optString(inquiry.caseCreatedBy)
		});
	}
	if (record.discrepancies && typeof record.discrepancies === "object") {
		const discrepancies = record.discrepancies;
		details.discrepancyTotalRecords = optNumber(discrepancies.totalRecords);
		if (Array.isArray(discrepancies.items)) {
			details.items = discrepancies.items.map(asShipmentDiscrepancyItem).filter((item) => item !== undefined);
		}
	}
	return details;
}
function shipmentDetailsIncomplete(details) {
	const total = details?.discrepancyTotalRecords;
	return typeof total === "number" && total > (details?.items.length ?? 0);
}
function totalDiscrepancyQuantity(details) {
	let total = 0;
	let seen = false;
	for (const item of details.items) {
		if (typeof item.totalDiscrepancyQuantity === "number") {
			total += item.totalDiscrepancyQuantity;
			seen = true;
		}
	}
	return seen ? total : "";
}
const BLANK_DETAIL_CELLS = SHIPPING_QUEUE_DETAIL_HEADERS.map(() => "");
const BLANK_ITEM_CELLS = SHIPPING_QUEUE_ITEM_HEADERS.map(() => "");
function shipmentListCells(shipment) {
	const window = shipment.shipOrDeliveryWindow;
	return [
		shippingQueueCell(shipment.shipmentName),
		shippingQueueCell(shipment.shipmentId),
		buildShipmentUrl(shipment.shipmentId),
		shippingQueueCell(shipment.shipmentStatus),
		shippingQueueCell(shipment.destinationFC),
		shippingQueueCell(shipment.fcAddress),
		shippingQueueCell(shipment.shipFromAddressId),
		formatShippingQueueDate(shipment.createdDate),
		formatShippingQueueDate(shipment.lastUpdatedDate),
		shippingQueueNumericCell(shipment.mskus),
		shippingQueueNumericCell(shipment.shippedQuantity),
		shippingQueueNumericCell(shipment.receivedQuantity),
		shippingQueueNumericCell(shipment.expectedQuantity),
		shippingQueueNumericCell(shipment.locatedQuantity),
		shippingQueueNumericCell(shipment.stowedQuantity),
		calculateDiscrepancyQuantity(shipment.receivedQuantity, shipment.shippedQuantity),
		shippingQueueCell(shipment.workflowId),
		shippingQueueCell(shipment.workflowType),
		shippingQueueCell(shipment.poId),
		shippingQueueCell(shipment.placementStatus),
		shippingQueueCell(window?.windowType),
		formatShippingQueueDate(window?.windowStartDate),
		formatShippingQueueDate(window?.windowEndDate),
		formatShippingQueueDate(window?.gracePeriodEndDate),
		shippingQueueCell(shipment.shipOrDeliveryWindowComplianceStatus),
		formatShippingQueueDate(shipment.needByDate),
		shippingQueueCell(shipment.reasonCode),
		shippingQueueYesNo(shipment.finalized),
		formatShippingQueueDate(shipment.finalizedDate),
		formatShippingQueueDate(shipment.estimatedFinalizedDateUTC),
		formatShippingQueueDate(shipment.formerEstimatedFinalizedDateUTC),
		shippingQueueYesNo(shipment.blocked),
		shippingQueueYesNo(shipment.partneredImport),
		shippingQueueYesNo(shipment.merchantLaunched),
		shippingQueueFormatComplexField(shipment.ismsDetails),
		shippingQueueFormatComplexField(shipment.t2pAccelerate)
	];
}
function shipmentDetailCells(shipment) {
	const details = shipment.details;
	if (!details) {
		const status = shipment.detailsFetchFailed ? SHIPPING_QUEUE_DETAILS_UNAVAILABLE : "";
		return [status, ...BLANK_DETAIL_CELLS.slice(1)];
	}
	const inquiry = details.inquiry;
	return [
		SHIPPING_QUEUE_DETAILS_LOADED,
		buildShipmentClaimUrl(shipment.shipmentId),
		shippingQueueYesNo(details.eligible),
		shippingQueueCell(details.ineligibilityReason),
		formatEligibilityDate(details.estimatedTimestamp),
		formatEligibilityDate(details.formerEstimatedTimestamp),
		shippingQueueNumericCell(details.daysToWait),
		formatEligibilityDetails(details.details),
		shippingQueueCell(inquiry?.inquiryStatus),
		shippingQueueCell(inquiry?.inquiryText),
		shippingQueueCell(inquiry?.caseId),
		formatShippingQueueDate(inquiry?.caseCreationDate),
		shippingQueueCell(inquiry?.caseCreatedBy),
		shippingQueueYesNo(details.hasDiscrepancy),
		shippingQueueCell(details.retailDomainName),
		shippingQueueYesNo(details.wmsrAllowed),
		shippingQueueNumericCell(details.discrepancyTotalRecords ?? details.items.length),
		totalDiscrepancyQuantity(details)
	];
}
function shipmentItemCells(item) {
	if (!item) return [...BLANK_ITEM_CELLS];
	return [
		shippingQueueCell(item.merchantSKU),
		shippingQueueCell(item.title),
		shippingQueueCell(item.fnsku),
		shippingQueueCell(item.asin),
		buildAsinUrl(item.asin),
		shippingQueueCell(item.upc),
		shippingQueueCell(item.barcodeType),
		shippingQueueCell(item.barcodeValue),
		shippingQueueCell(item.itemCondition),
		shippingQueueYesNo(item.isSortable),
		shippingQueueYesNo(item.eligibleForResearch),
		shippingQueueNumericCell(item.expectedQuantity),
		shippingQueueNumericCell(item.totalLocatedQuantity),
		shippingQueueNumericCell(item.totalReceivedQuantity),
		shippingQueueNumericCell(item.totalAdjustmentQuantity),
		shippingQueueNumericCell(item.totalReimbursedQuantity),
		shippingQueueNumericCell(item.totalClawbackQuantity),
		shippingQueueNumericCell(item.totalAcknowledgedQuantity),
		shippingQueueNumericCell(item.totalDeniedQuantity),
		shippingQueueNumericCell(item.totalVirtuallyAdjustedQuantity),
		shippingQueueNumericCell(item.otherReceivedQuantity),
		formatShippingQueueDate(item.otherReceiveStartDate),
		formatShippingQueueDate(item.otherReceiveEndDate),
		shippingQueueFormatComplexField(item.iarAutoReconciliations),
		shippingQueueNumericCell(item.totalDiscrepancyQuantity),
		shippingQueueCell(item.ineligibilityReason),
		shippingQueueCell(item.caseId),
		shippingQueueCell(item.reasonCode)
	];
}
/** One sheet row: the shipment's list and eligibility columns plus one SKU line (blank when there is none). */
function shippingQueueSheetRow(shipment, item) {
	return [
		...shipmentListCells(shipment),
		...shipmentDetailCells(shipment),
		...shipmentItemCells(item)
	];
}
/** A shipment becomes one row per SKU line, or a single row when it has none. */
function shippingQueueShipmentRows(shipment) {
	const items = shipment.details?.items ?? [];
	if (items.length === 0) return [shippingQueueSheetRow(shipment)];
	return items.map((item) => shippingQueueSheetRow(shipment, item));
}
/** Amazon lists shipments newest first; sheets show them oldest first, newest at the bottom. */
function oldestShipmentsFirst(shipments) {
	return [...shipments].reverse();
}
function shippingQueueSheetNotes(shipments) {
	const notes = [];
	if (shipments.some((shipment) => shipment.listingsIncomplete)) notes.push([SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE]);
	if (shipments.some((shipment) => shipment.detailsFetchFailed)) notes.push([SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE]);
	if (shipments.some((shipment) => shipmentDetailsIncomplete(shipment.details))) {
		notes.push([SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE]);
	}
	if (notes.length) notes.push([]);
	return notes;
}
function shippingQueueSheetRows(shipments) {
	return [
		...shippingQueueSheetNotes(shipments),
		[...SHIPPING_QUEUE_SHEET_HEADERS],
		...oldestShipmentsFirst(shipments).flatMap(shippingQueueShipmentRows)
	];
}
function shippingQueueCursor(shipment) {
	const id = shipment?.shipmentId?.trim();
	if (!shipment || !id || shipment.createdDate == null || shipment.lastUpdatedDate == null) return undefined;
	return {
		lastShipmentId: id,
		createdDate: String(shipment.createdDate),
		lastUpdatedDate: String(shipment.lastUpdatedDate)
	};
}
function shippingQueueUrl(pageSize = SHIPPING_QUEUE_DEFAULT_PAGE_SIZE, cursor, slice, ascending = false) {
	const params = new URLSearchParams({
		pageSize: String(pageSize),
		orderBy: SHIPPING_QUEUE_ORDER_BY,
		isOrderAscending: String(ascending)
	});
	if (slice) {
		params.set("startTime", String(slice.startTime));
		params.set("endTime", String(slice.endTime));
	}
	if (cursor) {
		params.set("lastShipmentId", cursor.lastShipmentId);
		params.set("createdDate", cursor.createdDate);
		params.set("lastUpdatedDate", cursor.lastUpdatedDate);
	}
	params.set("t2pLaunched", "true");
	return `${SHIPPING_QUEUE_URL}?${params.toString()}`;
}
/**
* Slices of Amazon's update-date index, newest first: SHIPPING_QUEUE_SLICE_DAYS at a time from now
* back to the cutoff, then on back SHIPPING_QUEUE_SLICE_YEARS, then one slice for everything older.
* Each slice ends a millisecond into the next, so a shipment on a boundary is never skipped, and
* the newest reaches a day past now in case this computer's clock runs behind Amazon's.
*/
function shippingQueueSlices(cutoffMs, nowMs) {
	const oldest = Math.max(0, cutoffMs - SHIPPING_QUEUE_SLICE_YEARS * 365 * DAY_MS);
	const step = Math.max(SHIPPING_QUEUE_SLICE_DAYS * DAY_MS, Math.ceil((nowMs - oldest) / SHIPPING_QUEUE_MAX_SLICES));
	const bounds = [];
	for (let time = nowMs; time > cutoffMs; time -= step) bounds.push(time);
	for (let time = cutoffMs; time > oldest; time -= step) bounds.push(time);
	if (bounds.length === 0) bounds.push(nowMs);
	return bounds.map((end, index) => ({
		startTime: bounds[index + 1] ?? 0,
		endTime: index === 0 ? end + DAY_MS : end + 1
	}));
}
function shipmentDetailsUrl(shipmentId) {
	return `${SHIPMENT_ELIGIBILITY_URL}/${encodeURIComponent(shipmentId)}?withInquiry=true&withDiscrepancies=true`;
}
function shipmentDiscrepanciesUrl(shipmentId, index) {
	const params = new URLSearchParams({
		filter: "NONE",
		index: String(index),
		pageSize: String(SHIPMENT_DISCREPANCY_PAGE_SIZE),
		isOrderAscending: "true",
		orderBy: "MSKU"
	});
	return `${SHIPMENT_DISCREPANCIES_URL}/${encodeURIComponent(shipmentId)}?${params.toString()}`;
}
function shipmentDocumentsUrl(shipmentId) {
	return `${SHIPMENT_DOCUMENTS_URL}/${encodeURIComponent(shipmentId)}?evaluateOption=DOCUMENT`;
}
function parseDocumentTypes(payload) {
	if (!payload || typeof payload !== "object" || !("documents" in payload)) return [];
	const documents = payload.documents;
	if (!Array.isArray(documents)) return [];
	const types = [];
	for (const document of documents) {
		if (!document || typeof document !== "object" || !("documentType" in document)) continue;
		const type = document.documentType;
		if (typeof type !== "string") continue;
		const trimmed = type.trim();
		if (trimmed) types.push(trimmed);
	}
	return types;
}
function shippingQueueLineStatus(input) {
	if (input.detailsFailed) return SHIPPING_STATUS_UNAVAILABLE;
	const shipmentReason = input.shipmentIneligibilityReason ?? "";
	const itemReason = input.itemIneligibilityReason ?? "";
	const discrepancy = input.discrepancy;
	if (shipmentReason === "NINE_MONTH_STATUTE_OF_LIMITATIONS") return SHIPPING_STATUS_OUTSIDE_WINDOW;
	if (shipmentReason === "NOT_ALL_SHIPPED") return SHIPPING_STATUS_MONITORING;
	if (itemReason === "ITEM_LEVEL_AUTHORITATIVE_RECEIVE") return SHIPPING_STATUS_INVESTIGATION_COMPLETED;
	if (itemReason === "RESEARCHED") return SHIPPING_STATUS_UNITS_LOCATED;
	if (discrepancy === 0) return SHIPPING_STATUS_RECEIVED_IN_FULL;
	if (input.eligible === true) {
		if (typeof discrepancy === "number" && discrepancy < 0) return SHIPPING_STATUS_NEW;
		if (typeof discrepancy === "number" && discrepancy > 0) return SHIPPING_STATUS_OVERAGED;
	}
	if (shipmentReason && shipmentReason !== "NONE") return shipmentReason;
	return SHIPPING_STATUS_REVIEW;
}
function requiredDocumentLabel(documentTypes, status) {
	if (status !== SHIPPING_STATUS_NEW) return SHIPPING_STATUS_UNAVAILABLE;
	const documents = [];
	if (documentTypes?.includes("INVOICE")) documents.push(REQUIRED_DOCUMENT_INVOICE);
	if (documentTypes?.includes("POD")) documents.push(REQUIRED_DOCUMENT_DELIVERY);
	return documents.length > 0 ? documents.join(" AND ") : SHIPPING_STATUS_UNAVAILABLE;
}
const DAY_MS = 864e5;
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class SessionInterrupted extends Error {
	constructor() {
		super("Shipment details session interrupted.");
		this.name = "SessionInterrupted";
	}
}
function isSessionResponse(response) {
	if (response.status === 401 || response.status === 403) return true;
	const type = response.headers?.get("content-type") ?? "";
	return /text\/html/i.test(type);
}
async function fetchShippingQueuePage(fetchImpl, url, signal) {
	const response = await fetchImpl(url, {
		method: "GET",
		mode: "cors",
		credentials: "include",
		referrer: SHIPPING_QUEUE_REFERRER,
		signal,
		headers: {
			accept: "*/*",
			"accept-language": "en-US,en;q=0.9"
		}
	});
	if (!response.ok) throw new Error(`Couldn’t load shipping queue (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load shipping queue.");
	}
	return parseShippingQueueResponse(payload);
}
async function fetchShipmentDetails(fetchImpl, shipmentId, sleep, onSession) {
	let lastError = new Error("Couldn’t load shipment details.");
	for (let attempt = 1; attempt <= SHIPMENT_DETAILS_MAX_ATTEMPTS; attempt += 1) {
		if (attempt > 1) await sleep(SHIPMENT_DETAILS_RETRY_DELAY_MS * (attempt - 1));
		let response;
		try {
			response = await fetchImpl(shipmentDetailsUrl(shipmentId), {
				method: "GET",
				mode: "cors",
				credentials: "include",
				referrer: buildShipmentClaimUrl(shipmentId),
				headers: {
					accept: "*/*",
					"accept-language": "en-US,en;q=0.9"
				}
			});
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			continue;
		}
		if (isSessionResponse(response)) {
			onSession?.();
			throw new SessionInterrupted();
		}
		if (!response.ok) {
			lastError = new Error(`Couldn’t load shipment details (${response.status}).`);
			if (response.status === 429 || response.status >= 500) continue;
			throw lastError;
		}
		let payload;
		try {
			payload = await response.json();
		} catch {
			throw new Error("Couldn’t load shipment details.");
		}
		return parseShipmentDetails(payload);
	}
	throw lastError;
}
async function fetchDiscrepancyItems(fetchImpl, shipmentId, index, sleep) {
	let lastError = new Error("Couldn’t load SKU lines.");
	for (let attempt = 1; attempt <= SHIPMENT_DETAILS_MAX_ATTEMPTS; attempt += 1) {
		if (attempt > 1) await sleep(SHIPMENT_DETAILS_RETRY_DELAY_MS * (attempt - 1));
		let response;
		try {
			response = await fetchImpl(shipmentDiscrepanciesUrl(shipmentId, index), {
				method: "GET",
				mode: "cors",
				credentials: "include",
				referrer: buildShipmentClaimUrl(shipmentId),
				headers: {
					accept: "*/*",
					"accept-language": "en-US,en;q=0.9"
				}
			});
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			continue;
		}
		if (!response.ok || isSessionResponse(response)) {
			lastError = new Error(`Couldn’t load SKU lines (${response.status}).`);
			if (response.status === 429 || response.status >= 500) continue;
			throw lastError;
		}
		const payload = await response.json();
		if (!Array.isArray(payload?.items)) throw new Error("Couldn’t load SKU lines.");
		return payload.items.map(asShipmentDiscrepancyItem).filter((item) => item !== undefined);
	}
	throw lastError;
}
/**
* The eligibility response carries a shipment's first 50 SKU lines. The rest come from the
* discrepancies endpoint, SHIPMENT_DISCREPANCY_PAGE_SIZE at a time and all at once, in the same
* MSKU order. Lines stay in order: a page that fails drops it and every page after it.
*/
async function withAllDiscrepancyItems(fetchImpl, shipmentId, details, sleep) {
	const total = details.discrepancyTotalRecords;
	if (typeof total !== "number" || total <= details.items.length || details.items.length === 0) {
		return {
			details,
			requests: 0
		};
	}
	const starts = [];
	for (let index = details.items.length; index < total; index += SHIPMENT_DISCREPANCY_PAGE_SIZE) starts.push(index);
	const pages = await Promise.all(starts.map((index) => fetchDiscrepancyItems(fetchImpl, shipmentId, index, sleep).catch(() => undefined)));
	const items = [...details.items];
	for (const page of pages) {
		if (!page) break;
		items.push(...page);
	}
	return {
		details: {
			...details,
			items
		},
		requests: starts.length
	};
}
/**
* Required documents only matter for lines that can be "Shipment ID - New (Send List)": an
* eligible shipment with a negative discrepancy. Other shipments skip that request.
*/
function shipmentNeedsDocumentTypes(details) {
	if (details.eligible !== true) return false;
	return details.items.some((item) => typeof item.totalDiscrepancyQuantity === "number" && item.totalDiscrepancyQuantity < 0);
}
async function fetchShipmentDocumentTypes(fetchImpl, shipmentId) {
	try {
		const response = await fetchImpl(shipmentDocumentsUrl(shipmentId), {
			method: "GET",
			mode: "cors",
			credentials: "include",
			referrer: buildShipmentClaimUrl(shipmentId),
			headers: {
				accept: "*/*",
				"accept-language": "en-US,en;q=0.9"
			}
		});
		if (!response.ok || isSessionResponse(response)) return { documentsFetchFailed: true };
		let payload;
		try {
			payload = await response.json();
		} catch {
			return { documentsFetchFailed: true };
		}
		return { documentTypes: parseDocumentTypes(payload) };
	} catch {
		return { documentsFetchFailed: true };
	}
}
/**
* Loads eligibility details SHIPMENT_DETAILS_CONCURRENCY at a time while the list is still being
* read. A session response stops new requests, waits, checks that the list still loads, and
* resumes; after SHIPMENT_DETAILS_SESSION_PAUSES pauses the remaining shipments are marked failed.
*/
function createShipmentDetailsLoader(fetchImpl, sleep, onProgress, log) {
	const shipments = [];
	const results = [];
	let next = 0;
	let inFlight = 0;
	let processed = 0;
	let listDone = false;
	let pausePromise = null;
	let pauseCount = 0;
	let holdLaunch = false;
	let halt = false;
	let documentsSkipped = 0;
	let lineRequests = 0;
	const failedSample = [];
	let settle = () => undefined;
	const settled = new Promise((resolve) => {
		settle = resolve;
	});
	/** Details progress starts once the list is complete, so its total never shrinks the bar. */
	function reportProgress() {
		if (!listDone) return;
		onProgress?.({
			source: "shippingQueue",
			status: "active",
			loaded: processed,
			total: shipments.length,
			phase: "details"
		});
	}
	function abandonQueued() {
		if (next >= shipments.length) return;
		while (next < shipments.length) {
			results[next] = {
				...shipments[next],
				detailsFetchFailed: true
			};
			next += 1;
			processed += 1;
		}
		reportProgress();
	}
	function startPause() {
		if (halt) return Promise.resolve(false);
		if (pausePromise) return pausePromise;
		if (pauseCount >= SHIPMENT_DETAILS_SESSION_PAUSES) {
			halt = true;
			log?.error("shippingQueue.detailsHalted", {
				pauses: pauseCount,
				processed,
				total: shipments.length
			});
			return Promise.resolve(false);
		}
		pauseCount += 1;
		let current;
		current = (async () => {
			log?.warn("shippingQueue.sessionPause", {
				pause: pauseCount,
				waitMs: SHIPMENT_DETAILS_SESSION_WAIT_MS,
				processed
			});
			try {
				await sleep(SHIPMENT_DETAILS_SESSION_WAIT_MS);
				await fetchShippingQueuePage(fetchImpl, shippingQueueUrl(1));
				return true;
			} catch (error) {
				log?.error("shippingQueue.sessionCheckFailed", { error: describeError(error) });
				halt = true;
				return false;
			} finally {
				if (pausePromise === current) pausePromise = null;
				if (!halt) holdLaunch = false;
			}
		})();
		pausePromise = current;
		return current;
	}
	function markFailed(shipment, id, error) {
		if (failedSample.length < 3) {
			failedSample.push(id);
			log?.warn("shippingQueue.detailsFailed", {
				shipmentId: id,
				error: describeError(error)
			});
		}
		return {
			...shipment,
			detailsFetchFailed: true
		};
	}
	async function loadDetails(shipment, id, onSession) {
		const first = await fetchShipmentDetails(fetchImpl, id, sleep, onSession);
		const { details, requests } = await withAllDiscrepancyItems(fetchImpl, id, first, sleep);
		lineRequests += requests;
		if (!shipmentNeedsDocumentTypes(details)) {
			documentsSkipped += 1;
			return {
				...shipment,
				details
			};
		}
		return {
			...shipment,
			details,
			...await fetchShipmentDocumentTypes(fetchImpl, id)
		};
	}
	async function loadOne(shipment) {
		const id = shipment.shipmentId?.trim();
		if (!id) return {
			...shipment,
			detailsFetchFailed: true
		};
		const onSession = () => {
			if (!halt) holdLaunch = true;
		};
		try {
			return await loadDetails(shipment, id, onSession);
		} catch (error) {
			if (!(error instanceof SessionInterrupted) || halt) return markFailed(shipment, id, error);
			const resumed = await startPause();
			if (!resumed) return {
				...shipment,
				detailsFetchFailed: true
			};
			try {
				return await loadDetails(shipment, id);
			} catch (retryError) {
				return markFailed(shipment, id, retryError);
			}
		}
	}
	function pump() {
		if (halt && inFlight === 0) abandonQueued();
		if (listDone && next >= shipments.length && inFlight === 0) {
			settle();
			return;
		}
		if (holdLaunch || pausePromise || halt) return;
		while (inFlight < SHIPMENT_DETAILS_CONCURRENCY && next < shipments.length) {
			const index = next;
			next += 1;
			inFlight += 1;
			void loadOne(shipments[index]).then((shipment) => {
				results[index] = shipment;
				inFlight -= 1;
				processed += 1;
				reportProgress();
				pump();
			});
		}
	}
	return {
		add: (batch) => {
			shipments.push(...batch);
			pump();
		},
		finish: async () => {
			listDone = true;
			if (shipments.length === 0) return [];
			reportProgress();
			pump();
			await settled;
			// Shipments whose SKU lines are still short after the extra pages.
			let linesCut = 0;
			let linesMax = 0;
			for (const { details } of results) {
				linesMax = Math.max(linesMax, details?.discrepancyTotalRecords ?? 0);
				if (shipmentDetailsIncomplete(details)) linesCut += 1;
			}
			log?.info("shippingQueue.details", {
				shipments: shipments.length,
				failed: results.filter((shipment) => shipment.detailsFetchFailed).length,
				documentsSkipped,
				pauses: pauseCount,
				...lineRequests ? {
					lineRequests,
					linesMax
				} : {},
				...linesCut ? { linesCut } : {},
				...failedSample.length ? { failedSample } : {}
			});
			return results;
		}
	};
}
/**
* Lists every shipment updated since the cutoff and hands in-window ones to `onShipments` in list
* order. Amazon sorts and filters by an update-date index that can lag a shipment's own
* lastUpdatedDate, so in-window shipments turn up well below the cutoff. Slices of that index
* load SHIPPING_QUEUE_SLICE_CONCURRENCY at a time and are read in order, and reading stops once
* SHIPPING_QUEUE_TRAILING_ROWS shipments in a row fall before the cutoff.
*/
async function listShippingQueue(fetchImpl, cutoffMs, nowMs, pageSize, onShipments, log) {
	const done = log?.time("shippingQueue.list");
	const controller = new AbortController();
	const slices = shippingQueueSlices(cutoffMs, nowMs).map((slice) => ({
		slice,
		rows: [],
		requests: 0,
		loading: false,
		complete: false
	}));
	/** Slices ending before the oldest shipment was created are empty and skipped. */
	let floor = Number.NEGATIVE_INFINITY;
	const seen = new Set();
	let current = 0;
	let currentRow = 0;
	let position = 0;
	let outRun = 0;
	let maxGap = 0;
	let lastInWindowAt = -1;
	let inWindow = 0;
	let requests = 0;
	let stopped = false;
	let listingsIncomplete = false;
	let failure;
	const stop = (incomplete, event, data) => {
		stopped = true;
		listingsIncomplete ||= incomplete;
		if (event) log?.warn(event, {
			slice: current,
			loaded: inWindow,
			...data
		});
	};
	/** Reads loaded slices in order, as far as they go. */
	const read = () => {
		while (!stopped && current < slices.length) {
			const state = slices[current];
			const added = [];
			let repeated = currentRow === 0 && state.rows.length > 1;
			for (; currentRow < state.rows.length && !stopped; currentRow += 1) {
				const shipment = state.rows[currentRow];
				const id = shipment.shipmentId?.trim();
				if (id && seen.has(id)) continue;
				repeated = false;
				if (id) seen.add(id);
				const updatedMs = getShipmentLastUpdatedMs(shipment);
				if (updatedMs != null && updatedMs < cutoffMs) {
					outRun += 1;
					if (outRun >= SHIPPING_QUEUE_TRAILING_ROWS) stopped = true;
				} else {
					maxGap = Math.max(maxGap, outRun);
					outRun = 0;
					lastInWindowAt = position;
					inWindow += 1;
					added.push(shipment);
				}
				position += 1;
			}
			if (added.length) onShipments(added);
			if (stopped) return;
			// A slice that only repeats shipments already read means Amazon ignored the date filter.
			if (repeated && state.complete) stop(true, "shippingQueue.sliceRepeated");
			else if (state.failure !== undefined) {
				if (position === 0 && inWindow === 0) failure = state.failure;
				else stop(true, "shippingQueue.listStopped", { error: describeError(state.failure) });
			} else if (!state.complete) return;
			if (stopped || failure !== undefined) return;
			current += 1;
			currentRow = 0;
		}
	};
	const load = async (state) => {
		state.loading = true;
		state.requests += 1;
		requests += 1;
		try {
			const cursor = shippingQueueCursor(state.rows[state.rows.length - 1]);
			const page = await fetchShippingQueuePage(fetchImpl, shippingQueueUrl(pageSize, cursor, state.slice), controller.signal);
			const before = state.rows.length;
			state.rows.push(...page);
			const fresh = page.some((shipment) => !state.rows.slice(0, before).some((row) => row.shipmentId === shipment.shipmentId));
			if (page.length < pageSize || !shippingQueueCursor(page[page.length - 1]) || before > 0 && !fresh) state.complete = true;
		} catch (error) {
			if (!stopped) state.failure = error;
		} finally {
			state.loading = false;
		}
	};
	let resolveList = () => undefined;
	const listed = new Promise((resolve) => {
		resolveList = resolve;
	});
	let next = 0;
	let inFlight = 0;
	const pump = () => {
		read();
		if (failure === undefined && !stopped && requests >= SHIPPING_QUEUE_MAX_REQUESTS) stop(true, "shippingQueue.listLimit");
		if (stopped || failure !== undefined || current >= slices.length) {
			controller.abort();
			resolveList();
			return;
		}
		const queue = [];
		const reading = slices[current];
		// The slice being read loads its next page ahead of new slices.
		if (reading.requests > 0 && !reading.complete && !reading.loading && reading.failure === undefined) queue.push(reading);
		while (inFlight + queue.length < SHIPPING_QUEUE_SLICE_CONCURRENCY && next < slices.length) {
			const state = slices[next];
			next += 1;
			if (state.slice.endTime < floor) state.complete = true;
			else if (state.requests === 0) queue.push(state);
		}
		for (const state of queue) {
			inFlight += 1;
			void load(state).finally(() => {
				inFlight -= 1;
				pump();
			});
		}
		// Trimmed slices can finish the list with nothing left in flight.
		if (queue.length === 0 && inFlight === 0) pump();
	};
	// The shipment with the oldest index bounds how far back slices are worth reading. A shipment
	// isn't indexed before it was created; a slice's width of margin covers any exception.
	requests += 1;
	void fetchShippingQueuePage(fetchImpl, shippingQueueUrl(1, undefined, undefined, true), controller.signal).then((rows) => {
		const created = Number(rows[0]?.createdDate);
		if (!rows.length) floor = Number.POSITIVE_INFINITY;
		else if (Number.isFinite(created)) floor = created - SHIPPING_QUEUE_SLICE_DAYS * DAY_MS;
		pump();
	}, () => undefined);
	pump();
	await listed;
	if (failure !== undefined) {
		done?.({
			requests,
			error: describeError(failure)
		}, "error");
		throw failure;
	}
	done?.({
		slices: slices.filter((state) => state.requests > 0).length,
		requests,
		rows: position,
		inWindow,
		...inWindow ? { lastInWindowAt } : {},
		...maxGap ? { maxGap } : {},
		...listingsIncomplete ? { incomplete: true } : {}
	});
	return { listingsIncomplete };
}
async function fetchShippingQueueShipments(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const onProgress = options.onProgress;
	const log = options.log;
	const sleep = options.sleep ?? defaultSleep;
	const pageSize = options.pageSize ?? SHIPPING_QUEUE_DEFAULT_PAGE_SIZE;
	const cutoffTimestamp = options.cutoffDate != null ? options.cutoffDate instanceof Date ? options.cutoffDate.getTime() : Number(options.cutoffDate) : calculateShippingQueueCutoffDate(options.referenceDate).getTime();
	onProgress?.({
		source: "shippingQueue",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	const details = createShipmentDetailsLoader(fetchImpl, sleep, onProgress, log);
	let listed = 0;
	const nowMs = options.referenceDate?.getTime() ?? Date.now();
	const { listingsIncomplete } = await listShippingQueue(fetchImpl, cutoffTimestamp, nowMs, pageSize, (shipments) => {
		details.add(shipments);
		listed += shipments.length;
		onProgress?.({
			source: "shippingQueue",
			status: "active",
			loaded: listed,
			phase: "listings"
		});
	}, log);
	const loaded = await details.finish();
	const withDetails = listingsIncomplete ? loaded.map((shipment) => ({
		...shipment,
		listingsIncomplete: true
	})) : loaded;
	onProgress?.({
		source: "shippingQueue",
		status: "complete",
		loaded: withDetails.length,
		total: withDetails.length,
		phase: withDetails.length > 0 ? "details" : "listings"
	});
	return withDetails;
}

/**
* Reads a Seller Central case, including every reply page, from the signed-in tab.
* Content scripts concatenate this file, so it must not import anything and its
* top-level names must stay unique across the content-script bundle.
*/
const VIEW_CASE_PAGE_SIZE = 10;
const VIEW_CASE_MAX_PAGES = 100;
const VIEW_CASE_ENDPOINT = "https://sellercentral.amazon.com/hill/hillservice/mons-api/ViewCase";
const VIEW_CASE_ORIGIN_REFERRER = "https://sellercentral.amazon.com/cu/case-dashboard/view-case";
const VIEW_CASE_SIGN_IN_ERROR = "Sign in to Seller Central, then try again.";
const CASE_PAGE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=";
const CASE_HTML_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: " "
};
function casePageUrl(caseId) {
	return `${CASE_PAGE_URL}${caseId}`;
}
function viewCaseRequestUrl(caseId, timeZone, currentToken) {
	const params = new URLSearchParams({
		caseId,
		timeZone,
		pageSize: String(VIEW_CASE_PAGE_SIZE)
	});
	if (currentToken) params.set("currentToken", currentToken);
	return `${VIEW_CASE_ENDPOINT}?${params.toString()}`;
}
function caseScrapeFileName(caseIds, date = new Date()) {
	if (caseIds.length === 1) return `case-${caseIds[0]}.json`;
	const day = [
		date.getFullYear(),
		date.getMonth() + 1,
		date.getDate()
	].map((part) => String(part).padStart(2, "0")).join("-");
	return `cases-${caseIds.length}-${day}.json`;
}
/** A message for the palette when the file is incomplete. Undefined when every case loaded. */
function caseScrapeFailure(file) {
	const errors = file.errors ?? [];
	if (file.cases.length > 0 && errors.length === 0) return undefined;
	if (errors.length === 1) return `Couldn’t scrape ${errors[0].caseId}. ${errors[0].error}`;
	if (errors.length > 1) return `Couldn’t scrape ${errors.map((item) => item.caseId).join(", ")}.`;
	return "Couldn’t scrape cases. Please try again.";
}
function downloadCaseScrape(file, caseIds, targetDocument = document, date = new Date()) {
	const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }));
	const anchor = targetDocument.createElement("a");
	anchor.href = url;
	anchor.download = caseScrapeFileName(caseIds, date);
	targetDocument.body.append(anchor);
	anchor.click();
	anchor.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function decodeCaseHtml(value) {
	return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity) => {
		if (entity.startsWith("#x") || entity.startsWith("#X")) {
			const code = Number.parseInt(entity.slice(2), 16);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		if (entity.startsWith("#")) {
			const code = Number.parseInt(entity.slice(1), 10);
			return Number.isFinite(code) ? String.fromCodePoint(code) : match;
		}
		return CASE_HTML_ENTITIES[entity] ?? match;
	});
}
/** Epoch seconds as an ISO timestamp in `timeZone`, such as 2026-10-05T19:21:54.913+08:00. */
function formatCaseTimestamp(seconds, timeZone) {
	const date = new Date(Math.round(seconds * 1e3));
	if (Number.isNaN(date.getTime())) throw new Error("Couldn’t load this case.");
	const parts = caseTimestampParts(date, timeZone, true);
	let hour = parts.hour;
	if (hour === "24") hour = "00";
	return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${caseTimestampOffset(date, timeZone)}`;
}
function caseTimestampParts(date, timeZone, fractional) {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
		...fractional ? { fractionalSecondDigits: 3 } : {}
	});
	return Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
}
function caseTimestampOffset(date, timeZone) {
	const parts = caseTimestampParts(date, timeZone, false);
	let hour = Number(parts.hour);
	if (hour === 24) hour = 0;
	const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), hour, Number(parts.minute), Number(parts.second));
	const offsetMinutes = Math.round((asUtc - Math.floor(date.getTime() / 1e3) * 1e3) / 6e4);
	const sign = offsetMinutes >= 0 ? "+" : "-";
	const absolute = Math.abs(offsetMinutes);
	return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}
function viewCaseRecord(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	return value;
}
function decodeCaseMessage(value) {
	if (typeof value === "string") return decodeCaseHtml(value);
	const record = viewCaseRecord(value);
	if (!record) return value;
	const next = { ...record };
	if (typeof next.message === "string") next.message = decodeCaseHtml(next.message);
	if ("hmdMetaData" in next) next.hmdMetaData = decodeCaseMessage(next.hmdMetaData);
	if (Array.isArray(next.messageList)) next.messageList = next.messageList.map((item) => decodeCaseMessage(item));
	if (typeof next.beforeHMDContent === "string") next.beforeHMDContent = decodeCaseHtml(next.beforeHMDContent);
	if (typeof next.afterHMDContent === "string") next.afterHMDContent = decodeCaseHtml(next.afterHMDContent);
	return next;
}
function presentCaseContact(contact, timeZone) {
	const next = decodeCaseMessage(contact);
	if (typeof next.timestamp === "number" && Number.isFinite(next.timestamp)) {
		next.timestampIso = formatCaseTimestamp(next.timestamp, timeZone);
	}
	return next;
}
function responseContentType(response) {
	return response.headers?.get("content-type") ?? "";
}
function isViewCaseSessionResponse(response) {
	if (response.status === 401 || response.status === 403) return true;
	return /text\/html/i.test(responseContentType(response));
}
function parseViewCasePage(payload) {
	const record = viewCaseRecord(payload);
	const meta = record ? viewCaseRecord(record.viewCaseMetaData) : undefined;
	if (!record || !meta || !Array.isArray(record.contactList)) throw new Error("Couldn’t load this case.");
	const total = record.totalNumberOfContacts;
	if (typeof total !== "number" || !Number.isFinite(total)) throw new Error("Couldn’t load this case.");
	const contactList = [];
	for (const item of record.contactList) {
		const contact = viewCaseRecord(item);
		if (!contact) throw new Error("Couldn’t load this case.");
		contactList.push(contact);
	}
	const token = typeof record.currentToken === "string" && record.currentToken.length > 0 ? record.currentToken : null;
	return {
		appointmentMetadata: record.appointmentMetadata ?? null,
		contactList,
		currentToken: token,
		liveConversation: record.liveConversation ?? null,
		totalNumberOfContacts: total,
		viewCaseMetaData: meta
	};
}
async function fetchViewCasePage(fetchImpl, caseId, timeZone, currentToken) {
	let response;
	try {
		response = await fetchImpl(viewCaseRequestUrl(caseId, timeZone, currentToken), {
			method: "GET",
			mode: "cors",
			credentials: "include",
			referrer: casePageUrl(caseId),
			headers: {
				accept: "application/json, text/plain, */*",
				"accept-language": "en-US,en;q=0.9",
				"anti-csrftoken-a2z-request": "true",
				"client-id": "viewCase",
				"origin-referrer": VIEW_CASE_ORIGIN_REFERRER
			}
		});
	} catch {
		throw new Error("Couldn’t load this case.");
	}
	if (isViewCaseSessionResponse(response)) throw new Error(VIEW_CASE_SIGN_IN_ERROR);
	if (!response.ok) throw new Error(`Couldn’t load this case (${response.status}).`);
	try {
		return parseViewCasePage(await response.json());
	} catch (error) {
		if (error instanceof Error && error.message === "Couldn’t load this case.") throw error;
		throw new Error("Couldn’t load this case.");
	}
}
function contactKey(contact) {
	return typeof contact.contactId === "string" && contact.contactId.length > 0 ? contact.contactId : undefined;
}
async function fetchWholeCase(fetchImpl, caseId, timeZone) {
	const collected = [];
	const seenContactIds = new Set();
	const seenTokens = new Set();
	let token;
	let total;
	let viewCaseMetaData;
	let appointmentMetadata;
	let liveConversation;
	for (let page = 0; page < VIEW_CASE_MAX_PAGES; page += 1) {
		if (token) {
			if (seenTokens.has(token)) break;
			seenTokens.add(token);
		}
		const result = await fetchViewCasePage(fetchImpl, caseId, timeZone, token);
		if (viewCaseMetaData === undefined) {
			viewCaseMetaData = result.viewCaseMetaData;
			appointmentMetadata = result.appointmentMetadata;
			liveConversation = result.liveConversation;
			total = result.totalNumberOfContacts;
		}
		for (const contact of result.contactList) {
			const key = contactKey(contact);
			if (key) {
				if (seenContactIds.has(key)) continue;
				seenContactIds.add(key);
			}
			collected.push(contact);
		}
		if (typeof total === "number" && collected.length >= total) break;
		if (!result.currentToken) break;
		token = result.currentToken;
	}
	if (!viewCaseMetaData || collected.length !== total) throw new Error("Couldn’t load the whole case.");
	const meta = { ...viewCaseMetaData };
	if (typeof meta.creationDate === "number" && Number.isFinite(meta.creationDate)) {
		meta.creationDateIso = formatCaseTimestamp(meta.creationDate, timeZone);
	}
	const contacts = collected.map((contact) => presentCaseContact(contact, timeZone)).sort((left, right) => {
		const leftTime = typeof left.timestamp === "number" ? left.timestamp : Number.POSITIVE_INFINITY;
		const rightTime = typeof right.timestamp === "number" ? right.timestamp : Number.POSITIVE_INFINITY;
		if (leftTime === rightTime) return 0;
		return leftTime < rightTime ? -1 : 1;
	});
	return {
		caseId,
		caseUrl: casePageUrl(caseId),
		viewCaseMetaData: meta,
		totalNumberOfContacts: total,
		appointmentMetadata: appointmentMetadata ?? null,
		liveConversation: liveConversation ?? null,
		contacts
	};
}
async function scrapeCases(fetchImpl, caseIds, options = {}) {
	const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const now = options.now ?? new Date();
	const cases = [];
	const errors = [];
	for (const caseId of caseIds) {
		try {
			cases.push(await fetchWholeCase(fetchImpl, caseId, timeZone));
		} catch (error) {
			errors.push({
				caseId,
				error: error instanceof Error && error.message ? error.message : "Couldn’t load this case."
			});
		}
	}
	return {
		scrapedAt: now.toISOString(),
		timeZone,
		cases,
		...errors.length > 0 ? { errors } : {}
	};
}

const PALETTE_APP_FILE = "palette-app.js";
const EXTENSION_CONTEXT_INVALIDATED = "Extension context invalidated.";
const PALETTE_UNSUPPORTED_PAGE = "The command palette can’t open on this page.";
const contentLog = createLogger("content");
let mounted = null;
let pending = null;
/**
* React DOM reads document.createElement("div").style as it loads. XML documents such as feeds,
* sitemaps, and SVG files create elements without one, so the palette runs only on HTML pages.
*/
function canHostPalette(doc = document) {
	return doc.createElement("div").style !== undefined;
}
async function loadPalette(doc = document) {
	if (mounted) return mounted;
	if (!pending) {
		if (!canHostPalette(doc)) throw new Error(PALETTE_UNSUPPORTED_PAGE);
		if (typeof chrome === "undefined" || !chrome.runtime?.id) {
			throw new Error(EXTENSION_CONTEXT_INVALIDATED);
		}
		pending = import(chrome.runtime.getURL(PALETTE_APP_FILE)).then((mod) => {
			mounted = mod.mountCommandPalette();
			if (!mounted) throw new Error("Could not mount the command palette.");
			return mounted;
		}).catch((error) => {
			pending = null;
			contentLog.error("palette.loadFailed", {
				contentType: doc.contentType,
				error: describeError(error)
			});
			throw error;
		});
	}
	return pending;
}
function onKeyDown(event) {
	handleContentKeyDown(event);
}
function handleContentKeyDown(event, load = loadPalette) {
	if (!isPaletteShortcut(event)) {
		if (event.metaKey || event.ctrlKey) void load().catch(() => undefined);
		return;
	}
	event.preventDefault();
	event.stopImmediatePropagation();
	window.removeEventListener("keydown", onKeyDown, true);
	void load().then((palette) => {
		palette.setOpen(true);
	}).catch(() => {
		window.addEventListener("keydown", onKeyDown, true);
	});
}
function emitReportProgress(event, runId) {
	if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") return;
	void chrome.runtime.sendMessage({
		type: "REPORTS_PROGRESS",
		...event,
		...runId ? { runId } : {}
	}).then(() => undefined, () => undefined);
}
/** Report sources this content script loads from the signed-in Seller Central tab, by message type. */
const REPORT_FETCHERS = {
	REPORTS_FETCH_UNFULFILLABLE: {
		source: "unfulfillable",
		fallbackError: "Couldn’t load unfulfillable inventory.",
		run: async (options) => {
			const [listings, nextRemovalOrderId] = await Promise.all([fetchUnfulfillableListings(options), fetchNextRemovalOrderId(options.fetch)]);
			return {
				response: {
					listings,
					nextRemovalOrderId
				},
				count: listings.length
			};
		}
	},
	REPORTS_FETCH_FEEDBACK: {
		source: "feedback",
		fallbackError: "Couldn’t load seller feedback.",
		run: async (options) => {
			const feedbacks = await fetchNeutralNegativeFeedbacks(options);
			return {
				response: { feedbacks },
				count: feedbacks.length
			};
		}
	},
	REPORTS_FETCH_STRANDED: {
		source: "stranded",
		fallbackError: "Couldn’t load stranded inventory.",
		run: async (options) => {
			const listings = await fetchStrandedListings(options);
			return {
				response: { listings },
				count: listings.length
			};
		}
	},
	REPORTS_FETCH_SUPPRESSED: {
		source: "suppressed",
		fallbackError: "Couldn’t load search-suppressed inventory.",
		run: async (options) => {
			const listings = await fetchSuppressedListings(options);
			return {
				response: { listings },
				count: listings.length
			};
		}
	},
	REPORTS_FETCH_SHIPPING_QUEUE: {
		source: "shippingQueue",
		fallbackError: "Couldn’t load shipping queue.",
		run: async (options) => {
			const shipments = await fetchShippingQueueShipments(options);
			return {
				response: { shipments },
				count: shipments.length
			};
		}
	}
};
const reportControllers = new Map();
function reportFetchScope(runId) {
	if (!runId) return {
		fetch: globalThis.fetch,
		release: () => undefined
	};
	const scope = reportControllers.get(runId) ?? {
		controller: new AbortController(),
		active: 0
	};
	scope.active += 1;
	reportControllers.set(runId, scope);
	return {
		fetch: (input, init) => globalThis.fetch(input, {
			...init,
			signal: init?.signal ? AbortSignal.any([scope.controller.signal, init.signal]) : scope.controller.signal
		}),
		release: () => {
			if (--scope.active === 0) reportControllers.delete(runId);
		}
	};
}
async function scrapeCasesFromPage(caseIds, runId) {
	const scope = reportFetchScope(runId);
	const monitor = createRequestMonitor(scope.fetch, contentLog);
	const done = contentLog.time("case.scrape", { requested: caseIds.length });
	try {
		const file = await scrapeCases(monitor.fetch, caseIds);
		done({
			cases: file.cases.length,
			errors: file.errors?.length ?? 0,
			requests: monitor.summary()
		});
		return {
			ok: true,
			file
		};
	} catch (error) {
		done({
			error: describeError(error),
			requests: monitor.summary()
		}, "error");
		return {
			ok: false,
			error: errorMessage(error, "Couldn’t scrape cases.")
		};
	} finally {
		scope.release();
	}
}
async function runReportFetcher(fetcher, runId) {
	const log = contentLog.withRun(runId);
	const scope = reportFetchScope(runId);
	const monitor = createRequestMonitor(scope.fetch, log);
	const done = log.time("report.fetch", { source: fetcher.source });
	try {
		const { response, count } = await fetcher.run({
			fetch: monitor.fetch,
			onProgress: (event) => emitReportProgress(event, runId),
			log
		});
		done({
			count,
			requests: monitor.summary()
		});
		return {
			ok: true,
			...response
		};
	} catch (error) {
		done({
			error: describeError(error),
			requests: monitor.summary()
		}, "error");
		return {
			ok: false,
			error: errorMessage(error, fetcher.fallbackError)
		};
	} finally {
		scope.release();
	}
}
function handleContentMessage(message, sender, sendResponse, load = loadPalette) {
	if (!message || typeof message !== "object" || !("type" in message)) return undefined;
	if (typeof chrome === "undefined" || !chrome.runtime?.id || sender.id !== chrome.runtime.id || sender.tab || sender.url && sender.url !== chrome.runtime.getURL("background.js")) {
		sendResponse({
			ok: false,
			error: "Unauthorized extension message."
		});
		return undefined;
	}
	const record = message;
	if (record.type === "ACCOUNTS_RESUME_CHECK") {
		sendResponse({ ok: true });
		return;
	}
	if (record.type === "REPORTS_ABORT") {
		if (typeof record.runId === "string") reportControllers.get(record.runId)?.controller.abort();
		sendResponse({ ok: true });
		return;
	}
	if (record.type === "REPORTS_SESSION_STATUS") {
		sendResponse({
			ok: true,
			...sellerCentralSessionStatus()
		});
		return;
	}
	if (record.type === "SCRAPE_CASES") {
		const caseIds = Array.isArray(record.caseIds) ? record.caseIds.filter((id) => typeof id === "string") : [];
		void scrapeCasesFromPage(caseIds, typeof record.runId === "string" ? record.runId : undefined).then(sendResponse);
		return true;
	}
	if (record.type === "OPEN_PALETTE") {
		const mode = record.mode === "report-login" ? "report-login" : undefined;
		void load().then((palette) => {
			palette.setOpen(true, mode);
		}).then(() => sendResponse({ ok: true }), (error) => sendResponse({
			ok: false,
			error: errorMessage(error, "Couldn’t open the command palette.")
		}));
		return true;
	}
	const fetcher = typeof record.type === "string" && Object.hasOwn(REPORT_FETCHERS, record.type) ? REPORT_FETCHERS[record.type] : undefined;
	if (!fetcher) return undefined;
	const runId = typeof record.runId === "string" ? record.runId : undefined;
	void runReportFetcher(fetcher, runId).then(sendResponse);
	return true;
}
if (typeof window !== "undefined" && window.top === window) {
	if (canHostPalette()) window.addEventListener("keydown", onKeyDown, true);
	if (typeof chrome !== "undefined") {
		if (chrome.runtime?.id) setLogSink(forwardLogsToBackground());
		chrome.runtime?.onMessage?.addListener(handleContentMessage);
	}
}

})();
