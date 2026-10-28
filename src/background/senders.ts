/** Who sent a message: this extension, and which of its pages. */

export type SenderTab = chrome.tabs.Tab & { id: number; windowId: number }

export function requireSenderTab(senderTab: chrome.tabs.Tab | undefined): SenderTab {
  if (senderTab?.id === undefined || senderTab.windowId === undefined) throw new Error("The originating tab is unavailable.")
  return senderTab as SenderTab
}

export function isOwnSender(sender: chrome.runtime.MessageSender): boolean {
  return Boolean(chrome.runtime.id && sender.id === chrome.runtime.id)
}

export function isPageSender(sender: chrome.runtime.MessageSender, page: string): boolean {
  return isOwnSender(sender) && (sender.frameId === undefined || sender.frameId === 0)
    && sender.url?.split(/[?#]/u)[0] === chrome.runtime.getURL(page)
}

/** Only extension pages (popup, options) may read or clear the diagnostics log. */
export function isExtensionPage(sender: chrome.runtime.MessageSender): boolean {
  return ["options.html", "popup.html", "timeout.html", "results.html"].some((page) => isPageSender(sender, page))
}
