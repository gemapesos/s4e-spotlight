/** Moves a switch's tab through sign-out and sign-in to the store, following its navigations. */
import { describeError } from "@/shared/log"
import { assertSwitchOperationCurrent, operationGeneration, operationSwitchGeneration, queueVaultOperation, switchGeneration, vaultGeneration } from "@/background/operations"
import { SELLER_CENTRAL_HOME_URL } from "@/background/sellerCentralTabs"
import { setCurrentStoreId } from "@/background/vault"
import { type ActiveJob, closeOwnedSwitchTab, getActiveJob, getJobRecords, jobContext, jobLog, setActiveJob, setJobStage, withTabDebugger } from "./job"
import { moveJobToUserTab } from "./tabs"

const OPENID_SPEC = "http://specs.openid.net/auth/2.0"
export const LOGOUT_URL = "https://sellercentral.amazon.com/sign-out?ref_=xx_logout_dnav_xx"
/** Amazon's sign-in, returning to `returnTo` (a Seller Central URL) once signed in. */
export function signInUrlFor(returnTo = "https://sellercentral.amazon.com/"): string {
  return `https://sellercentral.amazon.com/ap/signin?${new URLSearchParams({
    "openid.return_to": returnTo,
    "openid.identity": `${OPENID_SPEC}/identifier_select`,
    "openid.assoc_handle": "amzn_sw_signup_us",
    "openid.mode": "checkid_setup",
    "openid.claimed_id": `${OPENID_SPEC}/identifier_select`,
    "openid.ns": OPENID_SPEC,
  })}`
}
export const SIGN_IN_URL = signInUrlFor()
const logoutExits = new Map<string, Promise<void>>()

/** The tab listener and the content script both leave logout; share one navigation so neither cancels the other ("Navigation rejected"). */
export function advanceLogoutToSignIn(job: ActiveJob): Promise<void> {
  let exit = logoutExits.get(job.id)
  if (!exit) {
    exit = (async () => {
      const { store } = await getJobRecords(job)
      await setJobStage(job, "signin")
      // Returning straight to the store skips loading Seller Central's home page after sign-in.
      await chrome.tabs.update(job.tabId, { url: signInUrlFor(store.storeUrl) })
    })()
    exit.catch(() => logoutExits.delete(job.id))
    logoutExits.set(job.id, exit)
  }
  return exit
}

/** Browser identity and solved-CAPTCHA cookies; keeping them avoids new-device checks and repeat CAPTCHAs. */
const SIGN_OUT_KEPT_COOKIES = new Set(["ubid-main", "session-id", "session-id-time", "i18n-prefs", "lc-main", "sp-cdn", "x-amz-captcha-1", "x-amz-captcha-2"])
/**
 * The cookies that keep Amazon signed in (seen live on 2026-10-25); all on .amazon.com except __Host-mselc.
 * Sign-in also restored the session from cookies Seller Central never sends, such as sso-cd-state on
 * .account.amazon.com, so sign-out deletes every cookie on the sign-in hosts, not just these.
 */
const SESSION_COOKIES = ["at-main", "sess-at-main", "sst-main", "x-main", "session-token", "sso-state-main", "__Host-mselc"]
/**
 * Sites besides amazon.com itself whose cookies can restore a sign-in: Seller Central, and Amazon's
 * single sign-on (its sso-cd-state did, live). Other Amazon sites keep their cookies, so a switch does
 * not sign the user out of them.
 */
const SIGN_IN_COOKIE_SITES = ["sellercentral.amazon.com", "account.amazon.com"]
/** Every cookie the sign-in flow sends lives under one of these; /ap/ adds signin-sso-state-us. */
const SELLER_CENTRAL_COOKIE_URLS = [SELLER_CENTRAL_HOME_URL, "https://sellercentral.amazon.com/ap/signin"]

