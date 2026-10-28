/** Bulk removal: checks SKUs on Seller Central and opens Create removal order prefilled. */
import { createLogger, describeError } from "@/lib/log"
import { type BackgroundReply, type BulkRemovalSummary, MAX_BULK_IDS } from "@/shared/messages"
import { createChromeTab, type CreateTab, normalizeSkuIds } from "./openTabs"
import { asArray, CASE_SCRAPE_SIGN_IN_ERROR } from "./reports"
import { ensureSellerCentralTab, probeSellerCentralSession, sendWhenContentScriptReady, waitForTabComplete } from "./sellerCentralTabs"
import { getActiveJob } from "./switch/job"

const log = createLogger("background")

/** Amazon's Unfulfillable page uses this redirect to open Create removal order with SKUs prefilled. */
export const BULK_REMOVAL_URL = "https://sellercentral.amazon.com/recovery/requests/redirect/removal-order"
export function buildBulkRemovalUrl(items: ReadonlyArray<{ sku: string; asin: string; fnSku: string }>): string {
  const params = new URLSearchParams()
  items.forEach((item, index) => {
    params.append(`mSku.${index}`, item.sku)
    params.append(`fnSku.${index}`, item.fnSku)
    params.append(`asin.${index}`, item.asin)
  })
  params.append("ref_", "myij_unf_cro_bulk_bktsz_1")
  return `${BULK_REMOVAL_URL}?${params}`
}
function asRemovalItems(value: unknown): Array<{ sku: string; asin: string; fnSku: string }> {
  return asArray(value).filter((item): item is { sku: string; asin: string; fnSku: string } => {
    if (!item || typeof item !== "object") return false
    const { sku, asin, fnSku } = item as Record<string, unknown>
    return typeof sku === "string" && sku.length > 0 && typeof asin === "string" && asin.length > 0
      && typeof fnSku === "string" && fnSku.length > 0
  })
}

function asSkipped(value: unknown): BulkRemovalSummary["skipped"] {
  return asArray(value).flatMap((entry) => {
    if (!entry || typeof entry !== "object") return []
    const { sku, reason } = entry as Record<string, unknown>
    return typeof sku === "string" && typeof reason === "string" ? [{ sku, reason }] : []
  })
}

/**
 * Session-storage key for the Create removal order tab each palette tab opened last, so its
 * summary can go to it. Kept in storage because Chrome stops the idle worker after ~30 s.
 */
const BULK_REMOVAL_TAB_PREFIX = "bulkRemovalTab:"

export async function focusBulkRemovalTab(senderTab?: chrome.tabs.Tab): Promise<{ ok: true }> {
  const key = `${BULK_REMOVAL_TAB_PREFIX}${senderTab?.id}`
  const tabId = senderTab?.id === undefined ? undefined : (await chrome.storage.session.get(key))[key] as number | undefined
  if (tabId === undefined) throw new Error("The removal tab is no longer open.")
  try {
    const tab = await chrome.tabs.update(tabId, { active: true })
    if (tab?.windowId !== undefined) await chrome.windows.update(tab.windowId, { focused: true })
  } catch {
    await chrome.storage.session.remove(key)
    throw new Error("The removal tab is no longer open.")
  }
  return { ok: true }
}

/**
 * Checks the SKUs on a signed-in Seller Central tab and opens Create removal order in the
 * background with the removable ones prefilled. The palette gets back only counts, the skipped
 * SKUs and the next ID.
 */
export async function createBulkRemoval(
  skus: unknown,
  senderTab?: chrome.tabs.Tab,
  createTab: CreateTab = createChromeTab,
): Promise<BackgroundReply<"CREATE_BULK_REMOVAL">> {
  const ids = normalizeSkuIds(skus)
  if (ids.length === 0) throw new Error("Enter at least one SKU.")
  if (ids.length > MAX_BULK_IDS) throw new Error(`Remove no more than ${MAX_BULK_IDS} SKUs at a time.`)
  if (await getActiveJob()) throw new Error("Wait for the store switch to finish, then try again.")
  const done = log.time("removal.bulk", { requested: ids.length })
  try {
    const { tabId } = await ensureSellerCentralTab(senderTab, { focus: false })
    await waitForTabComplete(tabId)
    if (!await probeSellerCentralSession(tabId)) throw new Error(CASE_SCRAPE_SIGN_IN_ERROR)
    const response = await sendWhenContentScriptReady(tabId, { type: "BULK_REMOVAL_RESOLVE", skus: ids }, "Couldn’t check removal eligibility.", () => undefined)
    const items = asRemovalItems(response.items)
    const skipped = asSkipped(response.skipped)
    const nextRemovalOrderId = typeof response.nextRemovalOrderId === "string" && response.nextRemovalOrderId ? response.nextRemovalOrderId : null
    const eligibilityUnknown = response.eligibilityUnknown === true
    if (items.length > 0) {
      const tab = await createTab({
        url: buildBulkRemovalUrl(items),
        active: false,
        ...(senderTab?.windowId === undefined ? {} : { windowId: senderTab.windowId }),
        ...(senderTab?.index === undefined ? {} : { index: senderTab.index + 1 }),
      })
      if (senderTab?.id !== undefined && tab.id !== undefined) await chrome.storage.session.set({ [`${BULK_REMOVAL_TAB_PREFIX}${senderTab.id}`]: tab.id })
    }
    done({ opened: items.length, skipped: skipped.length, eligibilityUnknown })
    return { ok: true, openedCount: items.length, skipped, nextRemovalOrderId, eligibilityUnknown }
  } catch (error) {
    done({ error: describeError(error) }, "error")
    throw error
  }
}
