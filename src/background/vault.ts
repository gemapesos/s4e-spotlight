/** The encrypted account vault in storage, and the store last switched to. */
import {
  ACTIVE_JOB_STORAGE_KEY,
  CURRENT_STORE_KEY,
  decryptSharedVault,
  decryptVault,
  decryptVaultWithKey,
  deserializeKey,
  emptyVault,
  encryptSharedVault,
  encryptVault,
  encryptVaultWithKey,
  mergeVaults,
  parseOtpAuthUri,
  publicStoreIndex,
  serializeKey,
  SESSION_KEY_STORAGE_KEY,
  STORE_INDEX_KEY,
  validateStoreUrl,
  VAULT_STORAGE_KEY,
  type AccountVault,
  type EncryptedVault,
  type StoreIndexRecord,
} from "@/shared/accounts"
import { createLogger } from "@/shared/log"
import type { BackgroundReply } from "@/shared/messages"
import { assertVaultOperationCurrent } from "./operations"
import { closeOwnedSwitchTab, getActiveJob, SWITCH_NOTICE_KEY, UNLOCK_RESUME_KEY } from "./switch/job"

const log = createLogger("background")

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

export async function accountsStatus(): Promise<BackgroundReply<"ACCOUNTS_STATUS">> {
  const [envelope, key, stored] = await Promise.all([
    getEnvelope(),
    getSessionKey(),
    chrome.storage.local.get([STORE_INDEX_KEY, CURRENT_STORE_KEY]),
  ])
  const stores = (stored[STORE_INDEX_KEY] ?? []) as StoreIndexRecord[]
  const currentStoreId = typeof stored[CURRENT_STORE_KEY] === "string" ? stored[CURRENT_STORE_KEY] : undefined
  const job = await getActiveJob()
  const activeStore = job ? stores.find((store) => store.id === job.storeId) : undefined
  return {
    ok: true,
    initialized: Boolean(envelope),
    unlocked: Boolean(key),
    stores,
    currentStore: currentStoreFromIndex(stores, currentStoreId),
    activeSwitch: job
      ? {
        storeId: job.storeId,
        storeName: activeStore?.name ?? "Selected store",
        stage: job.stage,
        startedAt: job.startedAt,
        signIn: Boolean(job.signIn),
        ...(job.resumeStage ? { resumeStage: job.resumeStage } : {}),
        ...(job.attentionMessage ? { attentionMessage: job.attentionMessage } : {}),
      }
      : undefined,
  }
}

export async function createVault(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_CREATE">> {
  if (await getEnvelope()) throw new Error("The account vault already exists.")
  const masterPassword = requireMasterPassword(message.masterPassword)
  const done = log.time("vault.create")
  const { envelope, keyBytes } = await encryptVault(emptyVault(), masterPassword)
  assertVaultOperationCurrent()
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: [] })
  await chrome.storage.local.remove(CURRENT_STORE_KEY)
  await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
  done()
  return { ok: true }
}

export async function unlockVault(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_UNLOCK">> {
  const envelope = await getEnvelope()
  if (!envelope || typeof message.masterPassword !== "string") throw new Error("The account vault is not initialized.")
  const attempts = (await chrome.storage.session.get(UNLOCK_ATTEMPTS_KEY))[UNLOCK_ATTEMPTS_KEY] as { failures: number; nextAttemptAt: number } | undefined
  if (attempts && attempts.nextAttemptAt > Date.now()) throw new Error(`Try unlocking again in ${Math.ceil((attempts.nextAttemptAt - Date.now()) / 1000)} seconds.`)
  const done = log.time("vault.unlock")
  try {
    const { keyBytes } = await decryptVault(envelope, message.masterPassword)
    assertVaultOperationCurrent()
    await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
    await chrome.storage.session.remove(UNLOCK_ATTEMPTS_KEY)
  } catch (error) {
    assertVaultOperationCurrent()
    const failures = Math.min(9, (attempts?.failures ?? 0) + 1)
    const delay = failures < 3 ? 0 : Math.min(60_000, 1000 * 2 ** (failures - 3))
    await chrome.storage.session.set({ [UNLOCK_ATTEMPTS_KEY]: { failures, nextAttemptAt: Date.now() + delay } })
    done({ ok: false }, "warn")
    throw new Error("Incorrect master password or damaged vault.")
  }
  done({ ok: true })
  return { ok: true }
}

