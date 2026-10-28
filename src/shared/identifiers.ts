/** Case, shipment, removal order and SKU IDs in pasted text. `find` keeps repeats; `extract` drops them. */

const CASE_ID_PATTERN = /(?<!\d)\d{11}(?!\d)/g

/** Every Case ID in the input, repeats included. */
export function findCaseIds(input: string): string[] {
  return input.match(CASE_ID_PATTERN) ?? []
}

export function extractCaseIds(input: string): string[] {
  return [...new Set(findCaseIds(input))]
}

const SHIPMENT_ID_PATTERN = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi

/** Every Shipment ID in the input, repeats included. */
export function findShipmentIds(input: string): string[] {
  return (input.match(SHIPMENT_ID_PATTERN) ?? []).map((shipmentId) => shipmentId.toUpperCase())
}

export function extractShipmentIds(input: string): string[] {
  return [...new Set(findShipmentIds(input))]
}

const REMOVAL_ORDER_ID_PATTERN = /(?<![a-z0-9])S4E[a-z]{2}\d{4}(?![a-z0-9])/gi

/** Every Removal Order ID in the input, repeats included. */
export function findRemovalOrderIds(input: string): string[] {
  return (input.match(REMOVAL_ORDER_ID_PATTERN) ?? []).map((removalOrderId) => removalOrderId.toUpperCase())
}

export function extractRemovalOrderIds(input: string): string[] {
  return [...new Set(findRemovalOrderIds(input))]
}

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
