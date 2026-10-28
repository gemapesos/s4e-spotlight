import { describeError, errorMessage, type Logger } from "./log"
import type { ReportProgressEvent } from "./reportProgress"
import { quantityCell, textCell } from "@/shared/format"
import { fetchAntiCsrfTokenFromInventory, graphqlMessages, isInvalidPaginationInput, postInventoryGraphql, readAntiCsrfToken } from "@/sellerCentral/inventoryGraphql"

export const UNFULFILLABLE_INVENTORIES_URL = "https://sellercentral.amazon.com/recovery/inventories"
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
  "removal_order_id",
]
export const REMOVAL_ORDER_REPORT_URL = `https://sellercentral.amazon.com/reportcentral/api/v1/getOnlineReportRecords?${new URLSearchParams([
  ["type", "RemovalOrderDetail"],
  ["size", "50"],
  ["offset", "0"],
  ["sDate", ""],
  ["eDate", ""],
  ["days", "30"],
  ["sDateOff", "0"],
  ["eDateOff", "0"],
  ...REMOVAL_ORDER_REPORT_COLUMNS.map((column) => ["cols", column]),
  ["sort", JSON.stringify({ keyName: "creation_date", sortingOrder: "DESC" })],
])}`

const REMOVAL_ORDER_ID_PATTERN = /S4E[A-Z]{2}\d{4}/
export const UNFULFILLABLE_PAGE_SIZE = 250
export const UNFULFILLABLE_MAX_PAGES = 40
export const UNFULFILLABLE_INVENTORIES_BATCH_SIZE = 50

