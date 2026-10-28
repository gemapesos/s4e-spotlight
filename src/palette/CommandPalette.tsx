import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Building2,
  Clock,
  FileJson,
  FileSpreadsheet,
  FolderOpen,
  LogIn,
  Package,
  PackageMinus,
  Truck,
} from "lucide-react"

import { CancelButton, PrimaryButton } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { CommandDialog, CommandFooter, CommandHeader, CommandHint } from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"
import { extractCaseIds, findCaseIds } from "@/shared/identifiers"
import { fadeMaskForScroll, type FadeMaskState } from "@/lib/fadeMask"
import { errorMessage } from "@/shared/log"
import { commandFilter } from "@/lib/searchScore"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import {
  DEFAULT_ENABLED_FEATURES,
  isFeatureEnabled,
  type EnabledFeatures,
} from "@/shared/settings"
import { extractRemovalOrderIds, findRemovalOrderIds } from "@/shared/identifiers"
import { extractShipmentIds, findShipmentIds } from "@/shared/identifiers"
import { extractSkuIds, findSkuIds } from "@/shared/identifiers"
import { SwitchScreen } from "@/components/switch/SwitchProgress"
import { ErrorAlert, Notice } from "@/palette/parts"
import { AccountsScreen } from "@/palette/screens/AccountsScreen"
import { CommandsScreen } from "@/palette/screens/CommandsScreen"
import { IdentifierScreen } from "@/palette/screens/IdentifierScreen"
import { RemovalSummary } from "@/palette/screens/RemovalSummary"
import { MAX_BULK_IDS, type AccountsStatus, type AccountStoreSummary, type ActiveSwitchSummary, type BulkRemovalSummary } from "@/shared/messages"

export type PaletteMode =
  | "commands"
  | "case-ids"
  | "shipment-ids"
  | "sku-ids"
  | "bulk-removal"
  /** What Bulk removal opened and skipped. */
  | "removal-summary"
  | "confirm-ids"
  | "accounts"
  | "unlock"
  /** A command that needs Seller Central found it signed out. */
  | "sign-in"
  | "switching"
  /** Opened by the extension on the tab a switch reloaded. */
  | "switch-done"
/** Removal orders have no screen of their own; they're only opened from the Detected row. */
export type IdentifierMode = "case-ids" | "shipment-ids" | "sku-ids" | "bulk-removal" | "removal-order-ids"
/** Commands that open or read Seller Central pages, so they need a signed-in store. */
type SignInCommand = IdentifierMode | "generate-reports" | "scrape-case"

const CONFIRM_THRESHOLD = 10

/** How deep each screen sits, so going back slides the other way. */
const SCREEN_DEPTH: Record<PaletteMode, number> = {
  commands: 0,
  "case-ids": 1,
  "shipment-ids": 1,
  "sku-ids": 1,
  "bulk-removal": 1,
  accounts: 1,
  "removal-summary": 2,
  "confirm-ids": 2,
  "sign-in": 2,
  unlock: 2,
  switching: 2,
  "switch-done": 2,
}
/** Detected IDs shown as chips under the input; the rest are counted. */
export interface InputModeDefinition {
  ariaLabel: string
  description: string
  extractIds: (input: string) => string[]
  /** Every ID in the input, repeats included, to count what was ignored. */
  findIds: (input: string) => string[]
  /** Shown when submit fails without an Error. */
  failureError: string
  invalidError: string
  /** The instruction above the input. */
  label: string
  noun: string
  placeholder: string
  /** Resolves "stay" when the submit moved to another screen instead of finishing. */
  submit: (ids: string[]) => Promise<void | "stay"> | void
  title: string
  unit: string
  /** The action button's verb; defaults to Open. */
  verb?: string
  busyLabel?: string
}

function isIdentifierInputMode(mode: PaletteMode): mode is Extract<IdentifierMode, PaletteMode> {
  return mode === "case-ids" || mode === "shipment-ids" || mode === "sku-ids" || mode === "bulk-removal"
}

export interface CommandDefinition {
  id: string
  label: string
  icon: LucideIcon
  keywords: readonly string[]
  /** Opens a page in a new tab instead of another palette screen. */
  external?: boolean
}

const EMPTY_ACCOUNTS_STATUS: AccountsStatus = {
  initialized: false,
  unlocked: false,
  stores: [],
}

