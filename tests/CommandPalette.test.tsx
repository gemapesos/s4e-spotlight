import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CommandPalette, type CommandPaletteProps } from "../src/CommandPalette"
import type { ReportProgressEvent } from "../src/lib/reportProgress"
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

/** Chooses Generate Reports, then starts it from the confirmation with every section checked. */
async function startReport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("option", { name: /Generate reports/ }))
  await user.click(await screen.findByRole("button", { name: "Generate report" }))
}

const REPORT_SECTION_NAMES = [
  "Unfulfillable",
  "Seller Feedback",
  "Stranded",
  "Suppressed",
  "Shipping Queue",
]

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
    expect(screen.getByText("Settings", { selector: "[cmdk-group-heading]" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Open case IDs/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: /Open shipment IDs/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate reports/ })).toBeVisible()
    expect(screen.getByRole("option", { name: /Search SKUs/ })).toBeVisible()
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

    expect(screen.queryByRole("option", { name: /Generate reports/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Switch store/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Time Out/ })).not.toBeInTheDocument()
    expect(screen.queryByText("Reports", { selector: "[cmdk-group-heading]" })).not.toBeInTheDocument()
    expect(screen.queryByText("Settings", { selector: "[cmdk-group-heading]" })).not.toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Open case IDs/ })).toBeVisible()
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
    expect(screen.getByRole("option", { name: /Open shipment IDs/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open case ID/ })).not.toBeInTheDocument()

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
    expect(screen.queryByRole("option", { name: /Open case ID/ })).not.toBeInTheDocument()
  })

  it("matches shipment commands by typo, synonym, and acronym", async () => {
    const user = userEvent.setup()
    renderPalette()
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "shipmnet")
    expect(screen.getByRole("option", { name: /Open shipment IDs/ })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Open case ID/ })).not.toBeInTheDocument()

    await user.clear(input)
    await user.type(input, "fba")
    expect(screen.getByRole("option", { name: /Open shipment IDs/ })).toBeVisible()

    await user.clear(input)
    await user.type(input, "osi")
    expect(screen.getByRole("option", { name: /Open shipment IDs/ })).toBeVisible()
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

  it("offers a detected Removal Order ID action instead of a SKU search", async () => {
    const user = userEvent.setup()
    const onOpenRemovalOrderIds = vi.fn<(removalOrderIds: string[]) => Promise<void>>().mockResolvedValue()
    const { onOpenChange, onOpenSkuIds } = renderPalette(
      true, undefined, undefined, undefined, undefined, undefined, undefined, { onOpenRemovalOrderIds },
    )
    const input = screen.getByRole("combobox", { name: "Search commands" })

    await user.type(input, "s4ekm0127")
    const detected = screen.getByRole("option", { name: /Open removal order S4EKM0127/ })
    expect(detected).toBeVisible()
    expect(screen.queryByRole("option", { name: /as SKU/ })).not.toBeInTheDocument()

    await user.click(detected)
    expect(onOpenRemovalOrderIds).toHaveBeenCalledWith(["S4EKM0127"])
    expect(onOpenSkuIds).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("opens an enabled workflow without closing the palette", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case ID/ }))
    expect(screen.getByRole("dialog", { name: "Open case IDs" })).toBeVisible()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("switches to a focused multiline Case ID input", async () => {
    const user = userEvent.setup()
    const { onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))

    expect(screen.queryByRole("combobox", { name: "Search commands" })).not.toBeInTheDocument()
    expect(screen.queryByRole("listbox", { name: "Suggestions" })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Case IDs" })).toHaveFocus()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("shows directional fades only where Case ID content can scroll", async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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
    await user.click(screen.getByRole("option", { name: /Open shipment IDs/ }))
    const input = screen.getByRole("textbox", { name: "Shipment IDs" }) as HTMLTextAreaElement

    setTextareaLayout(input, { clientHeight: 128, scrollHeight: 300, scrollTop: 0 })
    fireEvent.change(input, { target: { value: "FBA19749WJ6Q\nFBA18G77LW09" } })

    expect(input).toHaveValue("FBA19749WJ6Q\nFBA18G77LW09")
    expect(input).toHaveAttribute("data-fade-mask", "bottom")
  })

  it("resets to command mode after closing and reopening", async () => {
    const user = userEvent.setup()
    const { rerenderPalette } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: [...ids, ids[0]].join("\n") } })
    expect(screen.getByText("10 unique case IDs")).toBeVisible()
    await user.click(screen.getByRole("button", { name: /^Open \d+ cases/ }))

    expect(openCaseIds).toHaveBeenCalledWith(ids)
  })

  it("confirms batches from eleven through fifty IDs", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 50 }, (_, index) => String(30_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: ids.join("\n") } })
    await user.click(screen.getByRole("button", { name: /^Open \d+ cases/ }))

    expect(screen.getByRole("dialog", { name: "Confirm bulk open" })).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Open 50 tabs" }))
    expect(openCaseIds).toHaveBeenCalledWith(ids)
  })

  it("confirms a bulk open with Enter on the focused button", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 11 }, (_, index) => String(30_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: ids.join("\n") } })
    await user.click(screen.getByRole("button", { name: /^Open \d+ cases/ }))
    expect(screen.getByRole("button", { name: "Open 11 tabs" })).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(openCaseIds).toHaveBeenCalledWith(ids)
  })

  it("rejects more than fifty IDs before messaging the background", async () => {
    const user = userEvent.setup()
    const openCaseIds = vi.fn<(caseIds: string[]) => Promise<void>>().mockResolvedValue()
    renderPalette(true, openCaseIds)
    const ids = Array.from({ length: 51 }, (_, index) => String(40_000_000_000 + index))

    await user.click(screen.getByRole("option", { name: /Open case ID/ }))
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: ids.join("\n") } })
    await user.click(screen.getByRole("button", { name: /^Open \d+ cases/ }))

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

    await user.click(screen.getByRole("option", { name: /Open shipment IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open shipment IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Search SKUs/ }))
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

    await user.click(screen.getByRole("option", { name: /Search SKUs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
    const input = screen.getByRole("textbox", { name: "Case IDs" })
    await user.type(input, "21476974831")
    await user.keyboard("{Shift>}{Enter}{/Shift}")

    expect(input).toHaveValue("21476974831\n")
    expect(openCaseIds).not.toHaveBeenCalled()
  })

  it("keeps invalid input open and exposes an accessible error", async () => {
    const user = userEvent.setup()
    const { onOpenCaseIds, onOpenChange } = renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
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
    const first = screen.getByRole("option", { name: /Open case IDs/ })
    const last = screen.getByRole("option", { name: /^Switch store$/ })

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
    expect(screen.getByRole("option", { name: /^Switch store$/ })).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("option", { name: /Open case IDs/ })).toHaveAttribute("aria-selected", "true")
  })

  it("keeps the command list scrollable without a visible scrollbar", () => {
    renderPalette()
    const list = screen.getByRole("listbox", { name: "Suggestions" })

    expect(list).toHaveClass("no-scrollbar")
    expect(list).toHaveClass("overflow-y-auto")
    expect(list).toHaveClass("min-h-0")
    expect(list).toHaveClass("max-h-80")
    expect(list).toHaveAttribute("data-fade-mask", "none")
  })

  it("does not animate the command surface on first open", () => {
    renderPalette()
    expect(document.querySelector("[data-slot=command]")).not.toHaveClass("animate-surface-in")
  })

  it("animates the command surface after a mode switch", async () => {
    const user = userEvent.setup()
    renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))

    expect(document.querySelector("[data-slot=command]")).toHaveClass("animate-surface-in")
  })

  it("slides forward into a screen and back out of it", async () => {
    const user = userEvent.setup()
    renderPalette()
    const shift = () => (document.querySelector("[data-slot=command]") as HTMLElement).style.getPropertyValue("--surface-shift")

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
    expect(shift()).toBe("0.75rem")
    await user.click(screen.getByRole("button", { name: "Back" }))
    expect(shift()).toBe("-0.75rem")
  })

  it("shows keyboard hints in the footer and a back header on screens below Commands", async () => {
    const user = userEvent.setup()
    renderPalette()

    expect(document.querySelector("[data-slot=command-footer]")).toHaveTextContent("Navigate")
    expect(document.querySelector("[data-slot=command-header]")).not.toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
    expect(document.querySelector("[data-slot=command-header]")).toHaveTextContent("Commands/Open case IDs")
    expect(document.querySelector("[data-slot=command-footer]")).toHaveTextContent("New line")
  })

  it("labels the open button with how many IDs it will open", async () => {
    const user = userEvent.setup()
    renderPalette()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
    expect(screen.getByRole("button", { name: "Open" })).toBeDisabled()
    fireEvent.change(screen.getByRole("textbox", { name: "Case IDs" }), { target: { value: "12345678901" } })

    expect(screen.getByRole("button", { name: "Open 1 case" })).toBeEnabled()
    expect(screen.getByRole("list", { name: "Detected case IDs" })).toHaveTextContent("12345678901")
  })

  it("shows directional fades only where the command list can scroll", () => {
    renderPalette()
    const list = screen.getByRole("listbox", { name: "Suggestions" }) as HTMLElement

    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 128 },
      scrollHeight: { configurable: true, value: 128 },
      scrollTop: { configurable: true, writable: true, value: 0 },
    })
    fireEvent.scroll(list)
    expect(list).toHaveAttribute("data-fade-mask", "none")

    Object.defineProperties(list, {
      clientHeight: { configurable: true, value: 128 },
      scrollHeight: { configurable: true, value: 300 },
    })
    fireEvent.scroll(list)
    expect(list).toHaveAttribute("data-fade-mask", "bottom")

    Object.defineProperty(list, "scrollTop", { configurable: true, writable: true, value: 80 })
    fireEvent.scroll(list)
    expect(list).toHaveAttribute("data-fade-mask", "both")

    Object.defineProperty(list, "scrollTop", { configurable: true, writable: true, value: 172 })
    fireEvent.scroll(list)
    expect(list).toHaveAttribute("data-fade-mask", "top")
  })

  it("keeps the palette open and downloads the report or the raw workbook", async () => {
    const user = userEvent.setup()
    const report = {
      storeName: "JMG Outdoors",
      generatedAt: new Date(2026, 7, 14),
      unfulfillableListings: [],
      feedbacks: [],
      strandedListings: [],
      suppressedListings: [],
      shipments: [],
    }
    const onGenerateReports = vi.fn().mockResolvedValue(report)
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
    const createObjectURL = vi.fn().mockReturnValue("blob:report")
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL: vi.fn() })
    const clicked: { download?: string } = {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.download = this.download
    })

    try {
      await startReport(user)

      expect(await screen.findByRole("button", { name: "Download" })).toBeVisible()
      const raw = screen.getByRole("button", { name: "Download raw workbook" })
      expect(raw).toBeVisible()
      expect(raw).toHaveAttribute("title", "Download raw workbook (debug)")
      expect(raw).toHaveAttribute("data-size", "icon")
      expect(screen.getByRole("button", { name: "Download" })).toHaveClass("translate-x-0")
      expect(raw).toHaveClass("translate-x-0")
      expect(screen.getByRole("button", { name: "Back" })).toBeVisible()
      expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
      expect(onPrepareReports).toHaveBeenCalledOnce()
      expect(onOpenChange).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Download" }))
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026 - Sheets.xlsx")
      await user.click(screen.getByRole("button", { name: "Download raw workbook" }))
      expect(clicked.download).toBe("JMG Outdoors - 14-Aug-2026.xlsx")
      expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()

      await user.keyboard("{Escape}")
      expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()

      await startReport(user)
      await user.click(await screen.findByRole("button", { name: "Back" }))
      expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
      expect(screen.getByRole("option", { name: /Generate reports/ })).toBeVisible()
    } finally {
      click.mockRestore()
    }
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

    await startReport(user)

    expect(await screen.findByRole("dialog", { name: "Generate reports" })).toBeVisible()
    expect(screen.queryByRole("option", { name: /Time Out/ })).not.toBeInTheDocument()
    expect(screen.queryByText("Opening Seller Central")).not.toBeInTheDocument()
    expect(screen.queryByText("Building spreadsheet")).not.toBeInTheDocument()
    expect(screen.getByText("Unfulfillable")).toBeVisible()
    expect(screen.getByText("Seller Feedback")).toBeVisible()
    expect(screen.getByText("Stranded")).toBeVisible()
    expect(screen.getByLabelText("Unfulfillable")).toBeVisible()
    expect(screen.getByLabelText("Seller Feedback")).toBeVisible()
    expect(screen.getByLabelText("Stranded")).toBeVisible()

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

    await startReport(user)

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t build the report.")
    expect(onOpenChange).not.toHaveBeenCalled()
    expect(screen.getByText("Unfulfillable")).toBeVisible()
    expect(screen.queryByRole("option", { name: /Generate reports/ })).not.toBeInTheDocument()
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

    await startReport(user)

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in to a Seller Central store")
    expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
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

    await startReport(user)
    await user.click(await screen.findByRole("button", { name: "Switch store" }))

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

    await startReport(user)
    await screen.findByRole("button", { name: "Switch store" })
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate reports/ })).toBeVisible()
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

    await startReport(user)
    await screen.findByRole("button", { name: "Switch store" })
    await user.keyboard("{Escape}")

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(screen.getByRole("option", { name: /Generate reports/ })).toBeVisible()
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

    await startReport(user)

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onGenerateReports).not.toHaveBeenCalled()
  })

  it("opens directly on the report sign-in prompt", () => {
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      initialMode: "report-login",
    })

    expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
    expect(screen.getByRole("alert")).toHaveTextContent("Generate reports needs an open Seller Central store")
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

  it("ignores a report run abandoned by closing the palette", async () => {
    const user = userEvent.setup()
    const report = {
      storeName: "JMG Outdoors",
      generatedAt: new Date(2026, 7, 14),
      unfulfillableListings: [],
      feedbacks: [],
      strandedListings: [],
      suppressedListings: [],
      shipments: [],
    }
    type Progress = (event: ReportProgressEvent) => void
    const runs: Array<{ finish: (value: typeof report) => void; progress?: Progress }> = []
    const onGenerateReports = vi.fn((_store?: string, progress?: Progress) => new Promise<typeof report>((finish) => {
      runs.push({ finish, progress })
    }))
    const { rerenderPalette } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onGenerateReports,
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await startReport(user)
    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledTimes(1))
    rerenderPalette(false)
    rerenderPalette(true)
    await startReport(user)
    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledTimes(2))

    await act(async () => {
      runs[0].progress?.({ source: "unfulfillable", status: "active", loaded: 5, total: 10, phase: "listings" })
      runs[0].finish(report)
    })
    expect(screen.queryByText("5 of 10 listings")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Download" })).toBeDisabled()

    await act(async () => { runs[1].finish(report) })
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Download" })).toBeEnabled())
  })

  it("shows why a report source failed", async () => {
    const user = userEvent.setup()
    let onProgress: ((event: ReportProgressEvent) => void) | undefined
    const onGenerateReports = vi.fn((_store?: string, progress?: typeof onProgress) => {
      onProgress = progress
      return new Promise<void>(() => undefined)
    })
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onGenerateReports,
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await startReport(user)
    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    await act(async () => {
      onProgress?.({ source: "shippingQueue", status: "error", error: "Couldn’t load shipping queue (503)." })
    })

    expect(screen.getByText("Couldn’t load shipping queue (503).")).toBeVisible()
  })

  it("downloads once per click and from the keyboard", async () => {
    const user = userEvent.setup()
    const report = {
      storeName: "JMG Outdoors",
      generatedAt: new Date(2026, 7, 14),
      unfulfillableListings: [],
      feedbacks: [],
      strandedListings: [],
      suppressedListings: [],
      shipments: [],
    }
    const onDownloadReport = vi.fn()
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onDownloadReport,
      onGenerateReports: vi.fn().mockResolvedValue(report),
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await startReport(user)
    await user.click(await screen.findByRole("button", { name: "Download" }))
    expect(onDownloadReport).toHaveBeenCalledTimes(1)
    expect(onDownloadReport).toHaveBeenLastCalledWith(report, "sheets")

    screen.getByRole("button", { name: "Download raw workbook" }).focus()
    await user.keyboard("{Enter}")
    expect(onDownloadReport).toHaveBeenCalledTimes(2)
    expect(onDownloadReport).toHaveBeenLastCalledWith(report, "raw")
  })

  it("lists sections that loaded only partly once the report is ready", async () => {
    const user = userEvent.setup()
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onGenerateReports: vi.fn().mockResolvedValue({
        storeName: "Cherrylane Enterprises",
        generatedAt: new Date(2026, 9, 18),
        unfulfillableListings: Array.from({ length: 10 }, () => ({ listingsIncomplete: true })),
        feedbacks: [],
        strandedListings: [],
        suppressedListings: [],
        shipments: [],
      }),
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await startReport(user)

    expect(await screen.findByText("Only 10 unfulfillable listings loaded; Seller Central lists more.")).toBeVisible()
    expect(screen.getByRole("button", { name: "Download" })).toBeVisible()
  })

  it("asks which sections to include before loading anything", async () => {
    const user = userEvent.setup()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: true })
    const onGenerateReports = vi.fn().mockResolvedValue(undefined)
    renderPalette(true, undefined, undefined, undefined, onGenerateReports, undefined, undefined, {
      onGetAccountsStatus: vi.fn().mockResolvedValue({
        initialized: true,
        unlocked: true,
        stores: [{ id: "store-1", name: "JMG Outdoors" }],
        currentStore: { id: "store-1", name: "JMG Outdoors" },
      }),
      onPrepareReports,
    })

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))

    expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
    expect(await screen.findByRole("status", { name: "Current store: JMG Outdoors" })).toBeVisible()
    for (const name of REPORT_SECTION_NAMES) {
      expect(screen.getByRole("option", { name })).toHaveAttribute("aria-checked", "true")
      expect(screen.getByRole("option", { name })).toHaveAttribute("data-checked", "true")
    }
    expect(screen.getByRole("option", { name: "Unfulfillable" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("button", { name: "Generate report" })).toBeEnabled()
    expect(screen.getByText("5 of 5 sections")).toBeVisible()
    expect(onPrepareReports).not.toHaveBeenCalled()
    expect(onGenerateReports).not.toHaveBeenCalled()

    await user.keyboard("{Meta>}{Enter}{/Meta}")

    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    expect(onPrepareReports).toHaveBeenCalledOnce()
    expect(onGenerateReports.mock.calls[0]?.[2]).toEqual([
      "unfulfillable",
      "feedback",
      "stranded",
      "suppressed",
      "shippingQueue",
    ])
  })

  it("loads and lists only the sections left checked", async () => {
    const user = userEvent.setup()
    const onGenerateReports = vi.fn(
      (_store?: string, _progress?: (event: ReportProgressEvent) => void, _sections?: readonly string[]) =>
        new Promise<void>(() => undefined),
    )
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onGenerateReports,
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    await user.click(screen.getByRole("option", { name: "Seller Feedback" }))
    await user.click(screen.getByRole("option", { name: "Shipping Queue" }))

    expect(screen.getByRole("option", { name: "Seller Feedback" })).toHaveAttribute("aria-checked", "false")
    expect(screen.getByRole("option", { name: "Shipping Queue" })).not.toHaveAttribute("data-checked")
    expect(screen.getByRole("option", { name: "Stranded" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByText("3 of 5 sections")).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Generate report" }))

    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    expect(onGenerateReports.mock.calls[0]?.[2]).toEqual(["unfulfillable", "stranded", "suppressed"])
    expect(screen.getByLabelText("Unfulfillable")).toBeVisible()
    expect(screen.getByLabelText("Stranded")).toBeVisible()
    expect(screen.getByLabelText("Suppressed")).toBeVisible()
    expect(screen.queryByText("Seller Feedback")).not.toBeInTheDocument()
    expect(screen.queryByText("Shipping Queue")).not.toBeInTheDocument()
  })

  it("toggles report sections from the keyboard", async () => {
    const user = userEvent.setup()
    const onGenerateReports = vi.fn(
      (_store?: string, _progress?: (event: ReportProgressEvent) => void, _sections?: readonly string[]) =>
        new Promise<void>(() => undefined),
    )
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, {
      onGenerateReports,
      onPrepareReports: vi.fn().mockResolvedValue({ loggedInToStore: true }),
    })

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    await user.keyboard("{ArrowUp}")
    expect(screen.getByRole("option", { name: "Shipping Queue" })).toHaveAttribute("aria-selected", "true")

    await user.keyboard("{Enter}")
    expect(screen.getByRole("option", { name: "Shipping Queue" })).toHaveAttribute("aria-checked", "false")
    await user.keyboard(" ")
    expect(screen.getByRole("option", { name: "Shipping Queue" })).toHaveAttribute("aria-checked", "true")
    await user.keyboard(" ")
    expect(onGenerateReports).not.toHaveBeenCalled()

    await user.keyboard("{Control>}{Enter}{/Control}")
    await vi.waitFor(() => expect(onGenerateReports).toHaveBeenCalledOnce())
    expect(onGenerateReports.mock.calls[0]?.[2]).toEqual(["unfulfillable", "feedback", "stranded", "suppressed"])
  })

  it("needs at least one section to generate a report", async () => {
    const user = userEvent.setup()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: true })
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, undefined, { onPrepareReports })

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    for (const name of REPORT_SECTION_NAMES) await user.click(screen.getByRole("option", { name }))

    const generate = screen.getByRole("button", { name: "Generate report" })
    expect(generate).toBeDisabled()
    expect(screen.getByText("0 of 5 sections")).toBeVisible()
    await user.click(generate)
    expect(onPrepareReports).not.toHaveBeenCalled()
  })

  it("leaves the report confirmation without loading, and starts the next one with every section checked", async () => {
    const user = userEvent.setup()
    const onPrepareReports = vi.fn().mockResolvedValue({ loggedInToStore: true })
    const onGenerateReports = vi.fn()
    renderPalette(true, undefined, undefined, undefined, onGenerateReports, undefined, undefined, { onPrepareReports })

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    await user.click(screen.getByRole("option", { name: "Stranded" }))
    expect(screen.getByRole("option", { name: "Stranded" })).toHaveAttribute("aria-checked", "false")
    await user.keyboard("{Escape}")
    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()

    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    expect(screen.getByRole("option", { name: "Stranded" })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByText("5 of 5 sections")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Back" }))

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeVisible()
    expect(onPrepareReports).not.toHaveBeenCalled()
    expect(onGenerateReports).not.toHaveBeenCalled()
  })
})
