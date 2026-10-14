(function () {
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
function hasSellerCentralLoginForm(root = document) {
	return LOGIN_FORM_SELECTORS.some((selector) => visible(root.querySelector(selector)));
}
function sellerCentralSessionStatus(pathname = location.pathname, root = document, readyState = typeof document !== "undefined" ? document.readyState : "loading") {
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
	} else if (hasSellerCentralLoginForm(root)) {
		result = {
			loggedInToStore: false,
			settled: true
		};
	} else if (readyState === "complete") {
		// Fully loaded page with no store shell and no login form → logged out (avoid 15s probe wait).
		result = {
			loggedInToStore: false,
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

const UNFULFILLABLE_GQL_URL = "https://sellercentral.amazon.com/myinventory/gql";
const UNFULFILLABLE_INVENTORIES_URL = "https://sellercentral.amazon.com/recovery/inventories";
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
const GET_LISTINGS_V2_PREFIX = `query GetListingsV2($pagination: PaginationInput, $usecase: UsecaseInput!, $sortRequest: SortRequest!, $searchTerm: SearchTerm, $multiSelectFilters: [MultiSelectFilter!], $multiSKUList: [String!]) {
  listingsV2(
    usecase: $usecase
    pagination: $pagination
    sortRequest: $sortRequest
    searchTerm: $searchTerm
    multiSelectFilters: $multiSelectFilters
    multiSKUList: $multiSKUList
  ) {
    ${LISTING_FIELDS}
    count`;
const GET_LISTINGS_V2_QUERY = `${GET_LISTINGS_V2_PREFIX}
    cursor
    debugInfo
    __typename
  }
}`;
const GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR = `${GET_LISTINGS_V2_PREFIX}
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
async function fetchAntiCsrfTokenFromInventory(fetchImpl) {
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
function isMissingCursorField(messages) {
	return messages.some((message) => /cursor/i.test(message) && /undefined|unknown field|cannot query field/i.test(message));
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
	const listings = Array.isArray(record.listings) ? record.listings.map(asListing).filter((listing) => listing !== undefined) : [];
	const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length;
	const cursor = typeof record.cursor === "string" && record.cursor.trim() ? record.cursor : undefined;
	return {
		listings,
		count,
		cursor
	};
}
function listingsVariables(cursor, includePagination = true) {
	const variables = {
		usecase: "INVENTORY_UNFULFILLABLE",
		sortRequest: {
			key: "QUANTITY_UNFULFILLABLE",
			order: "DESCENDING"
		},
		multiSelectFilters: [{
			key: "LISTING_STATUS",
			values: ["InventoryUnfulfillable"]
		}]
	};
	if (!includePagination) return variables;
	variables.pagination = cursor ? {
		pageSize: UNFULFILLABLE_PAGE_SIZE,
		cursor
	} : { pageSize: UNFULFILLABLE_PAGE_SIZE };
	return variables;
}
async function postListingsPage(fetchImpl, token, query, cursor, includePagination = true) {
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
			variables: listingsVariables(cursor, includePagination),
			query
		})
	});
	if (!response.ok) throw new Error(`Couldn’t load unfulfillable inventory (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load unfulfillable inventory.");
	}
	const messages = graphqlMessages(payload);
	if (messages.length && isMissingCursorField(messages)) throw new Error(messages.join(" "));
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
async function fetchRemovalLineItems(fetchImpl, token, listings, onProgress) {
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
		} catch {
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
async function fetchUnfulfillableListings(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const root = options.root ?? document;
	const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "");
	const onProgress = options.onProgress;
	let token = readAntiCsrfToken(root, cookie);
	if (!token) token = await fetchAntiCsrfTokenFromInventory(fetchImpl);
	if (!token) throw new Error("Couldn’t read the Seller Central security token.");
	onProgress?.({
		source: "unfulfillable",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	let query = GET_LISTINGS_V2_QUERY;
	let cursor;
	let includePagination = true;
	const listings = [];
	const seenCursors = new Set();
	let reportedCount = 0;
	let listingsIncomplete = false;
	for (let page = 0; page < UNFULFILLABLE_MAX_PAGES; page += 1) {
		let result;
		try {
			result = await postListingsPage(fetchImpl, token, query, cursor, includePagination);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const willRetryWithoutCursor = page === 0 && query === GET_LISTINGS_V2_QUERY && isMissingCursorField([message]);
			const willRetryWithoutPagination = page === 0 && includePagination && isInvalidPaginationInput([message]);
			if (willRetryWithoutCursor) {
				query = GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR;
				cursor = undefined;
				try {
					result = await postListingsPage(fetchImpl, token, query, cursor, includePagination);
				} catch (retryError) {
					const retryMessage = retryError instanceof Error ? retryError.message : String(retryError);
					if (!isInvalidPaginationInput([retryMessage])) throw retryError;
					includePagination = false;
					result = await postListingsPage(fetchImpl, token, query, cursor, includePagination);
				}
			} else if (willRetryWithoutPagination) {
				includePagination = false;
				result = await postListingsPage(fetchImpl, token, query, cursor, includePagination);
			} else if (listings.length > 0) {
				listingsIncomplete = true;
				break;
			} else {
				throw error;
			}
		}
		listings.push(...result.listings);
		reportedCount = result.count;
		onProgress?.({
			source: "unfulfillable",
			status: "active",
			loaded: listings.length,
			total: result.count,
			phase: "listings"
		});
		if (listings.length >= result.count) break;
		const emptyPage = result.listings.length === 0;
		const canSkipEmptyPage = emptyPage && result.count > listings.length && Boolean(result.cursor) && query !== GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR;
		if (emptyPage && !canSkipEmptyPage) break;
		if (!emptyPage && (query === GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR || !result.cursor)) break;
		if (!result.cursor || seenCursors.has(result.cursor)) break;
		seenCursors.add(result.cursor);
		cursor = result.cursor;
	}
	if (reportedCount > listings.length) listingsIncomplete = true;
	const { lineItems, failedPairKeys } = await fetchRemovalLineItems(fetchImpl, token, listings, onProgress);
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
const FEEDBACK_PAGE_SIZE = 20;
const FEEDBACK_MAX_PAGES = 40;
const FEEDBACK_PAGE_CONCURRENCY = 5;
const FEEDBACK_FROM_RATING = 1;
const FEEDBACK_TO_RATING = 3;
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
const MONTHS = [
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
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = MONTHS[date.getUTCMonth()];
	const year = date.getUTCFullYear();
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
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
function stringField(value) {
	if (value == null) return value;
	return typeof value === "string" ? value : undefined;
}
function numberField(value) {
	if (value == null) return value;
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
function booleanField(value) {
	if (value == null) return value;
	return typeof value === "boolean" ? value : undefined;
}
function asFeedback(value) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const answerMap = record.answerMap && typeof record.answerMap === "object" ? record.answerMap : undefined;
	const itemAsDescribedAnswer = answerMap?.ItemAsDescribed && typeof answerMap.ItemAsDescribed === "object" ? answerMap.ItemAsDescribed : undefined;
	const feedback = {};
	const feedbackId = stringField(record.feedbackId);
	const orderId = stringField(record.orderId);
	const numericRating = numberField(record.numericRating);
	const feedbackText = stringField(record.feedbackText);
	const feedbackDate = stringField(record.feedbackDate);
	const responseText = stringField(record.responseText);
	const responseDate = stringField(record.responseDate);
	const suppressed = booleanField(record.suppressed);
	const partiallySuppressed = booleanField(record.partiallySuppressed);
	const suppressReasonId = stringField(record.suppressReasonId);
	if (feedbackId !== undefined) feedback.feedbackId = feedbackId;
	if (orderId !== undefined) feedback.orderId = orderId;
	if (numericRating !== undefined) feedback.numericRating = numericRating;
	if (feedbackText !== undefined) feedback.feedbackText = feedbackText;
	if (feedbackDate !== undefined) feedback.feedbackDate = feedbackDate;
	if (responseText !== undefined) feedback.responseText = responseText;
	if (responseDate !== undefined) feedback.responseDate = responseDate;
	if (suppressed !== undefined) feedback.suppressed = suppressed;
	if (partiallySuppressed !== undefined) feedback.partiallySuppressed = partiallySuppressed;
	if (suppressReasonId !== undefined) feedback.suppressReasonId = suppressReasonId;
	if (itemAsDescribedAnswer) {
		feedback.answerMap = { ItemAsDescribed: { booleanRating: booleanField(itemAsDescribedAnswer.booleanRating) } };
	}
	return feedback;
}
function parseFeedbacksPage(payload) {
	if (!payload || typeof payload !== "object") throw new Error("Couldn’t load seller feedback.");
	const record = payload;
	if (!Array.isArray(record.feedbacks)) throw new Error("Couldn’t load seller feedback.");
	const feedbacks = record.feedbacks.map(asFeedback).filter((feedback) => feedback !== undefined);
	const pageNumber = typeof record.pageNumber === "number" && Number.isFinite(record.pageNumber) ? record.pageNumber : 0;
	return {
		feedbacks,
		lastPage: typeof record.lastPage === "boolean" ? record.lastPage : undefined,
		pageNumber
	};
}
function feedbacksUrl(pageNumber) {
	const params = new URLSearchParams({
		pageNumber: String(pageNumber),
		pageSize: String(FEEDBACK_PAGE_SIZE),
		fromRating: String(FEEDBACK_FROM_RATING),
		toRating: String(FEEDBACK_TO_RATING),
		sortBy: "Date",
		descendingOrder: "true",
		includePartiallySuppressed: "true",
		excludeTTRFeedback: "false",
		lastEvaluatedKey: ""
	});
	return `${FEEDBACKS_URL}?${params.toString()}`;
}
async function getFeedbacksPage(fetchImpl, pageNumber) {
	const response = await fetchImpl(feedbacksUrl(pageNumber), {
		method: "GET",
		credentials: "include",
		headers: {
			accept: "application/json, text/plain, */*",
			"x-requested-with": "XMLHttpRequest"
		}
	});
	if (!response.ok) throw new Error(`Couldn’t load seller feedback (${response.status}).`);
	let payload;
	try {
		payload = await response.json();
	} catch {
		throw new Error("Couldn’t load seller feedback.");
	}
	return parseFeedbacksPage(payload);
}
function isLastFeedbackPage(page) {
	return page.lastPage === true || page.feedbacks.length === 0 || page.lastPage !== false && page.feedbacks.length < FEEDBACK_PAGE_SIZE;
}
async function fetchNeutralNegativeFeedbacks(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const onProgress = options.onProgress;
	const feedbacks = [];
	onProgress?.({
		source: "feedback",
		status: "active",
		loaded: 0
	});
	for (let start = 0; start < FEEDBACK_MAX_PAGES; start += FEEDBACK_PAGE_CONCURRENCY) {
		const batchSize = Math.min(FEEDBACK_PAGE_CONCURRENCY, FEEDBACK_MAX_PAGES - start);
		const results = await Promise.allSettled(Array.from({ length: batchSize }, (_, offset) => getFeedbacksPage(fetchImpl, start + offset)));
		let foundLast = false;
		for (let offset = 0; offset < results.length; offset += 1) {
			const result = results[offset];
			if (result.status === "rejected") throw result.reason;
			const page = result.value;
			feedbacks.push(...page.feedbacks.filter((feedback) => isNeutralOrNegativeRating(feedback.numericRating)));
			const lastPage = isLastFeedbackPage(page);
			const loaded = start + offset + 1;
			onProgress?.({
				source: "feedback",
				status: lastPage ? "complete" : "active",
				loaded,
				total: lastPage ? loaded : undefined
			});
			if (lastPage) {
				foundLast = true;
				break;
			}
		}
		if (foundLast) break;
	}
	return feedbacks;
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
function strandedStringField(value) {
	if (typeof value !== "string") return undefined;
	return value;
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
function asStrandedListing(value, labels) {
	if (!value || typeof value !== "object") return undefined;
	const record = value;
	const listing = {};
	const sku = strandedStringField(record.SKU);
	const asin = strandedStringField(record.ASIN);
	const fnsku = strandedStringField(record.FNSKU);
	const productName = strandedStringField(record.ProductName);
	const condition = strandedStringField(record.Condition);
	const status = strandedStringField(record.Status);
	const statusSecondary = strandedStringField(record.StatusSecondary);
	const price = strandedStringField(record.Price);
	const priceUnit = strandedStringField(record.PriceUnit);
	const available = strandedStringField(record.Available);
	const totalQuantity = strandedStringField(record.TotalQuantity);
	const reserved = strandedStringField(record.Reserved);
	const inbound = strandedStringField(record.Inbound);
	const unfulfillable = strandedStringField(record.Unfulfillable);
	const dateAutoRemoval = strandedStringField(record.DateAutoRemoval);
	const autoRemovalType = strandedStringField(record.AutoRemovalType);
	const dateStranded = strandedStringField(record.DateStranded);
	const strandedReason = strandedStringField(record.StrandedReason);
	const strandedReasonCode = strandedStringField(record.StrandedReasonCode);
	const errorMessage = strandedStringField(record.ErrorMessage);
	const fulfilledBy = strandedStringField(record.FulfilledBy);
	const program = strandedStringField(record.Program);
	const supportedActions = strandedStringField(record.SupportedActions);
	if (sku !== undefined) listing.SKU = sku;
	if (asin !== undefined) listing.ASIN = asin;
	if (fnsku !== undefined) listing.FNSKU = fnsku;
	if (productName !== undefined) listing.ProductName = productName;
	if (condition !== undefined) listing.Condition = condition;
	if (status !== undefined) listing.Status = status;
	if (statusSecondary !== undefined) listing.StatusSecondary = statusSecondary;
	if (price !== undefined) listing.Price = price;
	if (priceUnit !== undefined) listing.PriceUnit = priceUnit;
	if (available !== undefined) listing.Available = available;
	if (totalQuantity !== undefined) listing.TotalQuantity = totalQuantity;
	if (reserved !== undefined) listing.Reserved = reserved;
	if (inbound !== undefined) listing.Inbound = inbound;
	if (unfulfillable !== undefined) listing.Unfulfillable = unfulfillable;
	if (dateAutoRemoval !== undefined) listing.DateAutoRemoval = dateAutoRemoval;
	if (autoRemovalType !== undefined) listing.AutoRemovalType = autoRemovalType;
	if (dateStranded !== undefined) listing.DateStranded = dateStranded;
	if (strandedReason !== undefined) listing.StrandedReason = strandedReason;
	if (strandedReasonCode !== undefined) listing.StrandedReasonCode = strandedReasonCode;
	if (errorMessage !== undefined) listing.ErrorMessage = errorMessage;
	if (fulfilledBy !== undefined) listing.FulfilledBy = fulfilledBy;
	if (program !== undefined) listing.Program = program;
	if (supportedActions !== undefined) listing.SupportedActions = supportedActions;
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
function suppressedGraphqlMessages(payload) {
	if (!payload || typeof payload !== "object" || !("errors" in payload)) return [];
	const errors = payload.errors;
	if (!Array.isArray(errors)) return [];
	return errors.map((error) => {
		if (!error || typeof error !== "object" || !("message" in error)) return "";
		return String(error.message ?? "");
	}).filter(Boolean);
}
function asSuppressedListing(value) {
	if (!value || typeof value !== "object") return undefined;
	return value;
}
function parseSuppressedListingsPage(payload) {
	const messages = suppressedGraphqlMessages(payload);
	const data = payload && typeof payload === "object" && "data" in payload ? payload.data : undefined;
	const listingsV2 = data && typeof data === "object" && "listingsV2" in data ? data.listingsV2 : undefined;
	if (!listingsV2 || typeof listingsV2 !== "object") {
		if (messages.length) throw new Error(messages.join(" "));
		throw new Error("Couldn’t load search-suppressed inventory.");
	}
	const record = listingsV2;
	const listings = Array.isArray(record.listings) ? record.listings.map(asSuppressedListing).filter((listing) => listing !== undefined) : [];
	const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length;
	return {
		listings,
		count
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
function suppressedChunk(items, size) {
	const batches = [];
	for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size));
	return batches;
}
function parseListingIssues(payload) {
	const messages = suppressedGraphqlMessages(payload);
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
function suppressedListingsVariables(from) {
	return {
		pagination: {
			from,
			size: SUPPRESSED_PAGE_SIZE
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
async function fetchSuppressedAntiCsrfTokenFromInventory(fetchImpl) {
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
async function postSuppressedListingsPage(fetchImpl, token, from) {
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
			variables: suppressedListingsVariables(from),
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
async function fetchListingIssues(fetchImpl, token, listings, onProgress) {
	if (listings.length === 0) return [];
	onProgress?.({
		source: "suppressed",
		status: "active",
		loaded: 0,
		total: listings.length,
		phase: "issues"
	});
	const withIssues = [];
	let processed = 0;
	for (const batch of suppressedChunk(listings, SUPPRESSED_ISSUES_CONCURRENCY)) {
		const results = await Promise.all(batch.map(async (listing) => {
			const sku = listingSku(listing);
			if (!sku) return {
				...listing,
				issues: []
			};
			try {
				return {
					...listing,
					issues: await postListingIssues(fetchImpl, token, sku)
				};
			} catch {
				return {
					...listing,
					issues: [],
					issuesFetchFailed: true
				};
			}
		}));
		withIssues.push(...results);
		processed += batch.length;
		onProgress?.({
			source: "suppressed",
			status: "active",
			loaded: processed,
			total: listings.length,
			phase: "issues"
		});
	}
	return withIssues;
}
async function fetchSuppressedListings(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const root = options.root ?? document;
	const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "");
	const onProgress = options.onProgress;
	let token = readAntiCsrfToken(root, cookie);
	if (!token) token = await fetchSuppressedAntiCsrfTokenFromInventory(fetchImpl);
	if (!token) throw new Error("Couldn’t read the Seller Central security token.");
	onProgress?.({
		source: "suppressed",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	const listings = [];
	let reportedCount = 0;
	let listingsIncomplete = false;
	let stoppedAtZeroAvailable = false;
	for (let page = 0; page < SUPPRESSED_MAX_PAGES; page += 1) {
		const from = page * SUPPRESSED_PAGE_SIZE;
		let result;
		try {
			result = await postSuppressedListingsPage(fetchImpl, token, from);
		} catch (error) {
			if (listings.length > 0) {
				listingsIncomplete = true;
				break;
			}
			throw error;
		}
		// Available quantity is descending, so the first out-of-stock row ends the scan.
		const cutoff = result.listings.findIndex((listing) => !hasNonZeroQuantity(listing));
		if (cutoff === -1) {
			listings.push(...result.listings);
		} else {
			listings.push(...result.listings.slice(0, cutoff));
			stoppedAtZeroAvailable = true;
		}
		reportedCount = result.count;
		onProgress?.({
			source: "suppressed",
			status: "active",
			loaded: listings.length,
			total: result.count,
			phase: "listings"
		});
		if (stoppedAtZeroAvailable) break;
		if (listings.length >= result.count) break;
		if (result.listings.length === 0) break;
	}
	if (!stoppedAtZeroAvailable && reportedCount > listings.length) listingsIncomplete = true;
	const tagged = listingsIncomplete ? listings.map((listing) => ({
		...listing,
		listingsIncomplete: true
	})) : listings;
	const inStock = inStockSuppressedListings(tagged);
	const merged = await fetchListingIssues(fetchImpl, token, inStock, onProgress);
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
const SHIPPING_QUEUE_DEFAULT_PAGE_SIZE = 250;
const SHIPPING_QUEUE_MAX_PAGES = 40;
const SHIPPING_QUEUE_ORDER_BY = "SHIPMENT_UPDATE_DATE";
const SHIPMENT_ELIGIBILITY_URL = "https://sellercentral.amazon.com/fba/wmsr/eligibilities";
const SHIPMENT_CLAIM_PAGE_URL = "https://sellercentral.amazon.com/fba/wmsr";
const SHIPMENT_DETAILS_CONCURRENCY = 40;
const SHIPMENT_DETAILS_MAX_ATTEMPTS = 3;
const SHIPMENT_DETAILS_RETRY_DELAY_MS = 500;
const SHIPMENT_DETAILS_SESSION_WAIT_MS = 6e4;
const SHIPMENT_DETAILS_SESSION_PAUSES = 3;
const SHIPPING_QUEUE_DETAILS_LOADED = "Loaded";
const SHIPPING_QUEUE_DETAILS_UNAVAILABLE = "Couldn’t load shipment details";
const SHIPPING_QUEUE_LIST_INCOMPLETE_NOTE = "Some shipments could not be loaded. This sheet includes only the shipments that were obtainable.";
const SHIPPING_QUEUE_DETAILS_INCOMPLETE_NOTE = "Shipment details could not be loaded for some shipments. Those rows are marked “Couldn’t load shipment details”.";
const SHIPPING_QUEUE_ITEMS_INCOMPLETE_NOTE = "Some shipments have more SKU lines than Amazon returned in one response. Those shipments list only the SKU lines that were obtainable.";
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
const SHIPPING_QUEUE_MONTHS = [
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
	const day = String(date.getUTCDate()).padStart(2, "0");
	const month = SHIPPING_QUEUE_MONTHS[date.getUTCMonth()];
	const year = date.getUTCFullYear();
	const hours = String(date.getUTCHours()).padStart(2, "0");
	const minutes = String(date.getUTCMinutes()).padStart(2, "0");
	const seconds = String(date.getUTCSeconds()).padStart(2, "0");
	return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
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
		...shipments.flatMap(shippingQueueShipmentRows)
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
function shippingQueueUrl(pageSize = SHIPPING_QUEUE_DEFAULT_PAGE_SIZE, cursor) {
	const params = new URLSearchParams({
		pageSize: String(pageSize),
		orderBy: SHIPPING_QUEUE_ORDER_BY,
		isOrderAscending: "false"
	});
	if (cursor) {
		params.set("lastShipmentId", cursor.lastShipmentId);
		params.set("createdDate", cursor.createdDate);
		params.set("lastUpdatedDate", cursor.lastUpdatedDate);
	}
	params.set("t2pLaunched", "true");
	return `${SHIPPING_QUEUE_URL}?${params.toString()}`;
}
function shipmentDetailsUrl(shipmentId) {
	return `${SHIPMENT_ELIGIBILITY_URL}/${encodeURIComponent(shipmentId)}?withInquiry=true&withDiscrepancies=true`;
}
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
async function fetchShippingQueuePage(fetchImpl, url) {
	const response = await fetchImpl(url, {
		method: "GET",
		mode: "cors",
		credentials: "include",
		referrer: SHIPPING_QUEUE_REFERRER,
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
async function fetchAllShipmentDetails(fetchImpl, shipments, sleep, onProgress) {
	if (shipments.length === 0) return [];
	onProgress?.({
		source: "shippingQueue",
		status: "active",
		loaded: 0,
		total: shipments.length,
		phase: "details"
	});
	const results = new Array(shipments.length);
	let next = 0;
	let inFlight = 0;
	let processed = 0;
	let pausePromise = null;
	let pauseCount = 0;
	let holdLaunch = false;
	let halt = false;
	let abandoned = false;
	function reportProgress() {
		onProgress?.({
			source: "shippingQueue",
			status: "active",
			loaded: processed,
			total: shipments.length,
			phase: "details"
		});
	}
	function abandonRest() {
		if (abandoned) return;
		abandoned = true;
		halt = true;
		while (next < shipments.length) {
			results[next] = {
				...shipments[next],
				detailsFetchFailed: true
			};
			next += 1;
			processed += 1;
			reportProgress();
		}
	}
	function startPause() {
		if (halt) return Promise.resolve(false);
		if (pausePromise) return pausePromise;
		if (pauseCount >= SHIPMENT_DETAILS_SESSION_PAUSES) {
			halt = true;
			console.error("[ShippingQueue] shipment details paused too many times; stopping");
			return Promise.resolve(false);
		}
		pauseCount += 1;
		let current;
		current = (async () => {
			console.warn("[ShippingQueue] detail session interrupted; pausing");
			try {
				await sleep(SHIPMENT_DETAILS_SESSION_WAIT_MS);
				await fetchShippingQueuePage(fetchImpl, shippingQueueUrl());
				return true;
			} catch (error) {
				console.error("[ShippingQueue] shipment list check failed:", error);
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
			return {
				...shipment,
				details: await fetchShipmentDetails(fetchImpl, id, sleep, onSession)
			};
		} catch (error) {
			if (!(error instanceof SessionInterrupted) || halt) {
				console.error("[ShippingQueue] shipment details failed:", id, error);
				return {
					...shipment,
					detailsFetchFailed: true
				};
			}
			const resumed = await startPause();
			if (!resumed) return {
				...shipment,
				detailsFetchFailed: true
			};
			try {
				return {
					...shipment,
					details: await fetchShipmentDetails(fetchImpl, id, sleep)
				};
			} catch (retryError) {
				console.error("[ShippingQueue] shipment details failed:", id, retryError);
				return {
					...shipment,
					detailsFetchFailed: true
				};
			}
		}
	}
	await new Promise((resolve) => {
		const pump = () => {
			if (halt && inFlight === 0) {
				abandonRest();
				resolve();
				return;
			}
			if (next >= shipments.length && inFlight === 0) {
				resolve();
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
		};
		pump();
	});
	return results;
}
async function fetchShippingQueueShipments(options = {}) {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const onProgress = options.onProgress;
	const sleep = options.sleep ?? defaultSleep;
	const pageSize = options.pageSize ?? SHIPPING_QUEUE_DEFAULT_PAGE_SIZE;
	const cutoffTimestamp = options.cutoffDate != null ? options.cutoffDate instanceof Date ? options.cutoffDate.getTime() : Number(options.cutoffDate) : calculateShippingQueueCutoffDate(options.referenceDate).getTime();
	onProgress?.({
		source: "shippingQueue",
		status: "active",
		loaded: 0,
		phase: "listings"
	});
	const shipments = [];
	const seenIds = new Set();
	let cursor;
	let listingsIncomplete = false;
	for (let page = 1; page <= SHIPPING_QUEUE_MAX_PAGES; page += 1) {
		let pageShipments;
		try {
			pageShipments = await fetchShippingQueuePage(fetchImpl, shippingQueueUrl(pageSize, cursor));
		} catch (error) {
			if (page > 1) {
				listingsIncomplete = true;
				break;
			}
			throw error;
		}
		if (pageShipments.length === 0) break;
		// Amazon orders by an index that can lag the real update time, so an older-looking
		// row may still be recent. Only stop once a whole page falls before the cutoff.
		let inWindow = 0;
		let added = 0;
		for (const shipment of pageShipments) {
			const updatedMs = getShipmentLastUpdatedMs(shipment);
			if (updatedMs != null && updatedMs < cutoffTimestamp) continue;
			inWindow += 1;
			const id = shipment.shipmentId?.trim();
			if (id && seenIds.has(id)) continue;
			if (id) seenIds.add(id);
			shipments.push(shipment);
			added += 1;
		}
		onProgress?.({
			source: "shippingQueue",
			status: "active",
			loaded: shipments.length,
			phase: "listings"
		});
		cursor = shippingQueueCursor(pageShipments[pageShipments.length - 1]);
		if (inWindow === 0 || added === 0 || pageShipments.length < pageSize || !cursor) break;
	}
	const tagged = listingsIncomplete ? shipments.map((shipment) => ({
		...shipment,
		listingsIncomplete: true
	})) : shipments;
	const withDetails = await fetchAllShipmentDetails(fetchImpl, tagged, sleep, onProgress);
	onProgress?.({
		source: "shippingQueue",
		status: "complete",
		loaded: withDetails.length,
		total: withDetails.length,
		phase: withDetails.length > 0 ? "details" : "listings"
	});
	return withDetails;
}

const PALETTE_APP_FILE = "palette-app.js";
let mounted = null;
let pending = null;
async function loadPalette() {
	if (mounted) return mounted;
	if (!pending) {
		if (typeof chrome === "undefined" || !chrome.runtime?.id) {
			throw new Error("Extension context invalidated.");
		}
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
function emitReportProgress(event) {
	if (typeof chrome === "undefined" || typeof chrome.runtime?.sendMessage !== "function") return;
	void chrome.runtime.sendMessage({
		type: "REPORTS_PROGRESS",
		...event
	}).then(() => undefined, () => undefined);
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
	if (record.type === "REPORTS_FETCH_UNFULFILLABLE") {
		void fetchUnfulfillableListings({ onProgress: emitReportProgress }).then((listings) => sendResponse({
			ok: true,
			listings
		}), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t load unfulfillable inventory."
		}));
		return true;
	}
	if (record.type === "REPORTS_FETCH_FEEDBACK") {
		void fetchNeutralNegativeFeedbacks({ onProgress: emitReportProgress }).then((feedbacks) => sendResponse({
			ok: true,
			feedbacks
		}), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t load seller feedback."
		}));
		return true;
	}
	if (record.type === "REPORTS_FETCH_STRANDED") {
		void fetchStrandedListings({ onProgress: emitReportProgress }).then((listings) => sendResponse({
			ok: true,
			listings
		}), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t load stranded inventory."
		}));
		return true;
	}
	if (record.type === "REPORTS_FETCH_SUPPRESSED") {
		void fetchSuppressedListings({ onProgress: emitReportProgress }).then((listings) => sendResponse({
			ok: true,
			listings
		}), (error) => sendResponse({
			ok: false,
			error: error instanceof Error ? error.message : "Couldn’t load search-suppressed inventory."
		}));
		return true;
	}
	if (record.type === "REPORTS_FETCH_SHIPPING_QUEUE") {
		void fetchShippingQueueShipments({ onProgress: emitReportProgress }).then((shipments) => sendResponse({
			ok: true,
			shipments
		}), (error) => {
			console.error("[ShippingQueue Content] Fetch failed:", error);
			sendResponse({
				ok: false,
				error: error instanceof Error ? error.message : "Couldn’t load shipping queue."
			});
		});
		return true;
	}
	return undefined;
}
if (typeof window !== "undefined" && window.top === window) {
	window.addEventListener("keydown", onKeyDown, true);
	if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.addListener(handleContentMessage);
}

})();