export const UNFULFILLABLE_SHEET_HEADERS = [
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
  "Image URL",
] as const

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
    }`

export const GET_LISTINGS_V2_QUERY = `query GetListingsV2($pagination: PaginationInput, $usecase: UsecaseInput!, $sortRequest: SortRequest!, $searchTerm: SearchTerm, $multiSelectFilters: [MultiSelectFilter!], $multiSKUList: [String!]) {
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
}`

export const REMOVAL_STATUS_ELIGIBLE = "Total available for removal"
export const REMOVAL_STATUS_UNKNOWN = "unknown ineligible reason"
export const REMOVAL_STATUS_UNAVAILABLE = "Couldn’t load removal status"
export const UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE =
  "Some unfulfillable listings could not be loaded. This sheet includes only the listings that were obtainable."
export const UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE =
  `Removal status could not be loaded for some SKUs. Those rows are marked “${REMOVAL_STATUS_UNAVAILABLE}”.`

export const REMOVAL_STATUS_BY_CODE = {
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
  InventorySubjectToLendingRestriction: "Inventory cannot be removed due to Lending restrictions - please contact Amazon Lending",
} as const

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
  REMOVAL_STATUS_UNKNOWN,
] as const

export interface RemovalStatusSegment {
  label: string
  quantity: number
}

export interface UnfulfillableListing {
  coreListingFields?: {
    sku?: string | null
    asin?: string | null
    fnSku?: string | null
  } | null
  listingData?: {
    title?: string | null
    lastUpdated?: string | null
  } | null
  imageUrl?: string | null
  status?: { status?: string | null } | null
  availability?: {
    unfulfillable?: number | null
    unfulfillableDetails?: {
      expired?: number | null
      damagedByCarrier?: number | null
      damagedByCustomer?: number | null
      damagedByDistributor?: number | null
      damagedByWarehouse?: number | null
      defective?: number | null
    } | null
  } | null
  offers?: Array<{
    price?: {
      price?: {
        amount?: string | null
        currencyUnit?: string | null
      } | null
    } | null
  } | null> | null
  removal?: RemovalStatusSegment[] | null
  removalFetchFailed?: boolean
  listingsIncomplete?: boolean
}

export interface RecoveryLineItem {
  merchantSku?: string | null
  fulfillmentNetworkSku?: string | null
  totalSellableQuantity?: number | null
  totalUnsellableQuantity?: number | null
  unsellableIneligibleQuantity?: number | null
  unsellableIneligibleQuantities?: Array<{
    quantity?: number | null
    unfulfillableErrorCode?: string | null
  } | null> | null
}

export interface ListingsPage {
  listings: UnfulfillableListing[]
  count: number
  /** Rows Amazon returned, including unreadable ones; the next page starts after them. */
  rows: number
}

export interface FetchUnfulfillableListingsOptions {
  fetch?: typeof globalThis.fetch
  root?: ParentNode
  cookie?: string
  onProgress?: (event: ReportProgressEvent) => void
  log?: Logger
}

export function formatListingStatus(status: string | null | undefined): string {
  if (!status) return ""
  return status
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function firstOfferPrice(listing: UnfulfillableListing): { amount: number | ""; currency: string } {
  for (const offer of listing.offers ?? []) {
    const price = offer?.price?.price
    if (!price?.amount) continue
    const amount = Number(price.amount)
    if (Number.isFinite(amount)) return { amount, currency: price.currencyUnit ?? "" }
  }
  return { amount: "", currency: "" }
}

export function formatRemovalStatus(segments: readonly RemovalStatusSegment[] | null | undefined): string {
  const byLabel = new Map<string, number>()
  for (const segment of segments ?? []) {
    if (segment.quantity <= 0) continue
    byLabel.set(segment.label, (byLabel.get(segment.label) ?? 0) + segment.quantity)
  }
  const ordered: RemovalStatusSegment[] = REMOVAL_STATUS_ORDER
    .filter((label) => byLabel.has(label))
    .map((label) => ({ label, quantity: byLabel.get(label) ?? 0 }))
  const known = new Set<string>(REMOVAL_STATUS_ORDER)
  for (const [label, qty] of byLabel) {
    if (!known.has(label)) ordered.push({ label, quantity: qty })
  }
  return ordered
    .map(({ label, quantity: qty }) => `${label} - ${qty} ${qty === 1 ? "unit" : "units"}`)
    .join(" || ")
}

export function unfulfillableSheetRow(listing: UnfulfillableListing): Array<string | number> {
  const details = listing.availability?.unfulfillableDetails
  const price = firstOfferPrice(listing)
  const cells: Record<(typeof UNFULFILLABLE_SHEET_HEADERS)[number], string | number> = {
    "SKU": textCell(listing.coreListingFields?.sku),
    "ASIN": textCell(listing.coreListingFields?.asin),
    "FNSKU": textCell(listing.coreListingFields?.fnSku),
    "Title": textCell(listing.listingData?.title),
    "Status": formatListingStatus(listing.status?.status),
    "Price": price.amount,
    "Currency": price.currency,
    "Unfulfillable": quantityCell(listing.availability?.unfulfillable),
    "Carrier Damaged": quantityCell(details?.damagedByCarrier),
    "Customer Damaged": quantityCell(details?.damagedByCustomer),
    "Defective": quantityCell(details?.defective),
    "Expired": quantityCell(details?.expired),
    "Warehouse Damaged": quantityCell(details?.damagedByWarehouse),
    "Distributor Damaged": quantityCell(details?.damagedByDistributor),
    "Removal Status": listing.removalFetchFailed ? REMOVAL_STATUS_UNAVAILABLE : formatRemovalStatus(listing.removal),
    "Last Updated": textCell(listing.listingData?.lastUpdated),
    "Image URL": textCell(listing.imageUrl),
  }
  return UNFULFILLABLE_SHEET_HEADERS.map((header) => cells[header])
}

function unfulfillableSheetNotes(listings: readonly UnfulfillableListing[]): Array<Array<string | number>> {
  const notes: Array<Array<string | number>> = []
  if (listings.some((listing) => listing.listingsIncomplete)) notes.push([UNFULFILLABLE_LISTINGS_INCOMPLETE_NOTE])
  if (listings.some((listing) => listing.removalFetchFailed)) notes.push([UNFULFILLABLE_REMOVAL_INCOMPLETE_NOTE])
  if (notes.length) notes.push([])
  return notes
}

export function unfulfillableSheetRows(listings: readonly UnfulfillableListing[]): Array<Array<string | number>> {
  return [...unfulfillableSheetNotes(listings), [...UNFULFILLABLE_SHEET_HEADERS], ...listings.map(unfulfillableSheetRow)]
}

export function listingSkuPair(listing: UnfulfillableListing): { merchantSku: string; fulfillmentNetworkSku: string } | undefined {
  const merchantSku = listing.coreListingFields?.sku?.trim()
  const fulfillmentNetworkSku = listing.coreListingFields?.fnSku?.trim()
  if (!merchantSku || !fulfillmentNetworkSku) return undefined
  return { merchantSku, fulfillmentNetworkSku }
}

function skuPairKey(merchantSku: string, fulfillmentNetworkSku: string): string {
  return `${merchantSku}\0${fulfillmentNetworkSku}`
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = []
  for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size))
  return batches
}

function removalStatusLabel(code: string | null | undefined): string {
  if (!code || !Object.hasOwn(REMOVAL_STATUS_BY_CODE, code)) return REMOVAL_STATUS_UNKNOWN
  return REMOVAL_STATUS_BY_CODE[code as keyof typeof REMOVAL_STATUS_BY_CODE]
}

export function removalStatusFromLineItem(item: RecoveryLineItem): RemovalStatusSegment[] {
  const byLabel = new Map<string, number>()
  let ineligibleTotal = 0
  for (const entry of item.unsellableIneligibleQuantities ?? []) {
    if (!entry) continue
    const qty = quantityCell(entry.quantity)
    if (qty <= 0) continue
    ineligibleTotal += qty
    const label = removalStatusLabel(entry.unfulfillableErrorCode)
    byLabel.set(label, (byLabel.get(label) ?? 0) + qty)
  }
  const reportedIneligible = quantityCell(item.unsellableIneligibleQuantity)
  if (reportedIneligible > ineligibleTotal) {
    byLabel.set(REMOVAL_STATUS_UNKNOWN, (byLabel.get(REMOVAL_STATUS_UNKNOWN) ?? 0) + (reportedIneligible - ineligibleTotal))
    ineligibleTotal = reportedIneligible
  }
  const eligible = Math.max(0, quantityCell(item.totalUnsellableQuantity) - ineligibleTotal)
  if (eligible > 0) byLabel.set(REMOVAL_STATUS_ELIGIBLE, (byLabel.get(REMOVAL_STATUS_ELIGIBLE) ?? 0) + eligible)

  return REMOVAL_STATUS_ORDER
    .filter((label) => (byLabel.get(label) ?? 0) > 0)
    .map((label) => ({ label, quantity: byLabel.get(label) ?? 0 }))
}

export function parseRecoveryInventories(payload: unknown): RecoveryLineItem[] {
  if (!payload || typeof payload !== "object" || !("lineItems" in payload)) {
    throw new Error("Couldn’t load unfulfillable removal status.")
  }
  const lineItems = (payload as { lineItems?: unknown }).lineItems
  if (!Array.isArray(lineItems)) throw new Error("Couldn’t load unfulfillable removal status.")
  return lineItems.filter((item): item is RecoveryLineItem => Boolean(item && typeof item === "object"))
}

export function mergeRemovalStatus(
  listings: readonly UnfulfillableListing[],
  lineItems: readonly RecoveryLineItem[],
  failedPairKeys: ReadonlySet<string> = new Set(),
): UnfulfillableListing[] {
  const byKey = new Map<string, RemovalStatusSegment[]>()
  for (const item of lineItems) {
    const merchantSku = item.merchantSku?.trim()
    const fulfillmentNetworkSku = item.fulfillmentNetworkSku?.trim()
    if (!merchantSku || !fulfillmentNetworkSku) continue
    byKey.set(skuPairKey(merchantSku, fulfillmentNetworkSku), removalStatusFromLineItem(item))
  }
  return listings.map((listing) => {
    const pair = listingSkuPair(listing)
    const key = pair ? skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku) : undefined
    if (key && failedPairKeys.has(key)) {
      return { ...listing, removal: [], removalFetchFailed: true }
    }
    return {
      ...listing,
      removal: key ? byKey.get(key) ?? [] : [],
    }
  })
}

function asListing(value: unknown): UnfulfillableListing | undefined {
  if (!value || typeof value !== "object") return undefined
  return value as UnfulfillableListing
}

export function parseListingsPage(payload: unknown): ListingsPage {
  const messages = graphqlMessages(payload)
  const data = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : undefined
  const listingsV2 =
    data && typeof data === "object" && "listingsV2" in data
      ? (data as { listingsV2?: unknown }).listingsV2
      : undefined

  if (!listingsV2 || typeof listingsV2 !== "object") {
    if (messages.length) throw new Error(messages.join(" "))
    throw new Error("Couldn’t load unfulfillable inventory.")
  }

  const record = listingsV2 as { listings?: unknown; count?: unknown }
  const rows = Array.isArray(record.listings) ? record.listings : []
  const listings = rows.map(asListing).filter((listing): listing is UnfulfillableListing => listing !== undefined)
  const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length
  return { listings, count, rows: rows.length }
}

/** Offset pagination, as Manage Inventory uses; omit `from` to request Amazon's default first page. */
export function listingsVariables(from?: number): Record<string, unknown> {
  return {
    usecase: "INVENTORY_UNFULFILLABLE",
    sortRequest: { key: "QUANTITY_UNFULFILLABLE", order: "DESCENDING" },
    multiSelectFilters: [{ key: "LISTING_STATUS", values: ["InventoryUnfulfillable"] }],
    ...(from === undefined ? {} : { pagination: { from, size: UNFULFILLABLE_PAGE_SIZE } }),
  }
}

function listingKey(listing: UnfulfillableListing): string {
  const pair = listingSkuPair(listing)
  return pair ? skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku) : JSON.stringify(listing.coreListingFields ?? listing)
}

export async function postListingsPage(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  from?: number,
  extraVariables: Record<string, unknown> = {},
): Promise<ListingsPage> {
  const payload = await postInventoryGraphql(fetchImpl, token, {
    operationName: "GetListingsV2",
    variables: { ...listingsVariables(from), ...extraVariables },
    query: GET_LISTINGS_V2_QUERY,
    }, "Couldn’t load unfulfillable inventory")
  return parseListingsPage(payload)
}

export async function postInventoriesBatch(
  fetchImpl: typeof globalThis.fetch,
  token: string | undefined,
  pairs: Array<{ merchantSku: string; fulfillmentNetworkSku: string }>,
): Promise<RecoveryLineItem[]> {
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "content-type": "application/json",
  }
  if (token) headers["anti-csrftoken-a2z"] = token

  const response = await fetchImpl(UNFULFILLABLE_INVENTORIES_URL, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({
      matchedMskusAndFnskus: pairs,
      fulfillmentChannel: "RETURN",
      inventoryCategory: "STANDARD",
    }),
  })

  if (!response.ok) throw new Error(`Couldn’t load unfulfillable removal status (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load unfulfillable removal status.")
  }
  return parseRecoveryInventories(payload)
}

