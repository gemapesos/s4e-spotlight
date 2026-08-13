import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Script } from "node:vm"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { transformWithOxc, type Plugin } from "vite"
import { defineConfig } from "vitest/config"

function stripModuleSyntax(source: string): string {
  return source.replace(/^export /gm, "").replace(/^import .+;\s*/gm, "")
}

function extensionScriptsPlugin(): Plugin {
  const backgroundPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/background.ts",
  )
  const pasteGuardPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/pasteGuard.ts",
  )
  const passkeyGuardPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/passkeyGuard.ts",
  )
  const passkeyGuardCorePath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "src/lib/passkeyGuardCore.ts",
  )
  const accountAutomationPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/accountAutomation.ts")
  const accountsPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/accounts.ts")

  return {
    name: "extension-scripts",
    buildStart() {
      this.addWatchFile(backgroundPath)
      this.addWatchFile(pasteGuardPath)
      this.addWatchFile(passkeyGuardPath)
      this.addWatchFile(passkeyGuardCorePath)
      this.addWatchFile(accountAutomationPath)
      this.addWatchFile(accountsPath)
    },
    async generateBundle(_options, bundle) {
      const [backgroundSource, pasteGuardSource, passkeyGuardSource, passkeyGuardCoreSource, accountAutomationSource, accountsSource] = await Promise.all([
        readFile(backgroundPath, "utf8"),
        readFile(pasteGuardPath, "utf8"),
        readFile(passkeyGuardPath, "utf8"),
        readFile(passkeyGuardCorePath, "utf8"),
        readFile(accountAutomationPath, "utf8"),
        readFile(accountsPath, "utf8"),
      ])
      const [backgroundResult, pasteGuardResult, passkeyGuardResult, passkeyGuardCoreResult, accountAutomationResult, accountsResult] = await Promise.all([
        transformWithOxc(backgroundSource, backgroundPath),
        transformWithOxc(pasteGuardSource, pasteGuardPath),
        transformWithOxc(passkeyGuardSource, passkeyGuardPath),
        transformWithOxc(passkeyGuardCoreSource, passkeyGuardCorePath),
        transformWithOxc(accountAutomationSource, accountAutomationPath),
        transformWithOxc(accountsSource, accountsPath),
      ])
      const passkeyGuardBundle = `${stripModuleSyntax(passkeyGuardCoreResult.code)}\n${stripModuleSyntax(passkeyGuardResult.code)}`

      this.emitFile({
        type: "asset",
        fileName: "background.js",
        source: backgroundResult.code,
      })
      const contentOutput = bundle["content.js"]
      if (!contentOutput || contentOutput.type !== "chunk") {
        this.error("The classic content.js bundle was not generated.")
      }

      for (const [fileName, source] of [
        ["paste-guard.js", pasteGuardResult.code],
        ["passkey-guard.js", passkeyGuardBundle],
        ["content.js", contentOutput.code],
        ["account-automation.js", accountAutomationResult.code],
      ] as const) {
        try {
          new Script(source, { filename: fileName })
        } catch (error) {
          this.error(`${fileName} must be valid classic JavaScript because Chrome loads it as a manifest content script: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      this.emitFile({ type: "asset", fileName: "account-automation.js", source: accountAutomationResult.code })
      this.emitFile({ type: "asset", fileName: "passkey-guard.js", source: passkeyGuardBundle })
      this.emitFile({ type: "asset", fileName: "lib/accounts.js", source: accountsResult.code })
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
