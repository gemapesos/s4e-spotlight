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

function asClassicContentScript(source: string): string {
  return `(function () {\n${source}\n})();\n`
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
  const geistFontPath = resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
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
  const settingsPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/settings.ts")
  const sellerCentralSessionPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/sellerCentralSession.ts")
  const unfulfillablePath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/unfulfillable.ts")
  const feedbackPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/feedback.ts")
  const strandedPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/stranded.ts")
  const suppressedPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/suppressed.ts")
  const shippingQueuePath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/shippingQueue.ts")
  const contentPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/content.tsx")
  const shortcutPath = resolve(fileURLToPath(new URL(".", import.meta.url)), "src/lib/shortcut.ts")

  return {
    name: "extension-scripts",
    buildStart() {
      this.addWatchFile(backgroundPath)
      this.addWatchFile(geistFontPath)
      this.addWatchFile(pasteGuardPath)
      this.addWatchFile(passkeyGuardPath)
      this.addWatchFile(passkeyGuardCorePath)
      this.addWatchFile(accountAutomationPath)
      this.addWatchFile(accountsPath)
      this.addWatchFile(settingsPath)
      this.addWatchFile(sellerCentralSessionPath)
      this.addWatchFile(unfulfillablePath)
      this.addWatchFile(feedbackPath)
      this.addWatchFile(strandedPath)
      this.addWatchFile(suppressedPath)
      this.addWatchFile(shippingQueuePath)
      this.addWatchFile(contentPath)
      this.addWatchFile(shortcutPath)
    },
    async generateBundle(_options, bundle) {
      const [backgroundSource, pasteGuardSource, passkeyGuardSource, passkeyGuardCoreSource, accountAutomationSource, accountsSource, settingsSource, sellerCentralSessionSource, unfulfillableSource, feedbackSource, strandedSource, suppressedSource, shippingQueueSource, contentSource, shortcutSource, geistFont] = await Promise.all([
        readFile(backgroundPath, "utf8"),
        readFile(pasteGuardPath, "utf8"),
        readFile(passkeyGuardPath, "utf8"),
        readFile(passkeyGuardCorePath, "utf8"),
        readFile(accountAutomationPath, "utf8"),
        readFile(accountsPath, "utf8"),
        readFile(settingsPath, "utf8"),
        readFile(sellerCentralSessionPath, "utf8"),
        readFile(unfulfillablePath, "utf8"),
        readFile(feedbackPath, "utf8"),
        readFile(strandedPath, "utf8"),
        readFile(suppressedPath, "utf8"),
        readFile(shippingQueuePath, "utf8"),
        readFile(contentPath, "utf8"),
        readFile(shortcutPath, "utf8"),
        readFile(geistFontPath),
      ])
      const [backgroundResult, pasteGuardResult, passkeyGuardResult, passkeyGuardCoreResult, accountAutomationResult, accountsResult, settingsResult, sellerCentralSessionResult, unfulfillableResult, feedbackResult, strandedResult, suppressedResult, shippingQueueResult, contentResult, shortcutResult] = await Promise.all([
        transformWithOxc(backgroundSource, backgroundPath),
        transformWithOxc(pasteGuardSource, pasteGuardPath),
        transformWithOxc(passkeyGuardSource, passkeyGuardPath),
        transformWithOxc(passkeyGuardCoreSource, passkeyGuardCorePath),
        transformWithOxc(accountAutomationSource, accountAutomationPath),
        transformWithOxc(accountsSource, accountsPath),
        transformWithOxc(settingsSource, settingsPath),
        transformWithOxc(sellerCentralSessionSource, sellerCentralSessionPath),
        transformWithOxc(unfulfillableSource, unfulfillablePath),
        transformWithOxc(feedbackSource, feedbackPath),
        transformWithOxc(strandedSource, strandedPath),
        transformWithOxc(suppressedSource, suppressedPath),
        transformWithOxc(shippingQueueSource, shippingQueuePath),
        transformWithOxc(contentSource, contentPath),
        transformWithOxc(shortcutSource, shortcutPath),
      ])
      const passkeyGuardBundle = `${stripModuleSyntax(passkeyGuardCoreResult.code)}\n${stripModuleSyntax(passkeyGuardResult.code)}`
      const sellerCentralSessionBoot = stripModuleSyntax(sellerCentralSessionResult.code)
      const accountAutomationBundle = asClassicContentScript(
        `${sellerCentralSessionBoot}\n${stripModuleSyntax(accountAutomationResult.code)}`,
      )
      const contentBoot = asClassicContentScript(
        `${stripModuleSyntax(shortcutResult.code)}\n${sellerCentralSessionBoot}\n${stripModuleSyntax(unfulfillableResult.code)}\n${stripModuleSyntax(feedbackResult.code)}\n${stripModuleSyntax(strandedResult.code)}\n${stripModuleSyntax(suppressedResult.code)}\n${stripModuleSyntax(shippingQueueResult.code)}\n${stripModuleSyntax(contentResult.code)}`,
      )

      this.emitFile({
        type: "asset",
        fileName: "background.js",
        source: backgroundResult.code,
      })
      const paletteOutput = bundle["palette-app.js"]
      if (!paletteOutput || paletteOutput.type !== "chunk") {
        this.error("The palette-app.js bundle was not generated.")
      }

      for (const [fileName, source] of [
        ["paste-guard.js", pasteGuardResult.code],
        ["passkey-guard.js", passkeyGuardBundle],
        ["content.js", contentBoot],
        ["account-automation.js", accountAutomationBundle],
      ] as const) {
        try {
          new Script(source, { filename: fileName })
        } catch (error) {
          this.error(`${fileName} must be valid classic JavaScript because Chrome loads it as a manifest content script: ${error instanceof Error ? error.message : String(error)}`)
        }
      }
      try {
        new Script(`${contentBoot}\n${accountAutomationBundle}`, { filename: "content+account-automation.js" })
      } catch (error) {
        this.error(`content.js and account-automation.js must share a page without clashing: ${error instanceof Error ? error.message : String(error)}`)
      }

      this.emitFile({ type: "asset", fileName: "account-automation.js", source: accountAutomationBundle })
      this.emitFile({ type: "asset", fileName: "passkey-guard.js", source: passkeyGuardBundle })
      this.emitFile({ type: "asset", fileName: "lib/accounts.js", source: accountsResult.code })
      this.emitFile({ type: "asset", fileName: "lib/settings.js", source: settingsResult.code })
      this.emitFile({
        type: "asset",
        fileName: "content.js",
        source: contentBoot,
      })
      this.emitFile({
        type: "asset",
        fileName: "paste-guard.js",
        source: pasteGuardResult.code,
      })
      this.emitFile({
        type: "asset",
        fileName: "geist-latin-wght-normal.woff2",
        source: geistFont,
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