async function fetchRemovalLineItems(
  fetchImpl: typeof globalThis.fetch,
  token: string | undefined,
  listings: readonly UnfulfillableListing[],
  onProgress?: (event: ReportProgressEvent) => void,
  log?: Logger,
): Promise<{ lineItems: RecoveryLineItem[]; failedPairKeys: Set<string> }> {
  const pairs = listings.map(listingSkuPair).filter((pair): pair is { merchantSku: string; fulfillmentNetworkSku: string } => pair !== undefined)
  if (pairs.length === 0) return { lineItems: [], failedPairKeys: new Set() }

  const lineItems: RecoveryLineItem[] = []
  const failedPairKeys = new Set<string>()
  let processed = 0
  onProgress?.({ source: "unfulfillable", status: "active", loaded: 0, total: pairs.length, phase: "removal" })
  for (const batch of chunk(pairs, UNFULFILLABLE_INVENTORIES_BATCH_SIZE)) {
    try {
      lineItems.push(...await postInventoriesBatch(fetchImpl, token, batch))
    } catch (error) {
      log?.warn("unfulfillable.removalBatchFailed", { skus: batch.length, error: describeError(error) })
      for (const pair of batch) failedPairKeys.add(skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku))
    }
    processed += batch.length
    onProgress?.({ source: "unfulfillable", status: "active", loaded: processed, total: pairs.length, phase: "removal" })
  }
  return { lineItems, failedPairKeys }
}

