import { webcrypto } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LOGOUT_URL, SIGN_IN_URL, handleAccountTabUpdated, handleAccountsMessage as rawHandleAccountsMessage, pickSellerCentralTab, SELLER_CENTRAL_HOME_URL, SELLER_CENTRAL_TAB_URL_PATTERN, validateVault } from "../src/background"
import { ACTIVE_JOB_STORAGE_KEY, CURRENT_STORE_KEY, decryptSharedVault, generateTotp, decryptVault, encryptSharedVault, SHARE_FILE_KIND, STORE_INDEX_KEY, VAULT_STORAGE_KEY, type AccountVault } from "../src/lib/accounts"


const accountsSender: chrome.runtime.MessageSender = { id: "test-extension", url: "chrome-extension://test-extension/options.html", frameId: 0, documentId: "accounts-document" }
// Happy-path fixtures use real context metadata. Authorization regression tests call the raw handler.
function handleAccountsMessage(message: Record<string, unknown>, sender: chrome.runtime.MessageSender) {
  const automation = String(message.type).startsWith("ACCOUNT_AUTOMATION_")
  return rawHandleAccountsMessage(message, {
    ...accountsSender,
    ...(automation ? { url: "https://sellercentral.amazon.com/ap/signin", documentId: "login-document" } : {}),
    ...sender,
  })
}

function storageArea(values: Record<string, unknown>) {
  return {
    get: vi.fn(async (keys: string | string[]) => {
      const names = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(names.filter((key) => key in values).map((key) => [key, structuredClone(values[key])]))
    }),
    set: vi.fn(async (next: Record<string, unknown>) => Object.assign(values, next)),
    remove: vi.fn(async (keys: string | string[]) => { for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key] }),
    setAccessLevel: vi.fn(async () => undefined),
  }
}

