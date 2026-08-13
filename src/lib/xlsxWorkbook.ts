export interface WorkbookSheet {
  name: string
  rows?: readonly (readonly string[])[]
}

const CRC_TABLE = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  CRC_TABLE[index] = crc >>> 0
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeUint16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
}

function writeUint32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff
  target[offset + 1] = (value >>> 8) & 0xff
  target[offset + 2] = (value >>> 16) & 0xff
  target[offset + 3] = (value >>> 24) & 0xff
}

function readUint16(source: Uint8Array, offset: number): number {
  return source[offset] | (source[offset + 1] << 8)
}

function readUint32(source: Uint8Array, offset: number): number {
  return (
    source[offset] |
    (source[offset + 1] << 8) |
    (source[offset + 2] << 16) |
    (source[offset + 3] << 24)
  ) >>> 0
}

function encodeUtf8(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder().decode(value)
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function columnName(index: number): string {
  let name = ""
  let n = index + 1
  while (n > 0) {
    const rem = (n - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    n = Math.floor((n - 1) / 26)
  }
  return name
}

function worksheetXml(rows: readonly (readonly string[])[] = []): string {
  if (rows.length === 0) {
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>'
  }

  const rowXml = rows.map((row, rowIndex) => {
    const r = rowIndex + 1
    const cells = row.map((value, colIndex) => {
      const ref = `${columnName(colIndex)}${r}`
      return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`
    }).join("")
    return `<row r="${r}">${cells}</row>`
  }).join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`
}

export function buildStoredZip(files: ReadonlyArray<{ name: string; data: Uint8Array }>): Uint8Array {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name)
    const crc = crc32(file.data)
    const local = new Uint8Array(30 + nameBytes.length + file.data.length)
    writeUint32(local, 0, 0x04034b50)
    writeUint16(local, 4, 20)
    writeUint16(local, 8, 0)
    writeUint32(local, 14, crc)
    writeUint32(local, 18, file.data.length)
    writeUint32(local, 22, file.data.length)
    writeUint16(local, 26, nameBytes.length)
    local.set(nameBytes, 30)
    local.set(file.data, 30 + nameBytes.length)
    localChunks.push(local)

    const central = new Uint8Array(46 + nameBytes.length)
    writeUint32(central, 0, 0x02014b50)
    writeUint16(central, 4, 20)
    writeUint16(central, 6, 20)
    writeUint32(central, 16, crc)
    writeUint32(central, 20, file.data.length)
    writeUint32(central, 24, file.data.length)
    writeUint16(central, 28, nameBytes.length)
    writeUint32(central, 42, offset)
    central.set(nameBytes, 46)
    centralChunks.push(central)

    offset += local.length
  }

  const centralSize = centralChunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const end = new Uint8Array(22)
  writeUint32(end, 0, 0x06054b50)
  writeUint16(end, 8, files.length)
  writeUint16(end, 10, files.length)
  writeUint32(end, 12, centralSize)
  writeUint32(end, 16, offset)

  const zip = new Uint8Array(offset + centralSize + end.length)
  let cursor = 0
  for (const chunk of localChunks) {
    zip.set(chunk, cursor)
    cursor += chunk.length
  }
  for (const chunk of centralChunks) {
    zip.set(chunk, cursor)
    cursor += chunk.length
  }
  zip.set(end, cursor)
  return zip
}

export function readStoredZip(bytes: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>()
  let offset = 0

  while (offset + 30 <= bytes.length) {
    const signature = readUint32(bytes, offset)
    if (signature === 0x02014b50 || signature === 0x06054b50) break
    if (signature !== 0x04034b50) {
      throw new Error("Invalid ZIP local file header.")
    }

    const compression = readUint16(bytes, offset + 8)
    if (compression !== 0) throw new Error("Only uncompressed ZIP entries are supported.")

    const size = readUint32(bytes, offset + 22)
    const nameLength = readUint16(bytes, offset + 26)
    const extraLength = readUint16(bytes, offset + 28)
    const nameStart = offset + 30
    const dataStart = nameStart + nameLength + extraLength
    const name = decodeUtf8(bytes.subarray(nameStart, nameStart + nameLength))
    files.set(name, bytes.subarray(dataStart, dataStart + size))
    offset = dataStart + size
  }

  return files
}

export function buildWorkbook(sheets: readonly WorkbookSheet[]): Uint8Array {
  if (sheets.length === 0) throw new Error("A workbook needs at least one worksheet.")

  const sheetEntries = sheets.map((sheet, index) => {
    const id = index + 1
    return {
      id,
      name: sheet.name,
      path: `xl/worksheets/sheet${id}.xml`,
      relId: `rId${id}`,
      xml: worksheetXml(sheet.rows),
    }
  })

  const contentTypes = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    ...sheetEntries.map((sheet) =>
      `<Override PartName="/${sheet.path}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    ),
    "</Types>",
  ].join("")

  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'

  const workbook = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    "<sheets>",
    ...sheetEntries.map((sheet) =>
      `<sheet name="${escapeXml(sheet.name)}" sheetId="${sheet.id}" r:id="${sheet.relId}"/>`,
    ),
    "</sheets>",
    "</workbook>",
  ].join("")

  const workbookRels = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    ...sheetEntries.map((sheet) =>
      `<Relationship Id="${sheet.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`,
    ),
    "</Relationships>",
  ].join("")

  return buildStoredZip([
    { name: "[Content_Types].xml", data: encodeUtf8(contentTypes) },
    { name: "_rels/.rels", data: encodeUtf8(rootRels) },
    { name: "xl/workbook.xml", data: encodeUtf8(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: encodeUtf8(workbookRels) },
    ...sheetEntries.map((sheet) => ({ name: sheet.path, data: encodeUtf8(sheet.xml) })),
  ])
}

export function listWorkbookSheetNames(bytes: Uint8Array): string[] {
  const files = readStoredZip(bytes)
  const workbook = files.get("xl/workbook.xml")
  if (!workbook) throw new Error("The workbook is missing xl/workbook.xml.")

  return [...decodeUtf8(workbook).matchAll(/<sheet name="([^"]+)"/g)].map((match) => match[1])
}
