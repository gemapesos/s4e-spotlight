import { webcrypto } from "node:crypto"
import { beforeAll, describe, expect, it } from "vitest"

import {
  decodeBase32,
  decryptVault,
  emptyVault,
  encryptVault,
  generateTotp,
  parseOtpAuthUri,
  publicStoreIndex,
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
