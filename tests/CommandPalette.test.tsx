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
  it("opens the S4E Spotlight window for Generate reports", async () => {
    const user = userEvent.setup()
    const onOpenReports = vi.fn().mockResolvedValue(undefined)
    const props = renderPalette(true, undefined, undefined, undefined, undefined, undefined, { onOpenReports })
    await user.click(screen.getByRole("option", { name: /Generate reports/ }))
    expect(onOpenReports).toHaveBeenCalledOnce()
    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  describe("commands that need a signed-in Seller Central store", () => {
    const signedOut = () => vi.fn().mockResolvedValue("signed-out")

    it("asks to sign in instead of opening Results when Seller Central is signed out", async () => {
      const user = userEvent.setup()
      const onOpenReports = vi.fn().mockResolvedValue(undefined)
      const onCheckSession = signedOut()
      const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
        onOpenReports,
        onCheckSession,
      })

      await user.click(screen.getByRole("option", { name: /Generate reports/ }))

      expect(await screen.findByRole("alert")).toHaveTextContent("Sign in to a Seller Central store")
      expect(screen.getByRole("alert")).toHaveTextContent("Generate reports needs a signed-in store")
      expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
      expect(onCheckSession).toHaveBeenCalledOnce()
      expect(onOpenReports).not.toHaveBeenCalled()
      expect(onOpenChange).not.toHaveBeenCalled()
    })

    it("opens Results once the session check finds a signed-in store", async () => {
      const user = userEvent.setup()
      const onOpenReports = vi.fn().mockResolvedValue(undefined)
      const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
        onOpenReports,
        onCheckSession: vi.fn().mockResolvedValue("signed-in"),
      })

      await user.click(screen.getByRole("option", { name: /Generate reports/ }))

      await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
      expect(onOpenReports).toHaveBeenCalledOnce()
    })

    it.each([
      ["Open case IDs", "12345678901"],
      ["Open shipment IDs", "FBA15ABCD123"],
      ["Search SKUs", "SKU-1"],
    ])("asks to sign in before %s, then goes back with the input kept", async (command, id) => {
      const user = userEvent.setup()
      const onOpenCaseIds = vi.fn()
      const onOpenShipmentIds = vi.fn()
      const onOpenSkuIds = vi.fn()
      renderPalette(true, onOpenCaseIds, onOpenShipmentIds, onOpenSkuIds, undefined, undefined, {
        onCheckSession: signedOut(),
      })

      await user.click(screen.getByRole("option", { name: command }))
      await user.type(screen.getByRole("textbox"), `${id}{Enter}`)

      expect(await screen.findByRole("alert")).toHaveTextContent(`${command} needs a signed-in store`)
      expect(screen.getByRole("dialog", { name: command })).toBeVisible()
      for (const run of [onOpenCaseIds, onOpenShipmentIds, onOpenSkuIds]) expect(run).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Back" }))
      expect(screen.getByRole("textbox")).toHaveValue(id)
    })

    it("asks to sign in before opening detected IDs, and Escape returns to the search", async () => {
      const user = userEvent.setup()
      const onOpenCaseIds = vi.fn()
      renderPalette(true, onOpenCaseIds, undefined, undefined, undefined, undefined, { onCheckSession: signedOut() })

      await user.type(screen.getByRole("combobox", { name: "Search commands" }), "12345678901")
      await user.keyboard("{Enter}")

      expect(await screen.findByRole("alert")).toHaveTextContent("Open case IDs needs a signed-in store")
      expect(onOpenCaseIds).not.toHaveBeenCalled()

      await user.keyboard("{Escape}")
      expect(screen.getByRole("combobox", { name: "Search commands" })).toHaveValue("12345678901")
    })

    it("runs the command when the session can't be checked", async () => {
      const user = userEvent.setup()
      const onOpenCaseIds = vi.fn().mockResolvedValue(undefined)
      renderPalette(true, onOpenCaseIds, undefined, undefined, undefined, undefined, {
        onCheckSession: vi.fn().mockRejectedValue(new Error("worker asleep")),
      })

      await user.click(screen.getByRole("option", { name: "Open case IDs" }))
      await user.type(screen.getByRole("textbox"), "12345678901{Enter}")

      await vi.waitFor(() => expect(onOpenCaseIds).toHaveBeenCalledWith(["12345678901"]))
    })

    it("opens Seller Central from the sign-in screen and closes", async () => {
      const user = userEvent.setup()
      const onOpenSellerCentral = vi.fn().mockResolvedValue(undefined)
      const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
        onCheckSession: signedOut(),
        onOpenSellerCentral,
      })

      await user.click(screen.getByRole("option", { name: "Open case IDs" }))
      await user.type(screen.getByRole("textbox"), "12345678901{Enter}")
      expect(await screen.findByRole("button", { name: /Switch store/ })).toBeVisible()
      await user.click(screen.getByRole("button", { name: "Open Seller Central" }))

      expect(onOpenSellerCentral).toHaveBeenCalledOnce()
      await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    })

    it("offers only Seller Central when store switching is turned off", async () => {
      const user = userEvent.setup()
      renderPalette(true, undefined, undefined, undefined, undefined, { ...DEFAULT_ENABLED_FEATURES, accounts: false }, {
        onCheckSession: signedOut(),
      })

      await user.click(screen.getByRole("option", { name: "Open case IDs" }))
      await user.type(screen.getByRole("textbox"), "12345678901{Enter}")

      expect(await screen.findByRole("alert")).toHaveTextContent("Sign in on Seller Central, then try again.")
      expect(screen.getByRole("button", { name: /Open Seller Central/ })).toBeVisible()
      expect(screen.queryByRole("button", { name: /Switch store/ })).not.toBeInTheDocument()
    })
  })

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
    expect(screen.getByRole("option", { name: /Scrape case/ })).toBeVisible()
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
      true, undefined, undefined, undefined, undefined, undefined, { onOpenRemovalOrderIds },
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

  it("opens the window's Cases tab straight from Scrape case", async () => {
    const user = userEvent.setup()
    const onOpenCases = vi.fn().mockResolvedValue(undefined)
    const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
      onOpenCases,
      onCheckSession: vi.fn().mockResolvedValue("signed-in"),
    })

    await user.click(screen.getByRole("option", { name: /Scrape case/ }))

    await vi.waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(onOpenCases).toHaveBeenCalledOnce()
    expect(screen.queryByRole("textbox", { name: "Case IDs" })).not.toBeInTheDocument()
  })

  it("asks to sign in instead of opening Scrape case when Seller Central is signed out", async () => {
    const user = userEvent.setup()
    const onOpenCases = vi.fn().mockResolvedValue(undefined)
    const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
      onOpenCases,
      onCheckSession: vi.fn().mockResolvedValue("signed-out"),
    })

    await user.click(screen.getByRole("option", { name: /Scrape case/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Scrape case needs a signed-in store")
    expect(onOpenCases).not.toHaveBeenCalled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("keeps the palette open with an error when the window can't open", async () => {
    const user = userEvent.setup()
    const onOpenCases = vi.fn().mockRejectedValue(new Error("Couldn’t open the S4E Spotlight window."))
    const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, { onOpenCases })

    await user.click(screen.getByRole("option", { name: /Scrape case/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn’t open the S4E Spotlight window.")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("hides Scrape case when the feature is off", () => {
    renderPalette(
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      { ...DEFAULT_ENABLED_FEATURES, "scrape-case": false },
    )

    expect(screen.queryByRole("option", { name: /Scrape case/ })).not.toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Open case IDs/ })).toBeVisible()
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

  describe("Bulk removal", () => {
    const summary = {
      openedCount: 2,
      skipped: [{ sku: "TYPO", reason: "Not in unfulfillable inventory" }],
      nextRemovalOrderId: "S4EJM0013",
      eligibilityUnknown: false,
    }

    it("sends the pasted SKUs, then shows what was skipped and the next removal order ID", async () => {
      const user = userEvent.setup()
      const onCreateBulkRemoval = vi.fn().mockResolvedValue(summary)
      const onFocusBulkRemoval = vi.fn().mockResolvedValue(undefined)
      const { onOpenChange } = renderPalette(true, undefined, undefined, undefined, undefined, undefined, { onCreateBulkRemoval, onFocusBulkRemoval })

      await user.click(screen.getByRole("option", { name: /Bulk removal/ }))
      const input = screen.getByRole("textbox", { name: "SKUs to remove" })
      // More than the bulk-open threshold: a single tab needs no confirmation.
      fireEvent.change(input, { target: { value: Array.from({ length: 12 }, (_, index) => `SKU-${index}`).join("\n") } })
      expect(screen.getByRole("button", { name: "Create removal for 12 SKUs" })).toBeEnabled()
      await user.keyboard("{Enter}")

      expect(onCreateBulkRemoval).toHaveBeenCalledWith(Array.from({ length: 12 }, (_, index) => `SKU-${index}`))
      expect(await screen.findByText("Opened a removal for 2 SKUs")).toBeVisible()
      expect(screen.getByText("S4EJM0013")).toBeVisible()
      expect(screen.getByRole("list", { name: "Skipped SKUs" })).toHaveTextContent("TYPONot in unfulfillable inventory")
      expect(onOpenChange).not.toHaveBeenCalled()

      await user.click(screen.getByRole("button", { name: "Go to removal" }))
      expect(onFocusBulkRemoval).toHaveBeenCalledOnce()
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it("goes back to the SKUs when nothing could be removed", async () => {
      const user = userEvent.setup()
      const onCreateBulkRemoval = vi.fn().mockResolvedValue({ ...summary, openedCount: 0, nextRemovalOrderId: null })
      renderPalette(true, undefined, undefined, undefined, undefined, undefined, { onCreateBulkRemoval })

      await user.click(screen.getByRole("option", { name: /Bulk removal/ }))
      fireEvent.change(screen.getByRole("textbox", { name: "SKUs to remove" }), { target: { value: "TYPO" } })
      await user.keyboard("{Enter}")

      expect(await screen.findByRole("alert")).toHaveTextContent("No SKUs can be removed")
      await user.click(screen.getByRole("button", { name: "Edit SKUs" }))
      expect(screen.getByRole("textbox", { name: "SKUs to remove" })).toHaveValue("TYPO")
    })

    it("is hidden when turned off", () => {
      renderPalette(true, undefined, undefined, undefined, undefined, { ...DEFAULT_ENABLED_FEATURES, "bulk-removal": false })
      expect(screen.queryByRole("option", { name: /Bulk removal/ })).toBeNull()
    })
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

    expect(document.querySelector("[data-slot=panel-footer]")).toHaveTextContent("Navigate")
    expect(document.querySelector("[data-slot=command-header]")).not.toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: /Open case IDs/ }))
    expect(document.querySelector("[data-slot=command-header]")).toHaveTextContent("Commands/Open case IDs")
    expect(document.querySelector("[data-slot=panel-footer]")).toHaveTextContent("New line")
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

  it("opens Time Out and closes the palette", async () => {
    const user = userEvent.setup()
    const onOpenTimeOut = vi.fn<() => Promise<void>>().mockResolvedValue()
    const { onOpenChange } = renderPalette(
      true,
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
      onOpenTimeOut,
    )

    await user.click(screen.getByRole("option", { name: /Time Out/ }))

    expect(await screen.findByRole("alert")).toHaveTextContent("tab creation failed")
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("opens directly on the report sign-in prompt", () => {
    renderPalette(true, undefined, undefined, undefined, undefined, undefined, {
      initialMode: "sign-in",
    })

    expect(screen.getByRole("dialog", { name: "Generate reports" })).toBeVisible()
    expect(screen.getByRole("alert")).toHaveTextContent("Generate reports needs a signed-in store")
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
