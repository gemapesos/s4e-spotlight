/** Saves `blob` to the user's downloads as `fileName`. */
export function saveFile(blob: Blob, fileName: string, targetDocument: Document = document): void {
  const url = URL.createObjectURL(blob)
  const anchor = targetDocument.createElement("a")
  anchor.href = url
  anchor.download = fileName
  targetDocument.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function saveJsonFile(value: unknown, fileName: string, targetDocument: Document = document): void {
  saveFile(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }), fileName, targetDocument)
}
