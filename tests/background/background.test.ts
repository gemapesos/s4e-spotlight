import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { appendLogEntries, clearLogEntries, readLogEntries } from "../../src/background/logs"
import { buildCaseUrl, buildRemovalOrderUrl, buildShipmentUrl, buildSkuUrl, buildTimeOutFormUrl, normalizeCaseIds, normalizeRemovalOrderIds, normalizeShipmentIds, normalizeSkuIds, openCaseTabs, openRemovalOrderTabs, openShipmentTabs, openSkuTabs, openTimeOutTabs, TIME_OUT_SHEET_URL } from "../../src/background/openTabs"
import { listenForMessages, routeMessage } from "../../src/background/router"
import { createLogStore, type LogEntry } from "../../src/shared/log"
import { DEFAULT_TIME_OUT_FORM_VALUES } from "../../src/shared/settings"

const senderTab = {
  id: 42,
  windowId: 7,
} as chrome.tabs.Tab

describe("background Case ID handling", () => {
  it("validates and deduplicates Case IDs", () => {
    expect(
      normalizeCaseIds([
        "21476974831",
        "invalid",
        "21476874681",
        "21476974831",
        21476874681,
      ]),
    ).toEqual(["21476974831", "21476874681"])
  })

  it("builds the canonical Seller Central case URL", () => {
    expect(buildCaseUrl("21598756071")).toBe(
      "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID=21598756071",
    )
  })

  it("opens every unique case in an inactive tab in the originating window", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 101 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 102 } as chrome.tabs.Tab)

    await openCaseTabs(
      ["21476974831", "21476874681", "21476974831"],
      senderTab,
      createTab,
    )

    expect(createTab).toHaveBeenNthCalledWith(1, {
      active: false,
      openerTabId: 42,
      url: buildCaseUrl("21476974831"),
      windowId: 7,
    })
    expect(createTab).toHaveBeenNthCalledWith(2, {
      active: false,
      openerTabId: 42,
      url: buildCaseUrl("21476874681"),
      windowId: 7,
    })
  })

  it("opens a single case in an active tab", async () => {
    const createTab = vi.fn().mockResolvedValueOnce({ id: 101 } as chrome.tabs.Tab)

    await openCaseTabs(["21476974831"], senderTab, createTab)

    expect(createTab).toHaveBeenCalledWith({
      active: true,
      openerTabId: 42,
      url: buildCaseUrl("21476974831"),
      windowId: 7,
    })
  })

  it("rolls back a partially created batch", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 101 } as chrome.tabs.Tab)
      .mockRejectedValueOnce(new Error("tab creation failed"))
    const removeTabs = vi.fn().mockResolvedValue(undefined)

    await expect(openCaseTabs(["21476974831", "21476874681"], senderTab, createTab, removeTabs)).rejects.toMatchObject({
      openedIds: [],
      rolledBackIds: ["21476974831"],
    })
    expect(removeTabs).toHaveBeenCalledWith([101])
  })

  it("reports IDs whose rollback failed", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 101 } as chrome.tabs.Tab)
      .mockRejectedValueOnce(new Error("tab creation failed"))
    const removeTabs = vi.fn().mockRejectedValue(new Error("close failed"))

    await expect(openCaseTabs(["21476974831", "21476874681"], senderTab, createTab, removeTabs)).rejects.toMatchObject({
      openedIds: ["21476974831"],
      rolledBackIds: [],
    })
  })

  it("enforces the fifty-ID limit in the background", async () => {
    const ids = Array.from({ length: 51 }, (_, index) => String(50_000_000_000 + index))
    await expect(openCaseTabs(ids, senderTab, vi.fn())).rejects.toThrow(/no more than 50/i)
  })
})

describe("background Removal Order ID handling", () => {
  it("normalizes, validates, and deduplicates Removal Order IDs", () => {
    expect(normalizeRemovalOrderIds(["s4ekm0127", "S4EKM0126", "S4EKM0127", "86RmssEGx+", 123])).toEqual([
      "S4EKM0127",
      "S4EKM0126",
    ])
  })

  it("builds the Seller Central removal order detail URL", () => {
    expect(buildRemovalOrderUrl("S4EKM0127")).toBe(
      "https://sellercentral.amazon.com/recoveryui/removal-order/detail?sourceRemovalOrderId=S4EKM0127",
    )
  })

  it("opens a single removal order in an active originating-window tab", async () => {
    const createTab = vi.fn().mockResolvedValueOnce({ id: 301 } as chrome.tabs.Tab)

    await openRemovalOrderTabs(["S4EKM0127"], senderTab, createTab)

    expect(createTab).toHaveBeenCalledWith({
      active: true,
      openerTabId: 42,
      url: buildRemovalOrderUrl("S4EKM0127"),
      windowId: 7,
    })
  })

})

