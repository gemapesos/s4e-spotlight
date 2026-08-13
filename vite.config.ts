import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { transformWithOxc, type Plugin } from "vite"
import { defineConfig } from "vitest/config"

function extensionScriptsPlugin(): Plugin {
  const backgroundPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/background.ts",
  )
  const pasteGuardPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/pasteGuard.ts",
  )

  return {
    name: "extension-scripts",
    buildStart() {
      this.addWatchFile(backgroundPath)
      this.addWatchFile(pasteGuardPath)
    },
    async generateBundle() {
      const [backgroundSource, pasteGuardSource] = await Promise.all([
        readFile(backgroundPath, "utf8"),
        readFile(pasteGuardPath, "utf8"),
      ])
      const [backgroundResult, pasteGuardResult] = await Promise.all([
        transformWithOxc(backgroundSource, backgroundPath),
        transformWithOxc(pasteGuardSource, pasteGuardPath),
      ])

      this.emitFile({
        type: "asset",
        fileName: "background.js",
        source: backgroundResult.code,
      })
      this.emitFile({
        type: "asset",
        fileName: "paste-guard.js",
        source: pasteGuardResult.code,
      })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), extensionScriptsPlugin()],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      mode === "test" ? "test" : "production",
    ),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    minify: "oxc",
    lib: {
      entry: "src/content.tsx",
      formats: ["iife"],
      name: "CommandPaletteExtension",
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
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
