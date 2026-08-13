import { webcrypto } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LOGOUT_URL, SIGN_IN_URL, handleAccountTabUpdated, handleAccountsMessage, validateVault } from "../src/background"
import { ACTIVE_JOB_STORAGE_KEY, STORE_INDEX_KEY, type AccountVault } from "../src/lib/accounts"

function storageArea(values: Record<string, unknown>) {
  return {
    get: vi.fn(async (keys: string | string[]) => {
      const names = Array.isArray(keys) ? keys : [keys]
      return Object.fromEntries(names.filter((key) => key in values).map((key) => [key, values[key]]))
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
  const update = vi.fn(async () => ({}))
  const remove = vi.fn(async () => undefined)
  const debuggerAttach = vi.fn(async () => undefined)
  const debuggerSendCommand = vi.fn(async () => undefined)
  const debuggerDetach = vi.fn(async () => undefined)

  beforeEach(() => {
    for (const key of Object.keys(local)) delete local[key]
    for (const key of Object.keys(session)) delete session[key]
    create.mockReset(); create.mockResolvedValue({ id: 91, windowId: 4 }); update.mockClear(); remove.mockClear()
    debuggerAttach.mockReset(); debuggerSendCommand.mockReset(); debuggerDetach.mockReset()
    debuggerAttach.mockResolvedValue(undefined)
    debuggerSendCommand.mockResolvedValue(undefined)
    debuggerDetach.mockResolvedValue(undefined)
    vi.stubGlobal("crypto", webcrypto)
    vi.stubGlobal("chrome", {
      storage: { local: storageArea(local), session: storageArea(session) },
      tabs: { create, update, remove },
      runtime: { openOptionsPage: vi.fn(async () => undefined) },
      debugger: { attach: debuggerAttach, sendCommand: debuggerSendCommand, detach: debuggerDetach },
    })
  })

  afterEach(() => vi.unstubAllGlobals())

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

  it("enforces one authorized switch and releases only the requested field", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home?store=test" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    await handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})
    expect(create).toHaveBeenCalledWith({ active: true, url: "about:blank" })
    expect(update).toHaveBeenCalledWith(91, { url: LOGOUT_URL })
    await expect(handleAccountsMessage({ type: "ACCOUNTS_START_SWITCH", storeId: "store" }, {})).rejects.toThrow(/already running/i)
    const job = session[ACTIVE_JOB_STORAGE_KEY] as { id: string }
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "password" }, { tab: { id: 12 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" })).rejects.toThrow(/authorized/i)
    const email = await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_SECRET", jobId: job.id, kind: "email" }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" })
    expect(email).toEqual({ ok: true, value: "operator@example.test" })
    expect(JSON.stringify(email)).not.toContain("private-password")
    await handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_COMPLETE", jobId: job.id }, { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/home" })
    expect(update).toHaveBeenCalledWith(91, { url: vault.stores[0].storeUrl })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toBeUndefined()
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
    expect(create).toHaveBeenCalledOnce()
  })

  it("cleans up the reservation when login-tab creation fails", async () => {
    await handleAccountsMessage({ type: "ACCOUNTS_CREATE", masterPassword: "a strong master password" }, {})
    const vault: AccountVault = {
      version: 1,
      credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
    }
    await handleAccountsMessage({ type: "ACCOUNTS_SAVE_VAULT", vault }, {})
    create.mockRejectedValueOnce(new Error("create failed"))

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

  it("routes a completed logout page to the canonical sign-in URL", async () => {
    await createActiveJob()
    update.mockClear()

    await handleAccountTabUpdated(91, { status: "complete" }, { id: 91, url: LOGOUT_URL } as chrome.tabs.Tab)

    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledWith(91, { url: SIGN_IN_URL })
  })

  it("lets the content script leave a logout re-auth page for canonical sign-in", async () => {
    const job = await createActiveJob()
    update.mockClear()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin?openid.return_to=https%3A%2F%2Fsellercentral.amazon.com%2Fsign-out" }

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_LEAVE_LOGOUT", jobId: job.id }, sender)).resolves.toEqual({ ok: true })
    expect(session[ACTIVE_JOB_STORAGE_KEY]).toMatchObject({ stage: "signin" })
    expect(update).toHaveBeenCalledWith(91, { url: SIGN_IN_URL })
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

  it("dispatches trusted mouse clicks in order and always detaches", async () => {
    const job = await createActiveJob()
    const sender = { tab: { id: 91 } as chrome.tabs.Tab, url: "https://sellercentral.amazon.com/ap/signin" }

    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "continue", x: 120.5, y: 240.25 }, sender)).resolves.toEqual({ ok: true })

    expect(debuggerAttach).toHaveBeenCalledWith({ tabId: 91 }, "1.3")
    expect(debuggerSendCommand.mock.calls).toEqual([
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mouseMoved", x: 120.5, y: 240.25 }],
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mousePressed", x: 120.5, y: 240.25, button: "left", clickCount: 1 }],
      [{ tabId: 91 }, "Input.dispatchMouseEvent", { type: "mouseReleased", x: 120.5, y: 240.25, button: "left", clickCount: 1 }],
    ])
    expect(debuggerDetach).toHaveBeenCalledWith({ tabId: 91 })

    debuggerSendCommand.mockRejectedValueOnce(new Error("dispatch failed"))
    await expect(handleAccountsMessage({ type: "ACCOUNT_AUTOMATION_CLICK", jobId: job.id, action: "otp-submit", x: 1, y: 2 }, sender)).rejects.toThrow("dispatch failed")
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
})
