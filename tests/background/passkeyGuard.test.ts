import { afterEach, describe, expect, it, vi } from "vitest"

import { setPasskeyGuard } from "../../src/background/switch/passkeyGuard"

function mockScripting() {
  const registered = new Map<string, chrome.scripting.RegisteredContentScript>()
  const scripting = {
    getRegisteredContentScripts: vi.fn(async ({ ids }: { ids: string[] }) => ids.filter((id) => registered.has(id)).map((id) => registered.get(id)!)),
    registerContentScripts: vi.fn(async (scripts: chrome.scripting.RegisteredContentScript[]) => {
      for (const script of scripts) {
        if (registered.has(script.id)) throw new Error("Duplicate script ID")
        registered.set(script.id, script)
      }
    }),
    unregisterContentScripts: vi.fn(async ({ ids }: { ids: string[] }) => {
      for (const id of ids) if (!registered.delete(id)) throw new Error("Nonexistent script ID")
    }),
  }
  vi.stubGlobal("chrome", { scripting })
  return { registered, scripting }
}

afterEach(() => vi.unstubAllGlobals())

describe("setPasskeyGuard", () => {
  it("registers the guard in the MAIN world at document_start for every Seller Central frame, this session only", async () => {
    const { registered } = mockScripting()
    await setPasskeyGuard(true)
    expect([...registered.values()]).toEqual([{
      id: "passkey-guard",
      matches: ["https://sellercentral.amazon.com/*"],
      js: ["passkey-guard.js"],
      runAt: "document_start",
      world: "MAIN",
      allFrames: true,
      persistAcrossSessions: false,
    }])
    await setPasskeyGuard(false)
    expect(registered.size).toBe(0)
  })

  it("never races itself when turned on and off at once", async () => {
    const { registered, scripting } = mockScripting()
    await Promise.all([setPasskeyGuard(true), setPasskeyGuard(true), setPasskeyGuard(false), setPasskeyGuard(false), setPasskeyGuard(true)])
    expect(registered.has("passkey-guard")).toBe(true)
    expect(scripting.registerContentScripts).toHaveBeenCalledTimes(2)
    expect(scripting.unregisterContentScripts).toHaveBeenCalledOnce()
  })
})
