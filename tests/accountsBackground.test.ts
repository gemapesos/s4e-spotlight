import { webcrypto } from "node:crypto"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LOGOUT_URL, handleAccountsMessage, validateVault } from "../src/background"
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
  const debuggerAttach = vi.fn(async () => undefined)
  const debuggerSendCommand = vi.fn(async () => undefined)
  const debuggerDetach = vi.fn(async () => undefined)

  beforeEach(() => {
    for (const key of Object.keys(local)) delete local[key]
    for (const key of Object.keys(session)) delete session[key]
    create.mockClear(); update.mockClear()
    debuggerAttach.mockReset(); debuggerSendCommand.mockReset(); debuggerDetach.mockReset()
    debuggerAttach.mockResolvedValue(undefined)
    debuggerSendCommand.mockResolvedValue(undefined)
    debuggerDetach.mockResolvedValue(undefined)
    vi.stubGlobal("crypto", webcrypto)
    vi.stubGlobal("chrome", {
      storage: { local: storageArea(local), session: storageArea(session) },
      tabs: { create, update },
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
    expect(create).toHaveBeenCalledWith({ active: true, url: LOGOUT_URL })
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

  it("dispatches a trusted mouse click in order and always detaches", async () => {
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

  it("rejects unauthorized trusted-click requests before attaching", async () => {
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
