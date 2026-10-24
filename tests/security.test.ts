import { webcrypto } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { handleAccountsMessage, handleAccountTabUpdated, handleResultsMessage, revokeResultsForTab, SIGN_IN_URL } from "../src/background"
import { ACTIVE_JOB_STORAGE_KEY, decryptVault, encryptVault, SESSION_KEY_STORAGE_KEY, serializeKey, STORE_INDEX_KEY, VAULT_STORAGE_KEY } from "../src/lib/accounts"

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

function area(values: Record<string, unknown>) {
  return {
    get: vi.fn(async (keys: string | string[] | null) => keys === null ? structuredClone(values) : Object.fromEntries((Array.isArray(keys) ? keys : [keys]).filter((key) => key in values).map((key) => [key, structuredClone(values[key])]))),
    set: vi.fn(async (items: Record<string, unknown>) => { Object.assign(values, structuredClone(items)) }),
    remove: vi.fn(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key] }),
  }
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
      storage: { local: area(local), session: area(session) },
      tabs: {
        create, get, query, sendMessage, update, remove: vi.fn(async () => undefined),
        onUpdated: { addListener: vi.fn((listener) => tabUpdatedListeners.add(listener)), removeListener: vi.fn((listener) => tabUpdatedListeners.delete(listener)) },
      },
      windows: {
        update: vi.fn(), create: vi.fn(async () => ({ id: 40, tabs: [{ id: 91, windowId: 40 }] })),
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
    await expect(handleAccountsMessage({ type, masterPassword: "fixture-master-password", vault }, contentSender)).rejects.toThrow(/Accounts page|extension page/i)
    expect(local[VAULT_STORAGE_KEY]).toBeDefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeDefined()
  })

  it.each([
    { ...optionsSender, id: "another-extension" },
    { ...optionsSender, url: `${origin}options.html.evil` },
    { ...optionsSender, frameId: 4 },
    { ...optionsSender, url: "https://untrusted.example/options.html" },
  ])("rejects forged Accounts identity %#", async (sender) => {
    await expect(handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, sender)).rejects.toThrow(/Unauthorized|Accounts page/i)
  })

  it("keeps the content status response free of vault secrets", async () => {
    const result = await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, contentSender)
    expect(result).toMatchObject({ ok: true, initialized: true, unlocked: true })
    expect(JSON.stringify(result)).not.toMatch(/fixture-secret|otpauth|ciphertext|accountsSessionKey/u)
    expect(await handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, optionsSender)).toMatchObject({ vault })
  })

  it("does not restore a key when Lock arrives during unlock", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    const derive = webcrypto.subtle.deriveBits.bind(webcrypto.subtle)
    let release!: () => void
    let entered!: () => void
    const waiting = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    vi.spyOn(webcrypto.subtle, "deriveBits").mockImplementation(async (...args: Parameters<typeof derive>) => { entered(); await gate; return derive(...args) })
    const unlock = handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)
    const rejected = expect(unlock).rejects.toThrow(/vault changed/i)
    await waiting
    const lock = handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
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
    const save = handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, optionsSender)
    const rejected = expect(save).rejects.toThrow(/vault changed/i)
    await waiting
    const reset = handleAccountsMessage({ type: "ACCOUNTS_RESET" }, optionsSender)
    release()
    await rejected
    await reset
    expect(local[VAULT_STORAGE_KEY]).toBeUndefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
  })

  it("serializes password changes and saves using the new key", async () => {
    await Promise.all([
      handleAccountsMessage({ type: "ACCOUNTS_CHANGE_MASTER_PASSWORD", masterPassword: "new-fixture-master" }, optionsSender),
      handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, optionsSender),
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
    const locking = handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    release()
    await Promise.all([updating, locking])
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeUndefined()
    expect(update).not.toHaveBeenCalled()
  })

  it("backs off repeated guesses without losing the vault", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, optionsSender)
    for (let attempt = 0; attempt < 3; attempt++) await expect(handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "wrong-password" }, optionsSender)).rejects.toThrow(/Incorrect/)
    const derive = vi.spyOn(webcrypto.subtle, "deriveBits")
    await expect(handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)).rejects.toThrow(/seconds/)
    expect(derive).not.toHaveBeenCalled()
    const afterDelay = Date.now() + 2000
    vi.spyOn(Date, "now").mockReturnValue(afterDelay)
    await handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "fixture-master-password" }, optionsSender)
    expect(session[SESSION_KEY_STORAGE_KEY]).toBeDefined()
    expect(local[VAULT_STORAGE_KEY]).toBeDefined()
  })

  it("opens secure unlock and resumes the selected store exactly once", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_REQUEST_UNLOCK", storeId: "store" }, contentSender)
    const pending = session.accountsUnlockResume as { id: string; accountsTabId: number }
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ url: "about:blank" }))
    expect(update).toHaveBeenCalledWith(200, { url: `${origin}options.html?resume=${pending.id}` })
    await expect(handleAccountsMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, { ...optionsSender, tab: { id: 999 } as chrome.tabs.Tab })).rejects.toThrow(/expired/)
    await handleAccountsMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, { ...optionsSender, tab: { id: 200 } as chrome.tabs.Tab })
    expect(sendMessage).toHaveBeenCalledWith(7, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: "source-document" })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ storeId: "store", sourceTabId: 7 })
    // The page the store was chosen on follows the switch, as if the vault had been unlocked.
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(7, { type: "OPEN_PALETTE", mode: "switching" }, { documentId: "source-document" }))
    // The Accounts tab opened just for the unlock does not linger once the switch is underway.
    expect(chrome.tabs.remove).toHaveBeenCalledWith(200)
    await expect(handleAccountsMessage({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id }, { ...optionsSender, tab: { id: 200 } as chrome.tabs.Tab })).rejects.toThrow(/expired/)
  })

  it("opens Accounts in the background and activates it only once it has loaded", async () => {
    // A foreground about:blank tab leaves focus in the omnibox instead of the master password field.
    get.mockImplementation(async (id: number) => ({ id, windowId: 1, status: "loading", url: extensionTabUrls.get(id) }))
    const requesting = handleAccountsMessage({ type: "ACCOUNTS_REQUEST_UNLOCK", storeId: "store" }, contentSender)
    await vi.waitFor(() => expect(tabUpdatedListeners.size).toBe(1))
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ active: false, url: "about:blank" }))
    expect(update).not.toHaveBeenCalledWith(200, { active: true })
    const accountsUrl = extensionTabUrls.get(200)!
    for (const listener of [...tabUpdatedListeners]) listener(200, { status: "complete" }, { id: 200, url: accountsUrl } as chrome.tabs.Tab)
    await requesting
    expect(update.mock.calls.map(([, changes]) => changes)).toEqual([{ url: accountsUrl }, { active: true }])
    expect(tabUpdatedListeners.size).toBe(0)
  })

  it.each([
    { ...loginSender, url: "http://sellercentral.amazon.com/ap/signin" },
    { ...loginSender, url: "https://sellercentral.amazon.com:8443/ap/signin" },
    { ...loginSender, frameId: 3 },
    { ...loginSender, documentId: undefined },
    { ...loginSender, url: "https://sellercentral.amazon.com/home" },
  ])("rejects an unauthorized automation origin/frame/document/step %#", async (sender) => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "signin", startedAt: Date.now(), ownsTab: false }
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, sender)).rejects.toThrow()
    expect(attach).not.toHaveBeenCalled()
  })

  it("binds credential release to the still-live login document", async () => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "signin", startedAt: Date.now(), ownsTab: false }
    sendMessage.mockResolvedValueOnce({ ok: false })
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, loginSender)).rejects.toThrow(/document/)
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "ACCOUNTS_RESUME_CHECK" }, { documentId: "login-document" })
  })

  it("does not release credentials during logout or click the wrong login step", async () => {
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job", tabId: 91, storeId: "store", stage: "logout", startedAt: Date.now(), ownsTab: false }
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: "job", kind: "password" }, loginSender)).rejects.toThrow(/login step/)
    ;(session[ACTIVE_JOB_STORAGE_KEY] as { stage: string }).stage = "password"
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: "job", action: "continue", x: 1, y: 2 }, loginSender)).rejects.toThrow(/login step/)
    expect(attach).not.toHaveBeenCalled()
  })

  it.each(["REPORTS_PREPARE", "REPORTS_FETCH_STRANDED", "SCRAPE_CASES"])("rejects bare %s from content", async (type) => {
    await expect(handleResultsMessage({ type, caseIds: ["11111111111"] }, contentSender)).rejects.toThrow(/Results page/)
    expect(query).not.toHaveBeenCalled()
  })

  it("commits the case handoff before Results loads and keeps it through initial navigation", async () => {
    let initialized: Record<string, unknown> | undefined
    update.mockImplementation(async (id: number, changes: { url?: string }) => {
      const launchId = new URL(changes.url!).searchParams.get("launch")
      await revokeResultsForTab(id)
      initialized = await handleResultsMessage({ type: "RESULTS_INIT", launchId }, resultsSender)
      return { id, windowId: 1 }
    })
    await handleResultsMessage({ type: "RESULTS_OPEN", mode: "cases", caseIds: ["11111111111"] }, contentSender)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ url: "about:blank" }))
    expect(initialized).toEqual({ ok: true, mode: "cases", caseIds: ["11111111111"] })
  })

  it("revokes runs on navigation and removes launch handoffs when their tab closes", async () => {
    await handleResultsMessage({ type: "RESULTS_OPEN", mode: "reports" }, contentSender)
    const launchKey = Object.keys(session).find((key) => key.startsWith("resultsLaunch:"))!
    const { runId } = await handleResultsMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
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
    const prepare = handleResultsMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    const rejected = expect(prepare).rejects.toThrow(/tab changed/)
    await started
    await revokeResultsForTab(91)
    release()
    await rejected
    expect(Object.keys(session).some((key) => key.startsWith("resultsRun:"))).toBe(false)
  })

  it("requires prepare and confines each selected source to one owner and one tab", async () => {
    await expect(handleResultsMessage({ type: "REPORTS_FETCH_STRANDED" }, resultsSender)).rejects.toThrow(/authorized/)
    const { runId } = await handleResultsMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    await expect(handleResultsMessage({ type: "REPORTS_FETCH_STRANDED", runId }, { ...resultsSender, documentId: "replacement-document" })).rejects.toThrow(/authorized/)
    await expect(handleResultsMessage({ type: "REPORTS_FETCH_FEEDBACK", runId }, resultsSender)).rejects.toThrow(/not selected/)
    const result = await handleResultsMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)
    expect(result).toEqual({ ok: true, listings: [{ sku: "fixture-sku" }] })
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "REPORTS_FETCH_STRANDED", runId }, { frameId: 0 })
    expect(query).toHaveBeenCalledTimes(1)
    await expect(handleResultsMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)).rejects.toThrow(/already started/)
  })

  it("suppresses an in-flight data response after cancellation", async () => {
    const { runId } = await handleResultsMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    let release!: (value: unknown) => void
    let entered!: () => void
    const started = new Promise<void>((resolve) => { entered = resolve })
    sendMessage.mockImplementation(async (_tab: number, message: { type: string }) => message.type === "REPORTS_FETCH_STRANDED" ? new Promise((resolve) => { entered(); release = resolve }) : { ok: true })
    const request = handleResultsMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)
    const rejected = expect(request).rejects.toThrow(/authorized/)
    await started
    await handleResultsMessage({ type: "RESULTS_CANCEL", runId }, resultsSender)
    release({ ok: true, listings: [{ sku: "must-not-return" }] })
    await rejected
    expect(sendMessage).toHaveBeenCalledWith(91, { type: "REPORTS_ABORT", runId }, { frameId: 0 })
  })

  it("rejects data fetches after the Seller Central tab navigates", async () => {
    const { runId } = await handleResultsMessage({ type: "REPORTS_PREPARE", sections: ["stranded"] }, resultsSender)
    get.mockResolvedValue({ id: 91, status: "complete", url: "https://untrusted.example/" })
    await expect(handleResultsMessage({ type: "REPORTS_FETCH_STRANDED", runId }, resultsSender)).rejects.toThrow(/session changed/)
  })
})
