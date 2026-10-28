import { resolve } from "node:path"

import { rolldown } from "rolldown"
import { afterEach, expect, it, vi } from "vitest"

afterEach(() => vi.unstubAllGlobals())

// Runs the bundled worker, as Chrome does. Vitest's own module loader hides a module reading
// another's value before it is initialized (an import cycle); the bundle throws, so test that.
it("bundles a service worker that starts and registers its listeners", async () => {
  const bundle = await rolldown({
    input: resolve("src/background/index.ts"),
    platform: "browser",
    resolve: { alias: { "@": resolve("src") } },
  })
  const [chunk] = (await bundle.generate({ format: "es", codeSplitting: false })).output
  await bundle.close()
  const listener = () => ({ addListener: vi.fn() })
  const area = { get: vi.fn(async () => ({})), set: vi.fn(), remove: vi.fn(), setAccessLevel: vi.fn(async () => undefined) }
  const chrome = {
    runtime: { id: "extension-id", getURL: (path: string) => `chrome-extension://extension-id/${path}`, getManifest: () => ({ version: "0.1.0" }), onMessage: listener(), onInstalled: listener() },
    storage: { local: area, session: area },
    tabs: { onUpdated: listener(), onRemoved: listener() },
    debugger: { onDetach: listener() },
  }
  vi.stubGlobal("chrome", chrome)

  new Function(chunk.code)()

  expect(area.setAccessLevel).toHaveBeenCalledWith({ accessLevel: "TRUSTED_CONTEXTS" })
  for (const event of [chrome.runtime.onMessage, chrome.tabs.onUpdated, chrome.tabs.onRemoved, chrome.debugger.onDetach]) {
    expect(event.addListener).toHaveBeenCalledOnce()
  }
})
