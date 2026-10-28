/** The service worker: restricts storage, then hands messages and tab events to their handlers. */
import { createLogger, setLogSink } from "@/lib/log"
import { workerLogStore } from "./logs"
import { revokeResultsForTab } from "./reports"
import { listenForMessages } from "./router"
import { forgetDebuggerSession } from "./switch/job"
import { handleAccountTabUpdated, recordSignInHop } from "./switch/signIn"
import { forgetClosedTab } from "./switch/start"

const log = createLogger("background")

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  const logStore = workerLogStore()
  setLogSink((entry) => logStore.append([entry]))
  chrome.runtime.onInstalled?.addListener(({ reason, previousVersion }) => {
    log.info("extension.installed", { reason, version: chrome.runtime.getManifest().version, previousVersion })
  })

  const storageReady = Promise.all([
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  ])
  void storageReady.catch(() => log.error("storage.restrictionFailed"))
  chrome.runtime.onMessage.addListener(listenForMessages(storageReady))
  chrome.debugger?.onDetach?.addListener((source) => forgetDebuggerSession(source.tabId))
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    recordSignInHop(tabId, changeInfo.url)
    if (changeInfo.status === "loading" || changeInfo.url) void revokeResultsForTab(tabId)
    void handleAccountTabUpdated(tabId, changeInfo, tab).catch(() => log.warn("account.switch.navigationFailed"))
  })
  chrome.tabs.onRemoved.addListener((tabId) => {
    void revokeResultsForTab(tabId, true)
    void forgetClosedTab(tabId).catch(() => undefined)
  })
}
