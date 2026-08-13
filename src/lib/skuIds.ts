const MAX_SKU_LENGTH = 40

export function extractSkuIds(input: string): string[] {
  const seen = new Set<string>()
  const skus: string[] = []

  for (const part of input.split(/[\n\r,\t]+/u)) {
    const sku = part.trim()
    if (!sku || sku.length > MAX_SKU_LENGTH || seen.has(sku)) continue
    seen.add(sku)
    skus.push(sku)
  }

  return skus
}