describe("background Shipment ID handling", () => {
  it("normalizes, validates, and deduplicates Shipment IDs", () => {
    expect(
      normalizeShipmentIds([
        "fba19749wj6q",
        "invalid",
        "FBA18G77LW09",
        "FBA19749WJ6Q",
        123,
      ]),
    ).toEqual(["FBA19749WJ6Q", "FBA18G77LW09"])
  })

  it("builds the canonical Seller Central shipment URL", () => {
    expect(buildShipmentUrl("FBA19749WJ6Q")).toBe(
      "https://sellercentral.amazon.com/fba/inbound-shipment/summary/FBA19749WJ6Q/contents",
    )
  })

  it("opens every unique shipment in an inactive originating-window tab", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 201 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 202 } as chrome.tabs.Tab)

    await openShipmentTabs(
      ["FBA19749WJ6Q", "FBA18G77LW09", "FBA19749WJ6Q"],
      senderTab,
      createTab,
    )

    expect(createTab).toHaveBeenNthCalledWith(1, {
      active: false,
      openerTabId: 42,
      url: buildShipmentUrl("FBA19749WJ6Q"),
      windowId: 7,
    })
    expect(createTab).toHaveBeenNthCalledWith(2, {
      active: false,
      openerTabId: 42,
      url: buildShipmentUrl("FBA18G77LW09"),
      windowId: 7,
    })
  })

})

describe("background SKU handling", () => {
  it("trims, validates length, and deduplicates SKUs case-sensitively", () => {
    expect(
      normalizeSkuIds([
        "  ABC-123  ",
        "invalid-because-this-sku-is-over-forty-characters",
        "abc-123",
        "ABC-123",
        "",
        123,
      ]),
    ).toEqual(["ABC-123", "abc-123"])
  })

  it("builds the canonical Seller Central inventory search URL", () => {
    expect(buildSkuUrl("ABC 123&x")).toBe(
      "https://sellercentral.amazon.com/myinventory/inventory?fulfilledBy=all&page=1&pageSize=250&searchField=all&searchTerm=ABC%20123%26x&sort=available_desc&status=all&ref_=xx_invmgr_favb_xx",
    )
  })

  it("opens every unique SKU in an inactive originating-window tab", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 301 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 302 } as chrome.tabs.Tab)

    await openSkuTabs(["ABC-123", "DEF_456", "ABC-123"], senderTab, createTab)

    expect(createTab).toHaveBeenNthCalledWith(1, {
      active: false,
      openerTabId: 42,
      url: buildSkuUrl("ABC-123"),
      windowId: 7,
    })
    expect(createTab).toHaveBeenNthCalledWith(2, {
      active: false,
      openerTabId: 42,
      url: buildSkuUrl("DEF_456"),
      windowId: 7,
    })
  })

  it("enforces the fifty-ID limit in the background", async () => {
    const ids = Array.from({ length: 51 }, (_, index) => `SKU-${index}`)
    await expect(openSkuTabs(ids, senderTab, vi.fn())).rejects.toThrow(/no more than 50/i)
  })
})

