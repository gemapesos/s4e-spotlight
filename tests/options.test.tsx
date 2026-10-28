import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VAULT_STORAGE_KEY } from "../src/lib/accounts"
import { OptionsApp } from "../src/options/OptionsApp"

const vault = {
  version: 1 as const,
  credentials: [{ id: "credential", domain: "operator@example.test", password: "private-password", otpAuthUri: "otpauth://totp/Test?secret=JBSWY3DPEHPK3PXP" }],
  stores: [{ id: "store", name: "Example Outdoors", credentialId: "credential", storeUrl: "https://sellercentral.amazon.com/home" }],
}

async function renderOptions(sendMessage: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("chrome", { runtime: { sendMessage } })
  const view = render(<OptionsApp />)
  await vi.waitFor(() => expect(screen.getByText("Credentials")).toBeVisible())
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

    await user.click(screen.getByRole("button", { name: "Delete Example Outdoors" }))
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
    const reveal = screen.getAllByRole("button", { name: "Reveal" })[0]
    fireEvent.click(reveal)
    expect(password.type).toBe("text")
    fireEvent.blur(password)
    expect(password.type).toBe("password")

    fireEvent.click(screen.getByRole("button", { name: "Delete Example Outdoors" }))
    fireEvent.click(within(screen.getByRole("alertdialog", { name: "Delete store?" })).getByRole("button", { name: "Delete" }))
    await vi.waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Save unavailable"))
    await vi.advanceTimersByTimeAsync(10_000)
    expect(screen.getByRole("alert")).toBeVisible()
  })

  it("enables Reset vault only after RESET is typed", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: false }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    render(<OptionsApp />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole("button", { name: "Reset vault" }))
    const dialog = screen.getByRole("alertdialog", { name: "Reset vault?" })
    const confirm = within(dialog).getByRole("button", { name: "Reset vault" })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText("Type RESET"), "RESET")
    expect(confirm).toBeEnabled()
    await user.click(confirm)

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_RESET" }))
  })

  it("closes a confirmed Reset dialog when the vault changes elsewhere", async () => {
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: false }
      return { ok: true }
    })
    let onStorageChanged: ((changes: Record<string, chrome.storage.StorageChange>, area: string) => void) | undefined
    vi.stubGlobal("chrome", {
      runtime: { sendMessage },
      storage: { onChanged: { addListener: vi.fn((listener) => { onStorageChanged = listener }), removeListener: vi.fn() } },
    })
    render(<OptionsApp />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole("button", { name: "Reset vault" }))
    await user.type(within(screen.getByRole("alertdialog", { name: "Reset vault?" })).getByLabelText("Type RESET"), "RESET")

    act(() => onStorageChanged?.({ [VAULT_STORAGE_KEY]: { newValue: {} } }, "local"))

    await vi.waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Reset vault?" })).not.toBeInTheDocument())
    expect(sendMessage).not.toHaveBeenCalledWith({ type: "ACCOUNTS_RESET" })
  })

  it("sends the share password only after the export dialog confirms it", async () => {
    const shareFile = { kind: "s4e-spotlight-vault-share", version: 1, iterations: 1_000, salt: "salt", iv: "iv", ciphertext: "ciphertext" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true }
      if (message.type === "ACCOUNTS_GET_VAULT") return { ok: true, vault }
      if (message.type === "ACCOUNTS_EXPORT_SHARE") return { ok: true, file: shareFile }
      return { ok: true }
    })
    const createObjectURL = vi.fn().mockReturnValue("blob:share")
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("s4e-spotlight-vault-share.json")
    })
    await renderOptions(sendMessage)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /^Export vault/ }))
    const dialog = screen.getByRole("dialog", { name: /^Export vault/ })
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_EXPORT_SHARE" }))
    await user.type(within(dialog).getByLabelText("Share password"), "share-password")
    await user.type(within(dialog).getByLabelText("Confirm share password"), "other-password")
    await user.click(within(dialog).getByRole("button", { name: "Export" }))
    expect(screen.getByRole("alert", { hidden: true })).toHaveTextContent("Share passwords do not match.")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_EXPORT_SHARE" }))

    await user.clear(within(dialog).getByLabelText("Confirm share password"))
    await user.type(within(dialog).getByLabelText("Confirm share password"), "share-password")
    await user.click(within(dialog).getByRole("button", { name: "Export" }))

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({ type: "ACCOUNTS_EXPORT_SHARE", sharePassword: "share-password" }))
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    const blob = createObjectURL.mock.calls[0][0] as Blob
    await expect(blob.text()).resolves.toContain("s4e-spotlight-vault-share")
  })

  it("sends the selected share file and share password on import", async () => {
    const share = { kind: "s4e-spotlight-vault-share", version: 1, iterations: 1_000, salt: "salt", iv: "iv", ciphertext: "ciphertext" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: true, unlocked: true }
      if (message.type === "ACCOUNTS_GET_VAULT") return { ok: true, vault }
      if (message.type === "ACCOUNTS_IMPORT_SHARE") {
        return { ok: true, vault, added: { credentials: 1, stores: 0 }, updated: { credentials: 0, stores: 1 } }
      }
      return { ok: true }
    })
    await renderOptions(sendMessage)
    const user = userEvent.setup()

    await user.click(screen.getByRole("button", { name: /^Import shared vault/ }))
    const dialog = screen.getByRole("dialog", { name: "Import vault" })
    const file = new File([JSON.stringify(share)], "s4e-spotlight-vault-share.json", { type: "application/json" })
    await user.upload(within(dialog).getByLabelText("Share file"), file)
    await user.type(within(dialog).getByLabelText("Share password"), "share-password")
    await user.click(within(dialog).getByRole("button", { name: "Import" }))

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNTS_IMPORT_SHARE",
      file: share,
      sharePassword: "share-password",
    }))
    expect(await screen.findByRole("status")).toHaveTextContent("Added 1 credential. Updated 1 store.")
  })

  it("creates a vault from a share file before a master password exists", async () => {
    const share = { kind: "s4e-spotlight-vault-share", version: 1, iterations: 1_000, salt: "salt", iv: "iv", ciphertext: "ciphertext" }
    const sendMessage = vi.fn(async (message: Record<string, unknown>) => {
      if (message.type === "ACCOUNTS_STATUS") return { ok: true, initialized: false }
      return { ok: true }
    })
    vi.stubGlobal("chrome", { runtime: { sendMessage } })
    render(<OptionsApp />)
    const user = userEvent.setup()
    const form = (await screen.findByRole("button", { name: "Import vault" })).closest("form")
    if (!form) throw new Error("Import form was not rendered.")

    await user.upload(within(form).getByLabelText("Share file"), new File([JSON.stringify(share)], "share.json", { type: "application/json" }))
    await user.type(within(form).getByLabelText("Share password"), "share-password")
    await user.type(within(form).getByLabelText("New master password"), "a strong master password")
    await user.type(within(form).getByLabelText("Confirm master password"), "different master password")
    await user.click(within(form).getByRole("button", { name: "Import vault" }))
    expect(screen.getByRole("alert")).toHaveTextContent("Master passwords do not match.")
    expect(sendMessage).not.toHaveBeenCalledWith(expect.objectContaining({ type: "ACCOUNTS_CREATE_FROM_SHARE" }))

    await user.clear(within(form).getByLabelText("Confirm master password"))
    await user.type(within(form).getByLabelText("Confirm master password"), "a strong master password")
    await user.click(within(form).getByRole("button", { name: "Import vault" }))

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledWith({
      type: "ACCOUNTS_CREATE_FROM_SHARE",
      file: share,
      sharePassword: "share-password",
      masterPassword: "a strong master password",
    }))
  })
})
