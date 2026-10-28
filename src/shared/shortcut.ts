export function isPaletteShortcut(event: KeyboardEvent) {
  const isSlash = event.code === "Slash" || event.key === "/"
  const hasPrimaryModifier = event.metaKey || event.ctrlKey

  return isSlash && hasPrimaryModifier && !event.altKey && !event.shiftKey
}