/**
 * Signs out without loading Amazon's sign-out pages: drop the session's cookies and open sign-in.
 * A background sign-out request would also end it on Amazon's side, but live it took over 1.5 s and
 * its redirects can land on sign-in and race the helper's own sign-in cookies. Falls back to the sign-out page if any of that is unavailable.
 */
export async function signOutWithoutPages(jobId: string): Promise<void> {
  const job = await getActiveJob()
  if (!job || job.id !== jobId || job.stage !== "logout") return
  try {
    if (await clearSessionWithoutPages(job)) await advanceLogoutToSignIn(job)
    else await chrome.tabs.update(job.tabId, { url: LOGOUT_URL })
  } catch (error) {
    // The switch never got going: end it rather than leave its helper window behind.
    if (operationGeneration === vaultGeneration && operationSwitchGeneration === switchGeneration) {
      await setActiveJob(undefined)
      await closeOwnedSwitchTab(job)
    }
    throw error
  }
}

/**
 * Clears the session through the debugger: chrome.cookies only lists hosts the extension may access,
 * which hides every .amazon.com session cookie. Returns false, leaving it to the sign-out page, when
 * that fails or any session cookie survives.
 */
async function clearSessionWithoutPages(job: ActiveJob): Promise<boolean> {
  const startedAt = Date.now()
  try {
    const { deleted, left, untouched } = await withTabDebugger(job.tabId, async (target) => {
      const before = await amazonCookies(target)
      const deleted = before.filter(isSignOutCookie)
      await Promise.all(deleted.map(({ name, domain, path }) => chrome.debugger.sendCommand(target, "Network.deleteCookies", { name, domain, path })))
      const left = (await amazonCookies(target)).filter(isSignOutCookie)
      return { deleted, left, untouched: before.filter((cookie) => !onSignInHost(cookie)) }
    })
    assertSwitchOperationCurrent()
    jobLog(job).info("account.switch.signedOut", {
      ...jobContext(job),
      deleted: deleted.length,
      // Other Amazon sites, by host only: their cookies stay, so the user stays signed in there.
      untouchedHosts: [...new Set(untouched.map(cookieHost))].sort(),
      // Session cookies that ignored deletion; any means the sign-out page must finish the job.
      left: describeJar(left),
      sessionLeft: SESSION_COOKIES.filter((name) => left.some((cookie) => cookie.name === name)),
      ms: Date.now() - startedAt,
    })
    if (left.length > 0) return false
    job.cookieSignOut = true
    signInTrail = { tabId: job.tabId, hops: [] }
    return true
  } catch (error) {
    assertSwitchOperationCurrent()
    jobLog(job).warn("account.switch.cookieSignOutUnavailable", { ...jobContext(job), error: describeError(error) })
    return false
  }
}

type JarEntry = { name: string; domain: string; path: string; expires?: number; httpOnly?: boolean; secure?: boolean; session?: boolean; sameSite?: string }

/**
 * Every Amazon cookie in the tab's profile, on any host or path, so diagnostics also show the sites
 * sign-out leaves alone. Falls back to what Seller Central sends.
 */
async function amazonCookies(target: chrome.debugger.Debuggee): Promise<JarEntry[]> {
  let all: JarEntry[]
  try {
    all = ((await chrome.debugger.sendCommand(target, "Network.getAllCookies")) as { cookies?: JarEntry[] } | undefined)?.cookies ?? []
  } catch {
    all = ((await chrome.debugger.sendCommand(target, "Network.getCookies", { urls: SELLER_CENTRAL_COOKIE_URLS })) as { cookies?: JarEntry[] } | undefined)?.cookies ?? []
  }
  return all.filter((cookie) => /(?:^|\.)amazon\.com$/u.test(cookieHost(cookie)))
}

/** The site a cookie belongs to, without a domain cookie's leading dot. */
function cookieHost(cookie: JarEntry): string {
  return cookie.domain.replace(/^\./u, "")
}

