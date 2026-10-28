/**
 * Reads a Seller Central case, including every reply page, from the signed-in tab.
 */

export const VIEW_CASE_PAGE_SIZE = 10
export const VIEW_CASE_MAX_PAGES = 100
export const VIEW_CASE_ENDPOINT = "https://sellercentral.amazon.com/hill/hillservice/mons-api/ViewCase"
export const VIEW_CASE_ORIGIN_REFERRER = "https://sellercentral.amazon.com/cu/case-dashboard/view-case"
export const VIEW_CASE_SIGN_IN_ERROR = "Sign in to Seller Central, then try again."
export const CASE_PAGE_URL = "https://sellercentral.amazon.com/cu/case-dashboard/view-case?ref=sc_cd_lobby_vc_v3&ie=UTF&caseID="

const CASE_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

export interface CaseScrapeError {
  caseId: string
  error: string
}

export interface ScrapedCase {
  caseId: string
  caseUrl: string
  viewCaseMetaData: Record<string, unknown>
  totalNumberOfContacts: number
  appointmentMetadata: unknown
  liveConversation: unknown
  contacts: Record<string, unknown>[]
}

export interface ScrapeCasesFile {
  scrapedAt: string
  timeZone: string
  cases: ScrapedCase[]
  errors?: CaseScrapeError[]
}

export interface ScrapeCasesOptions {
  timeZone?: string
  now?: Date
}

export function casePageUrl(caseId: string): string {
  return `${CASE_PAGE_URL}${caseId}`
}

export function viewCaseRequestUrl(caseId: string, timeZone: string, currentToken?: string): string {
  const params = new URLSearchParams({
    caseId,
    timeZone,
    pageSize: String(VIEW_CASE_PAGE_SIZE),
  })
  if (currentToken) params.set("currentToken", currentToken)
  return `${VIEW_CASE_ENDPOINT}?${params.toString()}`
}

export function caseScrapeFileName(caseIds: readonly string[], date = new Date()): string {
  if (caseIds.length === 1) return `case-${caseIds[0]}.json`
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-")
  return `cases-${caseIds.length}-${day}.json`
}

export function downloadCaseScrape(
  file: ScrapeCasesFile,
  caseIds: readonly string[],
  targetDocument: Document = document,
  date = new Date(),
): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }))
  const anchor = targetDocument.createElement("a")
  anchor.href = url
  anchor.download = caseScrapeFileName(caseIds, date)
  targetDocument.body.append(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

function decodeCaseHtml(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return CASE_HTML_ENTITIES[entity] ?? match
  })
}

