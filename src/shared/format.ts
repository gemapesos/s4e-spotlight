/** Cell values for the report sheets, and text from Seller Central's HTML. */

/** Text, or a blank cell for a missing value (never "null" or "undefined"). */
export function textCell(value: unknown): string {
  return value == null ? "" : String(value)
}

/** A number, or a blank cell when the value is missing or isn't one. */
export function numberCell(value: unknown): number | "" {
  if (typeof value === "number") return Number.isFinite(value) ? value : ""
  if (typeof value !== "string" || !value.trim()) return ""
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : ""
}

/** A count, where a missing value counts as 0. */
export function quantityCell(value: unknown): number {
  const amount = numberCell(value)
  return amount === "" ? 0 : amount
}

export function yesNo(value: boolean | null | undefined): string {
  if (value === true) return "Yes"
  if (value === false) return "No"
  return ""
}

const HTML_NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16)
      return code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10)
      return code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return HTML_NAMED_ENTITIES[entity] ?? match
  })
}
