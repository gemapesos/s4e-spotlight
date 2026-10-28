import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Building2,
  CircleAlert,
  Clock,
  FileJson,
  FileSpreadsheet,
  FolderOpen,
  LogIn,
  Package,
  PackageMinus,
  Settings,
  Truck,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { CancelButton, PrimaryButton } from "@/components/panel"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandHeader,
  CommandHint,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Spinner } from "@/components/ui/spinner"
import { extractCaseIds, findCaseIds } from "@/lib/caseIds"
import { fadeMaskForScroll, type FadeMaskState } from "@/lib/fadeMask"
import { commandFilter } from "@/lib/searchScore"
import type { SellerCentralSessionState } from "@/lib/sellerCentralSession"
import {
  DEFAULT_ENABLED_FEATURES,
  isFeatureEnabled,
  type EnabledFeatures,
} from "@/lib/settings"
import { extractRemovalOrderIds, findRemovalOrderIds } from "@/lib/removalOrderIds"
import { extractShipmentIds, findShipmentIds } from "@/lib/shipmentIds"
import { extractSkuIds, findSkuIds } from "@/lib/skuIds"
import { SWITCH_STAGE_LABELS, SwitchScreen } from "@/SwitchProgress"

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
type IdentifierMode = "case-ids" | "shipment-ids" | "sku-ids" | "bulk-removal" | "removal-order-ids"
/** Commands that open or read Seller Central pages, so they need a signed-in store. */
type SignInCommand = IdentifierMode | "generate-reports" | "scrape-case"

const CONFIRM_THRESHOLD = 10
const MAX_BULK_IDS = 50

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
const MAX_ID_CHIPS = 12