/** Epoch seconds as an ISO timestamp in `timeZone`, such as 2026-10-05T19:21:54.913+08:00. */
export function formatCaseTimestamp(seconds: number, timeZone: string): string {
  const date = new Date(Math.round(seconds * 1000))
  if (Number.isNaN(date.getTime())) throw new Error("Couldn’t load this case.")
  const parts = caseTimestampParts(date, timeZone, true)
  let hour = parts.hour
  if (hour === "24") hour = "00"
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}:${parts.second}.${parts.fractionalSecond}${caseTimestampOffset(date, timeZone)}`
}

function caseTimestampParts(date: Date, timeZone: string, fractional: boolean): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    ...(fractional ? { fractionalSecondDigits: 3 } : {}),
  })
  return Object.fromEntries(
    formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  )
}

function caseTimestampOffset(date: Date, timeZone: string): string {
  const parts = caseTimestampParts(date, timeZone, false)
  let hour = Number(parts.hour)
  if (hour === 24) hour = 0
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  )
  const offsetMinutes = Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000)
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absolute = Math.abs(offsetMinutes)
  return `${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`
}

function viewCaseRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined
  return value as Record<string, unknown>
}

function decodeCaseMessage(value: unknown): unknown {
  if (typeof value === "string") return decodeCaseHtml(value)
  const record = viewCaseRecord(value)
  if (!record) return value
  const next: Record<string, unknown> = { ...record }
  if (typeof next.message === "string") next.message = decodeCaseHtml(next.message)
  if ("hmdMetaData" in next) next.hmdMetaData = decodeCaseMessage(next.hmdMetaData)
  if (Array.isArray(next.messageList)) next.messageList = next.messageList.map((item) => decodeCaseMessage(item))
  if (typeof next.beforeHMDContent === "string") next.beforeHMDContent = decodeCaseHtml(next.beforeHMDContent)
  if (typeof next.afterHMDContent === "string") next.afterHMDContent = decodeCaseHtml(next.afterHMDContent)
  return next
}

function presentCaseContact(contact: Record<string, unknown>, timeZone: string): Record<string, unknown> {
  const next = decodeCaseMessage(contact) as Record<string, unknown>
  if (typeof next.timestamp === "number" && Number.isFinite(next.timestamp)) {
    next.timestampIso = formatCaseTimestamp(next.timestamp, timeZone)
  }
  return next
}

function responseContentType(response: Response): string {
  return response.headers?.get("content-type") ?? ""
}

function isViewCaseSessionResponse(response: Response): boolean {
  if (response.status === 401 || response.status === 403) return true
  return /text\/html/i.test(responseContentType(response))
}

interface ViewCasePage {
  appointmentMetadata: unknown
  contactList: Record<string, unknown>[]
  currentToken: string | null
  liveConversation: unknown
  totalNumberOfContacts: number
  viewCaseMetaData: Record<string, unknown>
}

function parseViewCasePage(payload: unknown): ViewCasePage {
  const record = viewCaseRecord(payload)
  const meta = record ? viewCaseRecord(record.viewCaseMetaData) : undefined
  if (!record || !meta || !Array.isArray(record.contactList)) throw new Error("Couldn’t load this case.")
  const total = record.totalNumberOfContacts
  if (typeof total !== "number" || !Number.isFinite(total)) throw new Error("Couldn’t load this case.")
  const contactList: Record<string, unknown>[] = []
  for (const item of record.contactList) {
    const contact = viewCaseRecord(item)
    if (!contact) throw new Error("Couldn’t load this case.")
    contactList.push(contact)
  }
  const token = typeof record.currentToken === "string" && record.currentToken.length > 0 ? record.currentToken : null
  return {
    appointmentMetadata: record.appointmentMetadata ?? null,
    contactList,
    currentToken: token,
    liveConversation: record.liveConversation ?? null,
    totalNumberOfContacts: total,
    viewCaseMetaData: meta,
  }
}

async function fetchViewCasePage(
  fetchImpl: typeof globalThis.fetch,
  caseId: string,
  timeZone: string,
  currentToken?: string,
): Promise<ViewCasePage> {
  let response: Response
  try {
    response = await fetchImpl(viewCaseRequestUrl(caseId, timeZone, currentToken), {
      method: "GET",
      mode: "cors",
      credentials: "include",
      referrer: casePageUrl(caseId),
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "anti-csrftoken-a2z-request": "true",
        "client-id": "viewCase",
        "origin-referrer": VIEW_CASE_ORIGIN_REFERRER,
      },
    })
  } catch {
    throw new Error("Couldn’t load this case.")
  }
  if (isViewCaseSessionResponse(response)) throw new Error(VIEW_CASE_SIGN_IN_ERROR)
  if (!response.ok) throw new Error(`Couldn’t load this case (${response.status}).`)
  try {
    return parseViewCasePage(await response.json())
  } catch (error) {
    if (error instanceof Error && error.message === "Couldn’t load this case.") throw error
    throw new Error("Couldn’t load this case.")
  }
}

function contactKey(contact: Record<string, unknown>): string | undefined {
  return typeof contact.contactId === "string" && contact.contactId.length > 0 ? contact.contactId : undefined
}

async function fetchWholeCase(
  fetchImpl: typeof globalThis.fetch,
  caseId: string,
  timeZone: string,
): Promise<ScrapedCase> {
  const collected: Record<string, unknown>[] = []
  const seenContactIds = new Set<string>()
  const seenTokens = new Set<string>()
  let token: string | undefined
  let total: number | undefined
  let viewCaseMetaData: Record<string, unknown> | undefined
  let appointmentMetadata: unknown
  let liveConversation: unknown

  for (let page = 0; page < VIEW_CASE_MAX_PAGES; page += 1) {
    if (token) {
      if (seenTokens.has(token)) break
      seenTokens.add(token)
    }
    const result = await fetchViewCasePage(fetchImpl, caseId, timeZone, token)
    if (viewCaseMetaData === undefined) {
      viewCaseMetaData = result.viewCaseMetaData
      appointmentMetadata = result.appointmentMetadata
      liveConversation = result.liveConversation
      total = result.totalNumberOfContacts
    }
    for (const contact of result.contactList) {
      const key = contactKey(contact)
      if (key) {
        if (seenContactIds.has(key)) continue
        seenContactIds.add(key)
      }
      collected.push(contact)
    }
    if (typeof total === "number" && collected.length >= total) break
    if (!result.currentToken) break
    token = result.currentToken
  }

  if (!viewCaseMetaData || collected.length !== total) throw new Error("Couldn’t load the whole case.")
  const meta = { ...viewCaseMetaData }
  if (typeof meta.creationDate === "number" && Number.isFinite(meta.creationDate)) {
    meta.creationDateIso = formatCaseTimestamp(meta.creationDate, timeZone)
  }
  const contacts = collected
    .map((contact) => presentCaseContact(contact, timeZone))
    .sort((left, right) => {
      const leftTime = typeof left.timestamp === "number" ? left.timestamp : Number.POSITIVE_INFINITY
      const rightTime = typeof right.timestamp === "number" ? right.timestamp : Number.POSITIVE_INFINITY
      if (leftTime === rightTime) return 0
      return leftTime < rightTime ? -1 : 1
    })
  return {
    caseId,
    caseUrl: casePageUrl(caseId),
    viewCaseMetaData: meta,
    totalNumberOfContacts: total,
    appointmentMetadata: appointmentMetadata ?? null,
    liveConversation: liveConversation ?? null,
    contacts,
  }
}

export async function scrapeCases(
  fetchImpl: typeof globalThis.fetch,
  caseIds: readonly string[],
  options: ScrapeCasesOptions = {},
): Promise<ScrapeCasesFile> {
  const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  const now = options.now ?? new Date()
  const cases: ScrapedCase[] = []
  const errors: CaseScrapeError[] = []
  for (const caseId of caseIds) {
    try {
      cases.push(await fetchWholeCase(fetchImpl, caseId, timeZone))
    } catch (error) {
      errors.push({
        caseId,
        error: error instanceof Error && error.message ? error.message : "Couldn’t load this case.",
      })
    }
  }
  return {
    scrapedAt: now.toISOString(),
    timeZone,
    cases,
    ...(errors.length > 0 ? { errors } : {}),
  }
}
