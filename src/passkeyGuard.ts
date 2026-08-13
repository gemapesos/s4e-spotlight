import {
  installPasskeyGuard,
  isSameOriginSellerCentralFrame,
  PASSKEY_GUARD_KEY,
  type PasskeyGuardController,
} from "./lib/passkeyGuardCore.js"

type PasskeyGuardWindow = Window &
  typeof globalThis & {
    [PASSKEY_GUARD_KEY]?: PasskeyGuardController
  }

if (isSameOriginSellerCentralFrame()) {
  const passkeyGuardWindow = window as PasskeyGuardWindow
  passkeyGuardWindow[PASSKEY_GUARD_KEY]?.destroy()
  passkeyGuardWindow[PASSKEY_GUARD_KEY] = installPasskeyGuard(window)
}
