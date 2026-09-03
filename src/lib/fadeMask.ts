export type FadeMaskState = "none" | "top" | "bottom" | "both"

export function fadeMaskForScroll(element: {
  clientHeight: number
  scrollHeight: number
  scrollTop: number
}): FadeMaskState {
  const threshold = 1
  const hasOverflow = element.scrollHeight - element.clientHeight > threshold
  const above = hasOverflow && element.scrollTop > threshold
  const below = hasOverflow && element.scrollTop + element.clientHeight < element.scrollHeight - threshold
  return above && below ? "both" : above ? "top" : below ? "bottom" : "none"
}
