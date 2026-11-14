import { afterEach, describe, expect, it, vi } from "vitest"

import { hasAuthenticatedSellerUi, selectedSellerCentralAccount, sellerCentralSessionStatus } from "../../src/sellerCentral/session"

function makeVisible() {
  vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body)
}

afterEach(() => {
  vi.restoreAllMocks()
  document.body.replaceChildren()
})

describe("sellerCentralSessionStatus", () => {
  it("treats the modern store shell as a signed-in store", () => {
    document.body.innerHTML = '<nav id="sc-top-nav-root"><a href="/home">Home</a></nav>'
    makeVisible()

    expect(hasAuthenticatedSellerUi()).toBe(true)
    expect(sellerCentralSessionStatus("/home")).toEqual({ loggedInToStore: true, settled: true })
  })

  it("treats the classic store shell as a signed-in store", () => {
    document.body.innerHTML = `
      <a class="logo-container" href="/home" aria-label="Amazon">Amazon</a>
      <input id="sc-search-field" placeholder="Search">
      <a href="/messaging/inbox" aria-label="Messages">Messages</a>
    `
    makeVisible()

    expect(sellerCentralSessionStatus("/inventory")).toEqual({ loggedInToStore: true, settled: true })
  })

  it("rejects sign-in pages even if a nav marker is present", () => {
    document.body.innerHTML = '<nav id="sc-top-nav-root"><a href="/home">Home</a></nav>'
    makeVisible()

    expect(sellerCentralSessionStatus("/ap/signin")).toEqual({ loggedInToStore: false, settled: true })
  })

  it("rejects the merchant marketplace picker", () => {
    document.body.innerHTML = "<main>Select an account</main>"

    expect(sellerCentralSessionStatus("/account-switcher/default/merchantMarketplace")).toEqual({
      loggedInToStore: false,
      settled: true,
    })
  })

  it("is unsettled while Seller Central is still loading", () => {
    document.body.innerHTML = "<main>Loading</main>"

    expect(sellerCentralSessionStatus("/home", document, "loading")).toEqual({ loggedInToStore: false, settled: false })
  })

  it("does not treat a single classic-shell marker as authenticated", () => {
    document.body.innerHTML = '<a class="logo-container" href="/home" aria-label="Amazon">Amazon</a>'
    makeVisible()

    expect(hasAuthenticatedSellerUi()).toBe(false)
    expect(sellerCentralSessionStatus("/home", document, "loading")).toEqual({ loggedInToStore: false, settled: false })
  })

  it("settles as logged out once the document is complete without a store shell", () => {
    document.body.innerHTML = "<main>Signed out</main>"

    expect(sellerCentralSessionStatus("/", document, "complete")).toEqual({ loggedInToStore: false, settled: true })
  })

  it("settles as logged out when a login form is visible", () => {
    document.body.innerHTML = '<input id="ap_email" type="email" value="">'
    makeVisible()

    expect(sellerCentralSessionStatus("/home", document, "loading")).toEqual({ loggedInToStore: false, settled: true })
  })

  it("treats the 2026 ngstrim store shell as a signed-in store", () => {
    document.body.innerHTML = '<div id="sc-navbar-container"><div id="ngstrim-nav-menu"></div></div>'
    makeVisible()

    expect(hasAuthenticatedSellerUi()).toBe(true)
    expect(sellerCentralSessionStatus("/myinventory/inventory")).toEqual({ loggedInToStore: true, settled: true })
  })

  it("rejects sign-in pages even with the 2026 navbar container", () => {
    document.body.innerHTML = '<div id="sc-navbar-container"></div>'

    expect(sellerCentralSessionStatus("/ap/signin")).toEqual({ loggedInToStore: false, settled: true })
  })
})

describe("selectedSellerCentralAccount", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("reads the selected merchant and store name from the account switcher's reply", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      globalAccount: { label: "Cherrylane Enterprises", id: "amzn1.pa.d.X", selected: true },
      regionalAccount: { ids: { mons_sel_mkid: "amzn1.mp.o.ATVPDKIKX0DER", mons_sel_dir_mcid: "amzn1.merchant.d.ABC" }, selected: true },
    }))))
    expect(await selectedSellerCentralAccount()).toEqual({ merchantId: "amzn1.merchant.d.ABC", label: "Cherrylane Enterprises" })
  })

  it("throws on an error status and leaves out fields it can't read", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })))
    await expect(selectedSellerCentralAccount()).rejects.toThrow("HTTP 503")
    vi.stubGlobal("fetch", vi.fn(async () => new Response("null")))
    expect(await selectedSellerCentralAccount()).toEqual({ merchantId: undefined, label: undefined })
  })
})
