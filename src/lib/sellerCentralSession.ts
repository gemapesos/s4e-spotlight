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

export function visible(element: Element | null): element is HTMLElement {
  return element instanceof HTMLElement && element.offsetParent !== null
}

export function shellSelectorHits(root: ParentNode = document): {
  modernHits: string[]
  classicHits: string[]
} {
  return {
    modernHits: MODERN_SHELL_SELECTORS.filter((selector) => visible(root.querySelector(selector))),
    classicHits: CLASSIC_SHELL_SELECTORS.filter((selector) => visible(root.querySelector(selector))),
  }
}

export function hasAuthenticatedSellerUi(root: ParentNode = document): boolean {
  const { modernHits, classicHits } = shellSelectorHits(root)
  if (modernHits.length > 0) return true
  return classicHits.length >= 2
}

export function sellerCentralSessionStatus(
  pathname = location.pathname,
  root: ParentNode = document,
): { loggedInToStore: boolean; settled: boolean } {
  let result: { loggedInToStore: boolean; settled: boolean }
  if (pathname.startsWith("/ap/") || pathname.startsWith("/account-switcher/")) {
    result = { loggedInToStore: false, settled: true }
  } else if (hasAuthenticatedSellerUi(root)) {
    result = { loggedInToStore: true, settled: true }
  } else {
    result = { loggedInToStore: false, settled: false }
  }
  // #region agent log
  {
    const hits = shellSelectorHits(root)
    fetch("http://127.0.0.1:7629/ingest/2f50b123-fd39-4d0e-ab71-986f14d4d34f", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f8f494" },
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
          classicHits: hits.classicHits,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
  }
  // #endregion
  return result
}
