import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommandPalette, type CommandPaletteProps } from "../src/CommandPalette"
import { DEFAULT_ENABLED_FEATURES, type EnabledFeatures } from "../src/lib/settings"

function renderPalette(
  open = true,
  onOpenCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue(),
  onOpenShipmentIds = vi
    .fn<(shipmentIds: string[]) => Promise<void>>()
    .mockResolvedValue(),
  onOpenSkuIds = vi.fn<(skuIds: string[]) => Promise<void>>().mockResolvedValue(),
  onGenerateReports = vi.fn<() => Promise<void>>().mockResolvedValue(),
  onOpenTimeOut = vi.fn<() => Promise<void>>().mockResolvedValue(),
  enabledFeatures?: EnabledFeatures,
  extras: Partial<CommandPaletteProps> = {},
) {
  const container = document.createElement("div")
  document.body.append(container)
  const onOpenChange = vi.fn()

  const props = {
    container,
    enabledFeatures,
    open,
    onOpenCaseIds,
    onOpenShipmentIds,
    onOpenSkuIds,
    onGenerateReports,
    onOpenTimeOut,
    onOpenChange,
    ...extras,
  }

  const view = render(<CommandPalette {...props} />)

  const rerenderPalette = (nextOpen: boolean) => {
    view.rerender(<CommandPalette {...props} open={nextOpen} />)
  }

  return {
    container,
    onGenerateReports,
    onOpenCaseIds,
    onOpenChange,
    onOpenShipmentIds,
    onOpenSkuIds,
    onOpenTimeOut,
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

  it("renders only functional command groups", () => {
    renderPalette()

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByText("Open", { selector: "[cmdk-group-heading]" })).toBeVisible()
    expect(screen.getByText("Reports", { selector: "[cmdk-group-heading]" })).toBeVisible()
    expect(screen.getByText("Configuration", { selector: "[cmdk-group-heading]" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Open Case ID\/s/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate Reports/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /Search SKU\/s/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /Time Out/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Calendar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Search Emoji/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Calculator/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Profile|Billing|Settings/ })).not.toBeInTheDocument()
  })

  it("hides disabled commands and empty groups", () => {
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { ...DEFAULT_ENABLED_FEATURES, "generate-reports": false, accounts: false, "time-out": false },
    )

    expect(screen.queryByRole("option", { name: /Generate Reports/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Accounts/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Time Out/ })).not.toBeInTheDocument()
    expect(screen.queryByText("Reports", { selector: "[cmdk-group-heading]" })).not.toBeInTheDocument()
    expect(screen.queryByText("Configuration", { selector: "[cmdk-group-heading]" })).not.toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Open Case ID\/s/ })).toBeVisible()
  })

  it("hides the SKU fallback when Search SKU/s is disabled", async () => {
    const user = userEvent.setup()
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { ...DEFAULT_ENABLED_FEATURES, "search-skus": false },
    )
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "WIDGET-1")

    expect(screen.queryByRole("option", { name: /Search 'WIDGET-1' as SKU/ })).not.toBeInTheDocument()
    expect(screen.getByText("No results found.")).toBeVisible()
  })

  it("filters commands and shows the empty state", async () => {
    const user = userEvent.setup()
    renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "shipment")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open Case ID/ })).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "missing command")
    expect(screen.getByText("No results found.")).toBeVisible()
  })

  it("finds Time Out using its resource keywords", async () => {
    const user = userEvent.setup()
    renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "sheet")

    expect(screen.getByRole("option", { name: /Time Out/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open Case ID/ })).not.toBeInTheDocument()
  })

  it("matches shipment commands by typo, synonym, and acronym", async () => {
    const user = userEvent.setup()
    renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "shipmnet")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open Case ID/ })).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "fba")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()

    await user.clear(input)
    await user.type(input, "osi")
    expect(screen.getByRole("option", { name: /Open Shipment IDs/ })).toBeVisible()
  })

  it("offers a detected Case ID action that opens the extracted ID", async () => {
    const user = userEvent.setup()
    const { onOpenCaseIds } = renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "21476974831")
    const detected = screen.getByRole("option", { name: /Open case 21476974831/ })
    expect(detected).toBeVisible()
    expect(screen.queryByText("No results found.")).not.toBeInTheDocument()

    await user.click(detected)
    expect(onOpenCaseIds).toHaveBeenCalledWith(["21476974831"])
  })

  it("opens an enabled workflow without closing the palette", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open Case ID/ }))
    expect(screen.getByRole("dialog", { name: "Open Case IDs" })).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalled()
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

  it("uses Escape to clear Case IDs, go back, clear search, then close", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()
    const search = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(search, "case")
    await user.keyboard("{Enter}")
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    await user.type(input, "not a case")
    await user.keyboard("{Enter}")
    expect(screen.getByRole("alert")).toBeVisible()

    await user.keyboard("{Escape}")
    expect(input).toHaveValue("")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("case")

    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("")
    expect(onOpenChange).not.toHaveBeenCalled()

    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("uses Escape to clear Shipment IDs before returning to commands", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.type(
      screen.getByRole("combobox", { name: "Search commands" }),
      "shipment",
    )
    await user.keyboard("{Enter}")
    const input = screen.getByRole("textbox", { name: "Shipment IDs" })
    await user.type(input, "   ")

    await user.keyboard("{Escape}")
    expect(input).toHaveValue("")
    await user.keyboard("{Escape}")
    expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("shipment")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("ignores Escape while identifiers are being submitted", async () => {
    const user = userEvent.setup()
    let finishSubmission: (() => void) | undefined
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>(
      () => new Promise<void>((resolve) => { finishSubmission = resolve }),
    )
    const { onOpenChange } = renderPalette(true, openCaseIds)

    await user.click(screen.getByRole("option", { name: /Open Case ID\/s/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    await user.type(input, "21476974831")
    await user.keyboard("{Enter}")
    expect(input).toBeDisabled()

    await user.keyboard("{Escape}")
    expect(input).toHaveValue("21476974831")
    expect(onOpenChange).not.toHaveBeenCalled()

    await act(async () => { finishSubmission?.() })
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
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

  it("opens ten unique IDs directly and shows the deduplicated count", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 10 }, (_, index) => String(20_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open Case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: [...ids, ids[0]].join("\n") } })
    expect(screen.getByText("10 unique case IDs")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Open" }))

    expect(openCaseIds).toHaveBeenCalledWith(ids)
  })

  it("confirms batches from eleven through fifty IDs", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 50 }, (_, index) => String(30_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open Case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: ids.join("\n") } })
    await user.click(screen.getByRole("button", { name: "Open" }))

    expect(screen.getByRole("dialog", { name: "Confirm Bulk Open" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Open 50 tabs" }))
    expect(openCaseIds).toHaveBeenCalledWith(ids)
  })

  it("rejects more than fifty IDs before messaging the background", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 51 }, (_, index) => String(40_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open Case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: ids.join("\n") } })
    await user.click(screen.getByRole("button", { name: "Open" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Open no more than 50 IDs")
    expect(openCaseIds).not.toHaveBeenCalled()
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

  it("extracts unique SKUs from lines and commas and submits them", async () => {
    const user = userEvent.setup()
    const openSkuIds = vi.fn<(skuIds: string[]) => Promise<void>>().mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
      vi.fn().mockResolvedValue(undefined),
      vi.fn().mockResolvedValue(undefined),
      openSkuIds,
    )

    await user.click(screen.getByRole("option", { name: /Search SKU\/s/ }))
    const input = screen.getByRole("textbox", { name: "SKUs" })
    fireEvent.change(input, {
      target: { value: "ABC-123\nabc-123, DEF_456\nABC-123" },
    })
    expect(screen.getByText("3 unique SKUs")).toBeVisible()
    await user.keyboard("{Enter}")

    expect(openSkuIds).toHaveBeenCalledWith(["ABC-123", "abc-123", "DEF_456"])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("keeps invalid SKU input open with a specific error", async () => {
    const user = userEvent.setup()
    const openSkuIds = vi.fn<(skuIds: string[]) => Promise<void>>().mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
      vi.fn().mockResolvedValue(undefined),
      vi.fn().mockResolvedValue(undefined),
      openSkuIds,
    )

    await user.click(screen.getByRole("option", { name: /Search SKU\/s/ }))
    const input = screen.getByRole("textbox", { name: "SKUs" })
    expect(input).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(screen.getByRole("alert")).toHaveTextContent("Enter at least one SKU.")
    expect(openSkuIds).not.toHaveBeenCalled()
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
      "worker failed",
    )
    expect(input).toHaveValue("21476974831")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("moves selection with the keyboard and opens the selected workflow", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.click(input)
    await user.keyboard("{Enter}")

    expect(screen.getByRole("textbox", { name: "Case IDs" })).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("cycles selection from the first command to the last and back", async () => {
    const user = userEvent.setup()
    renderPalette()
    const first = screen.getByRole("option", { name: /Open Case ID\/s/ })
    const last = screen.getByRole("option", { name: /^Accounts$/ })

    expect(first).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowUp}")
    expect(last).toHaveAttribute("aria-selected", "true")
    expect(first).toHaveAttribute("aria-selected", "false")

    await user.keyboard("{ArrowDown}")
    expect(first).toHaveAttribute("aria-selected", "true")
    expect(last).toHaveAttribute("aria-selected", "false")
  })

  it("cycles selection from the last command to the first", async () => {
    const user = userEvent.setup()
    renderPalette()

    await user.keyboard("{End}")
    expect(screen.getByRole("option", { name: /^Accounts$/ })).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("option", { name: /Open Case ID\/s/ })).toHaveAttribute("aria-selected", "true")
  })

  it("keeps the command list scrollable without a visible scrollbar", () => {
    renderPalette()
    const list = screen.getByRole("listbox", { name: "Suggestions" })

    expect(list).toHaveClass("no-scrollbar")
    expect(list).toHaveClass("overflow-y-auto")
    expect(list).toHaveClass("min-h-0")
  })

  it("generates a report and closes the palette", async () => {
    const user = userEvent.setup()
    const onGenerateReports = vi.fn<() => Promise<void>>().mockResolvedValue()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: true })
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      onGenerateReports,
      undefined,
      undefined,
      { onPrepareReports },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))

    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    expect(onPrepareReports).toHaveBeenCalledOnce()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("replaces the command list with per-source report progress", async () => {
    const user = userEvent.setup()
    let onProgress: ((event: { source: string; status: string; loaded?: number; total?: number; phase?: string }) => void) | undefined
    let resolveGenerate!: () => void
    const onGenerateReports = vi.fn(
      (_store?: string, progress?: (event: { source: string; status: string; loaded?: number; total?: number; phase?: string }) => void) => {
        onProgress = progress
        return new Promise<void>((resolve) => { resolveGenerate = resolve })
      },
    )
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      onGenerateReports,
      undefined,
      undefined,
      { onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }) },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))

    expect(await screen.findByRole("dialog", { name: "Generate Reports" })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Time Out/ })).not.toBeInTheDocument()
    expect(screen.getByText("Opening Seller Central")).toBeVisible()
    expect(screen.getByText("Unfulfillable listings")).toBeVisible()
    expect(screen.getByText("Seller feedback")).toBeVisible()
    expect(screen.getByText("Stranded inventory")).toBeVisible()
    expect(screen.getByLabelText("Unfulfillable listings")).toBeVisible()
    expect(screen.getByLabelText("Seller feedback")).toBeVisible()
    expect(screen.getByLabelText("Stranded inventory")).toBeVisible()

    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    await act(async () => {
      onProgress?.({ source: "unfulfillable", status: "active", loaded: 128, total: 300, phase: "listings" })
    })
    expect(screen.getByText("128 of 300 listings")).toBeVisible()
    await act(async () => { resolveGenerate() })
  })

  it("opens Time Out and closes the palette", async () => {
    const user = userEvent.setup()
    const onOpenTimeOut = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      onOpenTimeOut,
    )

    await user.click(screen.getByRole("option", { name: /Time Out/ }))

    await vi.waitFor(() => expect(onOpenTimeOut).toHaveBeenCalledOnce())
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("keeps the palette open when Time Out fails", async () => {
    const user = userEvent.setup()
    const onOpenTimeOut = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("tab creation failed"))
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      onOpenTimeOut,
    )

    await user.click(screen.getByRole("option", { name: /Time Out/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("tab creation failed")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("keeps the palette open when report generation fails", async () => {
    const user = userEvent.setup()
    const onGenerateReports = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("Couldn’t build the report."))
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      onGenerateReports,
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t build the report.")
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByText("Unfulfillable listings")).toBeVisible()
    expect(screen.queryByRole("option", { name: /Generate Reports/ })).not.toBeInTheDocument()
  })

  it("asks to sign in when Seller Central has no store session", async () => {
    const user = userEvent.setup()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: false })
    const onGenerateReports = vi.fn()
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      onGenerateReports,
      undefined,
      undefined,
      { onPrepareReports },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in to a Seller Central store")
    expect(screen.getByRole("dialog", { name: "Generate Reports" })).toBeVisible()
    expect(onGenerateReports).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("opens Accounts from the report sign-in prompt", async () => {
    const user = userEvent.setup()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: false })
    const onGetAccountsStatus = vi.fn().mockResolvedValue({
      initialized: true,
      unlocked: true,
      stores: [{ id: "store-1", name: "JMG Outdoors" }],
      currentStore: null,
    })
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { onPrepareReports, onGetAccountsStatus },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))
    await user.click(await screen.findByRole("button", { name: "Open Accounts" }))

    expect(await screen.findByRole("dialog", { name: "Accounts" })).toBeVisible()
    expect(screen.getByRole("option", { name: "JMG Outdoors" })).toBeVisible()
  })

  it("returns to commands from the report sign-in prompt", async () => {
    const user = userEvent.setup()
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: false }) },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))
    await screen.findByRole("button", { name: "Open Accounts" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate Reports/ })).toBeVisible()
  })

  it("uses Escape to leave the report sign-in prompt", async () => {
    const user = userEvent.setup()
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: false }) },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))
    await screen.findByRole("button", { name: "Open Accounts" })
    await user.keyboard("{Escape}")

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate Reports/ })).toBeVisible()
  })

  it("closes the launching palette when the sign-in prompt opens on Seller Central", async () => {
    const user = userEvent.setup()
    const onGenerateReports = vi.fn()
    const { onOpenChange } = renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      onGenerateReports,
      undefined,
      undefined,
      { onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: false, openedPromptOnSellerCentral: true }) },
    )

    await user.click(screen.getByRole("option", { name: /Generate Reports/ }))

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onGenerateReports).not.toHaveBeenCalled()
  })

  it("opens directly on the report sign-in prompt", () => {
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      initialMode: "report-login",
    })

    expect(screen.getByRole("dialog", { name: "Generate Reports" })).toBeVisible()
    expect(screen.getByRole("alert")).toHaveTextContent("Generate Reports needs an open Seller Central store")
  })

  it("closes an empty command palette on Escape and closes on backdrop click", async () => {
    const user = userEvent.setup()
    const first = renderPalette()

    await user.keyboard("{Escape}")
    expect(first.onOpenChange).toHaveBeenCalledWith(false)

    document.body.replaceChildren()
    const second = renderPalette()
    await user.click(document.querySelector("[data-slot=dialog-overlay]") as HTMLElement)
    expect(second.onOpenChange).toHaveBeenCalledWith(false)
  })
})
