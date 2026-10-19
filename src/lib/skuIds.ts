const MAX_SKU_LENGTH = 40

/** Every SKU in the input, repeats included. */
export function findSkuIds(input: string): string[] {
  return input
    .split(/[\n\r,\t]+/u)
    .map((part) => part.trim())
    .filter((sku) => sku && sku.length <= MAX_SKU_LENGTH)
}

export function extractSkuIds(input: string): string[] {
  return [...new Set(findSkuIds(input))]
}
