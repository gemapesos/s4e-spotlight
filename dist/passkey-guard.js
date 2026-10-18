(function () {
const PASSKEY_GUARD_KEY = "__s4eSpotlightPasskeyGuard";
const SELLER_CENTRAL_ORIGIN = "https://sellercentral.amazon.com";
function isPublicKeyRequest(options) {
	return Boolean(options && "publicKey" in options && options.publicKey);
}
function createNotAllowedError() {
	return new DOMException("The operation either timed out or was not allowed.", "NotAllowedError");
}
function installPasskeyGuard(targetWindow) {
	const credentials = targetWindow.navigator.credentials;
	const originalGet = credentials.get.bind(credentials);
	const originalCreate = credentials.create.bind(credentials);
	credentials.get = (options) => {
		if (isPublicKeyRequest(options)) {
			return Promise.reject(createNotAllowedError());
		}
		return originalGet(options);
	};
	credentials.create = (options) => {
		if (isPublicKeyRequest(options)) {
			return Promise.reject(createNotAllowedError());
		}
		return originalCreate(options);
	};
	const PublicKeyCredential = targetWindow.PublicKeyCredential;
	const restores = [];
	if (PublicKeyCredential) {
		if (typeof PublicKeyCredential.isConditionalMediationAvailable === "function") {
			const original = PublicKeyCredential.isConditionalMediationAvailable.bind(PublicKeyCredential);
			PublicKeyCredential.isConditionalMediationAvailable = () => Promise.resolve(false);
			restores.push(() => {
				PublicKeyCredential.isConditionalMediationAvailable = original;
			});
		}
		if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function") {
			const original = PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.bind(PublicKeyCredential);
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = () => Promise.resolve(false);
			restores.push(() => {
				PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = original;
			});
		}
	}
	return { destroy: () => {
		credentials.get = originalGet;
		credentials.create = originalCreate;
		for (const restore of restores) restore();
	} };
}
function isSameOriginSellerCentralFrame(targetWindow = window) {
	try {
		return targetWindow.location.origin === SELLER_CENTRAL_ORIGIN;
	} catch {
		return false;
	}
}

if (isSameOriginSellerCentralFrame()) {
	const passkeyGuardWindow = window;
	passkeyGuardWindow[PASSKEY_GUARD_KEY]?.destroy();
	passkeyGuardWindow[PASSKEY_GUARD_KEY] = installPasskeyGuard(window);
}

})();
