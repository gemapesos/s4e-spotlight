import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { WorkspaceApp } from "@/results/WorkspaceApp"

applyPrefersColorScheme(document.documentElement)
// The window is a raised surface like the palette, so it uses popover, which lifts in dark mode.
document.body.classList.add("bg-popover")
// Each tab scrolls its own body; the page itself never does, even while a tab slides in.
document.documentElement.classList.add("overflow-hidden")
document.body.classList.add("overflow-hidden")
createRoot(document.getElementById("root")!).render(<StrictMode><WorkspaceApp /></StrictMode>)
