const CASE_ID_PATTERN = /(?<!\d)\d{11}(?!\d)/g

/** Every Case ID in the input, repeats included. */
export function findCaseIds(input: string): string[] {
  return input.match(CASE_ID_PATTERN) ?? []
}

export function extractCaseIds(input: string): string[] {
  return [...new Set(findCaseIds(input))]
}
