import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { CommandPalette } from "../src/CommandPalette"

function renderAccounts(overrides: Record<string, unknown> = {}) {
  const container = document.createElement("div")
  document.body.append(container)
  const props = {
    container,
    open: true,
    onOpenChange: vi.fn(),
    onOpenCaseIds: vi.fn().mockResolvedValue(undefined),
    onOpenShipmentIds: vi.fn().mockResolvedValue(undefined),
    onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: true, unlocked: true, stores: [{ id: "store-1", name: "JMG Outdoors" }] }),
    onUnlockAccounts: vi.fn().mockResolvedValue(undefined),
    onStartAccountSwitch: vi.fn().mockResolvedValue(undefined),
    onManageAccounts: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
  render(<CommandPalette {...props} />)
  return props
}

describe("Accounts palette", () => {
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
    expect(props.onUnlockAccounts).toHaveBeenCalledWith("master password")
    expect(props.onStartAccountSwitch).toHaveBeenCalledWith("store-1")
  })

  it("opens Manage Accounts from an empty vault", async () => {
    const user = userEvent.setup()
    const props = renderAccounts({ onGetAccountsStatus: vi.fn().mockResolvedValue({ initialized: false, unlocked: false, stores: [] }) })
    await user.click(screen.getByRole("option", { name: /^Accounts$/ }))
    await user.click(await screen.findByRole("option", { name: "Manage Accounts" }))
    expect(props.onManageAccounts).toHaveBeenCalledOnce()
  })
})
