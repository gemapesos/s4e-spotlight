export function visible(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.offsetParent !== null
}

export function hasAuthenticatedSellerUi(root: ParentNode = document): boolean {
  const modernShell = [
    "#sc-navtab-home",
    "#sc-top-nav-root",
    '[data-testid="global-nav"]',
  ].some((selector) => visible(root.querySelector(selector)))
  if (modernShell) return true

  const classicShellMarkers = [
    "#sc-search-field",
    'a.logo-container[href="/home"]',
    'a[aria-label="Messages"][href^="/messaging/"]',
  ].filter((selector) => visible(root.querySelector(selector)))

  return classicShellMarkers.length >= 2
}

export function sellerCentralSessionStatus(
  pathname = location.pathname,
  root: ParentNode = document,
): { loggedInToStore: boolean; settled: boolean } {
  if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
    return { loggedInToStore: false, settled: true }
  }
  if (hasAuthenticatedSellerUi(root)) {
    return { loggedInToStore: true, settled: true }
  }
  return { loggedInToStore: false, settled: false }
}
