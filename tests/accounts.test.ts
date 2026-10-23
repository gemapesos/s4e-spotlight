import { webcrypto } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"

import {
  decodeBase32,
  decryptSharedVault,
  decryptVault,
  emptyVault,
  encryptSharedVault,
  encryptVault,
  generateTotp,
  mergeVaults,
  parseOtpAuthUri,
  publicStoreIndex,
  SHARE_DECRYPT_ERROR,
  SHARE_FILE_KIND,
  validateStoreUrl,
  type AccountVault,
} from "../src/lib/accounts"

beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto })
})

describe("account vault cryptography", () => {
  it("encrypts and decrypts a vault without exposing records in ciphertext", async () => {
    const vault: AccountVault = {
      version: 1,
      stores: [{ id: "store-1", name: "Example Store", credentialId: "credential-1", storeUrl: "https://sellercentral.amazon.com/home?store=example" }],
      credentials: [{ id: "credential-1", domain: "example@example.test", password: "example-password", otpAuthUri: "otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP" }],
    }
    const { envelope } = await encryptVault(vault, "correct horse battery staple", 1_000)

    expect(JSON.stringify(envelope)).not.toContain("example-password")
    expect((await decryptVault(envelope, "correct horse battery staple")).vault).toEqual(vault)
    await expect(decryptVault(envelope, "wrong password")).rejects.toThrow()
  })

  it("rejects tampered ciphertext", async () => {
    const { envelope } = await encryptVault(emptyVault(), "correct horse battery staple", 1_000)
    const final = envelope.ciphertext.at(-1) === "A" ? "B" : "A"
    await expect(decryptVault({ ...envelope, ciphertext: envelope.ciphertext.slice(0, -1) + final }, "correct horse battery staple")).rejects.toThrow()
  })

  it("publishes only store identifiers and names", () => {
    const vault: AccountVault = { version: 1, stores: [{ id: "s", name: "Store", credentialId: "c", storeUrl: "https://sellercentral.amazon.com/home" }], credentials: [{ id: "c", domain: "private@example.test", password: "secret", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }] }
    expect(publicStoreIndex(vault)).toEqual([{ id: "s", name: "Store" }])
    expect(JSON.stringify(publicStoreIndex(vault))).not.toContain("private")
  })
})

