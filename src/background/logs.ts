/** Log entries from every context, and reading or clearing them from extension pages. */
import { errorMessage, LOG_ENTRIES_MESSAGE, LOGS_CLEAR_MESSAGE, LOGS_GET_MESSAGE, type LogStore, sanitizeLogEntries } from "@/lib/log"
import { isExtensionPage } from "./senders"

export function handleLogMessage(
  type: string,
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
  store: LogStore,
  sendResponse: (response: unknown) => void,
): boolean | undefined {
  if (type === LOG_ENTRIES_MESSAGE) {
    const tab = sender.tab?.id
    const entries = sanitizeLogEntries(message.entries).map((entry) => ({ ...entry, tab }))
    store.append(entries)
    sendResponse({ ok: true })
    return undefined
  }
  if (type !== LOGS_GET_MESSAGE && type !== LOGS_CLEAR_MESSAGE) return undefined
  if (!isExtensionPage(sender)) {
    sendResponse({ ok: false, error: "Logs are only available to extension pages." })
    return undefined
  }
  const request = type === LOGS_GET_MESSAGE
    ? store.read().then((entries) => ({ ok: true, entries }))
    : store.clear().then(() => ({ ok: true }))
  void request.then(sendResponse, (error: unknown) => sendResponse({ ok: false, error: errorMessage(error, "Couldn’t read logs.") }))
  return true
}
