import { readFileSync } from "node:fs"
import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { OptionsApp } from "../src/options/OptionsApp"
import { WorkspaceApp } from "../src/results/WorkspaceApp"
import { SESSION_KEY_STORAGE_KEY } from "../src/lib/accounts"

const vault = { version: 1, stores: [], credentials: [{ id: "credential", domain: "fixture@example.test", password: "fixture-secret", otpAuthUri: "otpauth://totp/Fixture?secret=JBSWY3DPEHPK3PXP" }] }

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.history.replaceState(null, "", "/")
  document.body.replaceChildren()
})

describe("protected extension pages", () => {
  it("clears an open credential editor when another page locks the vault", async () => {
    let unlocked = true
    const listeners = new Set<(changes: Record<string, chrome.storage.StorageChange>, area: string) => void>()
    const sendMessage = vi.fn(async (message: { type: string }) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked }
      return { ok: true, vault }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage }, storage: { onChanged: { addListener: (fn: typeof listeners extends Set<infer F> ? F : never) => listeners.add(fn), removeListener: (fn: typeof listeners extends Set<infer F> ? F : never) => listeners.delete(fn) } } })
    render(<OptionsApp />)
    expect(await screen.findByLabelText("Password for fixture@example.test")).toHaveValue("fixture-secret")
    unlocked = false
    await act(async () => { for (const listener of listeners) listener({ [SESSION_KEY_STORAGE_KEY]: { oldValue: "fixture-key" } }, "session") })
    expect(await screen.findByRole("button", { name: "Unlock" })).toBeVisible()
    expect(screen.queryByLabelText("Password for fixture@example.test")).not.toBeInTheDocument()
    expect(document.body.textContent).not.toContain("fixture-secret")
  })

  it("discards a late plaintext load after an external Lock", async () => {
    let unlocked = true
    let release!: (value: unknown) => void
    let listener!: (changes: Record<string, chrome.storage.StorageChange>, area: string) => void
    const sendMessage = vi.fn(async (message: { type: string }) => message.type === "ACCOUNTS_STATUS" ? { ok: true, initialized: true, unlocked } : new Promise((resolve) => { release = resolve }))
    vi.stubGlobal("chrome", { runtime: { sendMessage }, storage: { onChanged: { addListener: (fn: typeof listener) => { listener = fn }, removeListener: vi.fn() } } })
    render(<OptionsApp />)
    await vi.waitFor(() => expect(release).toBeDefined())
    unlocked = false
    await act(async () => {
      listener({ [SESSION_KEY_STORAGE_KEY]: { oldValue: "fixture-key" } }, "session")
      release({ ok: true, vault })
    })
    expect(await screen.findByRole("button", { name: "Unlock" })).toBeVisible()
    expect(screen.queryByLabelText("Password for fixture@example.test")).not.toBeInTheDocument()
  })

  it("unlocks in the workspace window and resumes the palette's switch exactly once", async () => {
    window.history.replaceState(null, "", "/?launch=fixture-launch")
    let unlocked = false
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "accounts", caseIds: [], resumeId: "fixture-resume", storeName: "JMG Outdoors" }
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked, stores: [], currentStore: null }
      if (message.type === "ACCOUNTS_UNLOCK") unlocked = true
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage, onMessage: { addListener: vi.fn(), removeListener: vi.fn() } } })
    render(<WorkspaceApp />)
    const user = userEvent.setup()
    expect(await screen.findByText("JMG Outdoors")).toBeVisible()
    expect(sendMessage).toHaveBeenCalledWith({ type: "RESULTS_INIT", launchId: "fixture-launch" })
    await user.type(screen.getByLabelText("Master password"), "fixture-master-password")
    await user.click(screen.getByRole("button", { name: "Unlock and switch" }))
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: "fixture-resume" }))
    const types = sendMessage.mock.calls.map(([message]) => message.type)
    expect(types.indexOf("ACCOUNTS_UNLOCK")).toBeLessThan(types.indexOf("ACCOUNTS_RESUME_SWITCH"))
    expect(types.filter((type) => type === "ACCOUNTS_RESUME_SWITCH")).toHaveLength(1)
  })

  it("selects and confirms reports once in the window, with the run id on every source request", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "reports", caseIds: [] }
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true, stores: [], currentStore: null }
      if (message.type === "REPORTS_PREPARE") return { ok: true, runId: "fixture-run" }
      return { ok: true, listings: [], feedbacks: [], shipments: [] }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage, onMessage: { addListener: vi.fn(), removeListener: vi.fn() } } })
    render(<WorkspaceApp />)
    const user = userEvent.setup()
    const generate = await screen.findByRole("button", { name: "Generate report" })
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "REPORTS_PREPARE" }))
    await user.click(screen.getByRole("checkbox", { name: "Seller Feedback" }))
    await user.click(generate)
    expect(await screen.findByRole("button", { name: "Download" })).toBeEnabled()
    expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_PREPARE", sections: ["unfulfillable", "stranded", "suppressed", "shippingQueue"] })
    const fetches = sendMessage.mock.calls.filter(([message]) => String(message.type).startsWith("REPORTS_FETCH_"))
    expect(fetches).toHaveLength(4)
    expect(fetches.every(([message]) => message.runId === "fixture-run")).toBe(true)
    expect(sendMessage).toHaveBeenCalledWith({ type: "RESULTS_FINISH", runId: "fixture-run" })
  })

  it("carries case IDs into the window and waits for confirmation", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => message.type === "RESULTS_INIT" ? { ok: true, mode: "cases", caseIds: ["11111111111", "22222222222"] } : { ok: true, initialized: true, unlocked: false, stores: [] })
    vi.stubGlobal("chrome", { runtime: { sendMessage, onMessage: { addListener: vi.fn(), removeListener: vi.fn() } } })
    render(<WorkspaceApp />)
    expect(await screen.findByRole("textbox", { name: "Case IDs" })).toHaveValue("11111111111\n22222222222")
    expect(screen.getByRole("button", { name: "Scrape 2 cases" })).toBeEnabled()
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "REPORTS_PREPARE" }))
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "SCRAPE_CASES" }))
  })

  it("keeps protected pages out of web-accessible resources", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"))
    const resources = manifest.web_accessible_resources.flatMap((entry: { resources: string[] }) => entry.resources)
    expect(resources.sort()).toEqual(["geist-latin-wght-normal.woff2", "geist-mono-latin-wght-normal.woff2", "palette-app.js"].sort())
    expect(manifest.permissions).toEqual(["storage", "debugger"])
    expect(manifest.externally_connectable).toBeUndefined()
  })
})
