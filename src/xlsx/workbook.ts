export type WorkbookCell = string | number

export interface WorkbookFixedColumn {
  index: number
  widthPx: number
  wrapHeader?: boolean
}

export interface WorkbookSheet {
  name: string
  rows?: readonly (readonly WorkbookCell[])[]
  fixedColumns?: readonly WorkbookFixedColumn[]
  /** Header row height in pixels. Stored in the workbook as points. */
  headerRowHeightPx?: number
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

/** Control characters XML 1.0 forbids; one stray character makes Excel reject the whole file. */
const INVALID_XML_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g

function escapeXml(value: string): string {
  return value
    .replace(INVALID_XML_CHARACTERS, "")
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

/** Calibri 11 max digit width. Excel's column tooltip is floor(width * 7 + 5); 600px is width 85. */
const MAX_DIGIT_WIDTH_PX = 7
const COLUMN_PADDING_PX = 5
const AUTOFIT_SLACK_PX = MAX_DIGIT_WIDTH_PX
const MAX_COLUMN_PIXELS = 600

const NARROW_GLYPHS = new Set("ijl.,;:'!|`")
const SLIM_GLYPHS = new Set("frtI()[]{}")

function glyphPixels(char: string): number {
  if (char === " " || char === "\t") return 4
  if (char >= "0" && char <= "9") return MAX_DIGIT_WIDTH_PX
  if (NARROW_GLYPHS.has(char)) return 4
  if (SLIM_GLYPHS.has(char)) return 5
  if (char >= "a" && char <= "z") return char === "m" || char === "w" ? 11 : 7
  if (char >= "A" && char <= "Z") return char === "M" || char === "W" ? 12 : 8

  const code = char.codePointAt(0) ?? 0
  if (
    (code >= 0x1100 && code <= 0x115f) ||
    (code >= 0x2e80 && code <= 0xa4cf) ||
    (code >= 0xac00 && code <= 0xd7a3) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xfe10 && code <= 0xfe6f) ||
    (code >= 0xff01 && code <= 0xff60) ||
    (code >= 0xffe0 && code <= 0xffe6) ||
    code >= 0x1f300
  ) {
    return 14
  }
  return 8
}

function linePixels(line: string): number {
  let pixels = 0
  for (const char of line) pixels += glyphPixels(char)
  return pixels
}

function cellContentPixels(value: WorkbookCell): number {
  let max = 0
  for (const line of String(value).split(/\r\n|\n|\r/)) {
    max = Math.max(max, linePixels(line))
  }
  return max
}

function formatExcelWidthCents(cents: number): string {
  const whole = Math.trunc(cents / 100)
  const frac = cents % 100
  if (frac === 0) return String(whole)
  if (frac % 10 === 0) return `${whole}.${frac / 10}`
  return `${whole}.${String(frac).padStart(2, "0")}`
}

/** Excel width attribute, floored to 2 decimals, for a column that displays at most 600px. */
function excelWidthAttribute(displayedPixels: number): string {
  const pixels = Math.min(displayedPixels, MAX_COLUMN_PIXELS)
  const cents = Math.floor(((pixels - COLUMN_PADDING_PX) * 100) / MAX_DIGIT_WIDTH_PX)
  return formatExcelWidthCents(cents)
}

/** Width whose tooltip is exactly the requested pixel count. */
function excelWidthAttributeExact(targetPixels: number): string {
  const pixels = Math.min(Math.max(targetPixels, COLUMN_PADDING_PX), MAX_COLUMN_PIXELS)
  const cents = Math.ceil(((pixels - COLUMN_PADDING_PX) * 100) / MAX_DIGIT_WIDTH_PX)
  return formatExcelWidthCents(cents)
}

function colsXml(
  rows: readonly (readonly WorkbookCell[])[],
  fixedWidths: ReadonlyMap<number, number>,
): string {
  let count = rows.reduce((max, row) => Math.max(max, row.length), 0)
  for (const index of fixedWidths.keys()) count = Math.max(count, index + 1)
  const contentPixels = new Array<number>(count).fill(0)
  for (const row of rows) {
    row.forEach((cell, index) => {
      contentPixels[index] = Math.max(contentPixels[index], cellContentPixels(cell))
    })
  }

  const cols: string[] = []
  contentPixels.forEach((pixels, index) => {
    const fixed = fixedWidths.get(index)
    if (fixed == null && pixels <= 0) return
    const width = fixed == null
      ? excelWidthAttribute(Math.min(pixels + COLUMN_PADDING_PX + AUTOFIT_SLACK_PX, MAX_COLUMN_PIXELS))
      : excelWidthAttributeExact(fixed)
    const column = index + 1
    cols.push(`<col min="${column}" max="${column}" width="${width}" customWidth="1"/>`)
  })
  if (cols.length === 0) return ""
  return `<cols>${cols.join("")}</cols>`
}

const CENTER_STYLE = 0
const LEFT_STYLE = 1
const CENTER_WRAP_STYLE = 2

const LEFT_ALIGN_HEADERS = new Set([
  "SKU",
  "MSKU",
  "MSKUs",
  "Product Name",
  "Title",
  "Product",
  "Other Actions",
  "Additional Notes",
])

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
const SPREADSHEET_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
const PACKAGE_RELATIONSHIPS_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
const OFFICE_RELATIONSHIPS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
const SPREADSHEET_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml"

const STYLES_XML = [
  XML_DECLARATION,
  `<styleSheet xmlns="${SPREADSHEET_NS}">`,
  '<fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>',
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
  '<cellXfs count="3">',
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>',
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>',
  "</cellXfs>",
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
  "</styleSheet>",
].join("")

function leftAlignedColumns(rows: readonly (readonly WorkbookCell[])[]): Set<number> {
  const columns = new Set<number>()
  for (const row of rows) {
    row.forEach((cell, index) => {
      if (typeof cell === "string" && LEFT_ALIGN_HEADERS.has(cell)) columns.add(index)
    })
  }
  return columns
}

function isBlankCell(value: WorkbookCell): boolean {
  return typeof value === "string" && value.trim() === ""
}

/** xlsx row height is points. 96dpi pixels convert at 72/96. */
function rowHeightPoints(heightPx: number): string {
  const points = Math.round((heightPx * 72 / 96) * 100) / 100
  return String(points)
}

function cellXml(ref: string, value: WorkbookCell, style: number): string {
  if (isBlankCell(value)) return ""
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}" s="${style}"><v>${String(value)}</v></c>`
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`
}

function worksheetXml(sheet: WorkbookSheet): string {
  const rows = sheet.rows ?? []
  const worksheetOpen = `${XML_DECLARATION}<worksheet xmlns="${SPREADSHEET_NS}">`
  if (rows.length === 0) return `${worksheetOpen}<sheetData/></worksheet>`

  const fixedWidths = new Map((sheet.fixedColumns ?? []).map((column) => [column.index, column.widthPx]))
  const wrapHeaderColumns = new Set(
    (sheet.fixedColumns ?? []).filter((column) => column.wrapHeader).map((column) => column.index),
  )
  const leftColumns = leftAlignedColumns(rows)
  const rowXml = rows.map((row, rowIndex) => {
    const r = rowIndex + 1
    const cells = row.map((value, colIndex) => {
      const style = rowIndex === 0
        ? wrapHeaderColumns.has(colIndex) ? CENTER_WRAP_STYLE : CENTER_STYLE
        : leftColumns.has(colIndex) ? LEFT_STYLE : CENTER_STYLE
      return cellXml(`${columnName(colIndex)}${r}`, value, style)
    }).join("")
    const height = rowIndex === 0 && sheet.headerRowHeightPx != null
      ? ` ht="${rowHeightPoints(sheet.headerRowHeightPx)}" customHeight="1"`
      : ""
    return `<row r="${r}"${height}>${cells}</row>`
  }).join("")

  return `${worksheetOpen}${colsXml(rows, fixedWidths)}<sheetData>${rowXml}</sheetData></worksheet>`
}

/** `date` in the zip format's local-time DOS fields; all zeros would unzip as 1979/1980. */
export function dosDateTime(date: Date): { time: number; day: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    day: ((Math.max(1980, date.getFullYear()) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  }
}

export function buildStoredZip(files: ReadonlyArray<{ name: string; data: Uint8Array }>, date = new Date()): Uint8Array {
  const localChunks: Uint8Array[] = []
  const centralChunks: Uint8Array[] = []
  const { time, day } = dosDateTime(date)
  let offset = 0

  for (const file of files) {
    const nameBytes = encodeUtf8(file.name)
    const crc = crc32(file.data)
    const local = new Uint8Array(30 + nameBytes.length + file.data.length)
    writeUint32(local, 0, 0x04034b50)
    writeUint16(local, 4, 20)
    writeUint16(local, 8, 0)
    writeUint16(local, 10, time)
    writeUint16(local, 12, day)
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
    writeUint16(central, 12, time)
    writeUint16(central, 14, day)
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
      xml: worksheetXml(sheet),
    }
  })

  const contentTypes = [
    XML_DECLARATION,
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    `<Override PartName="/xl/workbook.xml" ContentType="${SPREADSHEET_CONTENT_TYPE}.sheet.main+xml"/>`,
    `<Override PartName="/xl/styles.xml" ContentType="${SPREADSHEET_CONTENT_TYPE}.styles+xml"/>`,
    ...sheetEntries.map((sheet) =>
      `<Override PartName="/${sheet.path}" ContentType="${SPREADSHEET_CONTENT_TYPE}.worksheet+xml"/>`,
    ),
    "</Types>",
  ].join("")

  const rootRels = [
    XML_DECLARATION,
    `<Relationships xmlns="${PACKAGE_RELATIONSHIPS_NS}">`,
    `<Relationship Id="rId1" Type="${OFFICE_RELATIONSHIPS}/officeDocument" Target="xl/workbook.xml"/>`,
    "</Relationships>",
  ].join("")

  const workbook = [
    XML_DECLARATION,
    `<workbook xmlns="${SPREADSHEET_NS}" xmlns:r="${OFFICE_RELATIONSHIPS}">`,
    "<sheets>",
    ...sheetEntries.map((sheet) =>
      `<sheet name="${escapeXml(sheet.name)}" sheetId="${sheet.id}" r:id="${sheet.relId}"/>`,
    ),
    "</sheets>",
    "</workbook>",
  ].join("")

  const stylesRelId = `rId${sheetEntries.length + 1}`
  const workbookRels = [
    XML_DECLARATION,
    `<Relationships xmlns="${PACKAGE_RELATIONSHIPS_NS}">`,
    ...sheetEntries.map((sheet) =>
      `<Relationship Id="${sheet.relId}" Type="${OFFICE_RELATIONSHIPS}/worksheet" Target="worksheets/sheet${sheet.id}.xml"/>`,
    ),
    `<Relationship Id="${stylesRelId}" Type="${OFFICE_RELATIONSHIPS}/styles" Target="styles.xml"/>`,
    "</Relationships>",
  ].join("")

  return buildStoredZip([
    { name: "[Content_Types].xml", data: encodeUtf8(contentTypes) },
    { name: "_rels/.rels", data: encodeUtf8(rootRels) },
    { name: "xl/workbook.xml", data: encodeUtf8(workbook) },
    { name: "xl/_rels/workbook.xml.rels", data: encodeUtf8(workbookRels) },
    { name: "xl/styles.xml", data: encodeUtf8(STYLES_XML) },
    ...sheetEntries.map((sheet) => ({ name: sheet.path, data: encodeUtf8(sheet.xml) })),
  ])
}

export function listWorkbookSheetNames(bytes: Uint8Array): string[] {
  const files = readStoredZip(bytes)
  const workbook = files.get("xl/workbook.xml")
  if (!workbook) throw new Error("The workbook is missing xl/workbook.xml.")

  return [...decodeUtf8(workbook).matchAll(/<sheet name="([^"]+)"/g)].map((match) => match[1])
}