describe("Accounts background workflow", () => {
  const local: Record<string, unknown> = {}
  const session: Record<string, unknown> = {}
  const create = vi.fn(async () => ({ id: 91, windowId: 4 }))
  const update = vi.fn(async (_id: number, _properties: chrome.tabs.UpdateProperties) => ({}))
  const remove = vi.fn(async () => undefined)
  const query = vi.fn(async (): Promise<chrome.tabs.Tab[]> => [])
  const focusWindow = vi.fn(async () => ({}))
  const createWindow = vi.fn()
  const move = vi.fn()
  const tabUrls = new Map<number, string>()
  const tabWindows = new Map<number, number>()
  const tabIndexes = new Map<number, number>()
  const get = vi.fn(async (id: number) => ({ id, windowId: tabWindows.get(id) ?? 4, index: tabIndexes.get(id) ?? 0, status: "complete", url: tabUrls.get(id) ?? "https://sellercentral.amazon.com/home" }))
  const debuggerAttach = vi.fn(async () => undefined)
  const debuggerSendCommand = vi.fn(async () => undefined)
  const debuggerDetach = vi.fn(async () => undefined)

  beforeEach(() => {
    for (const key of Object.keys(local)) delete local[key]
    for (const key of Object.keys(session)) delete session[key]
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 }); update.mockClear(); remove.mockClear()
    tabUrls.clear(); tabWindows.clear(); tabIndexes.clear()
    tabWindows.set(91, 40)
    get.mockClear()
    createWindow.mockReset().mockResolvedValue({ id: 40, tabs: [{ id: 91, windowId: 40 }], type: "normal", incognito: false })
    update.mockReset().mockImplementation(async (id: number, properties: chrome.tabs.UpdateProperties) => {
      if (properties.url) tabUrls.set(id, properties.url)
      return get(id)
    })
    move.mockReset().mockImplementation(async (id: number, properties: chrome.tabs.MoveProperties) => { tabWindows.set(id, properties.windowId!); return get(id) })
    query.mockReset(); query.mockResolvedValue([]); focusWindow.mockReset(); focusWindow.mockResolvedValue({})
    debuggerAttach.mockReset(); debuggerSendCommand.mockReset(); debuggerDetach.mockReset()
    debuggerAttach.mockResolvedValue(undefined)
    debuggerSendCommand.mockResolvedValue(undefined)
    debuggerDetach.mockResolvedValue(undefined)
    vi.stubGlobal("crypto", webcrypto)
    vi.stubGlobal("chrome", {
      storage: { local: storageArea(local), session: storageArea(session) },
      tabs: { create, update, remove, query, get, move, sendMessage: vi.fn(async () => ({ ok: true, loggedInToStore: true, settled: true })) },
      windows: {
        create: createWindow, update: focusWindow, remove: vi.fn(),
        get: vi.fn(async (id: number) => ({ id, type: "normal", incognito: false })),
        getLastFocused: vi.fn(async () => ({ id: 4, type: "normal", incognito: false })),
        getAll: vi.fn(async () => [{ id: 4, type: "normal", incognito: false }]),
      },
      runtime: { id: "test-extension", getURL: (path: string) => `chrome-extension://test-extension/${path}`, openOptionsPage: vi.fn(async () => undefined) },
      debugger: { attach: debuggerAttach, sendCommand: debuggerSendCommand, detach: debuggerDetach },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  async function completeSwitch(job: { id: string }) {
    const pending = session[ACTIVE_JOB_STORAGE_KEY] as { stage: string }
    if (pending.stage !== "store") {
      await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/home" })
    }
    // The store loads in the user's tab when one is open, else in the helper's.
    const { tabId } = session[ACTIVE_JOB_STORAGE_KEY] as { tabId: number }
    return handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, {
      tab: { id: tabId } as chrome.tabs.Tab, url: (await get(tabId)).url, documentId: "store-document",
    })
  }

  it("validates uniqueness and credential references", () => {
    const duplicate: AccountVault = {
      version: 1,
      credentials: [
        { id: "a", domain: "same@example.test", password: "x", otpAuthUri: "otpauth://totp/A?secret=JBSWY3DPEHPK3PXP" },
        { id: "b", domain: "SAME@example.test", password: "y", otpAuthUri: "otpauth://totp/B?secret=JBSWY3DPEHPK3PXP" },
      ],
      stores: [],
    }
    expect(() => validateVault(duplicate)).toThrow(/unique/i)
    expect(() => validateVault({ version: 1, credentials: [], stores: [{ id: "s", name: "Store", credentialId: "missing", storeUrl: "https://sellercentral.amazon.com/home" }] })).toThrow(/missing credential/i)
  })

  it("creates, saves, indexes, locks, and unlocks the encrypted vault", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    expect(local[STORE_INDEX_KEY]).toEqual([{ id: "store", name: "Example Outdoors" }])
    expect(JSON.stringify(local[STORE_INDEX_KEY])).not.toContain("private-password")
    await handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, {})
    await expect(handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, {})).rejects.toThrow(/locked/i)
    await expect(handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "wrong master password" }, {})).rejects.toThrow(/incorrect/i)
    await handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "a strong master password" }, {})
    expect((await handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, {}) as any).vault).toEqual(vault)
  })

  it("exports a share file only while the vault is unlocked", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    await handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, {})
    await expect(handleAccountsMessage({ type: "ACCOUNTS_EXPORT_SHARE", sharePassword: "share-password" }, {})).rejects.toThrow(/locked/i)

    await handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "a strong master password" }, {})
    const exported = await handleAccountsMessage({ type: "ACCOUNTS_EXPORT_SHARE", sharePassword: "share-password" }, {}) as any
    expect(exported.file.kind).toBe(SHARE_FILE_KIND)
    expect(JSON.stringify(exported.file)).not.toContain("private-password")
    expect(await decryptSharedVault(exported.file, "share-password")).toEqual(vault)
    await expect(decryptSharedVault(exported.file, "a strong master password")).rejects.toThrow(/share password or damaged/i)
  })

  it("imports a share into the recipient vault under the master password", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const localVault: AccountVault = {
      version: 1,
      credentials: [{ id: "local-credential", domain: "local@example.test", password: "local-password", otpAuthUri: "otpauth://totp/Local?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "local-store", name: "Local Store", credentialId: "local-credential", storeUrl: "https://sellercentral.amazon.com/home?store=local" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault: localVault }, {})
    const incoming: AccountVault = {
      version: 1,
      credentials: [{ id: "shared-credential", domain: "shared@example.test", password: "shared-password", otpAuthUri: "otpauth://totp/Shared?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "shared-store", name: "Shared Store", credentialId: "shared-credential", storeUrl: "https://sellercentral.amazon.com/home?store=shared" }],
    }
    const file = await encryptSharedVault(incoming, "share-password", 600_000)
    await expect(handleAccountsMessage({ type: "ACCOUNTS_IMPORT_SHARE", file, sharePassword: "wrong-password" }, {})).rejects.toThrow(/share password or damaged/i)
    expect((await handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, {}) as any).vault).toEqual(localVault)

    const imported = await handleAccountsMessage({ type: "ACCOUNTS_IMPORT_SHARE", file, sharePassword: "share-password" }, {}) as any
    expect(imported.added).toEqual({ credentials: 1, stores: 1 })
    const merged = (await handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, {}) as any).vault as AccountVault
    expect(merged.credentials.map(({ id }) => id)).toEqual(["local-credential", "shared-credential"])
    expect(merged.stores.map(({ id }) => id)).toEqual(["local-store", "shared-store"])
    expect(JSON.stringify(local[VAULT_STORAGE_KEY])).not.toContain("shared-password")
    await expect(decryptVault(local[VAULT_STORAGE_KEY] as never, "share-password")).rejects.toThrow()
    expect((await decryptVault(local[VAULT_STORAGE_KEY] as never, "a strong master password")).vault).toEqual(merged)
  })

  it("refuses to create a vault from a share when one already exists", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const file = await encryptSharedVault({
      version: 1,
      credentials: [{ id: "shared-credential", domain: "shared@example.test", password: "shared-password", otpAuthUri: "otpauth://totp/Shared?secret=JBSWY3DPEHPK3PXP" }],
      stores: [],
    }, "share-password", 600_000)
    await expect(handleAccountsMessage({
      type: "ACCOUNTS_CREATE_FROM_SHARE",
      file,
      sharePassword: "share-password",
      masterPassword: "another master password",
    }, {})).rejects.toThrow(/already exists/i)
    await expect(handleAccountsMessage({ type: "ACCOUNTS_UNLOCK", masterPassword: "another master password" }, {})).rejects.toThrow(/incorrect/i)

    await handleAccountsMessage({ type: "ACCOUNTS_RESET" }, {})
    await handleAccountsMessage({
      type: "ACCOUNTS_CREATE_FROM_SHARE",
      file,
      sharePassword: "share-password",
      masterPassword: "another master password",
    }, {})
    const created = (await handleAccountsMessage({ type: "ACCOUNTS_GET_VAULT" }, {}) as any).vault as AccountVault
    expect(created.credentials.map(({ domain }) => domain)).toEqual(["shared@example.test"])
    await expect(decryptVault(local[VAULT_STORAGE_KEY] as never, "share-password")).rejects.toThrow()
  })

  it("enforces one authorized switch and releases only the requested field", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})
    expect(createWindow).toHaveBeenCalledWith({ url: "about:blank", type: "normal", focused: false, incognito: false })
    expect(update).toHaveBeenCalledWith(91, { url: LOGOUT_URL })
    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})).rejects.toThrow(/already running/i)
    const job = session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "password" }, { tab: { id: 12 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" })).rejects.toThrow(/authorized/i)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, { tab: { id: 91 } as chrome.tabs.Tab, url: SIGN_IN_URL })
    const email = await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "email" }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" })
    expect(email).toEqual({ ok: true, value: "operator@example.test" })
    expect(JSON.stringify(email)).not.toContain("private-password")
    await completeSwitch(job)
    expect(update).toHaveBeenCalledWith(91, { url: vault.stores[0].storeUrl })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(local[CURRENT_STORE_KEY]).toBe("store")
  })

  it("serializes simultaneous starts and exposes focus and cancel controls", async () => {
    const job = await createActiveJob()
    const status = await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any
    expect(status.activeSwitch).toMatchObject({ storeId: "store", storeName: "Example Outdoors", stage: "logout" })

    await handleAccountsMessage({ type: "ACCOUNTS_FOCUS_SWITCH" }, {})
    expect(update).toHaveBeenCalledWith(91, { active: true })
    await handleAccountsMessage({ type: "ACCOUNTS_CANCEL_SWITCH" }, {})
    expect(remove).toHaveBeenCalledWith(91)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(job.id).toBeTruthy()
  })

  it("allows only one of two concurrent switch requests", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})

    const results = await Promise.allSettled([
      handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {}),
      handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {}),
    ])
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1)
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1)
    expect(createWindow).toHaveBeenCalledOnce()
  })

  it("cleans up the reservation when login-tab creation fails", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    createWindow.mockRejectedValueOnce(new Error("create failed"))

    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})).rejects.toThrow("create failed")
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it("associates the job before navigating and cleans up when logout navigation fails", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    update.mockImplementationOnce(async () => {
      expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ tabId: 91, stage: "logout" })
      throw new Error("navigation failed")
    })

    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})).rejects.toThrow("navigation failed")
    expect(remove).toHaveBeenCalledWith(91)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it("ignores startup completions and always routes logout to the canonical sign-in URL", async () => {
    await createActiveJob()
    update.mockClear()

    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: "about:blank" } as chrome.tabs.Tab)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "logout" })
    await handleAccountTabUpdated(12, { status: "complete" }, { id: 12, url: LOGOUT_URL } as chrome.tabs.Tab)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "logout" })
    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: "https://example.test/" } as chrome.tabs.Tab)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "logout" })

    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fsign-out" } as chrome.tabs.Tab)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledWith(91, { url: SIGN_IN_URL })
  })

  it("leaves sign-out as soon as its redirect commits, without loading the logout re-auth page", async () => {
    await createActiveJob()
    update.mockClear()
    const reauth = "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fsign-out"

    // The sign-out request itself has not finished while its own URL is still loading.
    await handleAccountTabUpdated(91, { status: "loading" }, { id: 91, url: LOGOUT_URL } as chrome.tabs.Tab)
    expect(update).not.toHaveBeenCalled()
    await handleAccountTabUpdated(91, { status: "loading", url: reauth }, { id: 91, url: reauth } as chrome.tabs.Tab)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledExactlyOnceWith(91, { url: SIGN_IN_URL })
    // The interrupted re-auth page finishing later does not navigate again.
    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: reauth } as chrome.tabs.Tab)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it("submits a verification code at once, even late in its time step, and retries once with a later step", async () => {
    const job = await createActiveJob()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/mfa" }
    const uri = "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP"
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)
    const step = 59_000_000
    const now = vi.spyOn(Date, "now").mockReturnValue((step * 30 + 29) * 1000)
    try {
      await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "otp", retry: true }, sender)).rejects.toThrow(/rejected the verification code/)
      expect(await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "otp" }, sender))
        .toEqual({ ok: true, value: await generateTotp(uri, step * 30 * 1000) })
      // Rejected in the same step: the retry uses the next step's code rather than repeating it.
      expect(await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "otp", retry: true }, sender))
        .toEqual({ ok: true, value: await generateTotp(uri, (step + 1) * 30 * 1000) })
      await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "otp", retry: true }, sender)).rejects.toThrow(/rejected the verification code/)
    } finally {
      now.mockRestore()
    }
  })

  it("routes a completed logout page to the canonical sign-in URL", async () => {
    await createActiveJob()
    update.mockClear()

    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: LOGOUT_URL } as chrome.tabs.Tab)

    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledWith(91, { url: SIGN_IN_URL })
  })

  it("does not treat Seller Central home as a logout intercept", async () => {
    await createActiveJob()
    update.mockClear()

    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: "https://sellercentral.amazon.com/" } as chrome.tabs.Tab)
    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: "https://sellercentral.amazon.com/home" } as chrome.tabs.Tab)

    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "logout" })
    expect(update).not.toHaveBeenCalled()
  })

  it("lets the content script leave a logout re-auth page for canonical sign-in", async () => {
    const job = await createActiveJob()
    update.mockClear()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fsign-out" }

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)).resolves.toEqual({ ok: true })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledWith(91, { url: SIGN_IN_URL })
  })

  it("navigates to sign-in once when the tab listener and content script leave logout together", async () => {
    const job = await createActiveJob()
    update.mockClear()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fsign-out" }

    await Promise.all([
      handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: sender.url } as chrome.tabs.Tab),
      expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)).resolves.toEqual({ ok: true }),
    ])

    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledTimes(1)
  })

  async function createActiveJob(): Promise<{ id: string }> {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})
    return session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
  }

  async function openSelectedStore(job: { id: string }) {
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/home", documentId: "login-document" })
    return { tab: { id: 91 } as chrome.tabs.Tab, url: (await get(91)).url, documentId: "store-document" }
  }

  it("loads the store once, straight into the user's Seller Central tab, unfocused, after sign-in", async () => {
    const job = await createActiveJob()
    query.mockResolvedValue([{ id: 22, windowId: 4 } as chrome.tabs.Tab])
    const storeUrl = "https://sellercentral.amazon.com/home?store=test"
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/home", documentId: "login-document" })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "store", tabId: 22, ownsTab: false })
    expect(update).toHaveBeenLastCalledWith(22, { url: storeUrl })
    expect(update).not.toHaveBeenCalledWith(91, { url: storeUrl })
    // Only the helper closes, after the user's tab started loading the store.
    expect(remove).toHaveBeenCalledExactlyOnceWith(91)
    expect(update.mock.invocationCallOrder.at(-1)).toBeLessThan(remove.mock.invocationCallOrder[0])
    expect(local[CURRENT_STORE_KEY]).toBeUndefined()

    const sender = { tab: { id: 22 } as chrome.tabs.Tab, url: storeUrl, documentId: "store-document" }
    // The sender check reads the tab first, then readiness checks whether loading finished.
    get.mockResolvedValueOnce({ id: 22, windowId: 4, index: 0, status: "loading", url: storeUrl })
    get.mockResolvedValueOnce({ id: 22, windowId: 4, index: 0, status: "loading", url: storeUrl })
    expect(await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, sender)).toMatchObject({ waitMs: 500 })
    const loads = update.mock.calls.length
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, sender)
    expect(update).toHaveBeenCalledTimes(loads)
    expect(update).not.toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ active: true }))
    expect(move).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledTimes(1)
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(22, { type: "ACCOUNTS_SWITCH_DONE", storeName: "Example Outdoors" }, { documentId: "store-document" })
    expect(session.accountsSwitchNotice).toEqual({ tabId: 22, storeName: "Example Outdoors" })
    expect(local[CURRENT_STORE_KEY]).toBe("store")
  })

  it("does not replace tabs if the store session is unconfirmed or moving the finished tab fails", async () => {
    const job = await createActiveJob()
    const sender = await openSelectedStore(job)
    const send = chrome.tabs.sendMessage as ReturnType<typeof vi.fn>
    send.mockImplementation(async (_id: number, message: { type: string }) => message.type === "REPORTS_SESSION_STATUS" ? { ok: true, loggedInToStore: false, settled: true } : { ok: true })
    expect(await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, sender)).toMatchObject({ waitMs: 500 })
    expect(move).not.toHaveBeenCalled()
    send.mockResolvedValue({ ok: true, loggedInToStore: true, settled: true })
    move.mockRejectedValueOnce(new Error("cannot move tab"))
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, sender)).rejects.toThrow("cannot move tab")
    expect(remove).not.toHaveBeenCalled()
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ id: job.id, stage: "store" })
    expect(local[CURRENT_STORE_KEY]).toBeUndefined()
  })

  it("loads the store into a matching tab and leaves incognito and navigated-away tabs alone", async () => {
    const job = await createActiveJob()
    query.mockResolvedValue([
      { id: 11, incognito: true } as chrome.tabs.Tab,
      { id: 22 } as chrome.tabs.Tab,
      { id: 33 } as chrome.tabs.Tab,
    ])
    tabUrls.set(22, "https://example.test/other-work")
    await completeSwitch(job)
    expect(update).toHaveBeenLastCalledWith(33, { url: "https://sellercentral.amazon.com/home?store=test" })
    expect(remove).toHaveBeenCalledExactlyOnceWith(91)
  })

  it("keeps the helper's tab, unfocused, when no Seller Central tab is open to reload", async () => {
    const job = await createActiveJob()
    const windows = chrome.windows.get as ReturnType<typeof vi.fn>
    windows.mockRejectedValue(new Error("window closed"))
    const all = chrome.windows.getAll as ReturnType<typeof vi.fn>
    all.mockResolvedValue([{ id: 40, type: "normal", incognito: false }, { id: 8, type: "normal", incognito: false }])
    await completeSwitch(job)
    expect(move).toHaveBeenCalledWith(91, { windowId: 8, index: -1 })
    // Its page is already loaded, so it is told directly.
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(91, { type: "ACCOUNTS_SWITCH_DONE", storeName: "Example Outdoors" }, { documentId: "store-document" })
    expect(session.accountsSwitchNotice).toEqual({ tabId: 91, storeName: "Example Outdoors" })
    tabWindows.set(91, 40)
    local[CURRENT_STORE_KEY] = undefined
    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})
    expect(session.accountsSwitchNotice).toBeUndefined()
    all.mockResolvedValue([{ id: 40, type: "normal", incognito: false }])
    move.mockClear()
    await completeSwitch(session[ACTIVE_JOB_STORAGE_KEY] as { id: string })
    expect(move).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it("shows the finished-switch notice only to its tab until that tab dismisses it", async () => {
    const job = await createActiveJob()
    query.mockResolvedValue([{ id: 22, windowId: 4 } as chrome.tabs.Tab])
    await completeSwitch(job)
    const page = (tabId: number, frameId = 0) => ({ tab: { id: tabId } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/home", frameId })

    expect(await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE" }, page(22))).toEqual({ ok: true, storeName: "Example Outdoors" })
    expect(await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE" }, page(22, 3))).toEqual({ ok: true })
    expect(await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE" }, page(33))).toEqual({ ok: true })
    await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE_DISMISS" }, page(33))
    expect(session.accountsSwitchNotice).toBeDefined()
    await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE_DISMISS" }, page(22))
    expect(session.accountsSwitchNotice).toBeUndefined()
    expect(await handleAccountsMessage({ type: "ACCOUNTS_SWITCH_NOTICE" }, page(22))).toEqual({ ok: true })
  })

  it("reports the steps a running switch takes, and where a paused one is waiting", async () => {
    const job = await createActiveJob()
    expect(await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {})).toMatchObject({ activeSwitch: { stage: "logout", signIn: true } })
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId: job.id, reason: "captcha" }, { tab: { id: 91 } as chrome.tabs.Tab, url: SIGN_IN_URL })
    expect(await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {})).toMatchObject({ activeSwitch: { stage: "paused", resumeStage: "logout", signIn: true } })
  })

  it("brings the helper forward once for CAPTCHA and keeps the job resumable", async () => {
    const job = await createActiveJob()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: SIGN_IN_URL }
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId: job.id, reason: "captcha" }, sender)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_PAUSED", jobId: job.id, reason: "captcha" }, sender)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "paused", resumeStage: "signin" })
    expect(focusWindow).toHaveBeenCalledExactlyOnceWith(40, { focused: true, state: "normal" })
    expect(remove).not.toHaveBeenCalled()
    expect(await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {})).toMatchObject({ activeSwitch: { stage: "paused", attentionMessage: expect.stringContaining("CAPTCHA") } })
    await completeSwitch(job)
    expect(local[CURRENT_STORE_KEY]).toBe("store")
  })

  it("keeps a failed login available for manual completion without closing old tabs", async () => {
    const job = await createActiveJob()
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_ERROR", jobId: job.id, error: "Amazon rejected the login." }, { tab: { id: 91 } as chrome.tabs.Tab, url: SIGN_IN_URL })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ id: job.id, stage: "paused", resumeStage: "logout" })
    expect(focusWindow).toHaveBeenCalledWith(40, { focused: true, state: "normal" })
    expect(remove).not.toHaveBeenCalled()
  })

  it("cancels a readiness check in flight before any old tabs are closed", async () => {
    const job = await createActiveJob()
    const sender = await openSelectedStore(job)
    let entered!: () => void
    let release!: () => void
    const started = new Promise<void>((resolve) => { entered = resolve })
    const gate = new Promise<void>((resolve) => { release = resolve })
    const send = chrome.tabs.sendMessage as ReturnType<typeof vi.fn>
    send.mockImplementation(async (_id: number, message: { type: string }) => {
      if (message.type === "REPORTS_SESSION_STATUS") { entered(); await gate }
      return { ok: true, loggedInToStore: true, settled: true }
    })
    const ready = handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_STORE_READY", jobId: job.id }, sender)
    const rejected = expect(ready).rejects.toThrow(/cancelled/)
    await started
    const cancel = handleAccountsMessage({ type: "ACCOUNTS_CANCEL_SWITCH" }, {})
    release()
    await rejected
    await cancel
    expect(move).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledExactlyOnceWith(91)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it.each(["ACCOUNTS_LOCK", "ACCOUNTS_RESET"])("%s closes the helper without touching old Seller Central tabs", async (type) => {
    await createActiveJob()
    await handleAccountsMessage({ type }, {})
    expect(remove).toHaveBeenCalledExactlyOnceWith(91)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it("dispatches trusted mouse clicks in order on one debugger session, detaching on failure and after sign-in", async () => {
    const job = await createActiveJob()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" }
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "email" }, sender)

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "continue", x: 120.5, y: 240.25 }, sender)).resolves.toEqual({ ok: true })

    expect(debuggerAttach).toHaveBeenCalledWith({ tabId: 91 }, "1.3")
    expect(debuggerSendCommand.mock.calls).toEqual([
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mouseMoved", x: 120.5, y: 240.25 }],
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mousePressed", x: 120.5, y: 240.25, button: "left", clickCount: 1 }],
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mouseReleased", x: 120.5, y: 240.25, button: "left", clickCount: 1 }],
    ])
    expect(debuggerDetach).not.toHaveBeenCalled()

    // The next step reuses the session instead of attaching again.
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "password" }, sender)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "password-submit", x: 1, y: 2 }, sender)
    expect(debuggerAttach).toHaveBeenCalledTimes(1)
    expect(debuggerDetach).not.toHaveBeenCalled()

    debuggerSendCommand.mockRejectedValueOnce(new Error("dispatch failed"))
    ;(session[ACTIVE_JOB_STORAGE_KEY] as { stage: string }).stage = "otp"
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "otp-submit", x: 1, y: 2 }, sender)).rejects.toThrow("dispatch failed")
    expect(debuggerDetach).toHaveBeenCalledExactlyOnceWith({ tabId: 91 })

    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "otp-submit", x: 1, y: 2 }, sender)
    expect(debuggerAttach).toHaveBeenCalledTimes(2)
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id }, { ...sender, url: "https://sellercentral.amazon.com/home" })
    expect(debuggerDetach).toHaveBeenCalledTimes(2)
  })

  it("no longer handles passkey dismissal escape requests", async () => {
    const job = await createActiveJob()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" }

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_ESCAPE", jobId: job.id }, sender)).rejects.toThrow(/unknown account command/i)
    expect(debuggerAttach).not.toHaveBeenCalled()
  })

  it("rejects unauthorized or malformed trusted-click requests before attaching", async () => {
    const job = await createActiveJob()
    const validSender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" }

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "continue", x: 1, y: 2 }, { ...validSender, tab: { id: 12 } as chrome.tabs.Tab })).rejects.toThrow(/authorized/i)
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "continue", x: 1, y: 2 }, { ...validSender, url: "https://example.test/signin" })).rejects.toThrow(/origin/i)
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: "stale", action: "continue", x: 1, y: 2 }, validSender)).rejects.toThrow(/authorized/i)
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "unknown", x: 1, y: 2 }, validSender)).rejects.toThrow(/unsupported/i)
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "continue", x: Number.NaN, y: 2 }, validSender)).rejects.toThrow(/coordinates/i)
    expect(debuggerAttach).not.toHaveBeenCalled()
  })

  it("tracks the last palette-switched store and keeps it after lock", async () => {
    const job = await createActiveJob()
    expect((await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any).currentStore).toBeNull()

    await completeSwitch(job)
    const unlocked = await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any
    expect(unlocked.currentStore).toEqual({ id: "store", name: "Example Outdoors" })

    await handleAccountsMessage({ type: "ACCOUNTS_LOCK" }, {})
    const locked = await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any
    expect(locked.unlocked).toBe(false)
    expect(locked.currentStore).toEqual({ id: "store", name: "Example Outdoors" })
  })

  it("does not treat a cancelled switch as the current store", async () => {
    await createActiveJob()
    await handleAccountsMessage({ type: "ACCOUNTS_CANCEL_SWITCH" }, {})
    const status = await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any
    expect(status.currentStore).toBeNull()
  })

  it("clears the current store when that store is deleted or the vault is reset", async () => {
    const job = await createActiveJob()
    await completeSwitch(job)

    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "other", name: "North Shop", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    expect((await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any).currentStore).toBeNull()

    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "other" }, {})
    const nextJob = session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
    await completeSwitch(nextJob)
    expect((await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any).currentStore).toEqual({ id: "other", name: "North Shop" })

    await handleAccountsMessage({ type: "ACCOUNTS_RESET" }, {})
    expect((await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {}) as any).currentStore).toBeNull()
  })

  it("prefers the current window then the most recently accessed Seller Central tab", () => {
    const otherWindow = { id: 1, windowId: 2, lastAccessed: 999 } as chrome.tabs.Tab
    const olderSame = { id: 2, windowId: 4, lastAccessed: 10 } as chrome.tabs.Tab
    const newerSame = { id: 3, windowId: 4, lastAccessed: 50 } as chrome.tabs.Tab
    expect(pickSellerCentralTab([otherWindow, olderSame, newerSame], 4)?.id).toBe(3)
    expect(pickSellerCentralTab([], 4)).toBeUndefined()
  })

  it("rejects focusing Seller Central when no store is selected", async () => {
    await expect(handleAccountsMessage({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" }, {})).rejects.toThrow(/no store is currently selected/i)
    expect(query).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it("focuses an existing Seller Central tab when a store is current", async () => {
    local[CURRENT_STORE_KEY] = "store"
    query.mockResolvedValue([
      { id: 11, windowId: 2, lastAccessed: 200 } as chrome.tabs.Tab,
      { id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
    ])
    const sender = { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab }

    await expect(handleAccountsMessage({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" }, sender)).resolves.toEqual({ ok: true, focused: true })
    expect(query).toHaveBeenCalledWith({ url: SELLER_CENTRAL_TAB_URL_PATTERN })
    expect(update).toHaveBeenCalledWith(22, { active: true })
    expect(focusWindow).toHaveBeenCalledWith(4, { focused: true })
    expect(create).not.toHaveBeenCalled()
  })

  it("opens Seller Central when no matching tab exists", async () => {
    local[CURRENT_STORE_KEY] = "store"
    query.mockResolvedValue([])
    const sender = { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab }

    await expect(handleAccountsMessage({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" }, sender)).resolves.toEqual({ ok: true, opened: true })
    expect(create).toHaveBeenCalledWith({ active: true, url: SELLER_CENTRAL_HOME_URL, windowId: 4 })
    expect(update).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
  })

  it("skips logout for the same credential and loads the store once in the user's tab", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "shipping", name: "365 Shipping", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=365-shipping" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"
    query.mockResolvedValue([
      { id: 11, windowId: 2, lastAccessed: 50 } as chrome.tabs.Tab,
      { id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
    ])
    const sender = { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab }

    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "shipping" }, sender)).resolves.toMatchObject({ ok: true })

    // No helper window: the tab in the starting window loads the store in place.
    expect(create).not.toHaveBeenCalled()
    expect(createWindow).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledExactlyOnceWith(22, { url: vault.stores[1].storeUrl })
    expect(focusWindow).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect(local[CURRENT_STORE_KEY]).toBe("loving-home")
    expect(await handleAccountsMessage({ type: "ACCOUNTS_STATUS" }, {})).toMatchObject({ activeSwitch: { stage: "store", signIn: false } })
    await completeSwitch(session[ACTIVE_JOB_STORAGE_KEY] as { id: string })
    // The store is not loaded again; the other window's copy closes.
    expect(update).toHaveBeenCalledTimes(1)
    expect(move).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
    expect(remove).toHaveBeenCalledExactlyOnceWith(11)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(local[CURRENT_STORE_KEY]).toBe("shipping")
  })

  it("prefers loading the store into the tab the switch started from", async () => {
    const job = await (async () => {
      await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
      await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault: {
        version: 1,
        credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
        stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
      } }, {})
      await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab })
      return session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
    })()
    query.mockResolvedValue([
      { id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
      { id: 7, windowId: 4, lastAccessed: 10 } as chrome.tabs.Tab,
    ])
    await completeSwitch(job)
    expect(update).toHaveBeenLastCalledWith(7, { url: "https://sellercentral.amazon.com/home?store=test" })
    expect(remove).toHaveBeenCalledWith(22)
    expect(remove).not.toHaveBeenCalledWith(7)
  })

  it("closes duplicate Seller Central tabs after a logout-login switch completes", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})
    const job = session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
    query.mockResolvedValue([
      { id: 11, windowId: 2, lastAccessed: 50 } as chrome.tabs.Tab,
      { id: 91, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab,
      { id: 33, windowId: 4, lastAccessed: 80 } as chrome.tabs.Tab,
    ])

    await completeSwitch(job)

    expect(update).not.toHaveBeenCalledWith(91, { url: vault.stores[0].storeUrl })
    expect(update).toHaveBeenLastCalledWith(33, { url: vault.stores[0].storeUrl })
    expect(remove).toHaveBeenCalledWith(11)
    expect(remove).toHaveBeenCalledWith(91)
    expect(remove).not.toHaveBeenCalledWith(33)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it("opens the store URL when skipping login and no Seller Central tab exists", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "shipping", name: "365 Shipping", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=365-shipping" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"
    query.mockResolvedValue([])
    const sender = { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab }

    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "shipping" }, sender)).resolves.toMatchObject({ ok: true })

    expect(createWindow).toHaveBeenCalledWith({ url: "about:blank", type: "normal", focused: false, incognito: false })
    expect(update).toHaveBeenCalledWith(91, { url: vault.stores[1].storeUrl })
    expect(focusWindow).not.toHaveBeenCalled()
    tabIndexes.set(7, 3)
    await completeSwitch(session[ACTIVE_JOB_STORAGE_KEY] as { id: string })
    // The finished tab lands beside the tab the switch started from, without taking focus.
    expect(move).toHaveBeenCalledWith(91, { windowId: 4, index: 4 })
    expect(focusWindow).not.toHaveBeenCalled()
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
    expect(local[CURRENT_STORE_KEY]).toBe("shipping")
  })

  it("leaves existing Seller Central tabs alone while switching a different credential in the helper", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [
        { id: "credential-a", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/A?secret=JBSWY3DPEHPK3PXP" },
        { id: "credential-b", domain: "other@example.test", password: "other-password", otpAuthUri: "otpauth://totp/B?secret=JBSWY3DPEHPK3PXP" },
      ],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential-a", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "north", name: "North Shop", credentialId: "credential-b", storeUrl: "https://sellercentral.amazon.com/home?store=north" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])
    const sender = { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab }

    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "north" }, sender)

    expect(create).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith(91, { url: LOGOUT_URL })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ storeId: "north", stage: "logout", tabId: 91, ownsTab: true, helperWindowId: 40, returnWindowId: 4 })
    expect(remove).not.toHaveBeenCalled()
    expect(focusWindow).not.toHaveBeenCalled()
    expect(local[CURRENT_STORE_KEY]).toBeUndefined()
  })

  it("creates a login tab when switching credentials and no Seller Central tab exists", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [
        { id: "credential-a", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/A?secret=JBSWY3DPEHPK3PXP" },
        { id: "credential-b", domain: "other@example.test", password: "other-password", otpAuthUri: "otpauth://totp/B?secret=JBSWY3DPEHPK3PXP" },
      ],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential-a", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "north", name: "North Shop", credentialId: "credential-b", storeUrl: "https://sellercentral.amazon.com/home?store=north" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"

    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "north" }, {})

    expect(createWindow).toHaveBeenCalledWith({ url: "about:blank", type: "normal", focused: false, incognito: false })
    expect(update).toHaveBeenCalledWith(91, { url: LOGOUT_URL })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ storeId: "north", stage: "logout", ownsTab: true })
    expect(local[CURRENT_STORE_KEY]).toBeUndefined()
  })

  it("closes only the helper tab when canceling a switch", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [
        { id: "credential-a", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/A?secret=JBSWY3DPEHPK3PXP" },
        { id: "credential-b", domain: "other@example.test", password: "other-password", otpAuthUri: "otpauth://totp/B?secret=JBSWY3DPEHPK3PXP" },
      ],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential-a", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "north", name: "North Shop", credentialId: "credential-b", storeUrl: "https://sellercentral.amazon.com/home?store=north" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"
    query.mockResolvedValue([{ id: 22, windowId: 4, lastAccessed: 100 } as chrome.tabs.Tab])

    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "north" }, { tab: { id: 7, windowId: 4 } as chrome.tabs.Tab })
    await handleAccountsMessage({ type: "ACCOUNTS_CANCEL_SWITCH" }, {})

    expect(remove).toHaveBeenCalledExactlyOnceWith(91)
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
  })

  it("still logs out when no current store is recorded", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "shipping", name: "365 Shipping", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=365-shipping" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})

    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "shipping" }, {})

    expect(createWindow).toHaveBeenCalledWith({ url: "about:blank", type: "normal", focused: false, incognito: false })
    expect(update).toHaveBeenCalledWith(91, { url: LOGOUT_URL })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ storeId: "shipping", stage: "logout", ownsTab: true })
    expect(local[CURRENT_STORE_KEY]).toBeUndefined()
  })

  it("does not skip login while another switch job is running", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [
        { id: "loving-home", name: "Loving Home USA", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=loving-home" },
        { id: "shipping", name: "365 Shipping", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=365-shipping" },
      ],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    local[CURRENT_STORE_KEY] = "loving-home"
    session[ACTIVE_JOB_STORAGE_KEY] = { id: "job-1", tabId: 91, storeId: "loving-home", stage: "logout", startedAt: Date.now(), ownsTab: true }

    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "shipping" }, {})).rejects.toThrow(/already running/i)
    expect(create).not.toHaveBeenCalled()
    expect(local[CURRENT_STORE_KEY]).toBe("loving-home")
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ id: "job-1" })
  })
})