async function defaultGetAccountsStatus(): Promise<AccountsStatus> {
  return EMPTY_ACCOUNTS_STATUS
}

export const commandGroups: ReadonlyArray<{
  heading: string
  commands: ReadonlyArray<CommandDefinition>
}> = [
  {
    heading: "Open",
    commands: [
      { id: "open-case-ids", label: "Open case IDs", icon: FolderOpen, keywords: ["case", "cases", "ticket", "support"] },
      { id: "scrape-case", label: "Scrape case", icon: FileJson, keywords: ["case", "cases", "scrape", "json", "export", "replies", "thread"] },
      { id: "open-shipment-ids", label: "Open shipment IDs", icon: Truck, keywords: ["shipment", "shipments", "fba", "inbound", "transfer"] },
      { id: "search-skus", label: "Search SKUs", icon: Package, keywords: ["sku", "skus", "asin", "msku", "listing", "product"] },
      { id: "bulk-removal", label: "Bulk removal", icon: PackageMinus, keywords: ["removal", "remove", "dispose", "liquidate", "unfulfillable", "sku", "skus", "msku"] },
      { id: "time-out", label: "Open Time Out", icon: Clock, keywords: ["timeout", "time", "sheet", "form", "break"], external: true },
    ],
  },
  {
    heading: "Reports",
    commands: [{ id: "generate-reports", label: "Generate reports", icon: FileSpreadsheet, keywords: ["report", "xlsx", "export", "spreadsheet"] }],
  },
  {
    heading: "Settings",
    commands: [{ id: "accounts", label: "Switch store", icon: Building2, keywords: ["account", "store", "stores", "switch", "login"] }],
  },
] as const

export interface CommandPaletteProps {
  container: ShadowRoot | HTMLElement
  open: boolean
  initialMode?: PaletteMode
  initialIdentifierInput?: string
  onOpenReports?: () => Promise<void>
  onOpenCaseIds: (caseIds: string[]) => Promise<void> | void
  /** Scrape case: opens the S4E Spotlight window on its Cases tab. */
  onOpenCases?: () => Promise<void>
  onOpenShipmentIds: (shipmentIds: string[]) => Promise<void> | void
  onOpenRemovalOrderIds?: (removalOrderIds: string[]) => Promise<void> | void
  onOpenSkuIds?: (skuIds: string[]) => Promise<void> | void
  /** Bulk removal: opens Create removal order in the background with the removable SKUs. */
  onCreateBulkRemoval?: (skus: string[]) => Promise<BulkRemovalSummary>
  onFocusBulkRemoval?: () => Promise<void>
  onGetAccountsStatus?: () => Promise<AccountsStatus>
  onUnlockAccounts?: (storeId: string) => Promise<void>
  onStartAccountSwitch?: (storeId: string) => Promise<void>
  onFocusCurrentStore?: () => Promise<void>
  onFocusAccountSwitch?: () => Promise<void>
  onCancelAccountSwitch?: () => Promise<void>
  onManageAccounts?: () => Promise<void>
  onOpenTimeOut?: () => Promise<void> | void
  /** Checked before commands that need Seller Central; "unknown" lets them run. */
  onCheckSession?: () => Promise<SellerCentralSessionState>
  onOpenSellerCentral?: () => Promise<void>
  onOpenChange: (open: boolean) => void
  enabledFeatures?: EnabledFeatures
  /** The store a finished switch reached, for the switch-done screen. */
  switchedStoreName?: string
}