/** On amazon.com itself or a sign-in site, where a cookie can restore the old session. */
function onSignInHost(cookie: JarEntry): boolean {
  const host = cookieHost(cookie)
  return host === "amazon.com" || SIGN_IN_COOKIE_SITES.some((site) => host === site || host.endsWith(`.${site}`))
}

/** Sign-out deletes every cookie on the sign-in hosts except browser identity and solved CAPTCHAs. */
function isSignOutCookie(cookie: JarEntry): boolean {
  return onSignInHost(cookie) && !SIGN_OUT_KEPT_COOKIES.has(cookie.name)
}

/**
 * Diagnostics: cookies by name and scope only, never values: name|domain+path|h(ttpOnly)s(ecure)x(session)|sameSite,
 * plus the expiry of session cookies, which shows whether one was set again after sign-out.
 */
function describeJar(entries: JarEntry[]): string[] {
  return entries.map((entry) => `${entry.name}|${entry.domain}${entry.path}|${entry.httpOnly ? "h" : ""}${entry.secure ? "s" : ""}${entry.session ? "x" : ""}|${entry.sameSite ?? ""}`
    + (SESSION_COOKIES.includes(entry.name) && entry.expires && entry.expires > 0 ? `|exp=${Math.round(entry.expires)}` : "")).sort()
}

/** Log entries are size-capped, so long lists go out in parts. */
function logJar(job: ActiveJob, phase: string, jar: string[]): void {
  for (let start = 0; start < Math.max(jar.length, 1); start += 25) {
    jobLog(job).info("account.switch.signOutJar", { phase, part: start / 25 + 1, count: jar.length, entries: jar.slice(start, start + 25) })
  }
}

/** Diagnostics: where the sign-in tab went after a cookie sign-out (host and path only), until sign-in is decided. */
let signInTrail: { tabId: number; hops: string[] } | undefined

export function recordSignInHop(tabId: number, value: string | undefined): void {
  if (!value || signInTrail?.tabId !== tabId || signInTrail.hops.length >= 20) return
  try {
    const url = new URL(value)
    signInTrail.hops.push(`${url.host}${url.pathname}`)
  } catch { /* not a URL */ }
}

/** Sign-in went straight back to Seller Central, so Amazon still knows the old session: sign out properly. */
async function fallBackToSignOutPage(job: ActiveJob, landedUrl: string): Promise<void> {
  const hops = signInTrail?.tabId === job.tabId ? signInTrail.hops : []
  signInTrail = undefined
  jobLog(job).warn("account.switch.cookieSignOutFallback", { ...jobContext(job), landed: new URL(landedUrl).pathname, hops })
  try {
    logJar(job, "fallback", describeJar(await withTabDebugger(job.tabId, amazonCookies)))
  } catch (error) {
    jobLog(job).warn("account.switch.signOutJarFailed", { error: describeError(error) })
  }
  job.cookieSignOut = false
  job.signOutFallbackFrom = landedUrl
  logoutExits.delete(job.id)
  await setJobStage(job, "logout")
  await chrome.tabs.update(job.tabId, { url: LOGOUT_URL })
}

/**
 * Sign-in is done once Amazon redirects back to Seller Central. Load the store once, where it
 * belongs: in the user's own tab when one is open (closing the helper), else in the helper,
 * which may already be on it.
 */
export async function openStoreAfterSignIn(job: ActiveJob, landedUrl?: string, documentId?: string): Promise<void> {
  if ((job.resumeStage ?? job.stage) === "store") return
  signInTrail = undefined
  const { store } = await getJobRecords(job)
  const helperTabId = job.tabId
  const handedOff = await moveJobToUserTab(job)
  const onStore = !handedOff && isStorePage(landedUrl, store.storeUrl)
  // The document that was showing cannot also confirm a store navigation in the same tab.
  if (!onStore) job.storeNavigationDocumentId = documentId
  delete job.cookieSignOut
  await setJobStage(job, "store")
  if (!onStore) await chrome.tabs.update(job.tabId, { url: store.storeUrl })
  // Closing its only tab closes the helper window; the user's tab now carries the switch.
  if (handedOff) try { await chrome.tabs.remove(helperTabId) } catch { /* already closed */ }
  jobLog(job).info("account.switch.signedIn", { ...jobContext(job), tab: handedOff ? "user" : onStore ? "landed" : "helper" })
}

