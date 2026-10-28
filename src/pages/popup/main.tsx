import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { forwardLogsToBackground, setLogSink } from "@/shared/log"
import { PopupApp } from "@/pages/popup/PopupApp"

setLogSink(forwardLogsToBackground())
applyPrefersColorScheme(document.documentElement)
// The popup is a raised surface like the palette, so it uses popover, which lifts in dark mode.
document.body.classList.add("bg-popover")
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PopupApp />
  </StrictMode>,
)
