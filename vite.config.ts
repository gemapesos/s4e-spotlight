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
  const accountAutomationPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/accountAutomation.ts")
  const accountsPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/accounts.ts")
  const optionsPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/options.ts")

  return {
    name: "extension-scripts",
    buildStart() {
      this.addWatchFile(backgroundPath)
      this.addWatchFile(pasteGuardPath)
      this.addWatchFile(accountAutomationPath)
      this.addWatchFile(accountsPath)
      this.addWatchFile(optionsPath)
    },
    async generateBundle() {
      const [backgroundSource, pasteGuardSource, accountAutomationSource, accountsSource, optionsSource] = await Promise.all([
        readFile(backgroundPath, "utf8"),
        readFile(pasteGuardPath, "utf8"),
        readFile(accountAutomationPath, "utf8"),
        readFile(accountsPath, "utf8"),
        readFile(optionsPath, "utf8"),
      ])
      const [backgroundResult, pasteGuardResult, accountAutomationResult, accountsResult, optionsResult] = await Promise.all([
        transformWithOxc(backgroundSource, backgroundPath),
        transformWithOxc(pasteGuardSource, pasteGuardPath),
        transformWithOxc(accountAutomationSource, accountAutomationPath),
        transformWithOxc(accountsSource, accountsPath),
        transformWithOxc(optionsSource, optionsPath),
      ])

      this.emitFile({
        type: "asset",
        fileName: "background.js",
        source: backgroundResult.code,
      })
      this.emitFile({ type: "asset", fileName: "account-automation.js", source: accountAutomationResult.code })
      this.emitFile({ type: "asset", fileName: "lib/accounts.js", source: accountsResult.code })
      this.emitFile({ type: "asset", fileName: "options.js", source: optionsResult.code })
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