export function removalOrderIdFromRow(row: unknown): string | null {
  if (!Array.isArray(row)) return null
  for (const cell of row) {
    if (typeof cell !== "string") continue
    const match = REMOVAL_ORDER_ID_PATTERN.exec(cell.trim())
    if (match) return match[0]
  }
  return null
}

export function latestRemovalOrderId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("columnData" in payload)) return null
  const rows = (payload as { columnData?: unknown }).columnData
  if (!Array.isArray(rows)) return null
  for (const row of rows) {
    const id = removalOrderIdFromRow(row)
    if (id) return id
  }
  return null
}

export function incrementRemovalOrderId(orderId: string): string | null {
  const match = /(S4E[A-Z]{2})(\d{4})/.exec(orderId)
  if (!match) return null
  const number = Number.parseInt(match[2], 10) + 1
  return `${match[1]}${String(number).padStart(4, "0")}`
}

export async function fetchNextRemovalOrderId(
  fetchImpl: typeof globalThis.fetch = globalThis.fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(REMOVAL_ORDER_REPORT_URL, {
      method: "GET",
      credentials: "include",
      headers: { accept: "*/*" },
    })
    if (!response.ok) return null
    let payload: unknown
    try {
      payload = await response.json()
    } catch {
      return null
    }
    const lastId = latestRemovalOrderId(payload)
    if (!lastId) return null
    return incrementRemovalOrderId(lastId)
  } catch {
    return null
  }
}

