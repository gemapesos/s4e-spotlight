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
	handleContentKeyDown(event);
}
function handleContentKeyDown(event, load = loadPalette) {
	if (!isPaletteShortcut(event)) {
		if (event.metaKey || event.ctrlKey) void load();
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
	return undefined;
}
if (typeof window !== "undefined" && window.top === window) {
	window.addEventListener("keydown", onKeyDown, true);
	if (typeof chrome !== "undefined") chrome.runtime?.onMessage?.addListener(handleContentMessage);
}

})();
