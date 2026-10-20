const REMOVAL_ORDER_ID_PATTERN = /(?<![a-z0-9])S4E[a-z]{2}\d{4}(?![a-z0-9])/gi

/** Every Removal Order ID in the input, repeats included. */
export function findRemovalOrderIds(input: string): string[] {
  return (input.match(REMOVAL_ORDER_ID_PATTERN) ?? []).map((removalOrderId) => removalOrderId.toUpperCase())
}

export function extractRemovalOrderIds(input: string): string[] {
  return [...new Set(findRemovalOrderIds(input))]
}