describe("background Time Out handling", () => {
  it("builds a prefilled form URL using the supplied local calendar date", () => {
    const url = new URL(buildTimeOutFormUrl(new Date(2026, 0, 2)))

    expect(url.searchParams.get("entry.1251728025")).toBe("2026-01-02")
    expect(url.searchParams.get("entry.1152525498")).toBe("Dhylan Mapesos")
    expect(url.searchParams.get("entry.625851554")).toBe("S4E")
    expect(url.searchParams.get("entry.30165443")).toBe("Lou")
    expect(url.searchParams.get("entry.412660572")).toBe("4")
    expect(url.searchParams.get("entry.894305442")).toBe("Yes")
    expect(url.searchParams.get("entry.453721608")).toBe("No")
    expect(url.searchParams.get("entry.570672286")).toBe("No")
    expect(url.searchParams.get("entry.1418374063")).toBe("No")
    expect(url.searchParams.get("entry.1631702449")).toBe("No")
    expect(url.searchParams.get("entry.433948939")).toBe("No")
    expect(url.searchParams.has("entry.789311136")).toBe(false)
    expect(url.searchParams.has("entry.1775030400")).toBe(false)
    expect(url.searchParams.has("entry.2008215653")).toBe(false)
    expect(url.searchParams.has("entry.1391961076")).toBe(false)
  })

  it("uses stored Time Out prefills when opening tabs", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 401 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 402 } as chrome.tabs.Tab)
    const date = new Date(2026, 7, 4)
    const values = {
      ...DEFAULT_TIME_OUT_FORM_VALUES,
      staffName: "Lou Rodriguez",
      business: "S4E",
      supervisor: "Karen Locker",
      hoursWorked: "8",
      scheduledAccountsCompleted: "Partial",
      blockersOrRedFlags: "Yes",
      shortDailyUpdate: "Wrapped the queue",
      clientAccountName: "JMG Outdoors",
      issueType: "Access issue",
      waitingOnWhom: "Amazon",
      followUpNeeded: "Yes",
      escalatedToSupervisor: "Yes",
      supervisorReviewNeeded: "Yes",
      karenReviewNeeded: "Yes",
    }

    await expect(openTimeOutTabs(senderTab, createTab, undefined, date, async () => values)).resolves.toEqual({ openedCount: 2 })

    expect(createTab).toHaveBeenNthCalledWith(2, {
      active: true,
      openerTabId: 42,
      url: buildTimeOutFormUrl(date, values),
      windowId: 7,
    })
    const url = new URL(buildTimeOutFormUrl(date, values))
    expect(url.searchParams.get("entry.1152525498")).toBe("Lou Rodriguez")
    expect(url.searchParams.get("entry.30165443")).toBe("Karen Locker")
    expect(url.searchParams.get("entry.412660572")).toBe("8")
    expect(url.searchParams.get("entry.894305442")).toBe("Partial")
    expect(url.searchParams.get("entry.453721608")).toBe("Yes")
    expect(url.searchParams.get("entry.789311136")).toBe("Wrapped the queue")
    expect(url.searchParams.get("entry.1775030400")).toBe("JMG Outdoors")
    expect(url.searchParams.get("entry.2008215653")).toBe("Access issue")
    expect(url.searchParams.get("entry.1391961076")).toBe("Amazon")
    expect(url.searchParams.get("entry.570672286")).toBe("Yes")
    expect(url.searchParams.get("entry.1418374063")).toBe("Yes")
    expect(url.searchParams.get("entry.1631702449")).toBe("Yes")
    expect(url.searchParams.get("entry.433948939")).toBe("Yes")
  })

  it("opens the sheet in the background and then focuses the prefilled form", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 401 } as chrome.tabs.Tab)
      .mockResolvedValueOnce({ id: 402 } as chrome.tabs.Tab)
    const date = new Date(2026, 7, 4)

    await expect(openTimeOutTabs(senderTab, createTab, undefined, date)).resolves.toEqual({ openedCount: 2 })

    expect(createTab).toHaveBeenNthCalledWith(1, {
      active: false,
      openerTabId: 42,
      url: TIME_OUT_SHEET_URL,
      windowId: 7,
    })
    expect(createTab).toHaveBeenNthCalledWith(2, {
      active: true,
      openerTabId: 42,
      url: buildTimeOutFormUrl(date),
      windowId: 7,
    })
  })

  it("rolls back the sheet if the form cannot be opened", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 401 } as chrome.tabs.Tab)
      .mockRejectedValueOnce(new Error("form tab failed"))
    const removeTabs = vi.fn().mockResolvedValue(undefined)

    await expect(openTimeOutTabs(senderTab, createTab, removeTabs)).rejects.toMatchObject({
      openedIds: [],
      rolledBackIds: ["Google Sheet"],
    })
    expect(removeTabs).toHaveBeenCalledWith([401])
  })

  it("reports a sheet that could not be closed during rollback", async () => {
    const createTab = vi.fn()
      .mockResolvedValueOnce({ id: 401 } as chrome.tabs.Tab)
      .mockRejectedValueOnce(new Error("form tab failed"))
    const removeTabs = vi.fn().mockRejectedValue(new Error("close failed"))

    await expect(openTimeOutTabs(senderTab, createTab, removeTabs)).rejects.toMatchObject({
      openedIds: ["Google Sheet"],
      rolledBackIds: [],
    })
  })

})

