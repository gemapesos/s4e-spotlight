import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Bug,
  Building2,
  CircleAlert,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Package,
  PackageMinus,
  Settings,
  Truck,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  CommandCheckbox,
  CommandDialog,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandHeader,
  CommandHint,
  CommandInput,
  CommandKbd,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { extractCaseIds, findCaseIds } from "@/lib/caseIds"
import {
  applyReportProgressEvent,
  INITIAL_REPORT_PROGRESS,
  REPORT_PROGRESS_ROWS,
  REPORT_SOURCES,
  type ReportProgressEvent,
  type ReportProgressState,
  type ReportSource,
} from "@/lib/reportProgress"
import { fadeMaskForScroll, type FadeMaskState } from "@/lib/fadeMask"
import { downloadGeneratedReport } from "@/lib/reportDownload"
import { reportWarnings, type GeneratedReport, type ReportDownloadFormat } from "@/lib/reports"
import { commandFilter } from "@/lib/searchScore"
import { cn } from "@/lib/utils"
import {
  DEFAULT_ENABLED_FEATURES,
  isFeatureEnabled,
  type EnabledFeatures,
} from "@/lib/settings"
import { extractRemovalOrderIds, findRemovalOrderIds } from "@/lib/removalOrderIds"
import { extractShipmentIds, findShipmentIds } from "@/lib/shipmentIds"
import { extractSkuIds, findSkuIds } from "@/lib/skuIds"
import { ReportProgressPanel } from "@/ReportProgressPanel"

export type PaletteMode =
  | "commands"
  | "case-ids"
  | "shipment-ids"
  | "sku-ids"
  | "confirm-ids"
  | "accounts"
  | "unlock"
  | "report-login"
  | "report-options"
  | "generating-reports"
/** Removal orders have no screen of their own; they're only opened from the Detected row. */
type IdentifierMode = "case-ids" | "shipment-ids" | "sku-ids" | "removal-order-ids"

const CONFIRM_THRESHOLD = 10
const MAX_BULK_IDS = 50
/** A click this soon after a pointer press on the same button belongs to that press. */
const POINTER_CLICK_WINDOW_MS = 1_000
/** The modifier for "do the main action" shortcuts, as this platform writes it. */
const MOD_KEY = typeof navigator !== "undefined" && /Mac|iPhone|iPad/u.test(navigator.platform) ? "⌘" : "Ctrl"

/** How deep each screen sits, so going back slides the other way. */
const SCREEN_DEPTH: Record<PaletteMode, number> = {
  commands: 0,
  "case-ids": 1,
  "shipment-ids": 1,
  "sku-ids": 1,
  accounts: 1,
  "report-options": 1,
  "report-login": 1,
  "confirm-ids": 2,
  unlock: 2,
  "generating-reports": 2,
}
/** Detected IDs shown as chips under the input; the rest are counted. */
const MAX_ID_CHIPS = 12

interface InputModeDefinition {
  ariaLabel: string
  description: string
  extractIds: (input: string) => string[]
  /** Every ID in the input, repeats included, to count what was ignored. */
  findIds: (input: string) => string[]
  invalidError: string
  /** The instruction above the input. */
  label: string
  noun: string
  placeholder: string
  submit: (ids: string[]) => Promise<void> | void
  title: string
  unit: string
}

function isIdentifierInputMode(mode: PaletteMode): mode is Extract<IdentifierMode, PaletteMode> {
  return mode === "case-ids" || mode === "shipment-ids" || mode === "sku-ids"
}

