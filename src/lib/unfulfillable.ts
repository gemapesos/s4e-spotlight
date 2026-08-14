export const UNFULFILLABLE_GQL_URL = "https://sellercentral.amazon.com/myinventory/gql"
export const UNFULFILLABLE_INVENTORIES_URL = "https://sellercentral.amazon.com/recovery/inventories"
export const INVENTORY_MANAGE_URL = "https://sellercentral.amazon.com/myinventory/inventory"
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
    count`

export const GET_LISTINGS_V2_QUERY = `${GET_LISTINGS_V2_PREFIX}
    cursor
    debugInfo
    __typename
  }
}`

export const GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR = `${GET_LISTINGS_V2_PREFIX}
    debugInfo
    __typename
  }
}`

export const REMOVAL_STATUS_ELIGIBLE = "Total available for removal"
export const REMOVAL_STATUS_UNKNOWN = "unknown ineligible reason"

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

interface ListingsPage {
  listings: UnfulfillableListing[]
  count: number
  cursor?: string
}

export interface FetchUnfulfillableListingsOptions {
  fetch?: typeof globalThis.fetch
  root?: ParentNode
  cookie?: string
}

export function readAntiCsrfToken(root: ParentNode = document, cookie = typeof document !== "undefined" ? document.cookie : ""): string | undefined {
  const meta = "querySelector" in root ? root.querySelector('meta[name="anti-csrftoken-a2z"]') : null
  const fromMeta = meta?.getAttribute("content")?.trim()
  if (fromMeta) return fromMeta

  const match = cookie.match(/(?:^|;\s*)anti-csrftoken-a2z=([^;]+)/)
  if (!match) return undefined
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return match[1].trim()
  }
}

export function readAntiCsrfTokenFromHtml(html: string): string | undefined {
  const named = html.match(/<meta\b[^>]*\bname=["']anti-csrftoken-a2z["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i)
  if (named?.[1]) return named[1].trim()
  const contentFirst = html.match(/<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bname=["']anti-csrftoken-a2z["'][^>]*>/i)
  return contentFirst?.[1]?.trim()
}

async function fetchAntiCsrfTokenFromInventory(fetchImpl: typeof globalThis.fetch): Promise<string | undefined> {
  const response = await fetchImpl(INVENTORY_MANAGE_URL, {
    method: "GET",
    credentials: "include",
    headers: { accept: "text/html" },
  })
  if (!response.ok) return undefined
  let html = ""
  try {
    html = await response.text()
  } catch {
    return undefined
  }
  return readAntiCsrfTokenFromHtml(html)
}

export function formatListingStatus(status: string | null | undefined): string {
  if (!status) return ""
  return status
    .split(/[_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function cell(value: string | number | null | undefined): string {
  if (value == null) return ""
  return String(value)
}

function quantity(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
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
    formatRemovalStatus(listing.removal),
    cell(listing.listingData?.lastUpdated),
    cell(listing.imageUrl),
  ]
}

export function unfulfillableSheetRows(listings: readonly UnfulfillableListing[]): Array<Array<string | number>> {
  return [[...UNFULFILLABLE_SHEET_HEADERS], ...listings.map(unfulfillableSheetRow)]
}

function graphqlMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("errors" in payload)) return []
  const errors = (payload as { errors?: unknown }).errors
  if (!Array.isArray(errors)) return []
  return errors
    .map((error) => {
      if (!error || typeof error !== "object" || !("message" in error)) return ""
      return String((error as { message?: unknown }).message ?? "")
    })
    .filter(Boolean)
}

export function isMissingCursorField(messages: readonly string[]): boolean {
  return messages.some((message) => /cursor/i.test(message) && /undefined|unknown field|cannot query field/i.test(message))
}

export function isInvalidPaginationInput(messages: readonly string[]): boolean {
  return messages.some((message) => /paginationinput/i.test(message) && /not defined|undefined|unknown field/i.test(message))
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

function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = []
  for (let index = 0; index < items.length; index += size) batches.push(items.slice(index, index + size))
  return batches
}

function removalStatusLabel(code: string | null | undefined): string {
  if (!code || !(code in REMOVAL_STATUS_BY_CODE)) return REMOVAL_STATUS_UNKNOWN
  return REMOVAL_STATUS_BY_CODE[code as keyof typeof REMOVAL_STATUS_BY_CODE]
}

export function removalStatusFromLineItem(item: RecoveryLineItem): RemovalStatusSegment[] {
  const byLabel = new Map<string, number>()
  let ineligibleTotal = 0
  for (const entry of item.unsellableIneligibleQuantities ?? []) {
    if (!entry) continue
    const qty = quantity(entry.quantity)
    if (qty <= 0) continue
    ineligibleTotal += qty
    const label = removalStatusLabel(entry.unfulfillableErrorCode)
    byLabel.set(label, (byLabel.get(label) ?? 0) + qty)
  }
  const reportedIneligible = quantity(item.unsellableIneligibleQuantity)
  if (reportedIneligible > ineligibleTotal) {
    byLabel.set(REMOVAL_STATUS_UNKNOWN, (byLabel.get(REMOVAL_STATUS_UNKNOWN) ?? 0) + (reportedIneligible - ineligibleTotal))
    ineligibleTotal = reportedIneligible
  }
  const eligible = Math.max(0, quantity(item.totalUnsellableQuantity) - ineligibleTotal)
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
    return {
      ...listing,
      removal: pair ? byKey.get(skuPairKey(pair.merchantSku, pair.fulfillmentNetworkSku)) ?? [] : [],
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

  const record = listingsV2 as { listings?: unknown; count?: unknown; cursor?: unknown }
  const listings = Array.isArray(record.listings)
    ? record.listings.map(asListing).filter((listing): listing is UnfulfillableListing => listing !== undefined)
    : []
  const count = typeof record.count === "number" && Number.isFinite(record.count) ? record.count : listings.length
  const cursor = typeof record.cursor === "string" && record.cursor.trim() ? record.cursor : undefined
  return { listings, count, cursor }
}

function listingsVariables(cursor?: string, includePagination = true): Record<string, unknown> {
  const variables: Record<string, unknown> = {
    usecase: "INVENTORY_UNFULFILLABLE",
    sortRequest: { key: "QUANTITY_UNFULFILLABLE", order: "DESCENDING" },
    multiSelectFilters: [{ key: "LISTING_STATUS", values: ["InventoryUnfulfillable"] }],
  }
  if (!includePagination) return variables
  variables.pagination = cursor
    ? { pageSize: UNFULFILLABLE_PAGE_SIZE, cursor }
    : { pageSize: UNFULFILLABLE_PAGE_SIZE }
  return variables
}

async function postListingsPage(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  query: string,
  cursor?: string,
  includePagination = true,
): Promise<ListingsPage> {
  const response = await fetchImpl(UNFULFILLABLE_GQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/graphql-response+json, application/json",
      "content-type": "application/json",
      "anti-csrftoken-a2z": token,
    },
    body: JSON.stringify({
      operationName: "GetListingsV2",
      variables: listingsVariables(cursor, includePagination),
      query,
    }),
  })

  if (!response.ok) throw new Error(`Couldn’t load unfulfillable inventory (${response.status}).`)

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new Error("Couldn’t load unfulfillable inventory.")
  }

  const messages = graphqlMessages(payload)
  if (messages.length && isMissingCursorField(messages)) throw new Error(messages.join(" "))
  return parseListingsPage(payload)
}

async function postInventoriesBatch(
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
): Promise<RecoveryLineItem[]> {
  const pairs = listings.map(listingSkuPair).filter((pair): pair is { merchantSku: string; fulfillmentNetworkSku: string } => pair !== undefined)
  if (pairs.length === 0) return []

  const lineItems: RecoveryLineItem[] = []
  for (const batch of chunk(pairs, UNFULFILLABLE_INVENTORIES_BATCH_SIZE)) {
    lineItems.push(...await postInventoriesBatch(fetchImpl, token, batch))
  }
  return lineItems
}

export async function fetchUnfulfillableListings(
  options: FetchUnfulfillableListingsOptions = {},
): Promise<UnfulfillableListing[]> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const root = options.root ?? document
  const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "")
  let token = readAntiCsrfToken(root, cookie)
  if (!token) token = await fetchAntiCsrfTokenFromInventory(fetchImpl)
  if (!token) throw new Error("Couldn’t read the Seller Central security token.")

  let query = GET_LISTINGS_V2_QUERY
  let cursor: string | undefined
  let includePagination = true
  const listings: UnfulfillableListing[] = []
  const seenCursors = new Set<string>()

  for (let page = 0; page < UNFULFILLABLE_MAX_PAGES; page += 1) {
    let result: ListingsPage
    try {
      result = await postListingsPage(fetchImpl, token, query, cursor, includePagination)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const willRetryWithoutCursor = page === 0 && query === GET_LISTINGS_V2_QUERY && isMissingCursorField([message])
      const willRetryWithoutPagination = page === 0 && includePagination && isInvalidPaginationInput([message])
      if (willRetryWithoutCursor) {
        query = GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR
        cursor = undefined
        try {
          result = await postListingsPage(fetchImpl, token, query, cursor, includePagination)
        } catch (retryError) {
          const retryMessage = retryError instanceof Error ? retryError.message : String(retryError)
          if (!isInvalidPaginationInput([retryMessage])) throw retryError
          includePagination = false
          result = await postListingsPage(fetchImpl, token, query, cursor, includePagination)
        }
      } else if (willRetryWithoutPagination) {
        includePagination = false
        result = await postListingsPage(fetchImpl, token, query, cursor, includePagination)
      } else {
        throw error
      }
    }

    listings.push(...result.listings)
    if (listings.length >= result.count || result.listings.length === 0) break
    if (query === GET_LISTINGS_V2_QUERY_WITHOUT_CURSOR || !result.cursor) break
    if (seenCursors.has(result.cursor)) break
    seenCursors.add(result.cursor)
    cursor = result.cursor
  }

  const lineItems = await fetchRemovalLineItems(fetchImpl, token, listings)
  return mergeRemovalStatus(listings, lineItems)
}