export function CommandPalette({
  container,
  open,
  initialMode,
  initialIdentifierInput = "",
  onOpenReports = async () => undefined,
  onOpenCaseIds,
  onOpenCases = async () => undefined,
  onOpenShipmentIds,
  onOpenRemovalOrderIds = async () => undefined,
  onOpenSkuIds = async () => undefined,
  onCreateBulkRemoval = async () => ({ openedCount: 0, skipped: [], nextRemovalOrderId: null, eligibilityUnknown: false }),
  onFocusBulkRemoval = async () => undefined,
  onGetAccountsStatus = defaultGetAccountsStatus,
  onUnlockAccounts = async () => undefined,
  onStartAccountSwitch = async () => undefined,
  onFocusCurrentStore = async () => undefined,
  onFocusAccountSwitch = async () => undefined,
  onCancelAccountSwitch = async () => undefined,
  onManageAccounts = async () => undefined,
  onOpenTimeOut = async () => undefined,
  onCheckSession = async () => "unknown",
  onOpenSellerCentral = async () => undefined,
  onOpenChange,
  enabledFeatures = DEFAULT_ENABLED_FEATURES,
  switchedStoreName,
}: CommandPaletteProps) {
  const [mode, setMode] = React.useState<PaletteMode>(open && initialMode ? initialMode : "commands")
  const [identifierMode, setIdentifierMode] = React.useState<IdentifierMode>(initialMode && isIdentifierInputMode(initialMode) ? initialMode : "case-ids")
  const [commandSearch, setCommandSearch] = React.useState("")
  const [accountSearch, setAccountSearch] = React.useState("")
  const [identifierInput, setIdentifierInput] = React.useState(initialIdentifierInput)
  const [pendingIds, setPendingIds] = React.useState<string[]>([])
  const [removalSummary, setRemovalSummary] = React.useState<BulkRemovalSummary | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [stores, setStores] = React.useState<AccountStoreSummary[]>([])
  const [activeSwitch, setActiveSwitch] = React.useState<ActiveSwitchSummary | undefined>()
  const [currentStore, setCurrentStore] = React.useState<AccountStoreSummary | null>(null)
  const [accountsLoaded, setAccountsLoaded] = React.useState(false)
  const [accountsUnlocked, setAccountsUnlocked] = React.useState(false)
  const [selectedStore, setSelectedStore] = React.useState<AccountStoreSummary | null>(null)
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")
  const [signInPrompt, setSignInPrompt] = React.useState<{ command: SignInCommand; back: PaletteMode }>({
    command: "generate-reports",
    back: "commands",
  })
  const identifierInputRef = React.useRef<HTMLTextAreaElement>(null)
  /** Bumped when the palette closes, so a late session check can't change the next opening. */
  const sessionCheckRef = React.useRef(0)
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const inputModes = React.useMemo<Record<IdentifierMode, InputModeDefinition>>(() => ({
    "case-ids": {
      ariaLabel: "Case IDs",
      description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
      extractIds: extractCaseIds,
      failureError: "Couldn’t open case tabs. Please try again.",
      findIds: findCaseIds,
      invalidError: "Enter at least one 11-digit Case ID.",
      label: "Paste one or more 11-digit case IDs",
      noun: "case",
      placeholder: "Paste case IDs, links or text…",
      submit: onOpenCaseIds,
      title: "Open case IDs",
      unit: "case ID",
    },
    "shipment-ids": {
      ariaLabel: "Shipment IDs",
      description: "Enter one or more Amazon Seller Central FBA Shipment IDs.",
      extractIds: extractShipmentIds,
      failureError: "Couldn’t open shipment tabs. Please try again.",
      findIds: findShipmentIds,
      invalidError: "Enter at least one valid FBA Shipment ID.",
      label: "Paste one or more FBA shipment IDs",
      noun: "shipment",
      placeholder: "Paste shipment IDs, links or text…",
      submit: onOpenShipmentIds,
      title: "Open shipment IDs",
      unit: "shipment ID",
    },
    "removal-order-ids": {
      ariaLabel: "Removal order IDs",
      description: "Enter one or more S4E removal order IDs.",
      extractIds: extractRemovalOrderIds,
      failureError: "Couldn’t open removal order tabs. Please try again.",
      findIds: findRemovalOrderIds,
      invalidError: "Enter at least one valid removal order ID.",
      label: "Paste one or more removal order IDs",
      noun: "removal order",
      placeholder: "Paste removal order IDs, links or text…",
      submit: onOpenRemovalOrderIds,
      title: "Open removal orders",
      unit: "removal order ID",
    },
    "sku-ids": {
      ariaLabel: "SKUs",
      description: "Enter one or more Amazon Seller Central SKUs, one per line.",
      extractIds: extractSkuIds,
      failureError: "Couldn’t open SKU tabs. Please try again.",
      findIds: findSkuIds,
      invalidError: "Enter at least one SKU.",
      label: "Paste one or more SKUs, one per line",
      noun: "SKU",
      placeholder: "Paste SKUs, one per line…",
      submit: onOpenSkuIds,
      title: "Search SKUs",
      unit: "SKU",
    },
    "bulk-removal": {
      ariaLabel: "SKUs to remove",
      description: "Enter SKUs to open Amazon’s Create removal order page with the removable ones filled in.",
      extractIds: extractSkuIds,
      failureError: "Couldn’t create the removal. Please try again.",
      findIds: findSkuIds,
      invalidError: "Enter at least one SKU.",
      label: "Paste the SKUs to remove, one per line",
      noun: "SKU",
      placeholder: "Paste SKUs, one per line…",
      submit: async (skus) => {
        setRemovalSummary(await onCreateBulkRemoval(skus))
        setMode("removal-summary")
        return "stay" as const
      },
      title: "Bulk removal",
      unit: "SKU",
      verb: "Create removal for",
      busyLabel: "Checking eligibility…",
    },
  }), [onCreateBulkRemoval, onOpenCaseIds, onOpenRemovalOrderIds, onOpenShipmentIds, onOpenSkuIds])
  const inputMode = inputModes[identifierMode]
  const confirmBackMode: PaletteMode = identifierMode === "removal-order-ids" ? "commands" : identifierMode

  const visibleGroups = React.useMemo(
    () =>
      commandGroups
        .map((group) => ({
          ...group,
          commands: group.commands.filter((command) => isFeatureEnabled(enabledFeatures, command.id)),
        }))
        .filter((group) => group.commands.length > 0),
    [enabledFeatures],
  )
  const currentIds = React.useMemo(() => inputMode.extractIds(identifierInput), [identifierInput, inputMode])
  const duplicateIds = React.useMemo(
    () => inputMode.findIds(identifierInput).length - currentIds.length,
    [currentIds.length, identifierInput, inputMode],
  )
  const detectedCaseIds = React.useMemo(() => extractCaseIds(commandSearch), [commandSearch])
  const detectedShipmentIds = React.useMemo(() => extractShipmentIds(commandSearch), [commandSearch])
  const detectedRemovalOrderIds = React.useMemo(() => extractRemovalOrderIds(commandSearch), [commandSearch])
  const hasDetectedIds = detectedCaseIds.length > 0 || detectedShipmentIds.length > 0 || detectedRemovalOrderIds.length > 0
  const skuFallbackQuery = commandSearch.trim()
  const accountsEnabled = isFeatureEnabled(enabledFeatures, "accounts")
  const matchedStores = React.useMemo(() => {
    if (!accountsEnabled || !skuFallbackQuery) return []
    return stores.filter((store) => commandFilter(store.name, skuFallbackQuery) > 0)
  }, [accountsEnabled, skuFallbackQuery, stores])
  const showSkuFallback = React.useMemo(() => {
    if (!isFeatureEnabled(enabledFeatures, "search-skus")) return false
    if (hasDetectedIds) return false
    if (matchedStores.length > 0) return false
    if (skuFallbackQuery.length < 1 || skuFallbackQuery.length > 40 || /\s/u.test(skuFallbackQuery)) return false
    return !visibleGroups.some((group) =>
      group.commands.some((command) => commandFilter(command.label, skuFallbackQuery, command.keywords) > 0),
    )
  }, [
    enabledFeatures,
    hasDetectedIds,
    matchedStores.length,
    skuFallbackQuery,
    visibleGroups,
  ])

  // Reset while rendering the reopened palette, not when it closes: closing keeps the last
  // screen on show through the exit animation instead of swapping back to the command list.
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setMode(initialMode === "sign-in" || initialMode === "switching" || initialMode === "switch-done" ? initialMode : "commands")
      setCommandSearch("")
      setAccountSearch("")
      setIdentifierInput("")
      setPendingIds([])
      setRemovalSummary(null)
      setError(null)
      setSubmitting(false)
      setStatusMessage(null)
      setSelectedStore(null)
      setSignInPrompt({ command: "generate-reports", back: "commands" })
    }
  }

  React.useEffect(() => {
    if (!open) {
      sessionCheckRef.current += 1
      return
    }
    if (initialMode === "sign-in" || initialMode === "switching" || initialMode === "switch-done") setMode(initialMode)
  }, [initialMode, open])

  React.useEffect(() => {
    if (!open || !accountsEnabled) return
    let cancelled = false
    void onGetAccountsStatus()
      .then((status) => {
        if (cancelled) return
        setStores(status.stores)
        setActiveSwitch(status.activeSwitch)
        setCurrentStore(status.currentStore ?? null)
        setAccountsLoaded(true)
        setAccountsUnlocked(status.unlocked)
      })
      .catch(() => {
        // Prefetch is best-effort; Accounts mode still loads with its own error path.
      })
    return () => {
      cancelled = true
    }
  }, [accountsEnabled, onGetAccountsStatus, open])

  React.useEffect(() => {
    // The switch screens follow the switch themselves.
    if (!open || !accountsEnabled || !activeSwitch || mode === "switching" || mode === "switch-done") return
    let cancelled = false
    let timer: number
    const refresh = async () => {
      try {
        const status = await onGetAccountsStatus()
        if (cancelled) return
        setActiveSwitch(status.activeSwitch)
        setCurrentStore(status.currentStore ?? null)
        setAccountsUnlocked(status.unlocked)
        if (!status.activeSwitch) return
      } catch { /* retry while the palette remains open */ }
      if (!cancelled) timer = window.setTimeout(() => void refresh(), 1000)
    }
    timer = window.setTimeout(() => void refresh(), 1000)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [accountsEnabled, activeSwitch?.storeId, mode, onGetAccountsStatus, open])

  React.useEffect(() => {
    if (isIdentifierInputMode(mode)) identifierInputRef.current?.focus()
  }, [mode])

  const updateFadeMask = React.useCallback(() => {
    const input = identifierInputRef.current
    if (!input) return setFadeMask("none")
    setFadeMask(fadeMaskForScroll(input))
  }, [])

  React.useLayoutEffect(() => {
    if (isIdentifierInputMode(mode)) updateFadeMask()
  }, [identifierInput, mode, updateFadeMask])

  const runIdentifiers = React.useCallback(async (ids: string[], mode: IdentifierMode = identifierMode) => {
    const definition = inputModes[mode]
    setError(null)
    setSubmitting(true)
    try {
      if (await definition.submit(ids) === "stay") return setSubmitting(false)
      close()
    } catch (caught) {
      setError(errorMessage(caught, definition.failureError))
      setSubmitting(false)
    }
  }, [close, identifierMode, inputModes])

  /**
   * Resolves true when a command may run. When Seller Central is signed out it shows the
   * sign-in screen instead, which goes back to `back`. Leaves `submitting` set on true.
   */
  const confirmSignedIn = React.useCallback(async (command: SignInCommand, back: PaletteMode): Promise<boolean> => {
    const check = ++sessionCheckRef.current
    setError(null)
    setStatusMessage("Checking Seller Central…")
    setSubmitting(true)
    const session = await onCheckSession().catch((): SellerCentralSessionState => "unknown")
    if (check !== sessionCheckRef.current) return false
    setStatusMessage(null)
    if (session !== "signed-out") return true
    setSignInPrompt({ command, back })
    setMode("sign-in")
    setSubmitting(false)
    return false
  }, [onCheckSession])

  const submitIdBatch = React.useCallback((target: IdentifierMode, ids: string[]) => {
    if (submitting) return
    setIdentifierMode(target)
    if (ids.length === 0) return setError(inputModes[target].invalidError)
    if (ids.length > MAX_BULK_IDS) return setError(`Open no more than ${MAX_BULK_IDS} IDs at a time.`)
    void confirmSignedIn(target, mode).then((signedIn) => {
      if (!signedIn) return
      // Bulk removal opens a single tab, so it needs no confirmation.
      if (ids.length > CONFIRM_THRESHOLD && target !== "bulk-removal") {
        setSubmitting(false)
        setPendingIds(ids)
        setMode("confirm-ids")
        return
      }
      void runIdentifiers(ids, target)
    })
  }, [confirmSignedIn, inputModes, mode, runIdentifiers, submitting])

  const submitIdentifiers = React.useCallback(() => {
    submitIdBatch(identifierMode, currentIds)
  }, [currentIds, identifierMode, submitIdBatch])

  const openAccounts = React.useCallback(async () => {
    setError(null)
    setStatusMessage("Loading accounts…")
    setSubmitting(true)
    try {
      const status = await onGetAccountsStatus()
      setStores(status.stores)
      setActiveSwitch(status.activeSwitch)
      setCurrentStore(status.currentStore ?? null)
      setAccountsLoaded(true)
      setAccountsUnlocked(status.unlocked)
      setAccountSearch("")
      setMode("accounts")
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t load accounts. Please try again."))
    } finally {
      setSubmitting(false)
      setStatusMessage(null)
    }
  }, [onGetAccountsStatus])

  const chooseStore = React.useCallback(async (store: AccountStoreSummary) => {
    setError(null)
    setSubmitting(true)
    try {
      if (currentStore?.id === store.id) {
        await onFocusCurrentStore()
        close()
        return
      }
      if (!accountsUnlocked) {
        setSelectedStore(store)
        setMode("unlock")
        setSubmitting(false)
        return
      }
      await onStartAccountSwitch(store.id)
      // Seller Central can't be used until the switch finishes, so follow it here.
      setMode("switching")
      setSubmitting(false)
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t start the account switch."))
      setSubmitting(false)
    }
  }, [accountsUnlocked, close, currentStore, onFocusCurrentStore, onStartAccountSwitch])

  const unlockAndStart = React.useCallback(async () => {
    if (!selectedStore || submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await onUnlockAccounts(selectedStore.id)
      close()
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t unlock accounts."))
      setSubmitting(false)
    }
  }, [close, onUnlockAccounts, selectedStore, submitting])

  const manageAccounts = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try { await onManageAccounts(); close() }
    catch (caught) { setError(errorMessage(caught, "Couldn’t open account settings.")); setSubmitting(false) }
  }, [close, onManageAccounts])

  const openTimeOut = React.useCallback(async () => {
    setError(null)
    setStatusMessage("Opening Time Out…")
    setSubmitting(true)
    try {
      await onOpenTimeOut()
      close()
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t open Time Out. Please try again."))
      setSubmitting(false)
      setStatusMessage(null)
    }
  }, [close, onOpenTimeOut])

  const selectCommand = React.useCallback((commandId: string) => {
    if (commandId === "open-case-ids") {
      setIdentifierMode("case-ids")
      setMode("case-ids")
      return
    }
    if (commandId === "scrape-case") {
      // Case IDs are pasted in the window, which keeps the results and the download.
      void confirmSignedIn("scrape-case", "commands").then((signedIn) => {
        if (!signedIn) return
        return onOpenCases().then(close, (caught: unknown) => {
          setError(errorMessage(caught, "Couldn’t open the S4E Spotlight window."))
          setSubmitting(false)
        })
      })
      return
    }
    if (commandId === "open-shipment-ids") {
      setIdentifierMode("shipment-ids")
      setMode("shipment-ids")
      return
    }
    if (commandId === "search-skus") {
      setIdentifierMode("sku-ids")
      setMode("sku-ids")
      return
    }
    if (commandId === "bulk-removal") {
      setIdentifierMode("bulk-removal")
      setMode("bulk-removal")
      return
    }
    if (commandId === "generate-reports") {
      // The window can't do anything signed out, so ask here instead of opening it.
      void confirmSignedIn("generate-reports", "commands").then((signedIn) => {
        if (!signedIn) return
        return onOpenReports().then(close, (caught: unknown) => {
          setError(errorMessage(caught, "Couldn’t open the S4E Spotlight window."))
          setSubmitting(false)
        })
      })
      return
    }
    if (commandId === "time-out") {
      void openTimeOut()
      return
    }
    if (commandId === "accounts") void openAccounts()
  }, [close, confirmSignedIn, onOpenCases, onOpenReports, openAccounts, openTimeOut])

  const handleSwitchAction = React.useCallback(async (action: "focus" | "cancel") => {
    setError(null)
    setSubmitting(true)
    try {
      if (action === "focus") await onFocusAccountSwitch()
      else { await onCancelAccountSwitch(); setActiveSwitch(undefined) }
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t update the account switch."))
    } finally { setSubmitting(false) }
  }, [onCancelAccountSwitch, onFocusAccountSwitch])

  const goToRemoval = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onFocusBulkRemoval()
      close()
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t open the removal tab."))
      setSubmitting(false)
    }
  }, [close, onFocusBulkRemoval])

  const returnToCommands = React.useCallback(() => {
    setMode("commands")
    setError(null)
  }, [])

  const leaveSignIn = React.useCallback(() => {
    setMode(signInPrompt.back)
    setError(null)
  }, [signInPrompt.back])

  const openSellerCentral = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onOpenSellerCentral()
      close()
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t open Seller Central."))
      setSubmitting(false)
    }
  }, [close, onOpenSellerCentral])

  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    event.preventDefault()
    // A switch keeps running when hidden; stopping it midway would leave Seller Central signed out.
    if (mode === "switching" || mode === "switch-done") return onOpenChange(false)
    if (submitting) return
    setError(null)
    if (mode === "commands") {
      if (commandSearch) return setCommandSearch("")
      return onOpenChange(false)
    }
    if (isIdentifierInputMode(mode)) {
      if (identifierInput) return setIdentifierInput("")
      return setMode("commands")
    }
    if (mode === "confirm-ids") return setMode(confirmBackMode)
    if (mode === "removal-summary") return setMode("bulk-removal")
    if (mode === "sign-in") return leaveSignIn()
    if (mode === "unlock") {
      return setMode("accounts")
    }
    if (accountSearch) return setAccountSearch("")
    setMode("commands")
  }, [accountSearch, commandSearch, confirmBackMode, identifierInput, leaveSignIn, mode, onOpenChange, submitting])

  const signInTitle = signInPrompt.command === "generate-reports" ? "Generate reports"
    : signInPrompt.command === "scrape-case" ? "Scrape case"
    : inputModes[signInPrompt.command].title
  const screens: Record<Exclude<PaletteMode, IdentifierMode>, { title: string; description: string }> = {
    commands: { title: "Command Palette", description: "Search for a command to run." },
    accounts: { title: "Accounts", description: "Search stores or manage account switching." },
    unlock: {
      title: "Unlock accounts",
      description: `Unlock to switch to ${selectedStore?.name ?? "the selected store"}.`,
    },
    "confirm-ids": { title: "Confirm bulk open", description: `Open ${pendingIds.length} ${inputMode.noun} tabs.` },
    "removal-summary": { title: "Bulk removal", description: "What the removal included and skipped." },
    "sign-in": {
      title: signInTitle,
      description: `Sign in to a Seller Central store to use ${signInTitle}.`,
    },
    switching: { title: "Switch store", description: "Follow the store switch while it signs in." },
    "switch-done": { title: "Switch store", description: "The store switch finished." },
  }
  const { title, description } = isIdentifierInputMode(mode) ? inputMode : screens[mode]

  const depth = SCREEN_DEPTH[mode]

  const busy = submitting && statusMessage ? (
    <span aria-live="polite" className="inline-flex min-w-0 items-center gap-1.5">
      <Spinner aria-hidden="true" className="size-3.5" role="presentation" />
      <span className="truncate">{statusMessage}</span>
    </span>
  ) : null

  const primaryAction = (label: React.ReactNode, onClick: () => void, options: { autoFocus?: boolean; disabled?: boolean } = {}) => (
    <PrimaryButton
      autoFocus={options.autoFocus}
      disabled={submitting || options.disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </PrimaryButton>
  )

  const cancelAction = (onClick: () => void) => (
    <CancelButton disabled={submitting} onClick={onClick} type="button" />
  )

  return (
    <div className="palette-scope">
      <CommandDialog
        container={container}
        contentDepth={depth}
        contentKey={mode}
        description={description}
        open={open}
        onEscapeKeyDown={handleEscapeKeyDown}
        onOpenChange={onOpenChange}
        title={title}
      >
        {mode === "commands" ? <>
          <CommandsScreen
            accountsEnabled={accountsEnabled}
            accountsLoaded={accountsLoaded}
            busy={busy}
            chooseStore={chooseStore}
            commandSearch={commandSearch}
            currentStore={currentStore}
            detectedCaseIds={detectedCaseIds}
            detectedRemovalOrderIds={detectedRemovalOrderIds}
            detectedShipmentIds={detectedShipmentIds}
            error={error}
            hasDetectedIds={hasDetectedIds}
            matchedStores={matchedStores}
            onCommandSearchChange={(value) => { setCommandSearch(value); setError(null) }}
            selectCommand={selectCommand}
            showSkuFallback={showSkuFallback}
            skuFallbackQuery={skuFallbackQuery}
            submitIdBatch={submitIdBatch}
            submitting={submitting}
            visibleGroups={visibleGroups}
          />
        </> : mode === "accounts" ? <>
          <AccountsScreen
            accountSearch={accountSearch}
            activeSwitch={activeSwitch}
            busy={busy}
            chooseStore={chooseStore}
            currentStore={currentStore}
            error={error}
            handleSwitchAction={handleSwitchAction}
            manageAccounts={manageAccounts}
            onAccountSearchChange={(value) => { setAccountSearch(value); setError(null) }}
            returnToCommands={returnToCommands}
            stores={stores}
            submitting={submitting}
          />
        </> : mode === "unlock" ? <>
          <CommandHeader backDisabled={submitting} onBack={() => { setMode("accounts"); setError(null) }} parent="Switch store" title="Unlock" />
          <p className="m-0 px-4 py-5 text-sm text-muted-foreground">Unlock in the S4E Spotlight window, where no web page can read your master password. The switch to {selectedStore?.name} then continues on its own.</p>
          <ErrorAlert error={error} id="unlock-error" />
          <CommandFooter action end={primaryAction(submitting ? "Opening window…" : "Unlock accounts", () => void unlockAndStart(), { autoFocus: true })}>
            <CommandHint keys={["esc"]}>Back</CommandHint>
          </CommandFooter>
        </> : mode === "confirm-ids" ? <>
          <CommandHeader backDisabled={submitting} onBack={() => { setMode(confirmBackMode); setError(null) }} parent={inputMode.title} title="Confirm" />
          <Notice
            body="Opening this many tabs can slow the browser for a few seconds."
            heading={`Open ${pendingIds.length} ${inputMode.noun} tabs in the background?`}
            icon={identifierMode === "shipment-ids" ? Truck
              : identifierMode === "sku-ids" ? Package
              : identifierMode === "removal-order-ids" ? PackageMinus
              : FolderOpen}
          />
          <ErrorAlert error={error} />
          <CommandFooter action end={<>
            {cancelAction(() => setMode(confirmBackMode))}
            {primaryAction(
              submitting ? "Opening…" : `Open ${pendingIds.length} tabs`,
              () => void runIdentifiers(pendingIds),
              { autoFocus: true },
            )}
          </>} />
        </> : mode === "removal-summary" ? <>
          <CommandHeader backDisabled={submitting} onBack={() => { setMode("bulk-removal"); setError(null) }} parent="Bulk removal" title="Summary" />
          <RemovalSummary summary={removalSummary} />
          <ErrorAlert error={error} />
          <CommandFooter action end={removalSummary?.openedCount
            ? primaryAction(submitting ? "Opening…" : "Go to removal", () => void goToRemoval(), { autoFocus: true })
            : primaryAction("Edit SKUs", () => setMode("bulk-removal"), { autoFocus: true })}>
            <CommandHint keys={["esc"]}>Back</CommandHint>
          </CommandFooter>
        </> : mode === "switching" || mode === "switch-done" ? (
          <SwitchScreen
            doneStoreName={mode === "switch-done" ? switchedStoreName ?? currentStore?.name ?? "the selected store" : undefined}
            onCancel={onCancelAccountSwitch}
            onClose={close}
            onEnded={() => void openAccounts()}
            onGetAccountsStatus={onGetAccountsStatus}
            onShowSignIn={onFocusAccountSwitch}
          />
        ) : mode === "sign-in" ? <>
          <CommandHeader backDisabled={submitting} onBack={leaveSignIn} parent={signInTitle} title="Sign in" />
          <Notice
            body={accountsEnabled
              ? `${signInTitle} needs a signed-in store. Switch to one of your stores, or sign in on Seller Central, then try again.`
              : `${signInTitle} needs a signed-in store. Sign in on Seller Central, then try again.`}
            heading="Sign in to a Seller Central store"
            icon={LogIn}
            role="alert"
          />
          <ErrorAlert error={error} />
          <CommandFooter action end={accountsEnabled ? <>
            <Button
              className="mr-1 rounded-[0.5rem] bg-background px-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50"
              disabled={submitting}
              onClick={() => void openSellerCentral()}
              type="button"
              variant="ghost"
            >
              Open Seller Central
            </Button>
            {primaryAction(submitting ? "Loading…" : "Switch store", () => void openAccounts(), { autoFocus: true })}
          </> : primaryAction(submitting ? "Opening…" : "Open Seller Central", () => void openSellerCentral(), { autoFocus: true })}>
            <CommandHint keys={["esc"]}>Back</CommandHint>
          </CommandFooter>
        </> : <>
          <IdentifierScreen
            currentIds={currentIds}
            duplicateIds={duplicateIds}
            error={error}
            fadeMask={fadeMask}
            identifierInput={identifierInput}
            identifierInputRef={identifierInputRef}
            inputMode={inputMode}
            onIdentifierInputChange={(value) => { setIdentifierInput(value); setError(null) }}
            returnToCommands={returnToCommands}
            submitIdentifiers={submitIdentifiers}
            submitting={submitting}
            updateFadeMask={updateFadeMask}
          />
        </>}
      </CommandDialog>
    </div>
  )
}