describe("shared vault file", () => {
  it.each([1, 1000, 599_999])("rejects a share file with %i KDF iterations", async (iterations) => {
    await expect(decryptSharedVault({ kind: SHARE_FILE_KIND, version: 1, iterations, salt: "fixture", iv: "fixture", ciphertext: "fixture" }, "fixture-share-password")).rejects.toThrow(SHARE_DECRYPT_ERROR)
  })
  const sharePassword = "share-password"
  const vault: AccountVault = {
    version: 1,
    stores: [{ id: "store-1", name: "Example Store", credentialId: "credential-1", storeUrl: "https://sellercentral.amazon.com/home?store=example" }],
    credentials: [{ id: "credential-1", domain: "example@example.test", password: "example-password", otpAuthUri: "otpauth://totp/Example?secret=JBSWY3DPEHPK3PXP" }],
  }

  it("encrypts with the share password and keeps secrets out of the file", async () => {
    const file = await encryptSharedVault(vault, sharePassword, 600_000)

    expect(file.kind).toBe(SHARE_FILE_KIND)
    expect(JSON.stringify(file)).not.toContain("example-password")
    expect(JSON.stringify(file)).not.toContain("example@example.test")
    expect(JSON.stringify(file)).not.toContain("Example Store")
    expect(await decryptSharedVault(file, sharePassword)).toEqual(vault)
    await expect(decryptSharedVault(file, "correct horse battery staple")).rejects.toThrow(SHARE_DECRYPT_ERROR)
    await expect(decryptSharedVault({ version: 1, iterations: file.iterations, salt: file.salt, iv: file.iv, ciphertext: file.ciphertext }, sharePassword)).rejects.toThrow(/not a shared vault/i)
  })

  it("rejects a damaged share file and drops fields outside the vault schema", async () => {
    const file = await encryptSharedVault(vault, sharePassword, 600_000)
    const damaged = file.ciphertext.at(-1) === "A" ? "B" : "A"
    await expect(decryptSharedVault({ ...file, ciphertext: file.ciphertext.slice(0, -1) + damaged }, sharePassword)).rejects.toThrow(SHARE_DECRYPT_ERROR)
    await expect(decryptSharedVault({ ...file, iterations: 600_001 }, sharePassword)).rejects.toThrow(SHARE_DECRYPT_ERROR)

    const dirty = {
      version: 1 as const,
      credentials: [{ ...vault.credentials[0], note: "secret-note" }],
      stores: [{ ...vault.stores[0], owner: "secret-owner" }],
    }
    const { envelope } = await encryptVault(dirty, sharePassword, 600_000)
    const shared = await decryptSharedVault({ ...envelope, kind: SHARE_FILE_KIND }, sharePassword)
    expect(shared).toEqual(vault)
    expect(JSON.stringify(shared)).not.toContain("secret-note")
  })

  it("merges shared accounts without dropping or colliding with local ones", () => {
    const current: AccountVault = {
      version: 1,
      credentials: [
        { id: "local-credential", domain: "local@example.test", password: "local-password", otpAuthUri: "otpauth://totp/Local?secret=JBSWY3DPEHPK3PXP" },
        { id: "shared-credential", domain: "shared@example.test", password: "old-password", otpAuthUri: "otpauth://totp/Shared?secret=JBSWY3DPEHPK3PXP" },
      ],
      stores: [{ id: "local-store", name: "Local Store", credentialId: "local-credential", storeUrl: "https://sellercentral.amazon.com/home?store=local" }],
    }
    const incoming: AccountVault = {
      version: 1,
      credentials: [{ id: "shared-credential", domain: "shared@example.test", password: "new-password", otpAuthUri: "otpauth://totp/Shared?secret=JBSWY3DPEHPK3PXP" }],
      stores: [{ id: "shared-store", name: "Shared Store", credentialId: "shared-credential", storeUrl: "https://sellercentral.amazon.com/home?store=shared" }],
    }

    const merged = mergeVaults(current, incoming)
    expect(merged.added).toEqual({ credentials: 0, stores: 1 })
    expect(merged.updated).toEqual({ credentials: 1, stores: 0 })
    expect(merged.vault.credentials.map(({ id, password }) => [id, password])).toEqual([
      ["local-credential", "local-password"],
      ["shared-credential", "new-password"],
    ])
    expect(merged.vault.stores.map(({ id }) => id)).toEqual(["local-store", "shared-store"])
    expect(current.credentials[1].password).toBe("old-password")

    expect(() => mergeVaults(current, {
      version: 1,
      credentials: [{ id: "other-credential", domain: "local@example.test", password: "incoming-password", otpAuthUri: "otpauth://totp/Other?secret=JBSWY3DPEHPK3PXP" }],
      stores: [],
    })).toThrow(/different credential/i)
    expect(() => mergeVaults(current, {
      version: 1,
      credentials: [],
      stores: [{ id: "other-store", name: "Local Store", credentialId: "local-credential", storeUrl: "https://sellercentral.amazon.com/home?store=other" }],
    })).toThrow(/different store/i)
  })
})

describe("TOTP and account validation", () => {
  it("matches the RFC 6238 SHA-1 test vector", async () => {
    expect(await generateTotp("otpauth://totp/RFC?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&algorithm=SHA1&digits=8&period=30", 59_000)).toBe("94287082")
  })

  it("validates Base32, OTP parameters, and exact Seller Central URLs", () => {
    expect(Array.from(decodeBase32("JBSWY3DP"))).toEqual([72, 101, 108, 108, 111])
    expect(parseOtpAuthUri("otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP")).toMatchObject({ algorithm: "SHA-1", digits: 6, period: 30 })
    expect(() => parseOtpAuthUri("otpauth://hotp/Test?secret=JBSWY3DPEHPK3PXP")).toThrow()
    expect(validateStoreUrl("https://sellercentral.amazon.com/home?merchant=one")).toBe(true)
    expect(validateStoreUrl("https://sellercentral.amazon.com.evil.test/home")).toBe(false)
    expect(validateStoreUrl("http://sellercentral.amazon.com/home")).toBe(false)
  })
})
