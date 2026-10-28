/** Worker requests that both the palette and the workspace window make. */
import { createLogger, describeError } from "@/lib/log"
import type { SellerCentralSessionState } from "@/lib/sellerCentralSession"
import { sendToBackground, type AccountsStatus } from "@/shared/messages"

// Logged as "palette", where these requests started, so existing log searches still find them.
const paletteLog = createLogger("palette")

export async function getAccountsStatus(): Promise<AccountsStatus> {
  const { initialized, unlocked, stores, activeSwitch, currentStore } = await sendToBackground({ type: "ACCOUNTS_STATUS" })
  return { initialized, unlocked, stores, activeSwitch, currentStore: currentStore ?? null }
}
/** Reads the session from open Seller Central tabs; "unknown" never blocks a command. */
export async function checkSellerCentralSession(): Promise<SellerCentralSessionState> {
  try {
    const { session } = await sendToBackground({ type: "SELLER_CENTRAL_SESSION" })
    return session === "signed-in" || session === "signed-out" ? session : "unknown"
  } catch (error) {
    paletteLog.warn("session.checkFailed", { error: describeError(error) })
    return "unknown"
  }
}
export async function openSellerCentral(): Promise<void> {
  await sendToBackground({ type: "SELLER_CENTRAL_OPEN" })
}
