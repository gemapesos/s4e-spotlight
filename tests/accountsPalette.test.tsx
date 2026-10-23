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
    onFocusCurrentStore: vi.fn().mockResolvedValue(undefined),
    onFocusAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onCancelAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onManageAccounts: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<CommandPalette {...props} />)
  return props
}

describe("Accounts palette", () => {
  it("prefetches stores when the palette opens", async () => {
    const props = renderAccounts()
    await vi.waitFor(() => expect(props.onGetAccountsStatus).toHaveBeenCalled())
  })

  it("switches from a matching store on the main search without opening Accounts", async () => {
    const user = userEvent.setup()
    const props = renderAccounts()
    await vi.waitFor(() => expect(props.onGetAccountsStatus).toHaveBeenCalled())

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "JMG")
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))

    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
    expect(screen.queryByRole("combobox", { name: "Search accounts" })).not.toBeInTheDocument()
  })

  it("unlocks from a top-level store match before switching", async () => {
    const user = userEvent.setup()
    const getStatus = vi.fn().mockResolvedValue({
      initialized: true,
      unlocked: false,
      stores: [{ id: "store-1", name: "JMG Outdoors" }],
    })
    const props = renderAccounts({ onGetAccountsStatus: getStatus })
    await vi.waitFor(() => expect(getStatus).toHaveBeenCalled())

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "JMG")
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    expect(screen.queryByLabelText("Master password")).not.toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Unlock accounts" }))

    await vi.waitFor(() => {
      expect(props.onUnlockAccounts).toHaveBeenCalledWith("store-1")
      expect(props.onStartAccountSwitch).not.toHaveBeenCalled()
      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("clears the command search before showing and selecting stores", async () => {
    const user = userEvent.setup()
    const props = renderAccounts()

    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("option", { name: "JMG Outdoors" })).toBeVisible()
    expect(screen.getByRole("option", { name: "Manage accounts" })).toBeVisible()

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
    expect(screen.getByRole("option", { name: /^Switch store$/ })).toBeVisible()
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
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    expect(props.onGetAccountsStatus).toHaveBeenCalled()
    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("unlocks a locked vault before starting the selected store", async () => {
    const user = userEvent.setup()
    const getStatus = vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] })
    const props = renderAccounts({ onGetAccountsStatus: getStatus })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    expect(screen.queryByLabelText("Master password")).not.toBeInTheDocument()
    await user.click(await screen.findByRole("button", { name: "Unlock accounts" }))
    await vi.waitFor(() => {
      expect(props.onUnlockAccounts).toHaveBeenCalledWith("store-1")
      expect(props.onStartAccountSwitch).not.toHaveBeenCalled()
      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("backs out of the unlock notice without collecting a password", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] }) })
    await user.type(screen.getByRole("combobox", { name: "Search commands" }), "accounts")
    await user.keyboard("{Enter}")
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    expect(screen.queryByLabelText("Master password")).not.toBeInTheDocument()
    await user.keyboard("{Escape}")
    expect(await screen.findByRole("combobox", { name: "Search accounts" })).toBeVisible()
    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("accounts")
    expect(props.onUnlockAccounts).not.toHaveBeenCalled()
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

  it("ignores Escape while opening the secure Accounts page", async () => {
    const user = userEvent.setup()
    let finishUnlock: (() => void) | undefined
    const props = renderAccounts({
      onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: false, stores: [{ id: "store-1", name: "JMG Outdoors" }] }),
      onUnlockAccounts: vi.fn(() => new Promise<void>((resolve) => { finishUnlock = resolve })),
    })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "JMG Outdoors" }))
    await user.click(await screen.findByRole("button", { name: "Unlock accounts" }))
    await user.keyboard("{Escape}")
    expect(props.onOpenChange).not.toHaveBeenCalled()
    await act(async () => { finishUnlock?.() })
    await vi.waitFor(() => expect(props.onOpenChange).toHaveBeenCalledWith(false))
    expect(props.onStartAccountSwitch).not.toHaveBeenCalled()
  })

  it("opens Manage Accounts from an empty vault", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: false, unlocked: false, stores: [] }) })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "Manage accounts" }))
    expect(props.onManageAccounts).toHaveBeenCalledOnce()
  })

  it("filters stores and distinguishes no matches from an empty vault", async () => {
    const user = userEvent.setup()
    renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [{ id: "one", name: "JMG Outdoors" }, { id: "two", name: "North Shop" }] }) })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
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
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    const search = await screen.findByRole("combobox", { name: "Search accounts" })
    await user.type(search, "outdors")
    expect(screen.getByRole("option", { name: /^JMG Outdoors/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: "North Shop" })).not.toBeInTheDocument()
  })

  it("keeps account-loading and Manage Accounts errors visible", async () => {
    const user = userEvent.setup()
    renderAccounts({ onGetAccountsStatus: vi.fn().mockRejectedValue(new Error("Vault unavailable")) })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Vault unavailable")

    document.body.replaceChildren()
    renderAccounts({ onManageAccounts: vi.fn().mockRejectedValue(new Error("Options unavailable")) })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "Manage accounts" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Options unavailable")
  })

  it("focuses or cancels an active switch", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [], activeSwitch: { storeId: "one", storeName: "JMG Outdoors", stage: "otp", startedAt: Date.now() } }) })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("button", { name: "Show sign-in" }))
    expect(props.onFocusAccountSwitch).toHaveBeenCalledOnce()
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(props.onCancelAccountSwitch).toHaveBeenCalledOnce()
  })

  it("shows Unknown when the current store cannot be detected", async () => {
    const user = userEvent.setup()
    renderAccounts()
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    expect(await screen.findByRole("status", { name: /Current store: Unknown/ })).toBeVisible()
  })

  it("shows the current store, marks it, and focuses Seller Central when it is reselected", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({
      onGetAccountsStatus: vi.fn().mockResolvedValue({
        initialized: true,
        unlocked: true,
        stores: [{ id: "store-1", name: "JMG Outdoors" }, { id: "store-2", name: "North Shop" }],
        currentStore: { id: "store-1", name: "JMG Outdoors" },
      }),
    })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    expect(await screen.findByRole("status", { name: /Current store: JMG Outdoors/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /^JMG Outdoors/ })).toHaveAttribute("data-checked", "true")
    expect(screen.getByRole("option", { name: "North Shop" })).not.toHaveAttribute("data-checked")

    await user.click(screen.getByRole("option", { name: /^JMG Outdoors/ }))
    expect(props.onFocusCurrentStore).toHaveBeenCalledOnce()
    expect(props.onStartAccountSwitch).not.toHaveBeenCalled()
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("starts a switch when a different store is selected", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({
      onGetAccountsStatus: vi.fn().mockResolvedValue({
        initialized: true,
        unlocked: true,
        stores: [{ id: "store-1", name: "JMG Outdoors" }, { id: "store-2", name: "North Shop" }],
        currentStore: { id: "store-1", name: "JMG Outdoors" },
      }),
    })
    await user.click(screen.getByRole("option", { name: /^Switch store$/ }))
    await user.click(await screen.findByRole("option", { name: "North Shop" }))
    expect(props.onFocusCurrentStore).not.toHaveBeenCalled()
    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-2")
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})
