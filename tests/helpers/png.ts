import { deflateSync } from "node:zlib"

/** A real width×height 8-bit RGB PNG filled with one color (chunk CRCs zeroed; readers here don't check them). */
export function rgbPng(width: number, height: number, rgb: [number, number, number] = [200, 30, 30], colorType = 2): Uint8Array {
  const row = [0, ...Array.from({ length: width }, () => rgb).flat()]
  const pixels = deflateSync(Uint8Array.from(Array.from({ length: height }, () => row).flat()))
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length)
    new DataView(out.buffer).setUint32(0, data.length)
    out.set(Uint8Array.from(type, (char) => char.charCodeAt(0)), 4)
    out.set(data, 8)
    return out
  }
  const header = new Uint8Array(13)
  new DataView(header.buffer).setUint32(0, width)
  new DataView(header.buffer).setUint32(4, height)
  header.set([8, colorType, 0, 0, 0], 8)
  const parts = [Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", pixels), chunk("IEND", new Uint8Array())]
  const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  parts.reduce((at, part) => (png.set(part, at), at + part.length), 0)
  return png
}
