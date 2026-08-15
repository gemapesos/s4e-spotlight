import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Building2, ChevronLeft, Clock, FileSpreadsheet, FolderOpen, Package, Settings, Truck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { extractCaseIds } from "@/lib/caseIds"
import {
  applyReportProgressEvent,
  INITIAL_REPORT_PROGRESS,
  type ReportProgressEvent,
  type ReportProgressState,
} from "@/lib/reportProgress"
import { commandFilter } from "@/lib/searchScore"
import {
  DEFAULT_ENABLED_FEATURES,
  isFeatureEnabled,
  type EnabledFeatures,
} from "@/lib/settings"
import { extractShipmentIds } from "@/lib/shipmentIds"
import { extractSkuIds } from "@/lib/skuIds"
import { ReportProgressPanel } from "@/ReportProgressPanel"

export type PaletteMode = "commands" | "case-ids" | "shipment-ids" | "sku-ids" | "confirm-ids" | "accounts" | "unlock" | "report-login" | "generating-reports"
type IdentifierMode = "case-ids" | "shipment-ids" | "sku-ids"
type FadeMaskState = "none" | "top" | "bottom" | "both"

const CONFIRM_THRESHOLD = 10
const MAX_BULK_IDS = 50

interface InputModeDefinition {
  ariaLabel: string
  description: string
  extractIds: (input: string) => string[]
  invalidError: string
  noun: string
  placeholder: string
  submit: (ids: string[]) => Promise<void> | void
  title: string
  unit: string
}

