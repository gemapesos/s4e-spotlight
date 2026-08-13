const CASE_ID_PATTERN = /(?<!\d)\d{11}(?!\d)/g

export function extractCaseIds(input: string): string[] {
  return [...new Set(input.match(CASE_ID_PATTERN) ?? [])]
}
