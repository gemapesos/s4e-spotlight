import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { forwardLogsToBackground, setLogSink } from "@/lib/log"
import { TimeoutApp } from "@/timeout/TimeoutApp"

setLogSink(forwardLogsToBackground())
applyPrefersColorScheme(document.documentElement)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimeoutApp />
  </StrictMode>,
)