function isIdentifierInputMode(mode: PaletteMode): mode is IdentifierMode {
  return mode === "case-ids" || mode === "shipment-ids" || mode === "sku-ids"
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

export const commandGroups: ReadonlyArray<{
  heading: string
  commands: ReadonlyArray<CommandDefinition>
}> = [
  {
    heading: "Open",
    commands: [
      { id: "open-case-ids", label: "Open Case ID/s", icon: FolderOpen, keywords: ["case", "cases", "ticket", "support"] },
      { id: "open-shipment-ids", label: "Open Shipment IDs", icon: Truck, keywords: ["shipment", "fba", "inbound", "transfer"] },
      { id: "search-skus", label: "Search SKU/s", icon: Package, keywords: ["sku", "skus", "asin", "msku", "listing", "product"] },
      { id: "time-out", label: "Time Out", icon: Clock, keywords: ["timeout", "time", "sheet", "form", "break"] },
    ],
  },
  {
    heading: "Reports",
    commands: [{ id: "generate-reports", label: "Generate Reports", icon: FileSpreadsheet, keywords: ["report", "xlsx", "export", "spreadsheet"] }],
  },
  {
    heading: "Configuration",
    commands: [{ id: "accounts", label: "Accounts", icon: Building2, keywords: ["account", "store", "stores", "switch", "login"] }],
  },
] as const

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
  ) => Promise<void> | void
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
  onOpenSkuIds = async () => undefined,
  onGetAccountsStatus = async () => ({ initialized: false, unlocked: false, stores: [] }),
  onUnlockAccounts = async () => undefined,
  onStartAccountSwitch = async () => undefined,
  onFocusCurrentStore = async () => undefined,
  onFocusAccountSwitch = async () => undefined,
  onCancelAccountSwitch = async () => undefined,
  onManageAccounts = async () => undefined,
  onPrepareReports = async () => ({ loggedInToStore: true }),
  onGenerateReports = async () => undefined,
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
  const [stores, setStores] = React.useState<AccountStoreSummary[]>([])
  const [activeSwitch, setActiveSwitch] = React.useState<ActiveSwitchSummary | undefined>()
  const [currentStore, setCurrentStore] = React.useState<AccountStoreSummary | null>(null)
  const [accountsLoaded, setAccountsLoaded] = React.useState(false)
  const [accountsUnlocked, setAccountsUnlocked] = React.useState(false)
  const [selectedStore, setSelectedStore] = React.useState<AccountStoreSummary | null>(null)
  const [masterPassword, setMasterPassword] = React.useState("")
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")
  const identifierInputRef = React.useRef<HTMLTextAreaElement>(null)
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])

  const inputModes = React.useMemo<Record<IdentifierMode, InputModeDefinition>>(() => ({
    "case-ids": {
      ariaLabel: "Case IDs",
      description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
      extractIds: extractCaseIds,
      invalidError: "Enter at least one 11-digit Case ID.",
      noun: "case",
      placeholder: "Paste Case IDs here…\n\nEnter to open · Shift+Enter for a new line",
      submit: onOpenCaseIds,
      title: "Open Case IDs",
      unit: "case ID",
    },
    "shipment-ids": {
      ariaLabel: "Shipment IDs",
      description: "Enter one or more Amazon Seller Central FBA Shipment IDs.",
      extractIds: extractShipmentIds,
      invalidError: "Enter at least one valid FBA Shipment ID.",
      noun: "shipment",
      placeholder: "Paste Shipment IDs here…\n\nEnter to open · Shift+Enter for a new line",
      submit: onOpenShipmentIds,
      title: "Open Shipment IDs",
      unit: "shipment ID",
    },
    "sku-ids": {
      ariaLabel: "SKUs",
      description: "Enter one or more Amazon Seller Central SKUs, one per line.",
      extractIds: extractSkuIds,
      invalidError: "Enter at least one SKU.",
      noun: "SKU",
      placeholder: "Paste SKUs here…\n\nEnter to open · Shift+Enter for a new line",
      submit: onOpenSkuIds,
      title: "Search SKUs",
      unit: "SKU",
    },
  }), [onOpenCaseIds, onOpenShipmentIds, onOpenSkuIds])
  const inputMode = inputModes[identifierMode]

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
  const detectedCaseIds = React.useMemo(() => extractCaseIds(commandSearch), [commandSearch])
  const detectedShipmentIds = React.useMemo(() => extractShipmentIds(commandSearch), [commandSearch])
  const skuFallbackQuery = commandSearch.trim()
  const showSkuFallback = React.useMemo(() => {
    if (!isFeatureEnabled(enabledFeatures, "search-skus")) return false
    if (detectedCaseIds.length > 0 || detectedShipmentIds.length > 0) return false
    if (skuFallbackQuery.length < 1 || skuFallbackQuery.length > 40 || /\s/u.test(skuFallbackQuery)) return false
    return !visibleGroups.some((group) =>
      group.commands.some((command) => commandFilter(command.label, skuFallbackQuery, command.keywords) > 0),
    )
  }, [detectedCaseIds.length, detectedShipmentIds.length, enabledFeatures, skuFallbackQuery, visibleGroups])

  React.useEffect(() => {
    if (open) {
      if (initialMode === "report-login") setMode("report-login")
      return
    }
    setMode("commands")
    setCommandSearch("")
    setAccountSearch("")
    setIdentifierInput("")
    setPendingIds([])
    setError(null)
    setSubmitting(false)
    setStatusMessage(null)
    setReportProgress(INITIAL_REPORT_PROGRESS)
    setSelectedStore(null)
    setMasterPassword("")
  }, [initialMode, open])

  React.useEffect(() => {
    if (isIdentifierInputMode(mode)) identifierInputRef.current?.focus()
  }, [mode])

  const updateFadeMask = React.useCallback(() => {
    const input = identifierInputRef.current
    if (!input) return setFadeMask("none")
    const threshold = 1
    const hasOverflow = input.scrollHeight - input.clientHeight > threshold
    const above = hasOverflow && input.scrollTop > threshold
    const below = hasOverflow && input.scrollTop + input.clientHeight < input.scrollHeight - threshold
    setFadeMask(above && below ? "both" : above ? "top" : below ? "bottom" : "none")
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

  const generateReports = React.useCallback(async () => {
    setError(null)
    setReportProgress({ ...INITIAL_REPORT_PROGRESS, prepare: "active" })
    setMode("generating-reports")
    setSubmitting(true)
    try {
      const prepared = await onPrepareReports()
      if (!prepared.loggedInToStore) {
        setSubmitting(false)
        if (prepared.openedPromptOnSellerCentral) {
          close()
          return
        }
        setMode("report-login")
        return
      }
      setReportProgress((current) => ({
        ...current,
        prepare: "complete",
        sources: {
          unfulfillable: { status: "active" },
          feedback: { status: "active" },
          stranded: { status: "active" },
        },
      }))
      await onGenerateReports(
        accountsLoaded ? (currentStore?.name ?? "") : undefined,
        (event) => setReportProgress((current) => applyReportProgressEvent(current, event)),
      )
      close()
    } catch (caught) {
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
      void generateReports()
      return
    }
    if (commandId === "time-out") {
      void openTimeOut()
      return
    }
    if (commandId === "accounts") void openAccounts()
  }, [generateReports, openAccounts, openTimeOut])

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
    setMode("commands")
    setError(null)
    setReportProgress(INITIAL_REPORT_PROGRESS)
  }, [])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen)
  }, [onOpenChange])

  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    event.preventDefault()
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
    if (mode === "confirm-ids") return setMode(identifierMode)
    if (mode === "report-login" || mode === "generating-reports") return setMode("commands")
    if (mode === "unlock") {
      if (masterPassword) return setMasterPassword("")
      return setMode("accounts")
    }
    if (accountSearch) return setAccountSearch("")
    setMode("commands")
  }, [accountSearch, commandSearch, identifierInput, identifierMode, masterPassword, mode, onOpenChange, submitting])

  const title = mode === "commands" ? "Command Palette" : mode === "accounts" ? "Accounts" : mode === "unlock" ? "Unlock Accounts" : mode === "confirm-ids" ? "Confirm Bulk Open" : mode === "report-login" || mode === "generating-reports" ? "Generate Reports" : inputMode.title
  const description = mode === "commands" ? "Search for a command to run." : mode === "accounts" ? "Search stores or manage account switching." : mode === "unlock" ? `Unlock to switch to ${selectedStore?.name ?? "the selected store"}.` : mode === "report-login" ? "Sign in to a Seller Central store to generate reports." : mode === "generating-reports" ? "Generating the Seller Central report." : inputMode.description

  const backButton = (label = "Back", action: () => void = returnToCommands) => (
    <div className="p-1 pb-0">
      <Button
        className="active:not-aria-[haspopup]:translate-y-0"
        disabled={submitting}
        onClick={action}
        onPointerDown={(event) => {
          if (event.button !== 0) return
          event.preventDefault()
          action()
        }}
        size="sm"
        type="button"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" />
        {label}
      </Button>
    </div>
  )

  const errorAlert = (id?: string) => error ? (
    <Alert className="mx-1 mb-1" id={id} variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null

  return (
    <div className="palette-scope">
      <CommandDialog
        container={container}
        contentKey={mode}
        description={description}
        open={open}
        onEscapeKeyDown={handleEscapeKeyDown}
        onOpenChange={handleOpenChange}
        title={title}
      >
        {mode === "commands" ? <>
          <CommandInput autoFocus aria-label="Search commands" disabled={submitting} onValueChange={(value) => { setCommandSearch(value); setError(null) }} placeholder="Type a command or search..." value={commandSearch} />
          {submitting && statusMessage ? <p aria-live="polite" className="px-2 py-1.5 text-sm text-muted-foreground">{statusMessage}</p> : null}
          <CommandList aria-label="Commands">
            {detectedCaseIds.length > 0 || detectedShipmentIds.length > 0 || showSkuFallback ? null : (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {detectedCaseIds.length > 0 || detectedShipmentIds.length > 0 ? (
              <>
                <CommandGroup forceMount heading="Detected">
                  {detectedCaseIds.length > 0 ? (
                    <CommandItem
                      disabled={submitting}
                      forceMount
                      keywords={detectedCaseIds}
                      onSelect={() => submitIdBatch("case-ids", detectedCaseIds)}
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
                      value={detectedIdentifierLabel("shipment", detectedShipmentIds)}
                    >
                      <Truck aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{detectedIdentifierLabel("shipment", detectedShipmentIds)}</span>
                    </CommandItem>
                  ) : null}
                </CommandGroup>
                <CommandSeparator alwaysRender />
              </>
            ) : null}
            {showSkuFallback ? (
              <CommandGroup forceMount heading="Search">
                <CommandItem
                  disabled={submitting}
                  forceMount
                  keywords={[skuFallbackQuery]}
                  onSelect={() => submitIdBatch("sku-ids", [skuFallbackQuery])}
                  value={`Search '${skuFallbackQuery}' as SKU`}
                >
                  <Package aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">Search '{skuFallbackQuery}' as SKU</span>
                </CommandItem>
              </CommandGroup>
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
                        value={command.label}
                        keywords={[...command.keywords]}
                        disabled={submitting}
                        onSelect={() => selectCommand(command.id)}
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
        </> : mode === "accounts" ? <>
          {backButton()}
          {activeSwitch ? (
            <Alert className="mx-1 my-1" role="status">
              <AlertTitle>Switching to {activeSwitch.storeName}</AlertTitle>
              <AlertDescription>Stage: {activeSwitch.stage}</AlertDescription>
              <div className="mt-2 flex gap-2">
                <Button disabled={submitting} onClick={() => void handleSwitchAction("focus")} size="xs" type="button" variant="outline">Go to login</Button>
                <Button disabled={submitting} onClick={() => void handleSwitchAction("cancel")} size="xs" type="button" variant="destructive">Cancel switch</Button>
              </div>
            </Alert>
          ) : null}
          <p
            aria-label={`Current store: ${currentStore?.name ?? "Unknown"}`}
            className="px-2 py-1.5 text-xs font-medium text-muted-foreground"
            role="status"
          >
            Current store: {currentStore?.name ?? "Unknown"}
          </p>
          <CommandInput autoFocus aria-label="Search accounts" disabled={submitting} onValueChange={(value) => { setAccountSearch(value); setError(null) }} placeholder="Search stores..." value={accountSearch} />
          <CommandList aria-label="Accounts">
            <CommandEmpty>No matching stores.</CommandEmpty>
            <CommandGroup heading="Stores">
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  data-checked={currentStore?.id === store.id || undefined}
                  disabled={submitting}
                  onSelect={() => void chooseStore(store)}
                  value={store.name}
                >
                  <Building2 aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{store.name}</span>
                </CommandItem>
              ))}
              {stores.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">No stores configured.</div> : null}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Configuration">
              <CommandItem value="Manage Accounts" disabled={submitting} onSelect={() => void manageAccounts()}>
                <Settings aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">Manage Accounts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          {errorAlert()}
        </> : mode === "unlock" ? <>
          {backButton("Accounts", () => { setMode("accounts"); setError(null) })}
          <form autoComplete="off" className="grid gap-4 px-2 pb-2" onSubmit={(event) => event.preventDefault()}>
            <p className="text-sm text-foreground">Unlock to switch to {selectedStore?.name}.</p>
            <div className="grid gap-2">
              <Label htmlFor="s4e-spotlight-vault-unlock">Master password</Label>
              <Input
                autoFocus
                aria-describedby={error ? "unlock-error" : undefined}
                aria-invalid={Boolean(error)}
                autoComplete="new-password"
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
            </div>
            <Button className="w-full" disabled={submitting} onClick={() => void unlockAndStart()} type="button">
              {submitting ? "Unlocking…" : "Unlock and switch"}
            </Button>
          </form>
          {errorAlert("unlock-error")}
        </> : mode === "confirm-ids" ? <>
          {backButton("Back", () => { setMode(identifierMode); setError(null) })}
          <Alert className="mx-1 mb-1" role="status">
            <AlertTitle>Open {pendingIds.length} {inputMode.noun} tabs in the background?</AlertTitle>
            <AlertDescription>This may briefly use significant browser resources.</AlertDescription>
          </Alert>
          <div className="flex gap-2 px-1 pb-1">
            <Button className="flex-1" disabled={submitting} onClick={() => setMode(identifierMode)} type="button" variant="outline">Cancel</Button>
            <Button autoFocus className="flex-1" disabled={submitting} onClick={() => void runIdentifiers(pendingIds)} type="button">
              {submitting ? "Opening…" : `Open ${pendingIds.length} tabs`}
            </Button>
          </div>
          {errorAlert()}
        </> : mode === "generating-reports" ? <>
          {error ? backButton() : null}
          <ReportProgressPanel failed={Boolean(error)} progress={reportProgress} submitting={submitting} />
          {errorAlert()}
        </> : mode === "report-login" ? <>
          {backButton()}
          <Alert className="mx-1 mb-1">
            <AlertTitle>Sign in to a Seller Central store</AlertTitle>
            <AlertDescription>Generate Reports needs an open Seller Central store. Sign in with Accounts, then try again.</AlertDescription>
          </Alert>
          <div className="flex gap-2 px-1 pb-1">
            <Button className="flex-1" disabled={submitting} onClick={returnToCommands} type="button" variant="outline">Cancel</Button>
            <Button autoFocus className="flex-1" disabled={submitting} onClick={() => void openAccounts()} type="button">
              {submitting ? "Loading…" : "Open Accounts"}
            </Button>
          </div>
          {errorAlert()}
        </> : <>
          {backButton()}
          <div className="p-1 pb-0">
            <InputGroup className="h-auto rounded-lg! border-input/30 bg-input/30 shadow-none!">
              <InputGroupTextarea
                ref={identifierInputRef}
                aria-describedby={error ? "identifier-input-error" : "identifier-input-count"}
                aria-invalid={Boolean(error)}
                aria-label={inputMode.ariaLabel}
                className="identifier-input no-scrollbar min-h-32"
                data-fade-mask={fadeMask}
                disabled={submitting}
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
            </InputGroup>
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <p id="identifier-input-count" aria-live="polite" className="m-0 text-xs text-muted-foreground">
              {currentIds.length} unique {inputMode.unit}{currentIds.length === 1 ? "" : "s"}
            </p>
            <Button disabled={submitting || currentIds.length === 0} onClick={submitIdentifiers} size="sm" type="button">
              {submitting ? "Opening…" : "Open"}
            </Button>
          </div>
          {errorAlert("identifier-input-error")}
        </>}
      </CommandDialog>
    </div>
  )
}
