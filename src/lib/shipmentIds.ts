const SHIPMENT_ID_PATTERN = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi

/** Every Shipment ID in the input, repeats included. */
export function findShipmentIds(input: string): string[] {
  return (input.match(SHIPMENT_ID_PATTERN) ?? []).map((shipmentId) => shipmentId.toUpperCase())
}

export function extractShipmentIds(input: string): string[] {
  return [...new Set(findShipmentIds(input))]
}
