import { fireEvent, screen } from "@testing-library/dom"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const vault = {
  version: 1 as const,
  credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
  stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
}

async function loadOptions(sendMessage: ReturnType<typeof vi.fn>) {
  document.body.innerHTML = '<main><div id="header-actions"></div><section id="app"></section></main><div id="notice" hidden><p class="toast-title"></p><p class="toast-description"></p><button class="toast-close">Close</button></div>'
  if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", "") }
  if (!HTMLDialogElement.prototype.close) HTMLDialogElement.prototype.close = function () { this.removeAttribute("open") }
  vi.stubGlobal("chrome", { runtime: { sendMessage } })
  vi.resetModules()
  await import("../src/options")
  await vi.waitFor(() => expect(screen.getByRole("heading", { name: "Credentials" })).toBeVisible())
}

beforeEach(() => vi.useRealTimers())
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren() })

describe("accounts options page", () => {
  it("requires named confirmation before deleting a store", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true }
      if (message.type === "ACCOUNTS_GET_VAULT") return { ok: true, vault }
      return { ok: true }
    })
    await loadOptions(sendMessage)
    const user = userEvent.setup()

    await user.click(screen.getAllByRole("button", { name: "Delete" })[1])
    expect(screen.getByRole("dialog", { name: "Delete store?" })).toHaveTextContent("Example Outdoors")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_SAVE_VAULT" }))
    await user.click(screen.getByRole("dialog", { name: "Delete store?" }).querySelector<HTMLButtonElement>('button[type="submit"]')!)

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_SAVE_VAULT", vault: expect.objectContaining({ stores: [] }) })))
  })

  it("re-hides revealed secrets on blur and keeps save errors visible", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true }
      if (message.type === "ACCOUNTS_GET_VAULT") return { ok: true, vault }
      if (message.type === "ACCOUNTS_SAVE_VAULT") throw new Error("Save unavailable")
      return { ok: true }
    })
    await loadOptions(sendMessage)
    const password = screen.getByLabelText("Password for operator@example.test") as HTMLInputElement
    const reveal = password.nextElementSibling as HTMLButtonElement
    fireEvent.click(reveal)
    expect(password.type).toBe("text")
    fireEvent.blur(password)
    expect(password.type).toBe("password")

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1])
    fireEvent.submit(screen.getByRole("dialog", { name: "Delete store?" }).querySelector("form")!)
    await vi.waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Save unavailable"))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(screen.getByRole("alert")).toBeVisible()
  })
})