export async function lockVault(): Promise<BackgroundReply<"ACCOUNTS_LOCK">> {
  const job = await getActiveJob()
  await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY, UNLOCK_RESUME_KEY])
  await closeOwnedSwitchTab(job)
  log.info("vault.lock")
  return { ok: true }
}

export async function getVault(): Promise<BackgroundReply<"ACCOUNTS_GET_VAULT">> {
  const { vault } = await getUnlockedVault()
  return { ok: true, vault }
}

export async function saveVaultFromPage(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_SAVE_VAULT">> {
  const current = await getUnlockedVault()
  const vault = message.vault as AccountVault
  await saveVault(vault, current.envelope, current.key)
  log.info("vault.save", { stores: vault.stores.length, credentials: vault.credentials.length })
  return { ok: true }
}

export async function exportShare(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_EXPORT_SHARE">> {
  const { vault } = await getUnlockedVault()
  const sharePassword = requireSharePassword(message.sharePassword)
  const file = await encryptSharedVault(vault, sharePassword)
  log.info("vault.share.export", { stores: vault.stores.length, credentials: vault.credentials.length })
  return { ok: true, file }
}

export async function importShare(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_IMPORT_SHARE">> {
  const current = await getUnlockedVault()
  const sharePassword = requireSharePassword(message.sharePassword)
  const incoming = await decryptSharedVault(message.file, sharePassword)
  validateVault(incoming)
  const merged = mergeVaults(current.vault, incoming)
  validateVault(merged.vault)
  await saveVault(merged.vault, current.envelope, current.key)
  log.info("vault.share.import", {
    addedCredentials: merged.added.credentials,
    addedStores: merged.added.stores,
    updatedCredentials: merged.updated.credentials,
    updatedStores: merged.updated.stores,
  })
  return { ok: true, vault: merged.vault, added: merged.added, updated: merged.updated }
}

export async function createVaultFromShare(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_CREATE_FROM_SHARE">> {
  if (await getEnvelope()) throw new Error("The account vault already exists.")
  const sharePassword = requireSharePassword(message.sharePassword)
  const masterPassword = requireMasterPassword(message.masterPassword)
  const vault = await decryptSharedVault(message.file, sharePassword)
  validateVault(vault)
  const done = log.time("vault.share.create")
  const { envelope, keyBytes } = await encryptVault(vault, masterPassword)
  assertVaultOperationCurrent()
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope, [STORE_INDEX_KEY]: publicStoreIndex(vault) })
  await chrome.storage.local.remove(CURRENT_STORE_KEY)
  await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
  done({ stores: vault.stores.length, credentials: vault.credentials.length })
  return { ok: true }
}

export async function changeMasterPassword(message: Record<string, unknown>): Promise<BackgroundReply<"ACCOUNTS_CHANGE_MASTER_PASSWORD">> {
  const { vault } = await getUnlockedVault()
  const masterPassword = requireMasterPassword(message.masterPassword)
  const { envelope, keyBytes } = await encryptVault(vault, masterPassword)
  assertVaultOperationCurrent()
  await chrome.storage.local.set({ [VAULT_STORAGE_KEY]: envelope })
  await chrome.storage.session.set({ [SESSION_KEY_STORAGE_KEY]: serializeKey(keyBytes) })
  await chrome.storage.session.remove(UNLOCK_RESUME_KEY)
  log.info("vault.changePassword")
  return { ok: true }
}

export async function resetVault(): Promise<BackgroundReply<"ACCOUNTS_RESET">> {
  const job = await getActiveJob()
  await chrome.storage.local.remove([VAULT_STORAGE_KEY, STORE_INDEX_KEY, CURRENT_STORE_KEY])
  await chrome.storage.session.remove([SESSION_KEY_STORAGE_KEY, ACTIVE_JOB_STORAGE_KEY, UNLOCK_RESUME_KEY, UNLOCK_ATTEMPTS_KEY, SWITCH_NOTICE_KEY])
  await closeOwnedSwitchTab(job)
  log.warn("vault.reset")
  return { ok: true }
}

export async function openAccountsPage(): Promise<BackgroundReply<"ACCOUNTS_OPEN_OPTIONS">> {
  await chrome.runtime.openOptionsPage()
  return { ok: true }
}