/** Amazon may append its own parameters; the store is open when its path and saved parameters match. */
function isStorePage(value: string | undefined, storeUrl: string): boolean {
  if (!value) return false
  try {
    const landed = new URL(value)
    const store = new URL(storeUrl)
    return landed.origin === store.origin && landed.pathname === store.pathname
      && [...store.searchParams].every(([key, expected]) => landed.searchParams.get(key) === expected)
  } catch {
    return false
  }
}

const CREDENTIAL_STAGES = new Set<ActiveJob["stage"]>(["email", "password", "otp"])

async function handleAccountTabUpdatedNow(
  tabId: number,
  changeInfo: { status?: string; url?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  const job = await getActiveJob()
  // A sign-out or sign-in the extension did not run may change the store, and the URL cannot tell which.
  if (!job) {
    if (isLogoutExitEvent(changeInfo, tab)) await setCurrentStoreId(undefined)
    return
  }
  if (job.tabId !== tabId) return
  if (job.stage === "logout") {
    // Always leave Amazon's logout intercept (return_to=sign-out) for the canonical sign-in URL.
    if (isLogoutExitEvent(changeInfo, tab)) await advanceLogoutToSignIn(job)
    return
  }
  const landed = landedSellerCentralPage(changeInfo, tab)
  if (!landed) return
  if (job.stage === "signin" && job.cookieSignOut) await fallBackToSignOutPage(job, landed)
  // Its URL commits before the page loads: hand off now instead of waiting for it to render.
  else if (CREDENTIAL_STAGES.has(job.stage)) await openStoreAfterSignIn(job, landed)
}

/** A committed Seller Central page outside sign-in and sign-out. */
function landedSellerCentralPage(changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab): string | undefined {
  const value = changeInfo.url ?? (changeInfo.status === "complete" ? tab.url : undefined)
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (url.origin !== "https://sellercentral.amazon.com" || url.pathname.startsWith("/ap/") || url.pathname.startsWith("/sign-out")) return undefined
    return value
  } catch {
    return undefined
  }
}

/**
 * Sign-out has finished once its redirect commits an /ap/ page: leave right then instead of loading
 * Amazon's logout re-auth page. A /sign-out document itself is left once it has loaded.
 */
function isLogoutExitEvent(changeInfo: { status?: string; url?: string }, tab: chrome.tabs.Tab): boolean {
  if (changeInfo.status !== "complete" && changeInfo.status !== "loading" && !changeInfo.url) return false
  const currentUrl = changeInfo.url ?? tab.url
  if (!currentUrl || currentUrl === "about:blank") return false
  let url: URL
  try { url = new URL(currentUrl) } catch { return false }
  if (url.hostname !== "sellercentral.amazon.com") return false
  if (url.pathname.startsWith("/ap/")) return true
  return url.pathname.startsWith("/sign-out") && changeInfo.status === "complete"
}

export async function handleAccountTabUpdated(
  tabId: number,
  changeInfo: { status?: string; url?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  if (!isLogoutExitEvent(changeInfo, tab) && !landedSellerCentralPage(changeInfo, tab)) return
  const generation = vaultGeneration
  const switchVersion = switchGeneration
  try {
    await queueVaultOperation(() => handleAccountTabUpdatedNow(tabId, changeInfo, tab))
  } catch (error) {
    if (generation === vaultGeneration && switchVersion === switchGeneration) throw error
  }
}