interface InputModeDefinition {
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

function identifierActionLabel(count: number, noun: string, verb = "Open"): string {
  if (count === 0) return verb
  return `${verb} ${count} ${noun}${count === 1 ? "" : "s"}`
}

function detectedIdentifierLabel(noun: string, ids: string[]): string {
  if (ids.length === 1) return `Open ${noun} ${ids[0]}`
  return `Open ${ids.length} ${noun} IDs`
}

export interface CommandDefinition {
  id: string
  label: string
  icon: LucideIcon
  keywords: readonly string[]
  /** Opens a page in a new tab instead of another palette screen. */
  external?: boolean
}

export interface AccountStoreSummary { id: string; name: string }
export interface ActiveSwitchSummary {
  storeId: string
  storeName: string
  stage: string
  startedAt: number
  /** False when a same-credential switch only opens the store. */
  signIn?: boolean
  /** The step a paused switch is waiting on. */
  resumeStage?: string
  attentionMessage?: string
}
export interface AccountsStatus {
  initialized: boolean
  unlocked: boolean
  stores: AccountStoreSummary[]
  activeSwitch?: ActiveSwitchSummary
  currentStore?: AccountStoreSummary | null
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

export interface BulkRemovalSummary {
  openedCount: number
  skipped: Array<{ sku: string; reason: string }>
  nextRemovalOrderId: string | null
  /** Amazon didn't report eligibility for some SKUs, so they were included unchecked. */
  eligibilityUnknown: boolean
}

export interface ReportsPrepareResult {
  loggedInToStore: boolean
  openedPromptOnSellerCentral?: boolean
  runId?: string
}

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
      setError(caught instanceof Error ? caught.message : definition.failureError)
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
      setError(caught instanceof Error ? caught.message : "Couldn’t load accounts. Please try again.")
    } finally {
      setSubmitting(false)
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
      setError(caught instanceof Error ? caught.message : "Couldn’t start the account switch.")
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
      setError(caught instanceof Error ? caught.message : "Couldn’t unlock accounts.")
      setSubmitting(false)
    }
  }, [close, onUnlockAccounts, selectedStore, submitting])

  const manageAccounts = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try { await onManageAccounts(); close() }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Couldn’t open account settings."); setSubmitting(false) }
  }, [close, onManageAccounts])

  const openTimeOut = React.useCallback(async () => {
    setError(null)
    setStatusMessage("Opening Time Out…")
    setSubmitting(true)
    try {
      await onOpenTimeOut()
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t open Time Out. Please try again.")
      setSubmitting(false)
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
          setError(caught instanceof Error ? caught.message : "Couldn’t open the S4E Spotlight window.")
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
          setError(caught instanceof Error ? caught.message : "Couldn’t open the S4E Spotlight window.")
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
      setError(caught instanceof Error ? caught.message : "Couldn’t update the account switch.")
    } finally { setSubmitting(false) }
  }, [onCancelAccountSwitch, onFocusAccountSwitch])

  const goToRemoval = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try {
      await onFocusBulkRemoval()
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t open the removal tab.")
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
      setError(caught instanceof Error ? caught.message : "Couldn’t open Seller Central.")
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

  const errorAlert = (id?: string) => error ? (
    <Alert className="mx-1.5 mb-1.5 w-auto" id={id} variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null

  const currentStoreLabel = `Current store: ${currentStore?.name ?? "Unknown"}`

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

  /** A question or notice with an icon tile, used by the confirmation screens. */
  const notice = (Icon: LucideIcon, heading: string, body: React.ReactNode, role: "alert" | "status" = "status") => (
    <div className="flex gap-3 px-4 py-5" role={role}>
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="m-0 text-base leading-6 font-medium">{heading}</p>
        <p className="m-0 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
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
          <CommandInput
            autoFocus
            aria-label="Search commands"
            disabled={submitting}
            onValueChange={(value) => { setCommandSearch(value); setError(null) }}
            placeholder="Type a command, ID or store…"
            value={commandSearch}
          />
          <CommandList aria-label="Commands">
            {hasDetectedIds || showSkuFallback || matchedStores.length > 0 ? null : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {hasDetectedIds ? (
              <>
                <CommandGroup forceMount heading="Detected">
                  {detectedCaseIds.length > 0 ? (
                    <CommandItem
                      disabled={submitting}
                      forceMount
                      keywords={detectedCaseIds}
                      onSelect={() => submitIdBatch("case-ids", detectedCaseIds)}
                      selectedHint="↵"
                      value={detectedIdentifierLabel("case", detectedCaseIds)}
                    >
                      <FolderOpen aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{detectedIdentifierLabel("case", detectedCaseIds)}</span>
                    </CommandItem>
                  ) : null}
                  {detectedShipmentIds.length > 0 ? (
                    <CommandItem
                      disabled={submitting}
                      forceMount
                      keywords={detectedShipmentIds}
                      onSelect={() => submitIdBatch("shipment-ids", detectedShipmentIds)}
                      selectedHint="↵"
                      value={detectedIdentifierLabel("shipment", detectedShipmentIds)}
                    >
                      <Truck aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{detectedIdentifierLabel("shipment", detectedShipmentIds)}</span>
                    </CommandItem>
                  ) : null}
                  {detectedRemovalOrderIds.length > 0 ? (
                    <CommandItem
                      disabled={submitting}
                      forceMount
                      keywords={detectedRemovalOrderIds}
                      onSelect={() => submitIdBatch("removal-order-ids", detectedRemovalOrderIds)}
                      selectedHint="↵"
                      value={detectedIdentifierLabel("removal order", detectedRemovalOrderIds)}
                    >
                      <PackageMinus aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{detectedIdentifierLabel("removal order", detectedRemovalOrderIds)}</span>
                    </CommandItem>
                  ) : null}
                </CommandGroup>
                <CommandSeparator alwaysRender />
              </>
            ) : null}
            {matchedStores.length > 0 ? (
              <>
                <CommandGroup forceMount heading="Stores">
                  {matchedStores.map((store) => (
                    <CommandItem
                      key={store.id}
                      data-checked={currentStore?.id === store.id || undefined}
                      disabled={submitting}
                      end={currentStore?.id === store.id ? <CurrentBadge /> : null}
                      forceMount
                      keywords={[store.name]}
                      onSelect={() => void chooseStore(store)}
                      selectedHint={currentStore?.id === store.id ? undefined : "↵"}
                      value={`Switch to ${store.name}`}
                    >
                      <Building2 aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{store.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator alwaysRender />
              </>
            ) : null}
            {showSkuFallback ? (
              <>
                <CommandGroup forceMount heading="Search">
                  <CommandItem
                    disabled={submitting}
                    forceMount
                    keywords={[skuFallbackQuery]}
                    onSelect={() => submitIdBatch("sku-ids", [skuFallbackQuery])}
                    selectedHint="↵"
                    value={`Search '${skuFallbackQuery}' as SKU`}
                  >
                    <Package aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">Search '{skuFallbackQuery}' as SKU</span>
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
            {visibleGroups.map((group, index) => (
              <React.Fragment key={group.heading}>
                {index ? <CommandSeparator /> : null}
                <CommandGroup heading={group.heading}>
                  {group.commands.map((command) => {
                    const Icon = command.icon
                    return (
                      <CommandItem
                        key={command.id}
                        disabled={submitting}
                        external={command.external}
                        keywords={[...command.keywords]}
                        onSelect={() => selectCommand(command.id)}
                        selectedHint={command.external ? undefined : "↵"}
                        value={command.label}
                      >
                        <Icon aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate">{command.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
          {errorAlert()}
          <CommandFooter
            end={<>
              <CommandHint keys={["↑", "↓"]}>Navigate</CommandHint>
              <CommandHint keys={["↵"]}>Select</CommandHint>
              <CommandHint keys={["esc"]}>{commandSearch ? "Clear" : "Close"}</CommandHint>
            </>}
          >
            {busy ?? (accountsEnabled && accountsLoaded && currentStore ? (
              <span aria-label={currentStoreLabel} className="inline-flex min-w-0 items-center gap-1.5" role="status">
                <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />
                <span className="truncate">{currentStore.name}</span>
              </span>
            ) : null)}
          </CommandFooter>
        </> : mode === "accounts" ? <>
          <CommandHeader backDisabled={submitting} divider={false} onBack={returnToCommands}>
            <CommandInput
              autoFocus
              aria-label="Search accounts"
              compact
              disabled={submitting}
              onValueChange={(value) => { setAccountSearch(value); setError(null) }}
              placeholder="Search stores…"
              value={accountSearch}
            />
          </CommandHeader>
          <p aria-label={currentStoreLabel} className="sr-only" role="status">{currentStoreLabel}</p>
          {activeSwitch ? (
            <div className="mx-1.5 mt-0.5 mb-1.5 flex items-center gap-2.5 rounded-[0.625rem] bg-muted py-2.5 pr-2.5 pl-3" role="status">
              <Spinner aria-hidden="true" className="text-foreground/70" role="presentation" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{activeSwitch.stage === "paused" ? "Needs attention" : `Switching to ${activeSwitch.storeName}`}</span>
                <span className="truncate text-xs leading-4 text-muted-foreground">{activeSwitch.attentionMessage ?? SWITCH_STAGE_LABELS[activeSwitch.stage] ?? activeSwitch.stage}</span>
              </div>
              <button
                className="h-7 shrink-0 rounded-[0.375rem] bg-background px-2.5 text-xs leading-4 font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleSwitchAction("focus")}
                type="button"
              >
                Show sign-in
              </button>
              <button
                className="h-7 shrink-0 rounded-[0.375rem] px-2.5 text-xs leading-4 font-medium text-destructive transition-colors hover:bg-background/60 disabled:opacity-50"
                disabled={submitting}
                onClick={() => void handleSwitchAction("cancel")}
                type="button"
              >
                Cancel
              </button>
            </div>
          ) : null}
          <CommandList aria-label="Accounts" className="pt-0">
            <CommandEmpty>No matching stores.</CommandEmpty>
            <CommandGroup heading="Stores">
              {stores.map((store) => {
                const current = currentStore?.id === store.id
                const switching = activeSwitch?.storeId === store.id
                return (
                  <CommandItem
                    key={store.id}
                    data-checked={current || undefined}
                    disabled={submitting}
                    end={current ? <CurrentBadge /> : switching ? <span className="text-xs leading-4 font-normal text-muted-foreground">Switching…</span> : null}
                    onSelect={() => void chooseStore(store)}
                    value={store.name}
                  >
                    <Building2 aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{store.name}</span>
                  </CommandItem>
                )
              })}
              {stores.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No stores configured.</div>
              ) : null}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem disabled={submitting} external onSelect={() => void manageAccounts()} value="Manage accounts">
                <Settings aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Manage accounts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          {errorAlert()}
          <CommandFooter
            end={<>
              <CommandHint keys={["↵"]}>Switch</CommandHint>
              <CommandHint keys={["esc"]}>{accountSearch ? "Clear" : "Back"}</CommandHint>
            </>}
          >
            {busy}
          </CommandFooter>
        </> : mode === "unlock" ? <>
          <CommandHeader backDisabled={submitting} onBack={() => { setMode("accounts"); setError(null) }} parent="Switch store" title="Unlock" />
          <p className="m-0 px-4 py-5 text-sm text-muted-foreground">Unlock in the S4E Spotlight window, where no web page can read your master password. The switch to {selectedStore?.name} then continues on its own.</p>
          {errorAlert("unlock-error")}
          <CommandFooter action end={primaryAction(submitting ? "Opening window…" : "Unlock accounts", () => void unlockAndStart(), { autoFocus: true })}>
            <CommandHint keys={["esc"]}>Back</CommandHint>
          </CommandFooter>
        </> : mode === "confirm-ids" ? <>
          <CommandHeader backDisabled={submitting} onBack={() => { setMode(confirmBackMode); setError(null) }} parent={inputMode.title} title="Confirm" />
          {notice(
            identifierMode === "shipment-ids" ? Truck
              : identifierMode === "sku-ids" ? Package
              : identifierMode === "removal-order-ids" ? PackageMinus
              : FolderOpen,
            `Open ${pendingIds.length} ${inputMode.noun} tabs in the background?`,
            "Opening this many tabs can slow the browser for a few seconds.",
          )}
          {errorAlert()}
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
          {errorAlert()}
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
          {notice(
            LogIn,
            "Sign in to a Seller Central store",
            accountsEnabled
              ? `${signInTitle} needs a signed-in store. Switch to one of your stores, or sign in on Seller Central, then try again.`
              : `${signInTitle} needs a signed-in store. Sign in on Seller Central, then try again.`,
            "alert",
          )}
          {errorAlert()}
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
          <CommandHeader backDisabled={submitting} onBack={returnToCommands} parent="Commands" title={inputMode.title} />
          <div className="flex flex-col gap-2.5 px-3 pt-3 pb-2">
            <label className="text-xs leading-4 font-medium text-muted-foreground" htmlFor="s4e-spotlight-identifier-input">
              {inputMode.label}
            </label>
            <textarea
              ref={identifierInputRef}
              aria-describedby={error ? "identifier-input-error" : "identifier-input-count"}
              aria-invalid={Boolean(error)}
              aria-label={inputMode.ariaLabel}
              className="identifier-input scroll-fade no-scrollbar h-32 w-full resize-none rounded-[0.625rem] border border-input bg-transparent px-3 py-2.5 font-mono text-[0.8125rem] leading-5 text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"
              data-fade-mask={fadeMask}
              disabled={submitting}
              id="s4e-spotlight-identifier-input"
              placeholder={inputMode.placeholder}
              value={identifierInput}
              onChange={(event) => { setIdentifierInput(event.target.value); setError(null) }}
              onScroll={updateFadeMask}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                if (event.shiftKey || event.nativeEvent.isComposing) {
                  event.stopPropagation()
                  return
                }
                event.preventDefault()
                event.stopPropagation()
                submitIdentifiers()
              }}
            />
            {currentIds.length > 0 ? (
              <ul aria-label={`Detected ${inputMode.unit}s`} className="m-0 flex list-none flex-wrap gap-1.5 p-0">
                {currentIds.slice(0, MAX_ID_CHIPS).map((id) => (
                  <li
                    key={id}
                    className="inline-flex h-[1.375rem] max-w-full animate-in items-center truncate rounded-full bg-muted px-2 font-mono text-xs leading-4 text-foreground/80 fade-in-0 zoom-in-90 duration-150 motion-reduce:animate-none"
                  >
                    {id}
                  </li>
                ))}
                {currentIds.length > MAX_ID_CHIPS ? (
                  <li className="inline-flex h-[1.375rem] items-center px-2 text-xs leading-4 text-muted-foreground">
                    +{currentIds.length - MAX_ID_CHIPS} more
                  </li>
                ) : null}
                {duplicateIds > 0 ? (
                  <li className="inline-flex h-[1.375rem] items-center px-2 text-xs leading-4 text-muted-foreground">
                    {duplicateIds} duplicate{duplicateIds === 1 ? "" : "s"} ignored
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
          {errorAlert("identifier-input-error")}
          <p aria-live="polite" className="sr-only" id="identifier-input-count">
            {currentIds.length} unique {inputMode.unit}{currentIds.length === 1 ? "" : "s"}
          </p>
          <CommandFooter
            action
            end={primaryAction(
              submitting ? inputMode.busyLabel ?? "Opening…" : identifierActionLabel(currentIds.length, inputMode.noun, inputMode.verb),
              submitIdentifiers,
              { disabled: currentIds.length === 0 },
            )}
          >
            <CommandHint keys={["⇧↵"]}>New line</CommandHint>
            <CommandHint keys={["esc"]}>Clear, then back</CommandHint>
          </CommandFooter>
        </>}
      </CommandDialog>
    </div>
  )
}

function RemovalSummary({ summary }: { summary: BulkRemovalSummary | null }) {
  if (!summary) return null
  const { openedCount, skipped, nextRemovalOrderId, eligibilityUnknown } = summary
  const Icon = openedCount ? PackageMinus : CircleAlert
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex gap-3" role={openedCount ? "status" : "alert"}>
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="m-0 text-base leading-6 font-medium">
            {openedCount ? `Opened a removal for ${openedCount} SKU${openedCount === 1 ? "" : "s"}` : "No SKUs can be removed"}
          </p>
          <p className="m-0 text-sm text-muted-foreground">
            {openedCount
              ? "Choose the method, address and quantities on Amazon’s Create removal order page, then review it."
              : "Nothing was opened."}
            {eligibilityUnknown ? " Amazon didn’t confirm eligibility for every SKU; its form checks them again." : null}
          </p>
        </div>
      </div>
      {nextRemovalOrderId ? (
        <div className="flex items-center justify-between gap-3 rounded-[0.625rem] bg-muted px-3 py-2">
          <span className="text-xs leading-4 text-muted-foreground">Next removal order ID</span>
          <span className="font-mono text-sm font-medium select-all">{nextRemovalOrderId}</span>
        </div>
      ) : null}
      {skipped.length ? (
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-xs leading-4 font-medium text-muted-foreground">Skipped {skipped.length} SKU{skipped.length === 1 ? "" : "s"}</p>
          <ul aria-label="Skipped SKUs" className="no-scrollbar m-0 flex max-h-36 list-none flex-col gap-1 overflow-y-auto p-0">
            {skipped.map(({ sku, reason }) => (
              <li key={sku} className="flex min-w-0 gap-2 text-sm">
                <span className="shrink-0 font-mono text-foreground/80">{sku}</span>
                <span className="min-w-0 truncate text-muted-foreground" title={reason}>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function CurrentBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded-full px-2 text-xs leading-4 font-medium text-foreground/70 ring-1 ring-border ring-inset">
      Current
    </span>
  )
}
