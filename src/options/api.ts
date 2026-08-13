export async function api<T = Record<string, unknown>>(message: Record<string, unknown>): Promise<T> {
  const response = await chrome.runtime.sendMessage(message) as T & { ok?: boolean; error?: string }
  if (!response?.ok) throw new Error(response?.error ?? "The extension did not respond.")
  return response
}
