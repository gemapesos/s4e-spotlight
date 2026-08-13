import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@fontsource-variable/geist"
import "@/styles.css"
import { applyPrefersColorScheme } from "@/lib/colorScheme"
import { OptionsApp } from "@/options/OptionsApp"

applyPrefersColorScheme(document.documentElement)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OptionsApp />
  </StrictMode>,
)
