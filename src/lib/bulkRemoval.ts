import { describeError, type Logger } from "./log"
import {
  fetchNextRemovalOrderId,
  listingSkuPair,
  postInventoriesBatch,
  postListingsPage,
  REMOVAL_STATUS_ELIGIBLE,
  removalStatusFromLineItem,
  UNFULFILLABLE_INVENTORIES_BATCH_SIZE,
  UNFULFILLABLE_MAX_PAGES,
  chunk,
  type RecoveryLineItem,
  type UnfulfillableListing,
} from "./unfulfillable"
import { fetchAntiCsrfTokenFromInventory, readAntiCsrfToken } from "@/sellerCentral/inventoryGraphql"

export const BULK_REMOVAL_NOT_FOUND = "Not in unfulfillable inventory"
export const BULK_REMOVAL_NO_UNITS = "No units available for removal"

export interface BulkRemovalItem {
  sku: string
  asin: string
  fnSku: string
  /** Units available for removal, or null when Amazon didn't report eligibility. */
  removableUnits: number | null
}

export interface BulkRemovalSkip {
  sku: string
  reason: string
}

export interface BulkRemovalResolution {
  items: BulkRemovalItem[]
  skipped: BulkRemovalSkip[]
  nextRemovalOrderId: string | null
  eligibilityUnknown: boolean
}

export interface ResolveRemovalSkusOptions {
  fetch?: typeof globalThis.fetch
  root?: ParentNode
  cookie?: string
  log?: Logger
}

const skuKey = (sku: string): string => sku.trim().toLowerCase()

function addListings(found: Map<string, UnfulfillableListing>, listings: readonly UnfulfillableListing[], wanted: ReadonlySet<string>): void {
  for (const listing of listings) {
    const sku = listing.coreListingFields?.sku
    const asin = listing.coreListingFields?.asin?.trim()
    if (!sku || !asin || !listingSkuPair(listing)) continue
    const key = skuKey(sku)
    if (wanted.has(key) && !found.has(key)) found.set(key, listing)
  }
}

/**
 * Finds the unfulfillable listing for each SKU. Asks Amazon for just those SKUs first, and scans
 * the unfulfillable list only if that filter is rejected or ignored.
 */
async function findListings(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  skus: readonly string[],
  log?: Logger,
): Promise<{ found: Map<string, UnfulfillableListing>; lookup: "multiSku" | "scan" }> {
  const wanted = new Set(skus.map(skuKey))
  const found = new Map<string, UnfulfillableListing>()
  try {
    const page = await postListingsPage(fetchImpl, token, 0, { multiSKUList: [...skus] })
    const returned = page.listings.map((listing) => listing.coreListingFields?.sku).filter((sku): sku is string => Boolean(sku))
    if (returned.length > 0 && returned.every((sku) => wanted.has(skuKey(sku)))) {
      addListings(found, page.listings, wanted)
      return { found, lookup: "multiSku" }
    }
    log?.warn("bulkRemoval.multiSkuIgnored", { returned: returned.length })
  } catch (error) {
    log?.warn("bulkRemoval.multiSkuFailed", { error: describeError(error) })
  }

  let offset = 0
  for (let page = 0; page < UNFULFILLABLE_MAX_PAGES && found.size < wanted.size; page += 1) {
    const result = await postListingsPage(fetchImpl, token, offset)
    addListings(found, result.listings, wanted)
    offset += result.rows
    if (result.rows === 0 || offset >= result.count) break
  }
  return { found, lookup: "scan" }
}

async function fetchLineItems(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  listings: readonly UnfulfillableListing[],
  log?: Logger,
): Promise<{ lineItems: RecoveryLineItem[]; failed: boolean }> {
  const pairs = listings.map(listingSkuPair).filter((pair) => pair !== undefined)
  const lineItems: RecoveryLineItem[] = []
  let failed = false
  for (const batch of chunk(pairs, UNFULFILLABLE_INVENTORIES_BATCH_SIZE)) {
    try {
      lineItems.push(...await postInventoriesBatch(fetchImpl, token, batch))
    } catch (error) {
      log?.warn("bulkRemoval.eligibilityFailed", { skus: batch.length, error: describeError(error) })
      failed = true
    }
  }
  return { lineItems, failed }
}

/**
 * Matches pasted SKUs to their unfulfillable listings and keeps those with units available for
 * removal, in the order given. Runs in the signed-in Seller Central tab.
 */
export async function resolveRemovalSkus(
  skus: readonly string[],
  options: ResolveRemovalSkusOptions = {},
): Promise<BulkRemovalResolution> {
  const fetchImpl = options.fetch ?? globalThis.fetch
  const root = options.root ?? document
  const cookie = options.cookie ?? (typeof document !== "undefined" ? document.cookie : "")
  const log = options.log
  const nextIdRequest = fetchNextRemovalOrderId(fetchImpl)

  const token = readAntiCsrfToken(root, cookie) ?? await fetchAntiCsrfTokenFromInventory(fetchImpl)
  if (!token) throw new Error("Couldn’t read the Seller Central security token.")

  const { found, lookup } = await findListings(fetchImpl, token, skus, log)
  const { lineItems, failed } = await fetchLineItems(fetchImpl, token, [...found.values()], log)
  const eligibilityBySku = new Map<string, RecoveryLineItem>()
  for (const item of lineItems) {
    if (item.merchantSku) eligibilityBySku.set(skuKey(item.merchantSku), item)
  }

  const items: BulkRemovalItem[] = []
  const skipped: BulkRemovalSkip[] = []
  let eligibilityUnknown = false
  for (const sku of skus) {
    const listing = found.get(skuKey(sku))
    if (!listing) {
      skipped.push({ sku, reason: BULK_REMOVAL_NOT_FOUND })
      continue
    }
    const fields = listing.coreListingFields!
    const item = { sku: fields.sku!.trim(), asin: fields.asin!.trim(), fnSku: fields.fnSku!.trim() }
    const lineItem = eligibilityBySku.get(skuKey(sku))
    if (!lineItem) {
      // Amazon's form still checks eligibility, so an unknown status doesn't hold the SKU back.
      eligibilityUnknown = true
      items.push({ ...item, removableUnits: null })
      continue
    }
    const segments = removalStatusFromLineItem(lineItem)
    const removableUnits = segments.find((segment) => segment.label === REMOVAL_STATUS_ELIGIBLE)?.quantity ?? 0
    if (removableUnits > 0) items.push({ ...item, removableUnits })
    else skipped.push({ sku: item.sku, reason: segments[0]?.label ?? BULK_REMOVAL_NO_UNITS })
  }

  log?.info("bulkRemoval.resolve", {
    requested: skus.length,
    matched: found.size,
    removable: items.length,
    lookup,
    eligibilityFailed: failed,
  })
  return { items, skipped, nextRemovalOrderId: await nextIdRequest, eligibilityUnknown }
}