export async function fetchUnfulfillableListings(
  options: FetchUnfulfillableListingsOptions = {},
): Promise<UnfulfillableListing[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const root = options.root ?? document
  const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "")
  const onProgress = options.onProgress
  const log = options.log
  let token = readAntiCsrfToken(root, cookie)
  if (!token) {
    log?.info("unfulfillable.tokenFromInventoryPage")
    token = await fetchAntiCsrfTokenFromInventory(fetchImpl)
  }
  if (!token) throw new Error("Couldn’t read the Seller Central security token.")

  onProgress?.({ source: "unfulfillable", status: "active", loaded: 0, phase: "listings" })

  const listings: UnfulfillableListing[] = []
  const seen = new Set<string>()
  let paginate = true
  let offset = 0
  let reportedCount = 0
  let listingsIncomplete = false

  for (let page = 0; page < UNFULFILLABLE_MAX_PAGES; page += 1) {
    const pageDone = log?.time("unfulfillable.page", { page, from: offset })
    let result: ListingsPage
    try {
      result = await postListingsPage(fetchImpl, token, paginate ? offset : undefined)
    } catch (error) {
      if (page === 0 && paginate && isInvalidPaginationInput([errorMessage(error)])) {
        // Without paging Amazon returns only its default first page; the count check below flags the rest.
        log?.warn("unfulfillable.schemaRetry", { without: "pagination" })
        paginate = false
        result = await postListingsPage(fetchImpl, token)
      } else if (listings.length > 0) {
        log?.warn("unfulfillable.listingsStopped", { page, loaded: listings.length, error: describeError(error) })
        listingsIncomplete = true
        break
      } else {
        throw error
      }
    }

    const added = result.listings.filter((listing) => {
      const key = listingKey(listing)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    listings.push(...added)
    offset += result.rows
    reportedCount = result.count
    pageDone?.({ rows: result.rows, added: added.length, reported: result.count })
    onProgress?.({
      source: "unfulfillable",
      status: "active",
      loaded: listings.length,
      total: result.count,
      phase: "listings",
    })
    if (!paginate || result.rows === 0 || offset >= result.count) break
    if (added.length === 0) {
      // Amazon ignored the offset and sent listings already loaded.
      log?.warn("unfulfillable.pagingIgnored", { page, loaded: listings.length, reported: result.count })
      break
    }
  }

  if (reportedCount > listings.length) {
    log?.warn("unfulfillable.listingsIncomplete", { loaded: listings.length, reported: reportedCount })
    listingsIncomplete = true
  }

  const { lineItems, failedPairKeys } = await fetchRemovalLineItems(fetchImpl, token, listings, onProgress, log)
  const merged = mergeRemovalStatus(listings, lineItems, failedPairKeys).map((listing) => (
    listingsIncomplete ? { ...listing, listingsIncomplete: true } : listing
  ))
  onProgress?.({
    source: "unfulfillable",
    status: "complete",
    loaded: merged.length,
    total: merged.length,
    phase: lineItems.length > 0 ? "removal" : "listings",
  })
  return merged
}
