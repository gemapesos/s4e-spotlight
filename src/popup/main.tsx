import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { PopupApp } from "@/popup/PopupApp"

applyPrefersColorScheme(document.documentElement)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)
