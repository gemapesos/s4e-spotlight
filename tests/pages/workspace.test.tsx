import { act, cleanup, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { WorkspaceApp } from "../../src/pages/workspace/WorkspaceApp"

type Listener = (message: unknown, sender: chrome.runtime.MessageSender, respond: (value: unknown) => void) => void

const scrapedCase = {
  caseId: "22420938051",
  caseUrl: "https://sellercentral.amazon.com/cu/case-dashboard/view-case?caseID=22420938051",
  viewCaseMetaData: { creationDateIso: "2026-10-05T19:21:54.913+08:00" },
  totalNumberOfContacts: 14,
  appointmentMetadata: null,
  liveConversation: null,
  contacts: [],
}

function stubChrome(handle: (message: Record<string, unknown>) => unknown) {
  const listeners = new Set<Listener>()
  const sendMessage = vi.fn(async (message: Record<string, unknown>) => handle(message) ?? { ok: true })
  vi.stubGlobal("chrome", {
    runtime: {
      id: "fixture",
      getURL: (path: string) => `chrome-extension://fixture/${path}`,
      sendMessage,
      onMessage: { addListener: (fn: Listener) => listeners.add(fn), removeListener: (fn: Listener) => listeners.delete(fn) },
    },
  })
  const deliver = (message: unknown, sender: chrome.runtime.MessageSender) => {
    const respond = vi.fn()
    for (const listener of listeners) listener(message, sender, respond)
    return respond
  }
  /** Delivers a message the way the background does. */
  const fromBackground = (message: unknown) => deliver(message, { id: "fixture", url: "chrome-extension://fixture/background.js" })
  return { deliver, fromBackground, sendMessage }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  window.history.replaceState(null, "", "/")
})

