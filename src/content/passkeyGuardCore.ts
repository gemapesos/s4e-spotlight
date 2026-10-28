export const PASSKEY_GUARD_KEY = "__s4eSpotlightPasskeyGuard"
export const SELLER_CENTRAL_ORIGIN = "https://sellercentral.amazon.com"

export interface PasskeyGuardController {
  destroy: () => void
}

export function isPublicKeyRequest(
  options?: CredentialRequestOptions | CredentialCreationOptions,
): boolean {
  return Boolean(options && "publicKey" in options && options.publicKey)
}

function createNotAllowedError(): DOMException {
  return new DOMException(
    "The operation either timed out or was not allowed.",
    "NotAllowedError",
  )
}

export function installPasskeyGuard(targetWindow: Window): PasskeyGuardController {
  const credentials = targetWindow.navigator.credentials
  const originalGet = credentials.get.bind(credentials)
  const originalCreate = credentials.create.bind(credentials)

  credentials.get = (options?: CredentialRequestOptions) => {
    if (isPublicKeyRequest(options)) {
      return Promise.reject(createNotAllowedError())
    }
    return originalGet(options)
  }

  credentials.create = (options?: CredentialCreationOptions) => {
    if (isPublicKeyRequest(options)) {
      return Promise.reject(createNotAllowedError())
    }
    return originalCreate(options)
  }

  type PublicKeyCredentialConstructor = {
    isConditionalMediationAvailable?: () => Promise<boolean>
    isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>
  }
  const PublicKeyCredential = (targetWindow as typeof targetWindow & {
    PublicKeyCredential?: PublicKeyCredentialConstructor
  }).PublicKeyCredential
  const restores: Array<() => void> = []

  if (PublicKeyCredential) {
    if (typeof PublicKeyCredential.isConditionalMediationAvailable === "function") {
      const original = PublicKeyCredential.isConditionalMediationAvailable.bind(PublicKeyCredential)
      PublicKeyCredential.isConditionalMediationAvailable = () => Promise.resolve(false)
      restores.push(() => {
        PublicKeyCredential.isConditionalMediationAvailable = original
      })
    }

    if (
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable ===
      "function"
    ) {
      const original =
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.bind(
          PublicKeyCredential,
        )
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () =>
        Promise.resolve(false)
      restores.push(() => {
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = original
      })
    }
  }

  return {
    destroy: () => {
      credentials.get = originalGet
      credentials.create = originalCreate
      for (const restore of restores) restore()
    },
  }
}

export function isSameOriginSellerCentralFrame(targetWindow: Window = window): boolean {
  try {
    return targetWindow.location.origin === SELLER_CENTRAL_ORIGIN
  } catch {
    return false
  }
}
