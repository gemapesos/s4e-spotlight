import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { OptionsApp } from "../src/options/OptionsApp"

const vault = {
  version: 1 as const,
  credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
  stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
}

async function renderOptions(sendMessage: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("chrome", { runtime: { sendMessage } })
  const view = render(<OptionsApp />)
  await vi.waitFor(() => expect(screen.getByRole("heading", { name: "Credentials" })).toBeVisible())
  return view
}

beforeEach(() => vi.useRealTimers())
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.replaceChildren()
  document.body.removeAttribute("style")
  document.body.removeAttribute("data-scroll-locked")
  document.body.style.pointerEvents = ""
})

describe("accounts options page", () => {
  it("requires named confirmation before deleting a store", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true }
      if (message.type === "ACCOUNTS_GET_VAULT") return { ok: true, vault }
      return { ok: true }
    })
    await renderOptions(sendMessage)
    const user = userEvent.setup()

    await user.click(screen.getAllByRole("button", { name: "Delete" })[1])
    const dialog = screen.getByRole("alertdialog", { name: "Delete store?" })
    expect(dialog).toHaveTextContent("Example Outdoors")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_SAVE_VAULT" }))
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

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
    await renderOptions(sendMessage)
    const password = screen.getByLabelText("Password for operator@example.test") as HTMLInputElement
    const reveal = password.nextElementSibling as HTMLButtonElement
    fireEvent.click(reveal)
    expect(password.type).toBe("text")
    fireEvent.blur(password)
    expect(password.type).toBe("password")

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[1])
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Delete store?" })).getByRole("button", { name: "Delete" }))
    await vi.waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Save unavailable"))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(screen.getByRole("alert")).toBeVisible()
  })
})
