import { createLogger } from "@/shared/log"

const GUARD_ID = "passkey-guard"
const log = createLogger("background")
let pending: Promise<void> = Promise.resolve()

/**
 * Blocks Seller Central's passkey prompts only while a switch runs, where they would stall the
 * sign-in automation; outside a switch, manual passkey sign-in and setup work as usual.
 * Calls are serialized, so a register and an unregister never race.
 */
export function setPasskeyGuard(on: boolean): Promise<void> {
  pending = pending.then(async () => {
    const registered = (await chrome.scripting.getRegisteredContentScripts({ ids: [GUARD_ID] })).length > 0
    if (on && !registered) {
      await chrome.scripting.registerContentScripts([{
        id: GUARD_ID,
        matches: ["https://sellercentral.amazon.com/*"],
        js: ["passkey-guard.js"],
        runAt: "document_start",
        world: "MAIN",
        allFrames: true,
        persistAcrossSessions: false,
      }])
    } else if (!on && registered) {
      await chrome.scripting.unregisterContentScripts({ ids: [GUARD_ID] })
    }
  }).catch((caught: unknown) => log.warn("passkeyGuard.syncFailed", { on, error: String(caught) }))
  return pending
}