describe("workspace window", () => {
  it("lists each scraped case and downloads the file only when asked", async () => {
    const { sendMessage } = stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "cases", caseIds: ["22420938051", "11111111111"] }
      if (message.type === "REPORTS_PREPARE") return { ok: true, runId: "fixture-run" }
      if (message.type === "SCRAPE_CASES") {
        return {
          ok: true,
          file: {
            scrapedAt: "2026-10-25T11:01:00.000Z",
            timeZone: "Asia/Manila",
            cases: [scrapedCase],
            errors: [{ caseId: "11111111111", error: "Couldn’t load this case (403)." }],
          },
        }
      }
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true, stores: [], currentStore: { id: "s", name: "365 Shipping" } }
    })
    const createObjectURL = vi.fn().mockReturnValue("blob:cases")
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const downloads: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download) })
    render(<WorkspaceApp />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: "Scrape 2 cases" }))

    expect(await screen.findByRole("heading", { name: "Scraped 1 of 2 cases" })).toBeVisible()
    expect(sendMessage).toHaveBeenCalledWith({ type: "REPORTS_PREPARE", mode: "cases", caseIds: ["22420938051", "11111111111"] })
    expect(sendMessage).toHaveBeenCalledWith({ type: "SCRAPE_CASES", runId: "fixture-run" })
    const rows = within(screen.getByRole("list", { name: "Cases" })).getAllByRole("listitem")
    expect(rows[0]).toHaveTextContent("14 replies · opened 5 Oct 2026")
    expect(rows[1]).toHaveTextContent("Couldn’t load this case (403).")
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "RESULTS_FINISH", runId: "fixture-run" }))
    expect(createObjectURL).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Download JSON" }))
    expect(downloads).toHaveLength(1)
    expect(downloads[0]).toMatch(/^cases-2-\d{4}-\d{2}-\d{2}\.json$/)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    await expect(blob.text()).resolves.toContain("Couldn’t load this case (403).")
  })

  it("asks for a signed-in store instead of reporting on nothing", async () => {
    stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "reports", caseIds: [] }
      if (message.type === "REPORTS_PREPARE") return { ok: true, loggedInToStore: false }
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: false, stores: [], currentStore: null }
    })
    render(<WorkspaceApp />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: "Generate report" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in to a Seller Central store")
    expect(screen.getByRole("button", { name: "Open Seller Central" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Switch store" }))
    expect(screen.getByRole("tab", { name: "Accounts" })).toHaveAttribute("aria-selected", "true")
  })

  it("follows a switch started from the window until the store is ready", async () => {
    let status: Record<string, unknown> = {
      ok: true, initialized: true, unlocked: true,
      stores: [{ id: "a", name: "365 Shipping" }, { id: "b", name: "JMG Outdoors" }],
      currentStore: { id: "a", name: "365 Shipping" },
    }
    const { sendMessage } = stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "accounts", caseIds: [] }
      if (message.type === "ACCOUNTS_STATUS") return status
      if (message.type === "ACCOUNTS_START_SWITCH") {
        status = { ...status, activeSwitch: { storeId: "b", storeName: "JMG Outdoors", stage: "otp", startedAt: 1, signIn: true } }
      }
    })
    render(<WorkspaceApp />)
    const user = userEvent.setup()

    const store = await screen.findByRole("button", { name: /JMG Outdoors/ })
    expect(screen.getByRole("button", { name: /365 Shipping/ })).toHaveTextContent("Current")
    await user.click(store)

    expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_START_SWITCH", storeId: "b" })
    expect(await screen.findByText("Switching to JMG Outdoors")).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Verification code: In progress" })).toBeVisible()

    status = { ...status, activeSwitch: undefined, currentStore: { id: "b", name: "JMG Outdoors" } }
    expect(await screen.findByText("Switched to JMG Outdoors", undefined, { timeout: 3000 })).toBeVisible()
  })

  it("shows a new launch in the open window without losing the other tabs", async () => {
    let launch: Record<string, unknown> = { ok: true, mode: "reports", caseIds: [] }
    const { fromBackground } = stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return launch
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: false, unlocked: false, stores: [] }
    })
    render(<WorkspaceApp />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole("checkbox", { name: "Stranded" }))
    expect(screen.getByText("4 of 5 sections")).toBeVisible()

    launch = { ok: true, mode: "cases", caseIds: ["22420938051"] }
    let respond!: ReturnType<typeof fromBackground>
    await act(async () => { respond = fromBackground({ type: "RESULTS_SHOW", launchId: "second" }) })

    expect(respond).toHaveBeenCalledWith({ ok: true })
    expect(await screen.findByRole("textbox", { name: "Case IDs" })).toHaveValue("22420938051")
    expect(screen.getByRole("tab", { name: "Cases" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "Reports" }))
    expect(screen.getByText("4 of 5 sections")).toBeVisible()
  })

  it("puts the cursor in the field of the tab it opens on", async () => {
    let launch: Record<string, unknown> = { ok: true, mode: "cases", caseIds: [] }
    const { fromBackground } = stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return launch
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: false, stores: [] }
    })
    render(<WorkspaceApp />)
    const user = userEvent.setup()

    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Case IDs" })).toHaveFocus())
    await user.click(screen.getByRole("tab", { name: "Accounts" }))
    await vi.waitFor(() => expect(screen.getByLabelText("Master password")).toHaveFocus())

    // A launch into the open window focuses its field too.
    launch = { ok: true, mode: "cases", caseIds: ["22420938051"] }
    await act(async () => { fromBackground({ type: "RESULTS_SHOW", launchId: "second" }) })
    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Case IDs" })).toHaveFocus())
  })

  it("ignores launches that don't come from the background", async () => {
    const { deliver, sendMessage } = stubChrome((message) => {
      if (message.type === "RESULTS_INIT") return { ok: true, mode: "reports", caseIds: [] }
    })
    render(<WorkspaceApp />)
    await screen.findByRole("button", { name: "Generate report" })

    // A content script in some tab can't steer the window to its own launch.
    const respond = deliver({ type: "RESULTS_SHOW", launchId: "forged" }, { id: "fixture", tab: { id: 3 } as chrome.tabs.Tab, url: "https://untrusted.example/" })

    expect(respond).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalledWith({ type: "RESULTS_INIT", launchId: "forged" })
    expect(screen.getByRole("tab", { name: "Reports" })).toHaveAttribute("aria-selected", "true")
  })
})
