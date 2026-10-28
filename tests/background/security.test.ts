import { webcrypto } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { relayAuthorizedReportProgress, revokeResultsForTab } from "../../src/background/reports"
import { routeMessage } from "../../src/background/router"
import { handleAccountTabUpdated, SIGN_IN_URL } from "../../src/background/switch/signIn"
import { ACTIVE_JOB_STORAGE_KEY, decryptVault, encryptVault, SESSION_KEY_STORAGE_KEY, serializeKey, STORE_INDEX_KEY, VAULT_STORAGE_KEY } from "../../src/shared/accounts"
import { storageArea } from "../helpers/chrome"

const origin = "chrome-extension://security-fixture/"
const optionsSender: chrome.runtime.MessageSender = { id: "security-fixture", url: `${origin}options.html`, frameId: 0, documentId: "accounts-document", tab: { id: 201, windowId: 1 } as chrome.tabs.Tab }
const contentSender: chrome.runtime.MessageSender = { id: "security-fixture", url: "https://untrusted.example/", frameId: 0, documentId: "source-document", tab: { id: 7, windowId: 1 } as chrome.tabs.Tab }
const resultsSender: chrome.runtime.MessageSender = { id: "security-fixture", url: `${origin}results.html`, frameId: 0, documentId: "results-document", tab: { id: 200, windowId: 1 } as chrome.tabs.Tab }
const loginSender: chrome.runtime.MessageSender = { id: "security-fixture", url: SIGN_IN_URL, frameId: 0, documentId: "login-document", tab: { id: 91, windowId: 1 } as chrome.tabs.Tab }
const vault = {
  version: 1 as const,
  credentials: [{ id: "credential", domain: "fixture@example.test", password: "fixture-secret", otpAuthUri: "otpauth://totp/Fixture?secret=JBSWY3DPEHPK3PXP" }],
  stores: [{ id: "store", name: "Fixture", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
}

/** The next popup window Chrome creates holds tab 200, the Results sender's tab. */
function openWorkspaceAsTab200() {
  ;(chrome.windows.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 50, tabs: [{ id: 200, windowId: 50 }] })
}

describe("security boundaries", () => {
  const local: Record<string, unknown> = {}
  const session: Record<string, unknown> = {}
  const create = vi.fn()
  const get = vi.fn()
  const query = vi.fn()
  const sendMessage = vi.fn()
  const update = vi.fn()
  const attach = vi.fn()
  const tabUpdatedListeners = new Set<(tabId: number, changeInfo: { status?: string }, tab: chrome.tabs.Tab) => void>()
  // Extension pages a test tab was sent to, so it reads back as loaded there.
  const extensionTabUrls = new Map<number, string>()

  beforeEach(async () => {
    vi.stubGlobal("crypto", webcrypto)
    for (const key of Object.keys(local)) delete local[key]
    for (const key of Object.keys(session)) delete session[key]
    const encrypted = await encryptVault(vault, "fixture-master-password", 1000)
    local[VAULT_STORAGE_KEY] = encrypted.envelope
    local[STORE_INDEX_KEY] = [{ id: "store", name: "Fixture" }]
    session[SESSION_KEY_STORAGE_KEY] = serializeKey(encrypted.keyBytes)
    create.mockReset().mockResolvedValue({ id: 200, windowId: 1 })
    tabUpdatedListeners.clear()
    extensionTabUrls.clear()
    get.mockReset().mockImplementation(async (id: number) => ({ id, windowId: 1, status: "complete", url: extensionTabUrls.get(id) ?? (id === 91 ? SIGN_IN_URL : "https://untrusted.example/") }))
    query.mockReset().mockResolvedValue([{ id: 91, windowId: 1 }])
    update.mockReset().mockImplementation(async (id: number, changes: { url?: string }) => {
      if (changes.url?.startsWith(origin)) extensionTabUrls.set(id, changes.url)
      return { id: 91, windowId: 1 }
    })
    sendMessage.mockReset().mockImplementation(async (_id: number, message: { type: string }) => {
      if (message.type === "REPORTS_SESSION_STATUS") return { ok: true, loggedInToStore: true, settled: true }
      if (message.type === "REPORTS_FETCH_STRANDED") return { ok: true, listings: [{ sku: "fixture-sku" }] }
      return { ok: true }
    })
    attach.mockReset().mockResolvedValue(undefined)
    vi.stubGlobal("chrome", {
      runtime: { id: "security-fixture", getURL: (path: string) => `${origin}${path}`, openOptionsPage: vi.fn() },
      storage: { local: storageArea(local), session: storageArea(session) },
      tabs: {
        create, get, query, sendMessage, update, remove: vi.fn(async () => undefined),
        onUpdated: { addListener: vi.fn((listener) => tabUpdatedListeners.add(listener)), removeListener: vi.fn((listener) => tabUpdatedListeners.delete(listener)) },
      },
      windows: {
        update: vi.fn(async () => undefined), create: vi.fn(async () => ({ id: 40, tabs: [{ id: 91, windowId: 40 }] })),
        get: vi.fn(async (id: number) => ({ id, type: "normal", incognito: false })),
        getLastFocused: vi.fn(async () => ({ id: 1, type: "normal", incognito: false })),
      },
      debugger: { attach, sendCommand: vi.fn(), detach: vi.fn() },
    })
  })

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it.each([
    "ACCOUNTS_CREATE", "ACCOUNTS_UNLOCK", "ACCOUNTS_GET_VAULT", "ACCOUNTS_SAVE_VAULT",
    "ACCOUNTS_EXPORT_SHARE", "ACCOUNTS_IMPORT_SHARE", "ACCOUNTS_CREATE_FROM_SHARE",
    "ACCOUNTS_CHANGE_MASTER_PASSWORD", "ACCOUNTS_RESET", "ACCOUNTS_RESUME_SWITCH", "ACCOUNTS_LOCK",
  ])("rejects %s from content even while unlocked", async (type) => {
    await expect(routeMessage({ type, masterPassword: "fixture-master-password", vault }, contentSender)).rejects.toThrow(/Accounts page|extension page/i)
    expect(local[VAULT_STORAGE_KEY]).toBeDefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeDefined()
  })

  it.each([
    { ...optionsSender, id: "another-extension" },
    { ...optionsSender, url: `${origin}options.html.evil` },
    { ...optionsSender, frameId: 4 },
    { ...optionsSender, url: "https://untrusted.example/options.html" },
  ])("rejects forged Accounts identity %#", async (sender) => {
    await expect(routeMessage({ type: "ACCOUNTS_GET_VAULT" }, sender)).rejects.toThrow(/Unauthorized|Accounts page/i)
  })

  it("keeps the content status response free of vault secrets", async () => {
    const result = await routeMessage({ type: "ACCOUNTS_STATUS" }, contentSender)
    expect(result).toMatchObject({ ok: true, initialized: true, unlocked: true })
    expect(JSON.stringify(result)).not.toMatch(/fixture-secret|otpauth|ciphertext|accountsSessionKey/u)
    expect(await routeMessage({ type: "ACCOUNTS_GET_VAULT" }, optionsSender)).toMatchObject({ vault })
  })

  it("does not restore a key when Lock arrives during unlock", async () => {
    await routeMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    const derive = webcrypto.subtle.deriveBits.bind(webcrypto.subtle)
    let release!: () => void
    let entered!: () => void
    const waiting = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(webcrypto.subtle, "deriveBits").mockImplementation(async (...args: Parameters<typeof derive>) => { entered(); await gate; return derive(...args) })
    const unlock = routeMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)
    const rejected = expect(unlock).rejects.toThrow(/vault changed/i)
    await waiting
    const lock = routeMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    release()
    await rejected
    await lock
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
  })

  it("does not resurrect a vault when Reset arrives during save", async () => {
    const encrypt = webcrypto.subtle.encrypt.bind(webcrypto.subtle)
    let release!: () => void
    let entered!: () => void
    const waiting = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(webcrypto.subtle, "encrypt").mockImplementation(async (...args: Parameters<typeof encrypt>) => { entered(); await gate; return encrypt(...args) })
    const save = routeMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, optionsSender)
    const rejected = expect(save).rejects.toThrow(/vault changed/i)
    await waiting
    const reset = routeMessage({ type: "ACCOUNTS_RESET" }, optionsSender)
    release()
    await rejected
    await reset
    expect(local[VAULT_STORAGE_KEY]).toBeUndefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
  })

  it("serializes password changes and saves using the new key", async () => {
    await Promise.all([
      routeMessage({ type: "ACCOUNTS_CHANGE_MASTER_PASSWORD", masterPassword: "new-fixture-master" }, optionsSender),
      routeMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, optionsSender),
    ])
    expect((await decryptVault(local[VAULT_STORAGE_KEY] as never, "new-fixture-master")).vault).toEqual(vault)
  })

  it("does not revive an account switch when Lock interrupts a tab update", async () => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "logout", startedAt: Date.now(), ownsTab: false }
    const storage = chrome.storage.session.get as ReturnType<typeof vi.fn>
    const read = storage.getMockImplementation() as (keys: string | string[] | null) => Promise<Record<string, unknown>>
    let entered!: () => void
    let release!: () => void
    let paused = false
    const waiting = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    storage.mockImplementation(async (keys: string | string[] | null) => {
      const snapshot = await read(keys)
      if (keys === ACTIVE_JOB_STORAGE_KEY && !paused) { paused = true; entered(); await gate }
      return snapshot
    })
    const updating = handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: SIGN_IN_URL } as chrome.tabs.Tab)
    await waiting
    const locking = routeMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    release()
    await Promise.all([updating, locking])
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
    expect(update).not.toHaveBeenCalled()
  })

  it("backs off repeated guesses without losing the vault", async () => {
    await routeMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    for (let attempt = 0; attempt < 3; attempt++) await expect(routeMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "wrong-password" }, optionsSender)).rejects.toThrow(/Incorrect/)
    const derive = vi.spyOn(webcrypto.subtle, "deriveBits")
    await expect(routeMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)).rejects.toThrow(/seconds/)
    expect(derive).not.toHaveBeenCalled()
    const afterDelay = Date.now() + 2000
    vi.spyOn(Date, "now").mockReturnValue(afterDelay)
    await routeMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeDefined()
    expect(local[VAULT_STORAGE_KEY]).toBeDefined()
  })

  it("opens unlock in the workspace window and resumes the selected store exactly once", async () => {
    openWorkspaceAsTab200()
    await routeMessage({ type: "ACCOUNTS_REQUEST_UNLOCK", storeId: "store" }, contentSender)
    const pending = session.accountsUnlockResume as { id: string; accountsTabId: number; closeAccounts: boolean }
    expect(pending).toMatchObject({ accountsTabId: 200, closeAccounts: true })
    expect(chrome.windows.create).toHaveBeenCalledWith(expect.objectContaining({ type: "popup", url: "about:blank" }))
    const launchKey = Object.keys(session).find((key) => key.startsWith("resultsLaunch:"))!
    expect(session[launchKey]).toMatchObject({ tabId: 200, mode: "accounts", resumeId: pending.id, storeName: "Fixture" })
    expect(update).toHaveBeenCalledWith(200, { url: `${origin}results.html?launch=${launchKey.slice("resultsLaunch:".length)}` })
    await expect(routeMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, { ...resultsSender, tab: { id: 999 } as chrome.tabs.Tab })).rejects.toThrow(/expired/)
    await routeMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, resultsSender)
    expect(sendMessage).toHaveBeenCalledWith(7, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: "source-document" })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ storeId: "store", sourceTabId: 7 })
    // The page the store was chosen on follows the switch, as if the vault had been unlocked.
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(7, { type: "OPEN_PALETTE", mode: "switching" }, { documentId: "source-document" }))
    // The window opened just for the unlock does not linger once the switch is underway.
    expect(chrome.tabs.remove).toHaveBeenCalledWith(200)
    // The page the store was chosen on comes back to the front, not the sign-in window.
    await vi.waitFor(() => expect(chrome.windows.update).toHaveBeenLastCalledWith(1, { focused: true }))
    expect(chrome.windows.create).toHaveBeenLastCalledWith(expect.objectContaining({ type: "normal", focused: false }))
    await expect(routeMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, resultsSender)).rejects.toThrow(/expired/)
  })

  it("keeps an already open window after its unlock resumes a switch", async () => {
    session.workspaceWindow = { windowId: 1, tabId: 200 }
    await routeMessage({ type: "ACCOUNTS_REQUEST_UNLOCK", storeId: "store" }, contentSender)
    const pending = session.accountsUnlockResume as { id: string; closeAccounts: boolean }
    expect(pending.closeAccounts).toBe(false)
    expect(sendMessage).toHaveBeenCalledWith(200, expect.objectContaining({ type: "RESULTS_SHOW" }))
    await routeMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, resultsSender)
    expect(chrome.tabs.remove).not.toHaveBeenCalledWith(200)
  })

  it("lets the window unlock and lock, but never read or change the vault", async () => {
    await routeMessage({ type: "ACCOUNTS_LOCK" }, resultsSender)
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
    await routeMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, resultsSender)
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeDefined()
    for (const type of ["ACCOUNTS_GET_VAULT", "ACCOUNTS_SAVE_VAULT", "ACCOUNTS_EXPORT_SHARE", "ACCOUNTS_CHANGE_MASTER_PASSWORD", "ACCOUNTS_RESET"]) {
      await expect(routeMessage({ type, vault, masterPassword: "fixture-master-password" }, resultsSender)).rejects.toThrow(/Accounts page/)
    }
  })

  it.each([
    { ...loginSender, url: "http://sellercentral.amazon.com/ap/signin" },
    { ...loginSender, url: "https://sellercentral.amazon.com:8443/ap/signin" },
    { ...loginSender, frameId: 3 },
    { ...loginSender, documentId: undefined },
    { ...loginSender, url: "https://sellercentral.amazon.com/home" },
  ])("rejects an unauthorized automation origin/frame/document/step %#", async (sender) => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "signin", startedAt: Date.now(), ownsTab: false }
    await expect(routeMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, sender)).rejects.toThrow()
    expect(attach).not.toHaveBeenCalled()
  })

  it("binds credential release to the still-live login document", async () => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "signin", startedAt: Date.now(), ownsTab: false }
    sendMessage.mockResolvedValueOnce({ ok: false })
    await expect(routeMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, loginSender)).rejects.toThrow(/document/)
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: "login-document" })
  })

  it("does not release credentials during logout or click the wrong login step", async () => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "logout", startedAt: Date.now(), ownsTab: false }
    await expect(routeMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, loginSender)).rejects.toThrow(/login step/)
    ;(session[ACTIVE_JOB_STORAGE_KEY] as { stage: string }).stage = "password"
    await expect(routeMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: "job", action: "continue", x: 1, y: 2 }, loginSender)).rejects.toThrow(/login step/)
    expect(attach).not.toHaveBeenCalled()
  })

  it.each(["REPORTS_PREPARE", "REPORTS_FETCH_STRANDED", "SCRAPE_CASES"])("rejects bare %s from content", async (type) => {
    await expect(routeMessage({ type, caseIds: ["11111111111"] }, contentSender)).rejects.toThrow(/Results page/)
    expect(query).not.toHaveBeenCalled()
  })

  it("commits the case handoff before the window loads and keeps it through initial navigation", async () => {
    openWorkspaceAsTab200()
    let initialized: Record<string, unknown> | undefined
    update.mockImplementation(async (id: number, changes: { url?: string }) => {
      const launchId = new URL(changes.url!).searchParams.get("launch")
      await revokeResultsForTab(id)
      initialized = await routeMessage({ type: "RESULTS_INIT", launchId }, resultsSender)
      return { id, windowId: 50 }
    })
    await routeMessage({ type: "RESULTS_OPEN", mode: "cases", caseIds: ["11111111111"] }, contentSender)
    expect(chrome.windows.create).toHaveBeenCalledWith(expect.objectContaining({ type: "popup", url: "about:blank", width: 440 }))
    expect(create).not.toHaveBeenCalled()
    expect(initialized).toEqual({ ok: true, mode: "cases", caseIds: ["11111111111"] })
  })

  it("opens a new window unfocused and focuses it once the page has loaded", async () => {
    openWorkspaceAsTab200()
    await routeMessage({ type: "RESULTS_OPEN", mode: "reports" }, contentSender)
    // Opening focused on about:blank would leave focus in the location bar.
    expect(chrome.windows.create).toHaveBeenCalledWith(expect.objectContaining({ type: "popup", url: "about:blank", focused: false }))
    const pageUrl = (update.mock.calls.find(([id]) => id === 200)?.[1] as { url: string }).url
    expect(pageUrl).toMatch(/results\.html\?launch=/)
    await vi.waitFor(() => expect(chrome.windows.update).toHaveBeenCalledWith(50, { focused: true }))
  })

  it("opens Scrape case on an empty Cases tab, but never with more than 50 IDs", async () => {
    session.workspaceWindow = { windowId: 1, tabId: 200 }
    await routeMessage({ type: "RESULTS_OPEN", mode: "cases" }, contentSender)
    const launchId = (sendMessage.mock.calls.find(([, message]) => message.type === "RESULTS_SHOW")?.[1] as { launchId: string }).launchId
    expect(session[`resultsLaunch:${launchId}`]).toMatchObject({ tabId: 200, mode: "cases", caseIds: [] })
    const tooMany = Array.from({ length: 51 }, (_, index) => String(30_000_000_000 + index))
    await expect(routeMessage({ type: "RESULTS_OPEN", mode: "cases", caseIds: tooMany }, contentSender)).rejects.toThrow(/50/)
  })

  it("reuses the open window and lets the page show the new launch itself", async () => {
    session.workspaceWindow = { windowId: 1, tabId: 200 }
    await routeMessage({ type: "RESULTS_OPEN", mode: "reports" }, contentSender)
    const launchId = (sendMessage.mock.calls.find(([, message]) => message.type === "RESULTS_SHOW")?.[1] as { launchId: string }).launchId
    expect(session[`resultsLaunch:${launchId}`]).toMatchObject({ tabId: 200, mode: "reports" })
    expect(chrome.windows.create).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()
    expect(chrome.windows.update).toHaveBeenCalledWith(1, { focused: true })
  })

  it("revokes runs on navigation and removes launch handoffs when their tab closes", async () => {
    openWorkspaceAsTab200()
    await routeMessage({ type: "RESULTS_OPEN", mode: "reports" }, contentSender)
    const launchKey = Object.keys(session).find((key) => key.startsWith("resultsLaunch:"))!
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    await revokeResultsForTab(200)
    expect(session[`resultsRun:${runId}`]).toBeUndefined()
    expect(session[launchKey]).toBeDefined()
    await revokeResultsForTab(200, true)
    expect(session[launchKey]).toBeUndefined()
  })

  it("does not create a run if a report tab changes during the session check", async () => {
    let entered!: () => void
    let release!: () => void
    const started = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    sendMessage.mockImplementation(async (_tab: number, message: { type: string }) => {
      if (message.type === "REPORTS_SESSION_STATUS") {
        entered(); await gate
        return { ok: true, loggedInToStore: true, settled: true }
      }
      return { ok: true }
    })
    const prepare = routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    const rejected = expect(prepare).rejects.toThrow(/tab changed/)
    await started
    await revokeResultsForTab(91)
    release()
    await rejected
    expect(Object.keys(session).some((key) => key.startsWith("resultsRun:"))).toBe(false)
  })

  it("requires prepare and confines each selected source to one owner and one tab", async () => {
    await expect(routeMessage({ type: "REPORTS_FETCH_STRANDED" }, resultsSender)).rejects.toThrow(/authorized/)
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    await expect(routeMessage({ type: "REPORTS_FETCH_STRANDED", runId }, { ...resultsSender, documentId: "replacement-document" })).rejects.toThrow(/authorized/)
    await expect(routeMessage({ type: "REPORTS_FETCH_FEEDBACK", runId }, resultsSender)).rejects.toThrow(/not selected/)
    const result = await routeMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)
    expect(result).toEqual({ ok: true, listings: [{ sku: "fixture-sku" }] })
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "REPORTS_FETCH_STRANDED", runId }, { frameId: 0 })
    expect(query).toHaveBeenCalledTimes(1)
    await expect(routeMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)).rejects.toThrow(/already started/)
  })

  it("suppresses an in-flight data response after cancellation", async () => {
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    let release!: (value: unknown) => void
    let entered!: () => void
    const started = new Promise<void>((resolve) => { entered = resolve })
    sendMessage.mockImplementation(async (_tab: number, message: { type: string }) => message.type === "REPORTS_FETCH_STRANDED" ? new Promise((resolve) => { entered(); release = resolve }) : { ok: true })
    const request = routeMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)
    const rejected = expect(request).rejects.toThrow(/authorized/)
    await started
    await routeMessage({ type: "RESULTS_CANCEL", runId }, resultsSender)
    release({ ok: true, listings: [{ sku: "must-not-return" }] })
    await rejected
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "REPORTS_ABORT", runId }, { frameId: 0 })
  })

  it("rejects data fetches after the Seller Central tab navigates", async () => {
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    get.mockResolvedValue({ id: 91, status: "complete", url: "https://untrusted.example/" })
    await expect(routeMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)).rejects.toThrow(/session changed/)
  })

  it.each([
    { section: "unfulfillable", type: "REPORTS_FETCH_UNFULFILLABLE", response: { listings: [{ sku: "ABC-123" }], extra: "dropped" }, expected: { listings: [{ sku: "ABC-123" }], nextRemovalOrderId: null } },
    { section: "feedback", type: "REPORTS_FETCH_FEEDBACK", response: { feedbacks: [{ feedbackId: "A1JYWNJI6O4TQ1" }] }, expected: { feedbacks: [{ feedbackId: "A1JYWNJI6O4TQ1" }] } },
    { section: "stranded", type: "REPORTS_FETCH_STRANDED", response: { listings: [{ SKU: "STRANDED-SKU" }] }, expected: { listings: [{ SKU: "STRANDED-SKU" }] } },
    { section: "suppressed", type: "REPORTS_FETCH_SUPPRESSED", response: { listings: [{ sku: "STOCK-SKU" }] }, expected: { listings: [{ sku: "STOCK-SKU" }] } },
    { section: "shippingQueue", type: "REPORTS_FETCH_SHIPPING_QUEUE", response: { shipments: [{ shipmentId: "FBA19RKC646S" }] }, expected: { shipments: [{ shipmentId: "FBA19RKC646S" }] } },
  ])("returns only what Results needs from $section, without focusing Seller Central", async ({ section, type, response, expected }) => {
    sendMessage.mockImplementation(async (_tab: number, message: { type: string }) => (
      message.type === "REPORTS_SESSION_STATUS" ? { ok: true, loggedInToStore: true, settled: true }
        : message.type === type ? { ok: true, ...response } : { ok: true }
    ))
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: [section] }, resultsSender)
    await expect(routeMessage({ type, runId }, resultsSender)).resolves.toEqual({ ok: true, ...expected })
    expect(sendMessage).toHaveBeenCalledWith(91, { type, runId }, { frameId: 0 })
    expect(update).not.toHaveBeenCalled()
  })

  it("starts no run while Seller Central is signed out", async () => {
    sendMessage.mockResolvedValue({ ok: true, loggedInToStore: false, settled: true })
    await expect(routeMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)).resolves.toEqual({ ok: true, loggedInToStore: false })
    await expect(routeMessage({ type: "REPORTS_PREPARE", mode: "cases", caseIds: ["22420938051"] }, resultsSender)).rejects.toThrow("Sign in to a store in Seller Central")
    expect(Object.keys(session).some((key) => key.startsWith("resultsRun:"))).toBe(false)
  })

  it("scrapes only the run's case IDs on its Seller Central tab", async () => {
    const file = { scrapedAt: "2026-10-22T11:01:00.000Z", timeZone: "Asia/Manila", cases: [{ caseId: "22420938051" }] }
    sendMessage.mockImplementation(async (_tab: number, message: { type: string }) => (
      message.type === "REPORTS_SESSION_STATUS" ? { ok: true, loggedInToStore: true, settled: true }
        : message.type === "SCRAPE_CASES" ? { ok: true, file } : { ok: true }
    ))
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", mode: "cases", caseIds: ["22420938051", "not-an-id"] }, resultsSender)
    await expect(routeMessage({ type: "SCRAPE_CASES", runId, caseIds: ["99999999999"] }, resultsSender)).resolves.toEqual({ ok: true, file })
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "SCRAPE_CASES", caseIds: ["22420938051"], runId }, { frameId: 0 })
  })

  it("stops a case scrape when the store signed out after prepare", async () => {
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", mode: "cases", caseIds: ["22420938051"] }, resultsSender)
    sendMessage.mockResolvedValue({ ok: true, loggedInToStore: false, settled: true })
    await expect(routeMessage({ type: "SCRAPE_CASES", runId }, resultsSender)).rejects.toThrow("Sign in to Seller Central, then try again.")
    expect(sendMessage).not.toHaveBeenCalledWith(91, expect.objectContaining({ type: "SCRAPE_CASES" }), { frameId: 0 })
  })

  it("forwards report progress only from the run's Seller Central tab to its Results page", async () => {
    const { runId } = await routeMessage({ type: "REPORTS_PREPARE", sections: ["shippingQueue"] }, resultsSender)
    const progress = { type: "REPORTS_PROGRESS", runId, source: "shippingQueue", status: "active" }
    const sellerCentralSender: chrome.runtime.MessageSender = { id: "security-fixture", url: "https://sellercentral.amazon.com/home", frameId: 0, tab: { id: 91, windowId: 1 } as chrome.tabs.Tab }
    sendMessage.mockClear()
    await relayAuthorizedReportProgress(progress, { ...sellerCentralSender, tab: { id: 92, windowId: 1 } as chrome.tabs.Tab })
    await relayAuthorizedReportProgress(progress, { ...sellerCentralSender, url: "https://untrusted.example/" })
    expect(sendMessage).not.toHaveBeenCalled()
    await relayAuthorizedReportProgress(progress, sellerCentralSender)
    expect(sendMessage).toHaveBeenCalledWith(200, progress, { documentId: "results-document" })
  })
})
