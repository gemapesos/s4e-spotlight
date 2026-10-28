/** Log entries from every context, and reading or clearing them from extension pages. */
import { createLogStore, sanitizeLogEntries, type LogEntry, type LogStore } from "@/lib/log"

let workerStore: LogStore | undefined

/** One store for the worker's own entries and forwarded ones, so they share a write queue. */
export function workerLogStore(): LogStore {
  return workerStore ??= createLogStore(chrome.storage.local)
}

/** Keeps entries forwarded from another context, tagged with the tab that sent them. */
export async function appendLogEntries(entries: unknown, sender: chrome.runtime.MessageSender, store = workerLogStore()): Promise<{ ok: true }> {
  const tab = sender.tab?.id
  store.append(sanitizeLogEntries(entries).map((entry) => ({ ...entry, tab })))
  return { ok: true }
}

export async function readLogEntries(store = workerLogStore()): Promise<{ ok: true; entries: LogEntry[] }> {
  return { ok: true, entries: await store.read() }
}

export async function clearLogEntries(store = workerLogStore()): Promise<{ ok: true }> {
  await store.clear()
  return { ok: true }
}
