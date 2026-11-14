import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  installPasskeyGuard,
  isPublicKeyRequest,
  isSameOriginSellerCentralFrame,
  PASSKEY_GUARD_KEY,
} from "../../src/content/passkeyGuardCore"

const SELLER_CENTRAL = "https://sellercentral.amazon.com/ap/signin"

function ensureCredentialsApi() {
  if (!globalThis.Credential) {
    class MockCredential {
      readonly id: string
      constructor(init?: { id?: string }) {
        this.id = init?.id ?? "credential"
      }
    }
    vi.stubGlobal("Credential", MockCredential)
  }

  if (!navigator.credentials) {
    Object.defineProperty(navigator, "credentials", {
      configurable: true,
      value: {
        get: vi.fn(async () => null),
        create: vi.fn(async () => null),
      },
    })
  }
}

function mockPublicKeyCredential() {
  class MockPublicKeyCredential {
    static isConditionalMediationAvailable = vi.fn(async () => true)
    static isUserVerifyingPlatformAuthenticatorAvailable = vi.fn(async () => true)
  }
  vi.stubGlobal("PublicKeyCredential", MockPublicKeyCredential)
  return MockPublicKeyCredential
}

async function loadPasskeyGuard(origin = SELLER_CENTRAL) {
  vi.stubGlobal("location", new URL(origin))
  vi.resetModules()
  await import("../../src/content/passkeyGuard")
}

beforeEach(() => {
  vi.restoreAllMocks()
  ensureCredentialsApi()
})

afterEach(() => {
  const passkeyGuardWindow = window as typeof window & {
    [PASSKEY_GUARD_KEY]?: { destroy: () => void }
  }
  passkeyGuardWindow[PASSKEY_GUARD_KEY]?.destroy()
  delete passkeyGuardWindow[PASSKEY_GUARD_KEY]
  vi.unstubAllGlobals()
})

describe("passkey guard helpers", () => {
  it("detects public-key credential requests", () => {
    expect(isPublicKeyRequest({ publicKey: { challenge: new Uint8Array() } } as CredentialRequestOptions)).toBe(true)
    expect(isPublicKeyRequest({ password: true } as CredentialRequestOptions)).toBe(false)
    expect(isPublicKeyRequest(undefined)).toBe(false)
  })

  it("matches only Seller Central same-origin frames", () => {
    vi.stubGlobal("location", new URL(SELLER_CENTRAL))
    expect(isSameOriginSellerCentralFrame()).toBe(true)
    vi.stubGlobal("location", new URL("https://example.test/"))
    expect(isSameOriginSellerCentralFrame()).toBe(false)
  })
})

describe("Seller Central passkey guard", () => {
  it("rejects WebAuthn get/create calls with NotAllowedError", async () => {
    mockPublicKeyCredential()
    const controller = installPasskeyGuard(window)
    const publicKeyOptions = { publicKey: { challenge: new Uint8Array([1, 2, 3]) } } as CredentialRequestOptions

    await expect(navigator.credentials.get(publicKeyOptions)).rejects.toMatchObject({
      name: "NotAllowedError",
    })
    await expect(navigator.credentials.create(publicKeyOptions as CredentialCreationOptions)).rejects.toMatchObject({
      name: "NotAllowedError",
    })

    controller.destroy()
  })

  it("delegates non-passkey credential calls to the original APIs", async () => {
    const passwordCredential = { id: "password-credential" } as Credential
    const originalGet = vi.fn(async () => passwordCredential)
    const originalCreate = vi.fn(async () => passwordCredential)
    navigator.credentials.get = originalGet
    navigator.credentials.create = originalCreate

    const controller = installPasskeyGuard(window)

    await expect(navigator.credentials.get({ password: true } as CredentialRequestOptions)).resolves.toBe(passwordCredential)
    await expect(navigator.credentials.create({ password: true } as CredentialCreationOptions)).resolves.toBe(passwordCredential)
    expect(originalGet).toHaveBeenCalledWith({ password: true })
    expect(originalCreate).toHaveBeenCalledWith({ password: true })

    controller.destroy()
  })

  it("reports conditional passkeys and platform authenticators as unavailable", async () => {
    mockPublicKeyCredential()
    const controller = installPasskeyGuard(window)

    await expect(PublicKeyCredential.isConditionalMediationAvailable()).resolves.toBe(false)
    await expect(PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()).resolves.toBe(false)

    controller.destroy()
  })

  it("installs automatically on Seller Central and restores on teardown", async () => {
    mockPublicKeyCredential()
    await loadPasskeyGuard()

    await expect(
      navigator.credentials.get({ publicKey: { challenge: new Uint8Array([9]) } } as CredentialRequestOptions),
    ).rejects.toMatchObject({ name: "NotAllowedError" })

    ;(
      window as typeof window & {
        [PASSKEY_GUARD_KEY]?: { destroy: () => void }
      }
    )[PASSKEY_GUARD_KEY]?.destroy()

    const originalGet = vi.fn(async () => null)
    navigator.credentials.get = originalGet
    await expect(navigator.credentials.get({ publicKey: { challenge: new Uint8Array([9]) } } as CredentialRequestOptions)).resolves.toBeNull()
    expect(originalGet).toHaveBeenCalledOnce()
  })

  it("does not install outside Seller Central", async () => {
    mockPublicKeyCredential()
    const originalGet = vi.fn(async () => null)
    navigator.credentials.get = originalGet

    await loadPasskeyGuard("https://example.test/signin")

    expect(
      (window as typeof window & { [PASSKEY_GUARD_KEY]?: unknown })[PASSKEY_GUARD_KEY],
    ).toBeUndefined()
    await expect(navigator.credentials.get({ publicKey: { challenge: new Uint8Array([4]) } } as CredentialRequestOptions)).resolves.toBeNull()
    expect(originalGet).toHaveBeenCalledOnce()
  })
})

describe("manifest passkey guard injection", () => {
  it("leaves passkey-guard.js out of the manifest, so passkeys work on Seller Central outside a switch", async () => {
    const manifest = JSON.parse(await readFile(resolve(process.cwd(), "public/manifest.json"), "utf8")) as {
      content_scripts: Array<{ js?: string[] }>
      permissions: string[]
    }
    expect(manifest.content_scripts.some((script) => script.js?.includes("passkey-guard.js"))).toBe(false)
    expect(manifest.permissions).toContain("scripting")
  })
})
