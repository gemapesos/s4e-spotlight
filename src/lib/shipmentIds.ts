const SHIPMENT_ID_PATTERN = /(?<![a-z0-9])FBA[a-z0-9]{9}(?![a-z0-9])/gi

export function extractShipmentIds(input: string): string[] {
  return [
    ...new Set(
      (input.match(SHIPMENT_ID_PATTERN) ?? []).map((shipmentId) =>
        shipmentId.toUpperCase(),
      ),
    ),
  ]
}
