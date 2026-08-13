import { describe, expect, it, vi } from "vitest"

import {
  buildCaseUrl,
  buildShipmentUrl,
  buildSkuUrl,
  createOpenIdsMessageListener,
  normalizeCaseIds,
  normalizeShipmentIds,
  normalizeSkuIds,
  openCaseTabs,
  openShipmentTabs,
  openSkuTabs,
} from "../src/background"

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

  it("returns a structured success response for the message", async () => {
    const openTabs = vi.fn().mockResolvedValue({ openedCount: 1 })
    const sendResponse = vi.fn()
    const listener = createOpenIdsMessageListener(openTabs)

    expect(
      listener(
        { type: "OPEN_CASE_IDS", caseIds: ["21476974831"] },
        { tab: senderTab } as chrome.runtime.MessageSender,
        sendResponse,
      ),
    ).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, openedCount: 1 })
    })
    expect(openTabs).toHaveBeenCalledWith(["21476974831"], senderTab)
  })

  it("returns a structured error and ignores unrelated messages", async () => {
    const openTabs = vi.fn().mockRejectedValue(new Error("tab creation failed"))
    const sendResponse = vi.fn()
    const listener = createOpenIdsMessageListener(openTabs)

    expect(
      listener(
        { type: "OPEN_CASE_IDS", caseIds: [] },
        { tab: senderTab } as chrome.runtime.MessageSender,
        sendResponse,
      ),
    ).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        ok: false,
        error: "tab creation failed",
      })
    })

    expect(listener({ type: "OTHER" }, {}, sendResponse)).toBeUndefined()
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

  it("routes shipment messages and returns a structured response", async () => {
    const openCases = vi.fn().mockResolvedValue({ openedCount: 0 })
    const openShipments = vi.fn().mockResolvedValue({ openedCount: 1 })
    const sendResponse = vi.fn()
    const listener = createOpenIdsMessageListener(openCases, openShipments)

    expect(
      listener(
        {
          type: "OPEN_SHIPMENT_IDS",
          shipmentIds: ["FBA19749WJ6Q"],
        },
        { tab: senderTab } as chrome.runtime.MessageSender,
        sendResponse,
      ),
    ).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, openedCount: 1 })
    })
    expect(openShipments).toHaveBeenCalledWith(["FBA19749WJ6Q"], senderTab)
    expect(openCases).not.toHaveBeenCalled()
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

  it("routes SKU messages and returns a structured response", async () => {
    const openCases = vi.fn().mockResolvedValue({ openedCount: 0 })
    const openShipments = vi.fn().mockResolvedValue({ openedCount: 0 })
    const openSkus = vi.fn().mockResolvedValue({ openedCount: 1 })
    const sendResponse = vi.fn()
    const listener = createOpenIdsMessageListener(openCases, openShipments, openSkus)

    expect(
      listener(
        { type: "OPEN_SKU_IDS", skuIds: ["ABC-123"] },
        { tab: senderTab } as chrome.runtime.MessageSender,
        sendResponse,
      ),
    ).toBe(true)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ ok: true, openedCount: 1 })
    })
    expect(openSkus).toHaveBeenCalledWith(["ABC-123"], senderTab)
    expect(openCases).not.toHaveBeenCalled()
    expect(openShipments).not.toHaveBeenCalled()
  })

  it("enforces the fifty-ID limit in the background", async () => {
    const ids = Array.from({ length: 51 }, (_, index) => `SKU-${index}`)
    await expect(openSkuTabs(ids, senderTab, vi.fn())).rejects.toThrow(/no more than 50/i)
  })
})
