export const VAULT_STORAGE_KEY = "accountsVault"
export const STORE_INDEX_KEY = "accountsStoreIndex"
export const SESSION_KEY_STORAGE_KEY = "accountsSessionKey"
export const ACTIVE_JOB_STORAGE_KEY = "accountsActiveJob"
export const CURRENT_STORE_KEY = "accountsCurrentStore"
export const PBKDF2_ITERATIONS = 600_000

export interface StoreRecord {
  id: string
  name: string
  credentialId: string
  storeUrl: string
}

export interface CredentialRecord {
  id: string
  domain: string
  password: string
  otpAuthUri: string
}

export interface AccountVault {
  version: 1
  stores: StoreRecord[]
  credentials: CredentialRecord[]
}

export interface EncryptedVault {
  version: 1
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export interface StoreIndexRecord {
  id: string
  name: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function asBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

export function emptyVault(): AccountVault {
  return { version: 1, stores: [], credentials: [] }
}

export async function deriveVaultKey(
  masterPassword: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveBits"],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: asBuffer(salt), iterations },
    material,
    256,
  )
  return new Uint8Array(bits)
}

async function importAesKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", asBuffer(keyBytes), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ])
}

export async function encryptVault(
  vault: AccountVault,
  masterPassword: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<{ envelope: EncryptedVault; keyBytes: Uint8Array }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyBytes = await deriveVaultKey(masterPassword, salt, iterations)
  return {
    envelope: await encryptVaultWithKey(vault, keyBytes, salt, iterations),
    keyBytes,
  }
}

export async function encryptVaultWithKey(
  vault: AccountVault,
  keyBytes: Uint8Array,
  salt: Uint8Array,
  iterations: number,
): Promise<EncryptedVault> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: asBuffer(iv) },
    await importAesKey(keyBytes),
    encoder.encode(JSON.stringify(vault)),
  )
  return {
    version: 1,
    iterations,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  }
}

export async function decryptVault(
  envelope: EncryptedVault,
  masterPassword: string,
): Promise<{ vault: AccountVault; keyBytes: Uint8Array }> {
  const salt = base64ToBytes(envelope.salt)
  const keyBytes = await deriveVaultKey(
    masterPassword,
    salt,
    envelope.iterations,
  )
  return { vault: await decryptVaultWithKey(envelope, keyBytes), keyBytes }
}

export async function decryptVaultWithKey(
  envelope: EncryptedVault,
  keyBytes: Uint8Array,
): Promise<AccountVault> {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: asBuffer(base64ToBytes(envelope.iv)) },
    await importAesKey(keyBytes),
    asBuffer(base64ToBytes(envelope.ciphertext)),
  )
  const vault = JSON.parse(decoder.decode(plaintext)) as AccountVault
  if (vault.version !== 1 || !Array.isArray(vault.stores) || !Array.isArray(vault.credentials)) {
    throw new Error("The account vault has an unsupported format.")
  }
  return vault
}

export function serializeKey(keyBytes: Uint8Array): string {
  return bytesToBase64(keyBytes)
}

export function deserializeKey(value: string): Uint8Array {
  return base64ToBytes(value)
}

export function publicStoreIndex(vault: AccountVault): StoreIndexRecord[] {
  return vault.stores.map(({ id, name }) => ({ id, name }))
}

export function validateStoreUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "sellercentral.amazon.com"
  } catch {
    return false
  }
}

export interface ParsedOtpAuth {
  secret: Uint8Array
  algorithm: "SHA-1" | "SHA-256" | "SHA-512"
  digits: number
  period: number
}

export function decodeBase32(value: string): Uint8Array {
  const normalized = value.toUpperCase().replace(/=+$/u, "").replace(/\s+/gu, "")
  if (!normalized || /[^A-Z2-7]/u.test(normalized)) throw new Error("Invalid Base32 secret.")
  let bits = ""
  for (const character of normalized) {
    const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(character)
    bits += code.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(Number.parseInt(bits.slice(index, index + 8), 2))
  }
  return new Uint8Array(bytes)
}

export function parseOtpAuthUri(value: string): ParsedOtpAuth {
  const url = new URL(value)
  if (url.protocol !== "otpauth:" || url.hostname !== "totp") {
    throw new Error("Use an otpauth://totp URI.")
  }
  const algorithmValue = (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase()
  const algorithm = algorithmValue.replace("SHA", "SHA-") as ParsedOtpAuth["algorithm"]
  if (!(["SHA-1", "SHA-256", "SHA-512"] as string[]).includes(algorithm)) {
    throw new Error("Unsupported TOTP algorithm.")
  }
  const digits = Number(url.searchParams.get("digits") ?? "6")
  const period = Number(url.searchParams.get("period") ?? "30")
  if (!Number.isInteger(digits) || digits < 6 || digits > 8) throw new Error("TOTP digits must be 6–8.")
  if (!Number.isInteger(period) || period < 15 || period > 120) throw new Error("TOTP period must be 15–120 seconds.")
  return {
    secret: decodeBase32(url.searchParams.get("secret") ?? ""),
    algorithm,
    digits,
    period,
  }
}

export async function generateTotp(value: string, now = Date.now()): Promise<string> {
  const parsed = parseOtpAuthUri(value)
  const counter = Math.floor(now / 1000 / parsed.period)
  const data = new Uint8Array(8)
  new DataView(data.buffer).setBigUint64(0, BigInt(counter))
  const key = await crypto.subtle.importKey(
    "raw",
    asBuffer(parsed.secret),
    { name: "HMAC", hash: parsed.algorithm },
    false,
    ["sign"],
  )
  const hash = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuffer(data)))
  const offset = hash.at(-1)! & 0x0f
  const code =
    (((hash[offset] & 0x7f) << 24) |
      (hash[offset + 1] << 16) |
      (hash[offset + 2] << 8) |
      hash[offset + 3]) %
    10 ** parsed.digits
  return code.toString().padStart(parsed.digits, "0")
}
