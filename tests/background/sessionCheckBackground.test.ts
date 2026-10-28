import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { checkSellerCentralSession, SELLER_CENTRAL_TAB_URL_PATTERN } from "../../src/background/sellerCentralTabs"
import { ACTIVE_JOB_STORAGE_KEY } from "../../src/shared/accounts"

type SessionReply = { ok: boolean; loggedInToStore: boolean; settled: boolean }

describe("checkSellerCentralSession", () => {
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const sendMessage = vi.fn(async (_tabId: number): Promise<SessionReply | undefined> => undefined)
  const sessionGet = vi.fn(async (): Promise<Record<string, unknown>> => ({}))

  beforeEach(() => {
    query.mockReset(); query.mockResolvedValue([])
    sendMessage.mockReset()
    sessionGet.mockReset(); sessionGet.mockResolvedValue({})
    vi.stubGlobal("chrome", {
      tabs: { query, sendMessage },
      storage: { session: { get: sessionGet } },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const replies = (byTab: Record<number, SessionReply>) => sendMessage.mockImplementation(async (tabId: number) => byTab[tabId])

  it("reports signed out when every open Seller Central tab shows sign-in", async () => {
    query.mockResolvedValue([{ id: 7 } as chrome.tabs.Tab])
    replies({ 7: { ok: true, loggedInToStore: false, settled: true } })

    await expect(checkSellerCentralSession({ id: 7 } as chrome.tabs.Tab)).resolves.toBe("signed-out")
    expect(query).toHaveBeenCalledWith({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
  })

  it("trusts any signed-in tab over a stale sign-in page", async () => {
    query.mockResolvedValue([{ id: 7, lastAccessed: 2 } as chrome.tabs.Tab, { id: 8, lastAccessed: 1 } as chrome.tabs.Tab])
    replies({
      7: { ok: true, loggedInToStore: false, settled: true },
      8: { ok: true, loggedInToStore: true, settled: true },
    })

    await expect(checkSellerCentralSession()).resolves.toBe("signed-in")
  })

  it("never opens a tab: with none open the session is unknown", async () => {
    await expect(checkSellerCentralSession()).resolves.toBe("unknown")
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it("ignores tabs from the other incognito profile", async () => {
    query.mockResolvedValue([{ id: 7, incognito: true } as chrome.tabs.Tab])
    replies({ 7: { ok: true, loggedInToStore: false, settled: true } })

    await expect(checkSellerCentralSession({ id: 3, incognito: false } as chrome.tabs.Tab)).resolves.toBe("unknown")
  })

  it("does not block commands while a store switch is signing out on purpose", async () => {
    sessionGet.mockResolvedValue({ [ACTIVE_JOB_STORAGE_KEY]: { id: "job", startedAt: Date.now() } })
    query.mockResolvedValue([{ id: 7 } as chrome.tabs.Tab])
    replies({ 7: { ok: true, loggedInToStore: false, settled: true } })

    await expect(checkSellerCentralSession()).resolves.toBe("unknown")
    expect(query).not.toHaveBeenCalled()
  })

  it("gives up quickly as unknown when a tab's content script never answers", async () => {
    vi.useFakeTimers()
    query.mockResolvedValue([{ id: 7 } as chrome.tabs.Tab])
    sendMessage.mockRejectedValue(new Error("Receiving end does not exist."))

    const result = checkSellerCentralSession()
    await vi.advanceTimersByTimeAsync(3_500)

    await expect(result).resolves.toBe("unknown")
  })
})
