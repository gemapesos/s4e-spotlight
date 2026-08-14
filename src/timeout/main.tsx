import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { TimeoutApp } from "@/timeout/TimeoutApp"

applyPrefersColorScheme(document.documentElement)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimeoutApp />
  </StrictMode>,
)
