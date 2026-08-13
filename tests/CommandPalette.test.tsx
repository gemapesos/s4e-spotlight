import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommandPalette } from "../src/CommandPalette"

function renderPalette(
  open = true,
  onOpenCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue(),
  onOpenShipmentIds = vi
    .fn<(shipmentIds: string[]) => Promise<void>>()
    .mockResolvedValue(),
) {
  const container = document.createElement("div")
  document.body.append(container)
  const onOpenChange = vi.fn()

  const view = render(
    <CommandPalette
      container={container}
      open={open}
      onOpenCaseIds={onOpenCaseIds}
      onOpenShipmentIds={onOpenShipmentIds}
      onOpenChange={onOpenChange}
    />,
  )

  const rerenderPalette = (nextOpen: boolean) => {
    view.rerender(
      <CommandPalette
        container={container}
        open={nextOpen}
        onOpenCaseIds={onOpenCaseIds}
        onOpenShipmentIds={onOpenShipmentIds}
        onOpenChange={onOpenChange}
      />,
    )
  }

  return {
    container,
    onOpenCaseIds,
    onOpenChange,
    onOpenShipmentIds,
    rerenderPalette,
  }
}

afterEach(() => {
  document.body.replaceChildren()
})

describe("CommandPalette", () => {
  function setTextareaLayout(
    input: HTMLTextAreaElement,
    { clientHeight, scrollHeight, scrollTop }: {
      clientHeight: number
      scrollHeight: number
      scrollTop: number
    },
  ) {
    Object.defineProperties(input, {
      clientHeight: { configurable: true, value: clientHeight },
      scrollHeight: { configurable: true, value: scrollHeight },
      scrollTop: { configurable: true, writable: true, value: scrollTop },
    })
  }

  it("renders the full reference command groups", () => {
    renderPalette()

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByText("Suggestions")).toBeVisible()
    expect(screen.getByText("Settings", { selector: "[cmdk-group-heading]" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Open Case ID\/s/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Calendar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Search Emoji/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Calculator/ })).not.toBeInTheDocument()
    expect(screen.getByText("⌘P")).toBeVisible()
    expect(screen.getByText("⌘B")).toBeVisible()
    expect(screen.getByText("⌘S")).toBeVisible()
  })

  it("filters commands and shows the empty state", async () => {
    const user = userEvent.setup()
    renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "billing")
    expect(screen.getByRole("option", { name: /Billing/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open Shipment IDs/ })).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "missing command")
    expect(screen.getByText("No results found.")).toBeVisible()
  })

  it("closes after selecting an enabled command", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Profile/ }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("switches to a focused multiline Case ID input", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))

    expect(screen.queryByRole("combobox", { name: "Search commands" })).not.toBeInTheDocument()
    expect(screen.queryByRole("listbox", { name: "Suggestions" })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Case IDs" })).toHaveFocus()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("shows directional fades only where Case ID content can scroll", async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" }) as HTMLTextAreaElement

    setTextareaLayout(input, { clientHeight: 128, scrollHeight: 128, scrollTop: 0 })
    fireEvent.scroll(input)
    expect(input).toHaveAttribute("data-fade-mask", "none")

    setTextareaLayout(input, { clientHeight: 128, scrollHeight: 300, scrollTop: 0 })
    fireEvent.scroll(input)
    expect(input).toHaveAttribute("data-fade-mask", "bottom")

    input.scrollTop = 80
    fireEvent.scroll(input)
    expect(input).toHaveAttribute("data-fade-mask", "both")

    input.scrollTop = 172
    fireEvent.scroll(input)
    expect(input).toHaveAttribute("data-fade-mask", "top")
  })

  it("updates Shipment ID fades after typing without changing the input", async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole("option", { name: /Open Shipment IDs/ }))
    const input = screen.getByRole("textbox", { name: "Shipment IDs" }) as HTMLTextAreaElement

    setTextareaLayout(input, { clientHeight: 128, scrollHeight: 300, scrollTop: 0 })
    fireEvent.change(input, { target: { value: "FBA19749WJ6Q\nFBA18G77LW09" } })

    expect(input).toHaveValue("FBA19749WJ6Q\nFBA18G77LW09")
    expect(input).toHaveAttribute("data-fade-mask", "bottom")
  })

  it("resets to command mode after closing and reopening", async () => {
    const user = userEvent.setup()
    const { rerenderPalette } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    await user.type(screen.getByRole("textbox", { name: "Case IDs" }), "21476974831")

    rerenderPalette(false)
    rerenderPalette(true)

    expect(screen.getByRole("combobox", { name: "Search commands" })).toBeVisible()
    expect(screen.queryByRole("textbox", { name: "Case IDs" })).not.toBeInTheDocument()
  })

  it("extracts unique Case IDs and submits them on Enter", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    const { onOpenChange } = renderPalette(true, openCaseIds)

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    fireEvent.change(input, {
      target: {
        value:
          "First case 21476974831, then 21476874681.\nDuplicate: 21476974831",
      },
    })
    await user.keyboard("{Enter}")

    expect(openCaseIds).toHaveBeenCalledWith(["21476974831", "21476874681"])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("extracts unique Shipment IDs from links and text and submits them", async () => {
    const user = userEvent.setup()
    const openShipmentIds = vi
      .fn<(shipmentIds: string[]) => Promise<void>>()
      .mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
      vi.fn().mockResolvedValue(undefined),
      openShipmentIds,
    )

    await user.click(screen.getByRole("option", { name: /Open Shipment IDs/ }))
    const input = screen.getByRole("textbox", { name: "Shipment IDs" })
    fireEvent.change(input, {
      target: {
        value:
          "https://sellercentral.amazon.com/fba/inbound-shipment/summary/FBA19749WJ6Q/contents\nFBA18G77LW09 and fba19749wj6q",
      },
    })
    await user.keyboard("{Enter}")

    expect(openShipmentIds).toHaveBeenCalledWith([
      "FBA19749WJ6Q",
      "FBA18G77LW09",
    ])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("keeps invalid Shipment ID input open with a specific error", async () => {
    const user = userEvent.setup()
    const openShipmentIds = vi
      .fn<(shipmentIds: string[]) => Promise<void>>()
      .mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
      vi.fn().mockResolvedValue(undefined),
      openShipmentIds,
    )

    await user.click(screen.getByRole("option", { name: /Open Shipment IDs/ }))
    await user.type(
      screen.getByRole("textbox", { name: "Shipment IDs" }),
      "FBA123",
    )
    await user.keyboard("{Enter}")

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter at least one valid FBA Shipment ID.",
    )
    expect(openShipmentIds).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("uses Shift+Enter for a line break without submitting", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    await user.type(input, "21476974831")
    await user.keyboard("{Shift>}{Enter}{/Shift}")

    expect(input).toHaveValue("21476974831\n")
    expect(openCaseIds).not.toHaveBeenCalled()
  })

  it("keeps invalid input open and exposes an accessible error", async () => {
    const user = userEvent.setup()
    const { onOpenCaseIds, onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    await user.type(screen.getByRole("textbox", { name: "Case IDs" }), "Case 12345")
    await user.keyboard("{Enter}")

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter at least one 11-digit Case ID.",
    )
    expect(onOpenCaseIds).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("retains Case IDs and reports a background failure", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi
      .fn<(caseIds: string[]) => Promise<void>>()
      .mockRejectedValue(new Error("worker failed"))
    const { onOpenChange } = renderPalette(true, openCaseIds)

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    await user.type(input, "21476974831")
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn’t open case tabs. Please try again.",
    )
    expect(input).toHaveValue("21476974831")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("moves selection with the keyboard and closes on Enter", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.click(input)
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes on Escape and backdrop click", async () => {
    const user = userEvent.setup()
    const first = renderPalette()

    await user.keyboard("{Escape}")
    expect(first.onOpenChange).toHaveBeenCalledWith(false)

    document.body.replaceChildren()
    const second = renderPalette()
    await user.click(document.querySelector("[data-slot=dialog-backdrop]") as HTMLElement)
    expect(second.onOpenChange).toHaveBeenCalledWith(false)
  })
})
