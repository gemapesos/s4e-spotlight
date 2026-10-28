/** The encrypted account vault in storage, and the store last switched to. */
import { type AccountVault, CURRENT_STORE_KEY, decryptVaultWithKey, deserializeKey, type EncryptedVault, encryptVaultWithKey, parseOtpAuthUri, publicStoreIndex, SESSION_KEY_STORAGE_KEY, STORE_INDEX_KEY, type StoreIndexRecord, validateStoreUrl, VAULT_STORAGE_KEY } from "@/lib/accounts"
import { assertVaultOperationCurrent } from "./operations"

export const UNLOCK_ATTEMPTS_KEY = "accountsUnlockAttempts"
export function validateVault(vault: AccountVault): void {
  const names = new Set<string>()
  const domains = new Set<string>()
  const credentialIds = new Set(vault.credentials.map(({ id }) => id))
  for (const credential of vault.credentials) {
    const domain = credential.domain.trim().toLowerCase()
    if (!domain || domains.has(domain)) throw new Error("Credential domains must be present and unique.")
    domains.add(domain)
    if (!credential.password) throw new Error("Each credential needs a password.")
    parseOtpAuthUri(credential.otpAuthUri)
  }
  for (const store of vault.stores) {
    const name = store.name.trim().toLowerCase()
    if (!name || names.has(name)) throw new Error("Store names must be present and unique.")
    names.add(name)
    if (!credentialIds.has(store.credentialId)) throw new Error(`Store “${store.name}” references a missing credential.`)
    if (!validateStoreUrl(store.storeUrl)) throw new Error(`Store “${store.name}” needs an HTTPS Seller Central URL.`)
  }
}

export async function getEnvelope(): Promise<EncryptedVault | undefined> {
  return (await chrome.storage.local.get(VAULT_STORAGE_KEY))[VAULT_STORAGE_KEY] as EncryptedVault | undefined
}
export async function getSessionKey(): Promise<Uint8Array | undefined> {
  const value = (await chrome.storage.session.get(SESSION_KEY_STORAGE_KEY))[SESSION_KEY_STORAGE_KEY]
  return typeof value === "string" ? deserializeKey(value) : undefined
}
export async function getUnlockedVault(): Promise<{ vault: AccountVault; envelope: EncryptedVault; key: Uint8Array }> {
  const [envelope, key] = await Promise.all([getEnvelope(), getSessionKey()])
  if (!envelope) throw new Error("Create the account vault first.")
  if (!key) throw new Error("The account vault is locked.")
  const vault = await decryptVaultWithKey(envelope, key)
  assertVaultOperationCurrent()
  return { vault, envelope, key }
}
export async function saveVault(vault: AccountVault, envelope: EncryptedVault, key: Uint8Array): Promise<void> {
  validateVault(vault)
  const salt = Uint8Array.from(atob(envelope.salt), (c) => c.charCodeAt(0))
  const nextEnvelope = await encryptVaultWithKey(vault, key, salt, envelope.iterations)
  assertVaultOperationCurrent()
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: nextEnvelope, [STORE_INDEX_KEY]: publicStoreIndex(vault) })
  await pruneCurrentStore(vault.stores.map(({ id }) => id))
}

export async function getCurrentStoreId(): Promise<string | undefined> {
  const value = (await chrome.storage.local.get(CURRENT_STORE_KEY))[CURRENT_STORE_KEY]
  return typeof value === "string" ? value : undefined
}

export async function setCurrentStoreId(storeId?: string): Promise<void> {
  if (storeId) await chrome.storage.local.set({ [CURRENT_STORE_KEY]: storeId })
  else await chrome.storage.local.remove(CURRENT_STORE_KEY)
}

async function pruneCurrentStore(storeIds: readonly string[]): Promise<void> {
  const currentId = await getCurrentStoreId()
  if (currentId && !storeIds.includes(currentId)) await setCurrentStoreId(undefined)
}

export function currentStoreFromIndex(stores: StoreIndexRecord[], storeId?: string): StoreIndexRecord | null {
  if (!storeId) return null
  return stores.find((store) => store.id === storeId) ?? null
}

export function requireMasterPassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 10) throw new Error("Use a master password of at least 10 characters.")
  return value
}

export function requireSharePassword(value: unknown): string {
  if (typeof value !== "string" || value.length < 10) throw new Error("Use a share password of at least 10 characters.")
  return value
}
