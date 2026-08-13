export const VAULT_STORAGE_KEY = "accountsVault";
export const STORE_INDEX_KEY = "accountsStoreIndex";
export const SESSION_KEY_STORAGE_KEY = "accountsSessionKey";
export const ACTIVE_JOB_STORAGE_KEY = "accountsActiveJob";
export const PBKDF2_ITERATIONS = 6e5;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function asBuffer(bytes) {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function bytesToBase64(bytes) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}
function base64ToBytes(value) {
	const binary = atob(value);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}
export function emptyVault() {
	return {
		version: 1,
		stores: [],
		credentials: []
	};
}
export async function deriveVaultKey(masterPassword, salt, iterations = PBKDF2_ITERATIONS) {
	const material = await crypto.subtle.importKey("raw", encoder.encode(masterPassword), "PBKDF2", false, ["deriveBits"]);
	const bits = await crypto.subtle.deriveBits({
		name: "PBKDF2",
		hash: "SHA-256",
		salt: asBuffer(salt),
		iterations
	}, material, 256);
	return new Uint8Array(bits);
}
async function importAesKey(keyBytes) {
	return crypto.subtle.importKey("raw", asBuffer(keyBytes), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encryptVault(vault, masterPassword, iterations = PBKDF2_ITERATIONS) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const keyBytes = await deriveVaultKey(masterPassword, salt, iterations);
	return {
		envelope: await encryptVaultWithKey(vault, keyBytes, salt, iterations),
		keyBytes
	};
}
export async function encryptVaultWithKey(vault, keyBytes, salt, iterations) {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt({
		name: "AES-GCM",
		iv: asBuffer(iv)
	}, await importAesKey(keyBytes), encoder.encode(JSON.stringify(vault)));
	return {
		version: 1,
		iterations,
		salt: bytesToBase64(salt),
		iv: bytesToBase64(iv),
		ciphertext: bytesToBase64(new Uint8Array(ciphertext))
	};
}
export async function decryptVault(envelope, masterPassword) {
	const salt = base64ToBytes(envelope.salt);
	const keyBytes = await deriveVaultKey(masterPassword, salt, envelope.iterations);
	return {
		vault: await decryptVaultWithKey(envelope, keyBytes),
		keyBytes
	};
}
export async function decryptVaultWithKey(envelope, keyBytes) {
	const plaintext = await crypto.subtle.decrypt({
		name: "AES-GCM",
		iv: asBuffer(base64ToBytes(envelope.iv))
	}, await importAesKey(keyBytes), asBuffer(base64ToBytes(envelope.ciphertext)));
	const vault = JSON.parse(decoder.decode(plaintext));
	if (vault.version !== 1 || !Array.isArray(vault.stores) || !Array.isArray(vault.credentials)) {
		throw new Error("The account vault has an unsupported format.");
	}
	return vault;
}
export function serializeKey(keyBytes) {
	return bytesToBase64(keyBytes);
}
export function deserializeKey(value) {
	return base64ToBytes(value);
}
export function publicStoreIndex(vault) {
	return vault.stores.map(({ id, name }) => ({
		id,
		name
	}));
}
export function validateStoreUrl(value) {
	try {
		const url = new URL(value);
		return url.protocol === "https:" && url.hostname === "sellercentral.amazon.com";
	} catch {
		return false;
	}
}
export function decodeBase32(value) {
	const normalized = value.toUpperCase().replace(/=+$/u, "").replace(/\s+/gu, "");
	if (!normalized || /[^A-Z2-7]/u.test(normalized)) throw new Error("Invalid Base32 secret.");
	let bits = "";
	for (const character of normalized) {
		const code = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(character);
		bits += code.toString(2).padStart(5, "0");
	}
	const bytes = [];
	for (let index = 0; index + 8 <= bits.length; index += 8) {
		bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
	}
	return new Uint8Array(bytes);
}
export function parseOtpAuthUri(value) {
	const url = new URL(value);
	if (url.protocol !== "otpauth:" || url.hostname !== "totp") {
		throw new Error("Use an otpauth://totp URI.");
	}
	const algorithmValue = (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase();
	const algorithm = algorithmValue.replace("SHA", "SHA-");
	if (![
		"SHA-1",
		"SHA-256",
		"SHA-512"
	].includes(algorithm)) {
		throw new Error("Unsupported TOTP algorithm.");
	}
	const digits = Number(url.searchParams.get("digits") ?? "6");
	const period = Number(url.searchParams.get("period") ?? "30");
	if (!Number.isInteger(digits) || digits < 6 || digits > 8) throw new Error("TOTP digits must be 6–8.");
	if (!Number.isInteger(period) || period < 15 || period > 120) throw new Error("TOTP period must be 15–120 seconds.");
	return {
		secret: decodeBase32(url.searchParams.get("secret") ?? ""),
		algorithm,
		digits,
		period
	};
}
export async function generateTotp(value, now = Date.now()) {
	const parsed = parseOtpAuthUri(value);
	const counter = Math.floor(now / 1e3 / parsed.period);
	const data = new Uint8Array(8);
	new DataView(data.buffer).setBigUint64(0, BigInt(counter));
	const key = await crypto.subtle.importKey("raw", asBuffer(parsed.secret), {
		name: "HMAC",
		hash: parsed.algorithm
	}, false, ["sign"]);
	const hash = new Uint8Array(await crypto.subtle.sign("HMAC", key, asBuffer(data)));
	const offset = hash.at(-1) & 15;
	const code = ((hash[offset] & 127) << 24 | hash[offset + 1] << 16 | hash[offset + 2] << 8 | hash[offset + 3]) % 10 ** parsed.digits;
	return code.toString().padStart(parsed.digits, "0");
}
