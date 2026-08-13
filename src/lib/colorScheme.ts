export function applyPrefersColorScheme(element: HTMLElement, targetWindow: Window = window): () => void {
  const media = targetWindow.matchMedia?.("(prefers-color-scheme: dark)")
  if (!media) return () => undefined
  const sync = () => element.classList.toggle("dark", media.matches)
  sync()
  media.addEventListener("change", sync)
  return () => media.removeEventListener("change", sync)
}
