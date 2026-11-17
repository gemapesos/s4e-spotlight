/**
 * A PDF with one PNG per page, each page as wide as US Letter and as tall as its image. The PNG's
 * compressed pixels go in as they are (Flate with the PNG predictor), so nothing is re-encoded.
 * shortcut: only 8-bit, non-interlaced RGB PNGs (what Chrome's screenshots are); others throw.
 */

const PAGE_WIDTH_PT = 612

interface PngImage { width: number; height: number; data: Uint8Array }

function readPng(png: Uint8Array): PngImage {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  if (view.getUint32(0) !== 0x89504e47) throw new Error("Not a PNG.")
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  const [bitDepth, colorType, , , interlace] = png.subarray(24, 29)
  if (bitDepth !== 8 || colorType !== 2 || interlace !== 0) throw new Error("Only 8-bit RGB PNGs go in the PDF.")
  const parts: Uint8Array[] = []
  for (let offset = 8; offset + 8 <= png.length;) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    if (type === "IDAT") parts.push(png.subarray(offset + 8, offset + 8 + length))
    offset += 12 + length
  }
  const data = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0))
  parts.reduce((at, part) => (data.set(part, at), at + part.length), 0)
  return { width, height, data }
}

export function buildImagesPdf(pngs: readonly Uint8Array[]): Uint8Array {
  const images = pngs.map(readPng)
  const chunks: Uint8Array[] = []
  const offsets: number[] = []
  let length = 0
  const write = (part: string | Uint8Array) => {
    const bytes = typeof part === "string" ? Uint8Array.from(part, (char) => char.charCodeAt(0)) : part
    chunks.push(bytes)
    length += bytes.length
  }
  const object = (id: number, ...parts: Array<string | Uint8Array>) => {
    offsets[id] = length
    write(`${id} 0 obj\n`)
    parts.forEach(write)
    write("\nendobj\n")
  }
  // Objects: 1 catalog, 2 page tree, then per image: page, its content stream, the image itself.
  const pageId = (index: number) => 3 + index * 3
  write("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
  object(1, "<< /Type /Catalog /Pages 2 0 R >>")
  object(2, `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${pageId(index)} 0 R`).join(" ")}] >>`)
  images.forEach((image, index) => {
    const id = pageId(index)
    const height = Math.round((PAGE_WIDTH_PT * image.height / image.width) * 100) / 100
    const draw = `q ${PAGE_WIDTH_PT} 0 0 ${height} 0 0 cm /Im Do Q`
    object(id, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH_PT} ${height}] /Resources << /XObject << /Im ${id + 2} 0 R >> >> /Contents ${id + 1} 0 R >>`)
    object(id + 1, `<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`)
    object(id + 2,
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8`
      + ` /Filter /FlateDecode /DecodeParms << /Predictor 15 /Colors 3 /BitsPerComponent 8 /Columns ${image.width} >> /Length ${image.data.length} >>\nstream\n`,
      image.data,
      "\nendstream")
  })
  const xref = length
  const count = 3 + images.length * 3
  write(`xref\n0 ${count}\n0000000000 65535 f \n`)
  for (let id = 1; id < count; id += 1) write(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`)
  write(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  const pdf = new Uint8Array(length)
  chunks.reduce((at, chunk) => (pdf.set(chunk, at), at + chunk.length), 0)
  return pdf
}
