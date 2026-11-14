const MODERN_SHELL_SELECTORS = [
  "#sc-navtab-home",
  "#sc-top-nav-root",
  '[data-testid="global-nav"]',
  "#sc-navbar-container",
  "#ngstrim-nav-menu",
] as const

const CLASSIC_SHELL_SELECTORS = [
  "#sc-search-field",
  'a.logo-container[href="/home"]',
  'a[aria-label="Messages"][href^="/messaging/"]',
] as const

const LOGIN_FORM_SELECTORS = [
  "#ap_email",
  'input[name="email"]',
  'input[type="email"]',
  'input[autocomplete="username"]',
  "#ap_password",
  'input[name="password"]',
  'input[type="password"]',
  "#auth-mfa-otpcode",
  'input[name="otpCode"]',
  'input[autocomplete="one-time-code"]',
  'input[inputmode="numeric"]',
] as const

export function visible(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.offsetParent !== null
}

export function hasAuthenticatedSellerUi(root: ParentNode = document): boolean {
  const isVisible = (selector: string) => visible(root.querySelector(selector))
  if (MODERN_SHELL_SELECTORS.some(isVisible)) return true
  return CLASSIC_SHELL_SELECTORS.filter(isVisible).length >= 2
}

export function hasSellerCentralLoginForm(root: ParentNode = document): boolean {
  return LOGIN_FORM_SELECTORS.some((selector) => visible(root.querySelector(selector)))
}

export function sellerCentralSessionStatus(
  pathname = location.pathname,
  root: ParentNode = document,
  readyState: DocumentReadyState = typeof document !== "undefined" ? document.readyState : "loading",
): { loggedInToStore: boolean; settled: boolean } {
  if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
    return { loggedInToStore: false, settled: true }
  }
  if (hasAuthenticatedSellerUi(root)) return { loggedInToStore: true, settled: true }
  if (hasSellerCentralLoginForm(root)) return { loggedInToStore: false, settled: true }
  // A fully loaded page with no store shell and no login form is signed out; don't wait out the probe.
  return { loggedInToStore: false, settled: readyState === "complete" }
}

/** What an open Seller Central tab shows; "unknown" when no tab can answer quickly. */
export type SellerCentralSessionState = "signed-in" | "signed-out" | "unknown"

/** The account Seller Central has selected, read from the request its own account switcher makes. */
export async function selectedSellerCentralAccount(): Promise<{ merchantId?: string; label?: string }> {
  const response = await fetch("/account-switcher/global-and-regional-account/merchantMarketplace", { credentials: "include" })
  if (!response.ok) throw new Error(`Account lookup failed with HTTP ${response.status}.`)
  const body = await response.json() as { globalAccount?: { label?: unknown }; regionalAccount?: { ids?: { mons_sel_dir_mcid?: unknown } } } | null
  const merchantId = body?.regionalAccount?.ids?.mons_sel_dir_mcid
  const label = body?.globalAccount?.label
  return { merchantId: typeof merchantId === "string" ? merchantId : undefined, label: typeof label === "string" ? label : undefined }
}
