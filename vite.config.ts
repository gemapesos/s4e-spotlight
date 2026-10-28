import { readFile } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { rolldown } from "rolldown"
import type { Plugin } from "vite"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))
const fromRoot = (path: string) => resolve(root, path)
const FONT_PATHS = [
  "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  "node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
]

/**
 * Scripts Chrome loads itself, each bundled into one file. Manifest content scripts can't be
 * modules, so they are IIFEs; the service worker is an ES module.
 */
const EXTENSION_SCRIPTS = {
  "background.js": { input: "src/background/index.ts", format: "es" },
  "content.js": { input: "src/content/paletteLoader.ts", format: "iife" },
  "seller-central.js": { input: "src/content/sellerCentral.ts", format: "iife" },
  "paste-guard.js": { input: "src/pasteGuard.ts", format: "iife" },
  "passkey-guard.js": { input: "src/passkeyGuard.ts", format: "iife" },
  "account-automation.js": { input: "src/accountAutomation.ts", format: "iife" },
} as const

function extensionScriptsPlugin(): Plugin {
  return {
    name: "extension-scripts",
    apply: "build",
    async buildStart() {
      for (const [fileName, { input, format }] of Object.entries(EXTENSION_SCRIPTS)) {
        const warnings: string[] = []
        const bundle = await rolldown({
          input: fromRoot(input),
          platform: "browser",
          resolve: { alias: { "@": fromRoot("src") } },
          onLog: (level, log) => {
            // Entries export functions for tests only; nothing reads them from the IIFE.
            if (level === "warn" && log.code !== "MISSING_NAME_OPTION_FOR_IIFE_EXPORT") warnings.push(log.message)
          },
        })
        try {
          const [chunk] = (await bundle.generate({ format, minify: true, codeSplitting: false })).output
          // A warning such as an unresolved package means a script that throws once Chrome runs it.
          if (warnings.length) this.error(`${fileName}: ${warnings.join("\n")}`)
          for (const id of chunk.moduleIds) this.addWatchFile(id)
          this.emitFile({ type: "asset", fileName, source: chunk.code })
        } finally {
          await bundle.close()
        }
      }
      for (const path of FONT_PATHS) {
        this.emitFile({ type: "asset", fileName: basename(path), source: await readFile(fromRoot(path)) })
      }
    },
  }
}

// Tests run east of UTC so local-time and UTC formatting land on different days. Test workers inherit this.
if (process.env.VITEST) process.env.TZ = "Asia/Manila"

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), extensionScriptsPlugin()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "test" ? "test" : "production",
    ),
  },
  build: {
    outDir: "dist",
    emptyOutDir: mode !== "development",
    cssCodeSplit: false,
    minify: "oxc",
    lib: {
      entry: "src/paletteApp.tsx",
      formats: ["es"],
      fileName: () => "palette-app.js",
    },
    rollupOptions: {
      output: {
        codeSplitting: false,
        assetFileNames: "[name][extname]",
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    restoreMocks: true,
  },
}))
