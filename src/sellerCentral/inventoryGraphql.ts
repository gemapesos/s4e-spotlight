/** Manage Inventory's GraphQL endpoint, which the Unfulfillable, Suppressed and bulk removal lookups share. */
export const INVENTORY_GQL_URL = "https://sellercentral.amazon.com/myinventory/gql"
export const INVENTORY_MANAGE_URL = "https://sellercentral.amazon.com/myinventory/inventory"

export function readAntiCsrfToken(root: ParentNode = document, cookie = typeof document !== "undefined" ? document.cookie : ""): string | undefined {
  const meta = "querySelector" in root ? root.querySelector('meta[name="anti-csrftoken-a2z"]') : null
  const fromMeta = meta?.getAttribute("content")?.trim()
  if (fromMeta) return fromMeta

  const match = cookie.match(/(?:^|;\s*)anti-csrftoken-a2z=([^;]+)/)
  if (!match) return undefined
  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return match[1].trim()
  }
}

export function readAntiCsrfTokenFromHtml(html: string): string | undefined {
  const named = html.match(/<meta\b[^>]*\bname=["']anti-csrftoken-a2z["'][^>]*\bcontent=["']([^"']+)["'][^>]*>/i)
  if (named?.[1]) return named[1].trim()
  const contentFirst = html.match(/<meta\b[^>]*\bcontent=["']([^"']+)["'][^>]*\bname=["']anti-csrftoken-a2z["'][^>]*>/i)
  return contentFirst?.[1]?.trim()
}

async function requestInventoryAntiCsrfToken(fetchImpl: typeof globalThis.fetch): Promise<string | undefined> {
  const response = await fetchImpl(INVENTORY_MANAGE_URL, {
    method: "GET",
    credentials: "include",
    headers: { accept: "text/html" },
  })
  if (!response.ok) return undefined
  let html = ""
  try {
    html = await response.text()
  } catch {
    return undefined
  }
  return readAntiCsrfTokenFromHtml(html)
}

let inventoryAntiCsrfTokenRequest: Promise<string | undefined> | null = null

/**
 * Reads the token from Manage Inventory's HTML when the current page has none. That page is
 * large, so reports that start at the same time share one request.
 */
export function fetchAntiCsrfTokenFromInventory(fetchImpl: typeof globalThis.fetch): Promise<string | undefined> {
  inventoryAntiCsrfTokenRequest ??= requestInventoryAntiCsrfToken(fetchImpl).finally(() => {
    inventoryAntiCsrfTokenRequest = null
  })
  return inventoryAntiCsrfTokenRequest
}

export function graphqlMessages(payload: unknown): string[] {
  if (!payload || typeof payload !== "object" || !("errors" in payload)) return []
  const errors = (payload as { errors?: unknown }).errors
  if (!Array.isArray(errors)) return []
  return errors
    .map((error) => {
      if (!error || typeof error !== "object" || !("message" in error)) return ""
      return String((error as { message?: unknown }).message ?? "")
    })
    .filter(Boolean)
}

export function isInvalidPaginationInput(messages: readonly string[]): boolean {
  return messages.some((message) => /paginationinput/i.test(message) && /not defined|undefined|unknown field/i.test(message))
}

/** Posts one query and returns the parsed reply; `failure` says what didn't load, as "Couldn’t load …". */
export async function postInventoryGraphql(
  fetchImpl: typeof globalThis.fetch,
  token: string,
  request: { operationName: string; variables: Record<string, unknown>; query: string },
  failure: string,
): Promise<unknown> {
  const response = await fetchImpl(INVENTORY_GQL_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/graphql-response+json, application/json",
      "content-type": "application/json",
      "anti-csrftoken-a2z": token,
    },
    body: JSON.stringify(request),
  })
  if (!response.ok) throw new Error(`${failure} (${response.status}).`)
  try {
    return await response.json()
  } catch {
    throw new Error(`${failure}.`)
  }
}
