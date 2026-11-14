/** The service worker: restricts storage, then hands messages and tab events to their handlers. */
import { createLogger, setLogSink } from "@/shared/log"
import { workerLogStore } from "./logs"
import { revokeResultsForTab } from "./reports"
import { listenForMessages } from "./router"
import { ACTIVE_JOB_STORAGE_KEY } from "@/shared/accounts"
import { forgetDebuggerSession } from "./switch/job"
import { setPasskeyGuard } from "./switch/passkeyGuard"
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
  // Every way a switch ends (finish, cancel, expiry, lock, reset) removes its job, so drop the passkey guard then.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "session" && ACTIVE_JOB_STORAGE_KEY in changes && changes[ACTIVE_JOB_STORAGE_KEY].newValue === undefined) void setPasskeyGuard(false)
  })
  void chrome.storage.session.get(ACTIVE_JOB_STORAGE_KEY).then((stored) => setPasskeyGuard(ACTIVE_JOB_STORAGE_KEY in stored))
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
