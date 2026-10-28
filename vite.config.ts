import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Script } from "node:vm"

import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { transformWithOxc, type Plugin } from "vite"
import { defineConfig } from "vitest/config"

const root = fileURLToPath(new URL(".", import.meta.url))
const fromRoot = (path: string) => resolve(root, path)
const GEIST_FONT_PATH = "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"
const GEIST_MONO_FONT_PATH = "node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2"

/** Modules Chrome loads without bundling: compiled one by one, then emitted or concatenated. */
const SCRIPT_SOURCES = {
  background: "src/background.ts",
  accounts: "src/lib/accounts.ts",
  settings: "src/lib/settings.ts",
  log: "src/lib/log.ts",
  dates: "src/lib/dates.ts",
  pasteGuard: "src/pasteGuard.ts",
  passkeyGuardCore: "src/lib/passkeyGuardCore.ts",
  passkeyGuard: "src/passkeyGuard.ts",
  shortcut: "src/lib/shortcut.ts",
  sellerCentralSession: "src/lib/sellerCentralSession.ts",
  accountAutomation: "src/accountAutomation.ts",
  unfulfillable: "src/lib/unfulfillable.ts",
  bulkRemoval: "src/lib/bulkRemoval.ts",
  feedback: "src/lib/feedback.ts",
  stranded: "src/lib/stranded.ts",
  suppressed: "src/lib/suppressed.ts",
  shippingQueue: "src/lib/shippingQueue.ts",
  viewCase: "src/lib/viewCase.ts",
  content: "src/content.tsx",
} as const

type ScriptName = keyof typeof SCRIPT_SOURCES

/**
 * Manifest content scripts are classic scripts, so each one concatenates its modules in
 * dependency order inside one function scope. Top-level names must be unique within a script.
 */
const CLASSIC_SCRIPTS: Record<string, readonly ScriptName[]> = {
  "paste-guard.js": ["pasteGuard"],
  "passkey-guard.js": ["passkeyGuardCore", "passkeyGuard"],
  "content.js": [
    "log",
    "dates",
    "shortcut",
    "sellerCentralSession",
    "unfulfillable",
    "bulkRemoval",
    "feedback",
    "stranded",
    "suppressed",
    "shippingQueue",
    "viewCase",
    "content",
  ],
  "account-automation.js": ["log", "sellerCentralSession", "accountAutomation"],
}

/** ES modules the background service worker imports by relative path. */
const BACKGROUND_MODULES: Record<string, ScriptName> = {
  "background.js": "background",
  "lib/accounts.js": "accounts",
  "lib/settings.js": "settings",
  "lib/log.js": "log",
}

/** Static imports in compiled code, as written (type-only imports are already gone). */
function staticImports(source: string): string[] {
  return [...source.matchAll(/^import\s[^;]*?from\s*["']([^"']+)["']/gm)].map((match) => match[1])
}

/** The module a relative import names, or undefined when it isn't one of SCRIPT_SOURCES. */
function importedScript(specifier: string): ScriptName | undefined {
  const base = specifier.split("/").pop()?.replace(/\.(?:js|ts|tsx)$/u, "")
  return base && Object.hasOwn(SCRIPT_SOURCES, base) ? base as ScriptName : undefined
}

function stripModuleSyntax(source: string): string {
  return source.replace(/^export /gm, "").replace(/^import .+;\s*/gm, "")
}

function asClassicContentScript(source: string): string {
  return `(function () {\n${source}\n})();\n`
}

function topLevelNames(source: string): string[] {
  const declarations = /^(?:async\s+)?function\s*\*?\s*([\w$]+)|^(?:const|let|var|class)\s+([\w$]+)/gm
  return [...source.matchAll(declarations)].map((match) => match[1] ?? match[2])
}

/** Two modules declaring the same top-level function would silently override each other. */
function duplicateTopLevelName(modules: ReadonlyArray<{ name: ScriptName; code: string }>): string | undefined {
  const owners = new Map<string, ScriptName>()
  for (const { name, code } of modules) {
    for (const identifier of topLevelNames(code)) {
      const owner = owners.get(identifier)
      if (owner && owner !== name) return `“${identifier}” is declared in both ${owner} and ${name}`
      owners.set(identifier, name)
    }
  }
  return undefined
}

function extensionScriptsPlugin(): Plugin {
  return {
    name: "extension-scripts",
    buildStart() {
      this.addWatchFile(fromRoot(GEIST_FONT_PATH))
      for (const path of Object.values(SCRIPT_SOURCES)) this.addWatchFile(fromRoot(path))
    },
    async generateBundle(_options, bundle) {
      const paletteOutput = bundle["palette-app.js"]
      if (!paletteOutput || paletteOutput.type !== "chunk") {
        this.error("The palette-app.js bundle was not generated.")
      }

      const entries = await Promise.all(
        (Object.entries(SCRIPT_SOURCES) as Array<[ScriptName, string]>).map(async ([name, path]) => {
          const file = fromRoot(path)
          const { code } = await transformWithOxc(await readFile(file, "utf8"), file)
          return [name, code] as const
        }),
      )
      const compiled = Object.fromEntries(entries) as Record<ScriptName, string>

      // Nothing here is bundled, so a module missing from a list fails only when Chrome runs it.
      for (const [fileName, names] of Object.entries(CLASSIC_SCRIPTS)) {
        for (const name of names) {
          for (const specifier of staticImports(compiled[name])) {
            const imported = importedScript(specifier)
            if (!imported || !names.includes(imported)) this.error(`${fileName}: ${name} imports “${specifier}”, which is not one of its CLASSIC_SCRIPTS modules.`)
          }
        }
      }
      const backgroundFiles = new Set(Object.keys(BACKGROUND_MODULES))
      for (const [fileName, name] of Object.entries(BACKGROUND_MODULES)) {
        for (const specifier of staticImports(compiled[name])) {
          const target = resolve("/", fileName, "..", specifier).slice(1)
          if (!backgroundFiles.has(target)) this.error(`${fileName} imports “${specifier}”, which is not emitted. Add it to BACKGROUND_MODULES.`)
        }
      }

      const classicScripts = Object.entries(CLASSIC_SCRIPTS).map(([fileName, names]) => {
        const modules = names.map((name) => ({ name, code: stripModuleSyntax(compiled[name]) }))
        const duplicate = duplicateTopLevelName(modules)
        if (duplicate) this.error(`${fileName}: ${duplicate}. Rename one of them.`)
        const source = asClassicContentScript(modules.map(({ code }) => code).join("\n"))
        try {
          new Script(source, { filename: fileName })
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          this.error(`${fileName} must be valid classic JavaScript because Chrome loads it as a manifest content script: ${reason}`)
        }
        return [fileName, source] as const
      })

      for (const [fileName, source] of classicScripts) this.emitFile({ type: "asset", fileName, source })
      for (const [fileName, name] of Object.entries(BACKGROUND_MODULES)) {
        this.emitFile({ type: "asset", fileName, source: compiled[name] })
      }
      this.emitFile({
        type: "asset",
        fileName: "geist-latin-wght-normal.woff2",
        source: await readFile(fromRoot(GEIST_FONT_PATH)),
      })
      this.emitFile({
        type: "asset",
        fileName: "geist-mono-latin-wght-normal.woff2",
        source: await readFile(fromRoot(GEIST_MONO_FONT_PATH)),
      })
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
