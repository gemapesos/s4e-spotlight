import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { AccountsStatus, ActiveSwitchSummary } from "../src/CommandPalette"
import { SwitchScreen, SwitchStatusCard } from "../src/SwitchProgress"

const stores = [{ id: "jmg", name: "JMG Outdoors" }]
const running = (overrides: Partial<ActiveSwitchSummary> = {}): AccountsStatus => ({
  initialized: true,
  unlocked: true,
  stores,
  activeSwitch: { storeId: "jmg", storeName: "JMG Outdoors", stage: "otp", startedAt: 1, signIn: true, ...overrides },
})

function renderCard(status: () => Promise<AccountsStatus>, props: Partial<React.ComponentProps<typeof SwitchStatusCard>> = {}) {
  const handlers = {
    onCancel: vi.fn(async () => undefined),
    onDismiss: vi.fn(),
    onGetAccountsStatus: vi.fn(status),
    onShowSignIn: vi.fn(async () => undefined),
  }
  render(<SwitchStatusCard {...handlers} {...props} />)
  return handlers
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("store switch status card", () => {
  it("shows each sign-in step like report progress, with the current one highlighted", async () => {
    renderCard(async () => running())

    expect(await screen.findByText("Switching to JMG Outdoors")).toBeVisible()
    expect(screen.getByText("Entering the verification code…")).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Sign out: Done" })).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Sign in: Done" })).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Verification code: In progress" })).toHaveAttribute("aria-current", "step")
    expect(screen.getByRole("listitem", { name: "Open store: Waiting" })).toBeVisible()
    expect(screen.getByRole("progressbar", { name: "Store switch progress" })).toHaveAttribute("aria-valuenow", "63")
  })

  it("shows only the store step when the same login skips sign-in", async () => {
    renderCard(async () => running({ stage: "store", signIn: false }))

    expect(await screen.findByRole("listitem", { name: "Open store: In progress" })).toBeVisible()
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
  })

  it("marks the step that needs the user and offers to show the sign-in window or cancel", async () => {
    const handlers = renderCard(async () => running({ stage: "paused", resumeStage: "otp", attentionMessage: "Complete the CAPTCHA in the sign-in window." }))

    expect(await screen.findByText("Needs attention")).toBeVisible()
    expect(screen.getByText("Complete the CAPTCHA in the sign-in window.")).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Verification code: Needs you" })).toBeVisible()
    await act(async () => screen.getByRole("button", { name: "Show sign-in" }).click())
    expect(handlers.onShowSignIn).toHaveBeenCalledOnce()
    await act(async () => screen.getByRole("button", { name: "Cancel" }).click())
    expect(handlers.onCancel).toHaveBeenCalledOnce()
  })

  it("keeps the result up after the switch finishes until the user clicks or presses a key", async () => {
    vi.useFakeTimers()
    let status: AccountsStatus = running({ stage: "store" })
    const handlers = renderCard(async () => status, { isUserEvent: () => true })
    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(screen.getByText("Switching to JMG Outdoors")).toBeVisible()

    status = { initialized: true, unlocked: true, stores, currentStore: stores[0] }
    await act(async () => { await vi.advanceTimersByTimeAsync(800) })
    expect(screen.getByText("Switched to JMG Outdoors")).toBeVisible()
    expect(screen.queryByRole("list")).not.toBeInTheDocument()

    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60_000) })
    expect(screen.getByText("Switched to JMG Outdoors")).toBeVisible()
    expect(handlers.onDismiss).not.toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
    expect(handlers.onDismiss).toHaveBeenCalledOnce()
  })

  it("ignores page-made events while waiting to be dismissed", async () => {
    const handlers = renderCard(async () => running(), { doneStoreName: "JMG Outdoors" })

    expect(await screen.findByText("Switched to JMG Outdoors")).toBeVisible()
    window.dispatchEvent(new MouseEvent("pointerdown"))
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
    expect(handlers.onDismiss).not.toHaveBeenCalled()
    expect(handlers.onGetAccountsStatus).not.toHaveBeenCalled()
  })

  it("goes away when the switch ends without reaching the store", async () => {
    const handlers = renderCard(async () => ({ initialized: true, unlocked: true, stores, currentStore: null }))

    await vi.waitFor(() => expect(handlers.onDismiss).toHaveBeenCalledOnce())
    expect(screen.queryByText(/Switch/)).not.toBeInTheDocument()
  })

  it("makes Show sign-in the main action on the switch screen when Amazon needs the user", async () => {
    const handlers = { onCancel: vi.fn(async () => undefined), onClose: vi.fn(), onEnded: vi.fn(), onShowSignIn: vi.fn(async () => undefined) }
    render(<SwitchScreen {...handlers} onGetAccountsStatus={async () => running({ stage: "paused", resumeStage: "password", attentionMessage: "Complete Amazon’s verification in the sign-in window." })} />)

    expect(await screen.findByText("Needs attention")).toBeVisible()
    expect(screen.getByText("Complete Amazon’s verification in the sign-in window.")).toBeVisible()
    expect(screen.getByRole("listitem", { name: "Sign in: Needs you" })).toBeVisible()
    expect(screen.getByText("1 of 4")).toBeVisible()
    const show = screen.getByRole("button", { name: /Show sign-in/ })
    expect(show).toHaveTextContent("↵")
    await act(async () => show.click())
    expect(handlers.onShowSignIn).toHaveBeenCalledOnce()
    expect(handlers.onClose).not.toHaveBeenCalled()
  })

  it("closes the finished switch screen on the user's next click or key, not on page-made events", async () => {
    const onClose = vi.fn()
    const isUserEvent = vi.fn((event: Event) => event.type === "keydown")
    render(<SwitchScreen doneStoreName="JMG Outdoors" isUserEvent={isUserEvent} onCancel={vi.fn()} onClose={onClose} onEnded={vi.fn()} onGetAccountsStatus={vi.fn()} onShowSignIn={vi.fn()} />)

    expect(screen.getByText("Switched to JMG Outdoors")).toBeVisible()
    window.dispatchEvent(new MouseEvent("pointerdown"))
    expect(onClose).not.toHaveBeenCalled()
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "x" }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
