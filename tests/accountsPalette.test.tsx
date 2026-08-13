import { act, cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommandPalette } from "../src/CommandPalette"

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
})

function renderAccounts(overrides: Record<string, unknown> = {}) {
  const container = document.createElement("div")
  document.body.append(container)
  const props = {
    container,
    open: true,
    onOpenChange: vi.fn(),
    onOpenCaseIds: vi.fn().mockResolvedValue(undefined),
    onOpenShipmentIds: vi.fn().mockResolvedValue(undefined),
    onOpenSkuIds: vi.fn().mockResolvedValue(undefined),
    onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [{ id: "store-1", name: "JMG Outdoors" }] }),
    onUnlockAccounts: vi.fn().mockResolvedValue(undefined),
    onStartAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onFocusAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onCancelAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onManageAccounts: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<CommandPalette {...props} />)
  return props
}

describe("Accounts palette", () => {
  it("clears the command search before showing and selecting stores", async () => {
    const user = userEvent.setup()
    const props = renderAccounts()

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("option", { name: "JMG Outdoors" })).toBeVisible()
    expect(screen.getByRole("option", { name: "Manage Accounts" })).toBeVisible()

    await user.keyboard("{Enter}")
    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
  })

  it("returns from Accounts to the previous command search", async () => {
    const user = userEvent.setup()
    renderAccounts()

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")
    await screen.findByRole("option", { name: "JMG Outdoors" })
    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("accounts")
    expect(screen.getByRole("option", { name: /^Accounts$/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Billing/ })).not.toBeInTheDocument()
  })

  it("uses Escape to return from Accounts, clear search, then close", async () => {
    const user = userEvent.setup()
    const props = renderAccounts()

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")
    await screen.findByRole("option", { name: "JMG Outdoors" })

    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("accounts")
    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("")
    await user.keyboard("{Escape}")
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("shows configured stores and starts an unlocked switch", async () => {
    const user = userEvent.setup()
    const props = renderAccounts()
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("unlocks a locked vault before starting the selected store", async () => {
    const user = userEvent.setup()
    const getStatus = vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] })
    const props = renderAccounts({ onGetAccountsStatus: getStatus })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    await user.type(await screen.findByLabelText("Master password"), "master password")
    await user.keyboard("{Enter}")
    await vi.waitFor(() => {
      expect(props.onUnlockAccounts).toHaveBeenCalledWith("master password")
      expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("uses Escape to clear the password before backing through Accounts", async () => {
    const user = userEvent.setup()
    const getStatus = vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] })
    const props = renderAccounts({ onGetAccountsStatus: getStatus })

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    const password = await screen.findByLabelText("Master password")
    await user.type(password, "wrong")

    await user.keyboard("{Escape}")
    expect(password).toHaveValue("")
    await user.keyboard("{Escape}")
    expect(screen.getByRole("button", { name: "Back" })).toBeVisible()
    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("accounts")
    expect(props.onOpenChange).not.toHaveBeenCalled()
  })

  it("ignores Escape while accounts are loading", async () => {
    const user = userEvent.setup()
    let finishLoading: ((value: { initialized: boolean; unlocked: boolean; stores: never[] }) => void) | undefined
    const status = new Promise<{ initialized: boolean; unlocked: boolean; stores: never[] }>((resolve) => { finishLoading = resolve })
    const props = renderAccounts({ onGetAccountsStatus: vi.fn(() => status) })
    const search = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(search, "accounts")
    await user.keyboard("{Enter}")
    await user.keyboard("{Escape}")

    expect(search).toHaveValue("accounts")
    expect(props.onOpenChange).not.toHaveBeenCalled()
    await act(async () => { finishLoading?.({ initialized: true, unlocked: true, stores: [] }) })
    expect(await screen.findByText("No stores configured.")).toBeVisible()
  })

  it("ignores Escape while unlocking and switching accounts", async () => {
    const user = userEvent.setup()
    let finishUnlock: (() => void) | undefined
    let finishSwitch: (() => void) | undefined
    const getStatus = vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] })
    const props = renderAccounts({
      onGetAccountsStatus: getStatus,
      onUnlockAccounts: vi.fn(() => new Promise<void>((resolve) => { finishUnlock = resolve })),
      onStartAccountSwitch: vi.fn(() => new Promise<void>((resolve) => { finishSwitch = resolve })),
    })

    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    const password = await screen.findByLabelText("Master password")
    await user.type(password, "master password")
    await user.keyboard("{Enter}")

    await user.keyboard("{Escape}")
    expect(password).toHaveValue("master password")
    expect(props.onOpenChange).not.toHaveBeenCalled()

    await act(async () => { finishUnlock?.() })
    await vi.waitFor(() => expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1"))
    await user.keyboard("{Escape}")
    expect(password).toHaveValue("master password")
    expect(props.onOpenChange).not.toHaveBeenCalled()

    await act(async () => { finishSwitch?.() })
    await vi.waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false))
  })

  it("opens Manage Accounts from an empty vault", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: false, unlocked: false, stores: [] }) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "Manage Accounts" }))
    expect(props.onManageAccounts).toHaveBeenCalledOnce()
  })

  it("filters stores and distinguishes no matches from an empty vault", async () => {
    const user = userEvent.setup()
    renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [{ id: "one", name: "JMG Outdoors" }, { id: "two", name: "North Shop" }] }) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    const search = await screen.findByRole("combobox", { name: "Search accounts" })
    await user.type(search, "north")
    expect(screen.getByRole("option", { name: "North Shop" })).toBeVisible()
    expect(screen.queryByRole("option", { name: "JMG Outdoors" })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, "missing")
    expect(screen.getByText("No matching stores.")).toBeVisible()
    expect(screen.queryByText("No stores configured.")).not.toBeInTheDocument()
  })

  it("matches stores with a one-character typo", async () => {
    const user = userEvent.setup()
    renderAccounts({
      onGetAccountsStatus: vi.fn().mockResolvedValue({
        initialized: true,
        unlocked: true,
        stores: [{ id: "one", name: "JMG Outdoors" }, { id: "two", name: "North Shop" }],
      }),
    })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    const search = await screen.findByRole("combobox", { name: "Search accounts" })
    await user.type(search, "outdors")
    expect(screen.getByRole("option", { name: "JMG Outdoors" })).toBeVisible()
    expect(screen.queryByRole("option", { name: "North Shop" })).not.toBeInTheDocument()
  })

  it("keeps account-loading and Manage Accounts errors visible", async () => {
    const user = userEvent.setup()
    renderAccounts({ onGetAccountsStatus: vi.fn().mockRejectedValue(new Error("Vault unavailable")) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Vault unavailable")

    document.body.replaceChildren()
    renderAccounts({ onManageAccounts: vi.fn().mockRejectedValue(new Error("Options unavailable")) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "Manage Accounts" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Options unavailable")
  })

  it("focuses or cancels an active switch", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [], activeSwitch: { storeId: "one", storeName: "JMG Outdoors", stage: "otp", startedAt: Date.now() } }) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("button", { name: "Go to login" }))
    expect(props.onFocusAccountSwitch).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "Cancel switch" }))
    expect(props.onCancelAccountSwitch).toHaveBeenCalledOnce()
  })
})