function openIdsLabel(count: number, noun: string): string {
  if (count === 0) return "Open"
  return `Open ${count} ${noun}${count === 1 ? "" : "s"}`
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
export interface ActiveSwitchSummary { storeId: string; storeName: string; stage: string; startedAt: number }
export interface AccountsStatus {
  initialized: boolean
  unlocked: boolean
  stores: AccountStoreSummary[]
  activeSwitch?: ActiveSwitchSummary
  currentStore?: AccountStoreSummary | null
}

/** What an account switch is doing, in the user's terms. */
const SWITCH_STAGE_LABELS: Record<string, string> = {
  logout: "Signing out of the current account…",
  signin: "Opening Amazon sign-in…",
  email: "Entering the account email…",
  password: "Entering the password…",
  otp: "Entering the verification code…",
  paused: "Waiting for you to complete the CAPTCHA.",
  authenticated: "Opening the store…",
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
      { id: "open-shipment-ids", label: "Open shipment IDs", icon: Truck, keywords: ["shipment", "shipments", "fba", "inbound", "transfer"] },
      { id: "search-skus", label: "Search SKUs", icon: Package, keywords: ["sku", "skus", "asin", "msku", "listing", "product"] },
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

function ReportDownloadButton({
  children,
  disabled,
  label,
  onDownload,
  size = "default",
  title,
  variant = "default",
}: {
  children: React.ReactNode
  disabled: boolean
  /** The accessible name of an icon-only button. */
  label?: string
  onDownload: () => void
  size?: "default" | "icon"
  title?: string
  variant?: "default" | "ghost"
}) {
  /** When a pointer press started a download; its own click arrives 50–150 ms later. */
  const pointerDownloadAt = React.useRef(Number.NEGATIVE_INFINITY)

  return (
    <Button
      aria-label={label}
      className={cn(
        "active:not-aria-[haspopup]:translate-y-0",
        size === "default" ? "gap-2 rounded-[0.5rem] px-3" : "rounded-[0.5rem] text-foreground/80",
      )}
      disabled={disabled}
      onClick={(event) => {
        // Keyboard clicks have detail 0; a pointer click right after the press is the same press.
        if (event.detail > 0 && performance.now() - pointerDownloadAt.current < POINTER_CLICK_WINDOW_MS) return
        onDownload()
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || disabled) return
        event.preventDefault()
        pointerDownloadAt.current = performance.now()
        onDownload()
      }}
      size={size}
      title={title}
      type="button"
      variant={variant}
    >
      {children}
    </Button>
  )
}

export interface ReportsPrepareResult {
  loggedInToStore: boolean
  openedPromptOnSellerCentral?: boolean
}

export interface CommandPaletteProps {
  container: ShadowRoot | HTMLElement
  open: boolean
  initialMode?: PaletteMode
  onOpenCaseIds: (caseIds: string[]) => Promise<void> | void
  onOpenShipmentIds: (shipmentIds: string[]) => Promise<void> | void
  onOpenRemovalOrderIds?: (removalOrderIds: string[]) => Promise<void> | void
  onOpenSkuIds?: (skuIds: string[]) => Promise<void> | void
  onGetAccountsStatus?: () => Promise<AccountsStatus>
  onUnlockAccounts?: (masterPassword: string) => Promise<void>
  onStartAccountSwitch?: (storeId: string) => Promise<void>
  onFocusCurrentStore?: () => Promise<void>
  onFocusAccountSwitch?: () => Promise<void>
  onCancelAccountSwitch?: () => Promise<void>
  onManageAccounts?: () => Promise<void>
  onPrepareReports?: () => Promise<ReportsPrepareResult>
  onGenerateReports?: (
    currentStoreName?: string,
    onProgress?: (event: ReportProgressEvent) => void,
    sections?: readonly ReportSource[],
  ) => Promise<GeneratedReport | void> | GeneratedReport | void
  onDownloadReport?: (report: GeneratedReport, format: ReportDownloadFormat) => void
  onOpenTimeOut?: () => Promise<void> | void
  onOpenChange: (open: boolean) => void
  enabledFeatures?: EnabledFeatures
}

export function CommandPalette({
  container,
  open,
  initialMode,
  onOpenCaseIds,
  onOpenShipmentIds,
  onOpenRemovalOrderIds = async () => undefined,
  onOpenSkuIds = async () => undefined,
  onGetAccountsStatus = defaultGetAccountsStatus,
  onUnlockAccounts = async () => undefined,
  onStartAccountSwitch = async () => undefined,
  onFocusCurrentStore = async () => undefined,
  onFocusAccountSwitch = async () => undefined,
  onCancelAccountSwitch = async () => undefined,
  onManageAccounts = async () => undefined,
  onPrepareReports = async () => ({ loggedInToStore: true }),
  onGenerateReports = async () => undefined,
  onDownloadReport = downloadGeneratedReport,
  onOpenTimeOut = async () => undefined,
  onOpenChange,
  enabledFeatures = DEFAULT_ENABLED_FEATURES,
}: CommandPaletteProps) {
  const [mode, setMode] = React.useState<PaletteMode>(
    open && initialMode && initialMode !== "commands" ? initialMode : "commands",
  )
  const [identifierMode, setIdentifierMode] = React.useState<IdentifierMode>("case-ids")
  const [commandSearch, setCommandSearch] = React.useState("")
  const [accountSearch, setAccountSearch] = React.useState("")
  const [identifierInput, setIdentifierInput] = React.useState("")
  const [pendingIds, setPendingIds] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [reportProgress, setReportProgress] = React.useState<ReportProgressState>(INITIAL_REPORT_PROGRESS)
  const [reportSections, setReportSections] = React.useState<readonly ReportSource[]>(REPORT_SOURCES)
  const [generatedReport, setGeneratedReport] = React.useState<GeneratedReport | null>(null)
  const [stores, setStores] = React.useState<AccountStoreSummary[]>([])
  const [activeSwitch, setActiveSwitch] = React.useState<ActiveSwitchSummary | undefined>()
  const [currentStore, setCurrentStore] = React.useState<AccountStoreSummary | null>(null)
  const [accountsLoaded, setAccountsLoaded] = React.useState(false)
  const [accountsUnlocked, setAccountsUnlocked] = React.useState(false)
  const [selectedStore, setSelectedStore] = React.useState<AccountStoreSummary | null>(null)
  const [masterPassword, setMasterPassword] = React.useState("")
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")
  const identifierInputRef = React.useRef<HTMLTextAreaElement>(null)
  /** Bumped whenever a report run is abandoned, so its late results can't overwrite a newer run. */
  const reportRunRef = React.useRef(0)
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const inputModes = React.useMemo<Record<IdentifierMode, InputModeDefinition>>(() => ({
    "case-ids": {
      ariaLabel: "Case IDs",
      description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
      extractIds: extractCaseIds,
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
      findIds: findSkuIds,
      invalidError: "Enter at least one SKU.",
      label: "Paste one or more SKUs, one per line",
      noun: "SKU",
      placeholder: "Paste SKUs, one per line…",
      submit: onOpenSkuIds,
      title: "Search SKUs",
      unit: "SKU",
    },
  }), [onOpenCaseIds, onOpenRemovalOrderIds, onOpenShipmentIds, onOpenSkuIds])
  const inputMode = inputModes[identifierMode]
  const confirmBackMode: PaletteMode = identifierMode === "removal-order-ids" ? "commands" : identifierMode
  const warnings = React.useMemo(() => (generatedReport ? reportWarnings(generatedReport) : []), [generatedReport])

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

  React.useEffect(() => {
    if (open) {
      if (initialMode === "report-login") setMode("report-login")
      return
    }
    reportRunRef.current += 1
    setMode("commands")
    setCommandSearch("")
    setAccountSearch("")
    setIdentifierInput("")
    setPendingIds([])
    setError(null)
    setSubmitting(false)
    setStatusMessage(null)
    setReportProgress(INITIAL_REPORT_PROGRESS)
    setReportSections(REPORT_SOURCES)
    setGeneratedReport(null)
    setSelectedStore(null)
    setMasterPassword("")
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
      await definition.submit(ids)
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Couldn’t open ${definition.noun} tabs. Please try again.`)
      setSubmitting(false)
    }
  }, [close, identifierMode, inputModes])

  const submitIdBatch = React.useCallback((mode: IdentifierMode, ids: string[]) => {
    if (submitting) return
    setIdentifierMode(mode)
    if (ids.length === 0) return setError(inputModes[mode].invalidError)
    if (ids.length > MAX_BULK_IDS) return setError(`Open no more than ${MAX_BULK_IDS} IDs at a time.`)
    if (ids.length > CONFIRM_THRESHOLD) {
      setPendingIds(ids)
      setError(null)
      setMode("confirm-ids")
      return
    }
    void runIdentifiers(ids, mode)
  }, [inputModes, runIdentifiers, submitting])

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
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t start the account switch.")
      setSubmitting(false)
    }
  }, [accountsUnlocked, close, currentStore, onFocusCurrentStore, onStartAccountSwitch])

  const unlockAndStart = React.useCallback(async () => {
    if (!selectedStore || submitting) return
    if (!masterPassword) return setError("Enter your master password.")
    setError(null)
    setSubmitting(true)
    try {
      await onUnlockAccounts(masterPassword)
      await onStartAccountSwitch(selectedStore.id)
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t unlock accounts.")
      setSubmitting(false)
    }
  }, [close, masterPassword, onStartAccountSwitch, onUnlockAccounts, selectedStore, submitting])

  const manageAccounts = React.useCallback(async () => {
    setError(null)
    setSubmitting(true)
    try { await onManageAccounts(); close() }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Couldn’t open account settings."); setSubmitting(false) }
  }, [close, onManageAccounts])

  const toggleReportSection = React.useCallback((source: ReportSource) => {
    setReportSections((current) => current.includes(source)
      ? current.filter((id) => id !== source)
      : REPORT_SOURCES.filter((id) => id === source || current.includes(id)))
  }, [])

  const generateReports = React.useCallback(async (sections: readonly ReportSource[]) => {
    if (sections.length === 0) return
    const run = ++reportRunRef.current
    const isCurrentRun = () => run === reportRunRef.current
    setError(null)
    setGeneratedReport(null)
    setReportProgress({ ...INITIAL_REPORT_PROGRESS, prepare: "active", sections })
    setMode("generating-reports")
    setSubmitting(true)
    try {
      const prepared = await onPrepareReports()
      if (!isCurrentRun()) return
      if (!prepared.loggedInToStore) {
        setSubmitting(false)
        if (prepared.openedPromptOnSellerCentral) {
          close()
          return
        }
        setMode("report-login")
        return
      }
      setReportProgress((current) => {
        const sources = { ...current.sources }
        for (const source of sections) sources[source] = { status: "active" }
        return { ...current, prepare: "complete", sources }
      })
      const report = await onGenerateReports(
        accountsLoaded ? (currentStore?.name ?? "") : undefined,
        (event) => {
          if (!isCurrentRun() || !sections.includes(event.source)) return
          setReportProgress((current) => applyReportProgressEvent(current, event))
        },
        sections,
      )
      if (!isCurrentRun()) return
      if (report) setGeneratedReport(report)
      setReportProgress((current) => ({ ...current, workbook: "complete" }))
      setSubmitting(false)
    } catch (caught) {
      if (!isCurrentRun()) return
      setError(caught instanceof Error ? caught.message : "Couldn’t generate the report. Please try again.")
      setSubmitting(false)
    }
  }, [accountsLoaded, close, currentStore, onGenerateReports, onPrepareReports])

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
    if (commandId === "generate-reports") {
      setReportSections(REPORT_SOURCES)
      setError(null)
      setMode("report-options")
      return
    }
    if (commandId === "time-out") {
      void openTimeOut()
      return
    }
    if (commandId === "accounts") void openAccounts()
  }, [openAccounts, openTimeOut])

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

  const returnToCommands = React.useCallback(() => {
    reportRunRef.current += 1
    setMode("commands")
    setError(null)
    setGeneratedReport(null)
    setReportProgress(INITIAL_REPORT_PROGRESS)
  }, [])

  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    event.preventDefault()
    // Escape stops a running report; the run counter drops its late results.
    if (mode === "generating-reports") {
      setSubmitting(false)
      return returnToCommands()
    }
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
    if (mode === "report-options") return returnToCommands()
    if (mode === "report-login") return setMode("commands")
    if (mode === "unlock") {
      if (masterPassword) return setMasterPassword("")
      return setMode("accounts")
    }
    if (accountSearch) return setAccountSearch("")
    setMode("commands")
  }, [accountSearch, commandSearch, confirmBackMode, identifierInput, masterPassword, mode, onOpenChange, returnToCommands, submitting])

  const screens: Record<Exclude<PaletteMode, IdentifierMode>, { title: string; description: string }> = {
    commands: { title: "Command Palette", description: "Search for a command to run." },
    accounts: { title: "Accounts", description: "Search stores or manage account switching." },
    unlock: {
      title: "Unlock accounts",
      description: `Unlock to switch to ${selectedStore?.name ?? "the selected store"}.`,
    },
    "confirm-ids": { title: "Confirm bulk open", description: `Open ${pendingIds.length} ${inputMode.noun} tabs.` },
    "report-login": {
      title: "Generate reports",
      description: "Sign in to a Seller Central store to generate reports.",
    },
    "report-options": {
      title: "Generate reports",
      description: "Choose what to include in the report.",
    },
    "generating-reports": {
      title: "Generate reports",
      description: generatedReport ? "Download the report." : "Generating the Seller Central report.",
    },
  }
  const { title, description } = isIdentifierInputMode(mode) ? inputMode : screens[mode]

  const depth = SCREEN_DEPTH[mode]
  const reportsDone = reportProgress.sections.filter((source) => reportProgress.sources[source].status === "complete").length
  const reportsTotal = reportProgress.sections.length

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

  const primaryAction = (label: React.ReactNode, onClick: () => void, options: { autoFocus?: boolean; disabled?: boolean; keys?: string } = {}) => (
    <Button
      autoFocus={options.autoFocus}
      className="gap-2 rounded-[0.5rem] pr-1.5 pl-3"
      disabled={submitting || options.disabled}
      onClick={onClick}
      type="button"
    >
      {label}
      <CommandKbd aria-hidden="true" inverted>{options.keys ?? "↵"}</CommandKbd>
    </Button>
  )

  const cancelAction = (onClick: () => void) => (
    <Button
      className="mr-1 gap-2 rounded-[0.5rem] bg-background pr-1.5 pl-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50"
      disabled={submitting}
      onClick={onClick}
      type="button"
      variant="ghost"
    >
      Cancel
      <CommandKbd aria-hidden="true" muted>esc</CommandKbd>
    </Button>
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (mode !== "report-options" || event.nativeEvent.isComposing) return
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void generateReports(reportSections)
      return
    }
    if (event.key === " " && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault()
      event.currentTarget.querySelector<HTMLElement>("[cmdk-item][data-selected=true]")?.click()
    }
  }

  return (
    <div className="palette-scope">
      <CommandDialog
        container={container}
        contentDepth={depth}
        contentKey={mode}
        description={description}
        open={open}
        onEscapeKeyDown={handleEscapeKeyDown}
        onKeyDown={handleKeyDown}
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
                <span className="truncate font-medium">Switching to {activeSwitch.storeName}</span>
                <span className="truncate text-xs leading-4 text-muted-foreground">{SWITCH_STAGE_LABELS[activeSwitch.stage] ?? activeSwitch.stage}</span>
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
          <form autoComplete="off" className="flex flex-col gap-2.5 px-3 pt-3 pb-3" onSubmit={(event) => event.preventDefault()}>
            <Label className="text-xs leading-4 font-medium text-muted-foreground" htmlFor="s4e-spotlight-vault-unlock">
              Master password
            </Label>
            <Input
              autoFocus
              aria-describedby={error ? "unlock-error" : undefined}
              aria-invalid={Boolean(error)}
              autoComplete="new-password"
              className="h-10 rounded-[0.625rem] px-3"
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              disabled={submitting}
              id="s4e-spotlight-vault-unlock"
              name="s4e-spotlight-vault-unlock"
              type="password"
              value={masterPassword}
              onChange={(event) => { setMasterPassword(event.target.value); setError(null) }}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void unlockAndStart() } }}
            />
            <p className="m-0 text-xs leading-4 text-muted-foreground">Unlock to switch to {selectedStore?.name}.</p>
          </form>
          {errorAlert("unlock-error")}
          <CommandFooter action end={primaryAction(submitting ? "Unlocking…" : "Unlock and switch", () => void unlockAndStart())}>
            <CommandHint keys={["esc"]}>{masterPassword ? "Clear" : "Back"}</CommandHint>
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
            {primaryAction(submitting ? "Opening…" : `Open ${pendingIds.length} tabs`, () => void runIdentifiers(pendingIds), { autoFocus: true })}
          </>} />
        </> : mode === "report-options" ? <>
          <CommandHeader
            aside={accountsLoaded ? <span aria-label={currentStoreLabel} role="status">{currentStore?.name ?? "No store open"}</span> : null}
            backDisabled={submitting}
            onBack={returnToCommands}
            parent="Commands"
            title="Generate reports"
          />
          <CommandList aria-label="Report sections" aria-multiselectable="true">
            <CommandGroup heading="Include">
              {REPORT_PROGRESS_ROWS.map((row) => {
                const included = reportSections.includes(row.id)
                return (
                  <CommandItem
                    key={row.id}
                    aria-checked={included}
                    className="gap-2.5"
                    data-checked={included || undefined}
                    onSelect={() => toggleReportSection(row.id)}
                    selectedHint="space"
                    value={row.label}
                  >
                    <CommandCheckbox />
                    <span className={cn("min-w-0 flex-1 truncate", !included && "text-muted-foreground")}>{row.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
          {errorAlert()}
          <CommandFooter
            action
            end={primaryAction("Generate report", () => void generateReports(reportSections), {
              disabled: reportSections.length === 0,
              keys: `${MOD_KEY}↵`,
            })}
          >
            <span className="tabular-nums">{reportSections.length} of {REPORT_SOURCES.length} sections</span>
            <CommandHint keys={["esc"]}>Back</CommandHint>
          </CommandFooter>
        </> : mode === "generating-reports" ? <>
          <CommandHeader
            aside={<span className="tabular-nums">{reportsDone} of {reportsTotal}</span>}
            backDisabled={submitting}
            divider={
              <div
                aria-label="Report progress"
                aria-valuemax={reportsTotal}
                aria-valuemin={0}
                aria-valuenow={reportsDone}
                className="h-0.5 shrink-0 bg-muted"
                role="progressbar"
              >
                <div
                  className="h-full bg-primary transition-[width] duration-400 ease-out-expo motion-reduce:transition-none"
                  style={{ width: `${reportsTotal ? (100 * reportsDone) / reportsTotal : 0}%` }}
                />
              </div>
            }
            onBack={returnToCommands}
            parent="Generate reports"
            title={generatedReport && !error ? "Report ready" : "Generating"}
          />
          <ReportProgressPanel
            failed={Boolean(error)}
            progress={reportProgress}
            submitting={submitting}
            warnings={warnings}
          />
          {errorAlert()}
          <CommandFooter action end={<>
            <ReportDownloadButton
              disabled={!generatedReport || Boolean(error)}
              label="Download raw workbook"
              onDownload={() => { if (generatedReport) onDownloadReport(generatedReport, "raw") }}
              size="icon"
              title="Download raw workbook (debug)"
              variant="ghost"
            >
              <FileText aria-hidden="true" />
            </ReportDownloadButton>
            <ReportDownloadButton
              disabled={!generatedReport || Boolean(error)}
              onDownload={() => { if (generatedReport) onDownloadReport(generatedReport, "sheets") }}
            >
              <Download aria-hidden="true" />
              Download
            </ReportDownloadButton>
          </>}>
            <CommandHint keys={["esc"]}>{submitting ? "Stop and go back" : "Back"}</CommandHint>
          </CommandFooter>
        </> : mode === "report-login" ? <>
          <CommandHeader backDisabled={submitting} onBack={returnToCommands} parent="Commands" title="Generate reports" />
          {notice(
            Building2,
            "Sign in to a Seller Central store",
            "Generate reports needs an open Seller Central store. Sign in with Switch store, then try again.",
            "alert",
          )}
          {errorAlert()}
          <CommandFooter action end={<>
            {cancelAction(returnToCommands)}
            {primaryAction(submitting ? "Loading…" : "Switch store", () => void openAccounts(), { autoFocus: true })}
          </>} />
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
              submitting ? "Opening…" : openIdsLabel(currentIds.length, inputMode.noun),
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

function CurrentBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded-full px-2 text-xs leading-4 font-medium text-foreground/70 ring-1 ring-border ring-inset">
      Current
    </span>
  )
}