describe("routing ID and Time Out messages", () => {
  const sender = { id: "extension-id", tab: senderTab } as chrome.runtime.MessageSender
  const create = vi.fn(async (properties: chrome.tabs.CreateProperties) => ({ id: 100, ...properties }) as chrome.tabs.Tab)
  const remove = vi.fn(async () => undefined)
  beforeEach(() => {
    create.mockClear(); remove.mockClear()
    vi.stubGlobal("chrome", {
      runtime: { id: "extension-id", getURL: (path: string) => `chrome-extension://extension-id/${path}` },
      storage: { local: { get: vi.fn(async () => ({})) } },
      tabs: { create, remove },
    })
  })
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    { message: { type: "OPEN_CASE_IDS", caseIds: ["21476974831"] }, url: buildCaseUrl("21476974831") },
    { message: { type: "OPEN_SHIPMENT_IDS", shipmentIds: ["FBA19749WJ6Q"] }, url: buildShipmentUrl("FBA19749WJ6Q") },
    { message: { type: "OPEN_SKU_IDS", skuIds: ["ABC-123"] }, url: buildSkuUrl("ABC-123") },
    { message: { type: "OPEN_REMOVAL_ORDER_IDS", removalOrderIds: ["S4EKM0127"] }, url: buildRemovalOrderUrl("S4EKM0127") },
  ])("opens $message.type in the sender's window and answers with the count", async ({ message, url }) => {
    const sendResponse = vi.fn()

    expect(listenForMessages(Promise.resolve())(message, sender, sendResponse)).toBe(true)

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true, openedCount: 1 }))
    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith({ active: true, openerTabId: 42, url, windowId: 7 })
  })

  it("opens the Time Out sheet and form", async () => {
    const sendResponse = vi.fn()

    listenForMessages(Promise.resolve())({ type: "OPEN_TIME_OUT" }, sender, sendResponse)

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith({ ok: true, openedCount: 2 }))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ active: false, url: TIME_OUT_SHEET_URL }))
  })

  it("answers a failed batch with what was closed, and leaves other messages unanswered", async () => {
    create.mockResolvedValueOnce({ id: 101 } as chrome.tabs.Tab).mockRejectedValueOnce(new Error("tab creation failed"))
    const listener = listenForMessages(Promise.resolve())
    const failed = vi.fn()
    const empty = vi.fn()
    const other = vi.fn()

    listener({ type: "OPEN_CASE_IDS", caseIds: ["21476974831", "21476874681"] }, sender, failed)
    listener({ type: "OPEN_CASE_IDS", caseIds: [] }, sender, empty)

    await vi.waitFor(() => expect(failed).toHaveBeenCalledWith({
      ok: false,
      error: "tab creation failed Any tabs opened by this attempt were closed.",
      openedIds: [],
      rolledBackIds: ["21476974831"],
    }))
    expect(remove).toHaveBeenCalledWith([101])
    await vi.waitFor(() => expect(empty).toHaveBeenCalledWith({ ok: false, error: "No valid Case IDs were provided." }))
    expect(listener({ type: "OTHER" }, sender, other)).toBeUndefined()
    expect(other).not.toHaveBeenCalled()
  })
})

describe("diagnostics log messages", () => {
  function setup() {
    const values: Record<string, unknown> = {}
    const store = createLogStore({
      get: vi.fn(async (key: string) => ({ [key]: values[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(values, items) }),
      remove: vi.fn(async (key: string) => { delete values[key] }),
    })
    vi.stubGlobal("chrome", {
      runtime: { id: "extension-id", getURL: (path: string) => `chrome-extension://extension-id/${path}` },
    })
    return store
  }
  const entry: LogEntry = { t: 1, level: "info", ctx: "content", event: "report.fetch" }

  it("stores forwarded entries with the sending tab", async () => {
    const store = setup()

    await expect(appendLogEntries([entry, { bad: true }], { id: "extension-id", tab: { id: 22 } as chrome.tabs.Tab }, store)).resolves.toEqual({ ok: true })

    expect(await store.read()).toEqual([{ ...entry, tab: 22 }])
    vi.unstubAllGlobals()
  })

  it("only lets extension pages read or clear logs", async () => {
    const store = setup()
    store.append([entry])
    const webPage = { id: "extension-id", url: "https://sellercentral.amazon.com/home" }

    await expect(routeMessage({ type: "LOGS_GET" }, webPage)).rejects.toThrow("Logs are only available to extension pages.")
    await expect(routeMessage({ type: "LOGS_CLEAR" }, webPage)).rejects.toThrow("Logs are only available to extension pages.")
    await expect(readLogEntries(store)).resolves.toEqual({ ok: true, entries: [entry] })
    await expect(clearLogEntries(store)).resolves.toEqual({ ok: true })
    expect(await store.read()).toEqual([])
    vi.unstubAllGlobals()
  })
})
