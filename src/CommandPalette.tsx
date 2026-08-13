import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Building2, ChevronLeft, FolderOpen, Package, Settings, Truck } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { extractCaseIds } from "@/lib/caseIds"
import { commandFilter } from "@/lib/searchScore"
import { extractShipmentIds } from "@/lib/shipmentIds"
import { extractSkuIds } from "@/lib/skuIds"

type PaletteMode = "commands" | "case-ids" | "shipment-ids" | "sku-ids" | "confirm-ids" | "accounts" | "unlock"
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
    ],
  },
  {
    heading: "Configuration",
    commands: [{ id: "accounts", label: "Accounts", icon: Building2, keywords: ["account", "store", "stores", "switch", "login"] }],
  },
] as const

export interface CommandPaletteProps {
  container: ShadowRoot | HTMLElement
  open: boolean
  onOpenCaseIds: (caseIds: string[]) => Promise<void> | void
  onOpenShipmentIds: (shipmentIds: string[]) => Promise<void> | void
  onOpenSkuIds?: (skuIds: string[]) => Promise<void> | void
  onGetAccountsStatus?: () => Promise<AccountsStatus>
  onUnlockAccounts?: (masterPassword: string) => Promise<void>
  onStartAccountSwitch?: (storeId: string) => Promise<void>
  onFocusAccountSwitch?: () => Promise<void>
  onCancelAccountSwitch?: () => Promise<void>
  onManageAccounts?: () => Promise<void>
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({
  container,
  open,
  onOpenCaseIds,
  onOpenShipmentIds,
  onOpenSkuIds = async () => undefined,
  onGetAccountsStatus = async () => ({ initialized: false, unlocked: false, stores: [] }),
  onUnlockAccounts = async () => undefined,
  onStartAccountSwitch = async () => undefined,
  onFocusAccountSwitch = async () => undefined,
  onCancelAccountSwitch = async () => undefined,
  onManageAccounts = async () => undefined,
  onOpenChange,
}: CommandPaletteProps) {
  const [mode, setMode] = React.useState<PaletteMode>("commands")
  const [identifierMode, setIdentifierMode] = React.useState<IdentifierMode>("case-ids")
  const [commandSearch, setCommandSearch] = React.useState("")
  const [accountSearch, setAccountSearch] = React.useState("")
  const [identifierInput, setIdentifierInput] = React.useState("")
  const [pendingIds, setPendingIds] = React.useState<string[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [stores, setStores] = React.useState<AccountStoreSummary[]>([])
  const [activeSwitch, setActiveSwitch] = React.useState<ActiveSwitchSummary | undefined>()
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

  const currentIds = React.useMemo(() => inputMode.extractIds(identifierInput), [identifierInput, inputMode])
  const detectedCaseIds = React.useMemo(() => extractCaseIds(commandSearch), [commandSearch])
  const detectedShipmentIds = React.useMemo(() => extractShipmentIds(commandSearch), [commandSearch])
  const skuFallbackQuery = commandSearch.trim()
  const showSkuFallback = React.useMemo(() => {
    if (detectedCaseIds.length > 0 || detectedShipmentIds.length > 0) return false
    if (skuFallbackQuery.length < 1 || skuFallbackQuery.length > 40 || /\s/u.test(skuFallbackQuery)) return false
    return !commandGroups.some((group) =>
      group.commands.some((command) => commandFilter(command.label, skuFallbackQuery, command.keywords) > 0),
    )
  }, [detectedCaseIds.length, detectedShipmentIds.length, skuFallbackQuery])

  React.useEffect(() => {
    if (open) return
    setMode("commands")
    setCommandSearch("")
    setAccountSearch("")
    setIdentifierInput("")
    setPendingIds([])
    setError(null)
    setSubmitting(false)
    setSelectedStore(null)
    setMasterPassword("")
  }, [open])

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
    setSubmitting(true)
    try {
      const status = await onGetAccountsStatus()
      setStores(status.stores)
      setActiveSwitch(status.activeSwitch)
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
      const status = await onGetAccountsStatus()
      if (!status.unlocked) {
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
  }, [close, onGetAccountsStatus, onStartAccountSwitch])

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

  const returnToCommands = React.useCallback(() => { setMode("commands"); setError(null) }, [])

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
    if (mode === "unlock") {
      if (masterPassword) return setMasterPassword("")
      return setMode("accounts")
    }
    if (accountSearch) return setAccountSearch("")
    setMode("commands")
  }, [accountSearch, commandSearch, identifierInput, identifierMode, masterPassword, mode, onOpenChange, submitting])

  const title = mode === "commands" ? "Command Palette" : mode === "accounts" ? "Accounts" : mode === "unlock" ? "Unlock Accounts" : mode === "confirm-ids" ? "Confirm Bulk Open" : inputMode.title
  const description = mode === "commands" ? "Search for a command to run." : mode === "accounts" ? "Search stores or manage account switching." : mode === "unlock" ? `Unlock to switch to ${selectedStore?.name ?? "the selected store"}.` : inputMode.description

  const backButton = (label = "Back", action: () => void = returnToCommands) => (
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
  )

  const errorAlert = (id?: string) => error ? (
    <Alert className="mx-2 mb-2" id={id} variant="destructive">
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
          {submitting ? <p aria-live="polite" className="px-3 py-2 text-sm text-muted-foreground">Loading accounts…</p> : null}
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
                      <span>{detectedIdentifierLabel("case", detectedCaseIds)}</span>
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
                      <span>{detectedIdentifierLabel("shipment", detectedShipmentIds)}</span>
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
                  <span>Search '{skuFallbackQuery}' as SKU</span>
                </CommandItem>
              </CommandGroup>
            ) : null}
            {commandGroups.map((group, index) => (
              <React.Fragment key={group.heading}>
                {index ? <CommandSeparator /> : null}
                <CommandGroup heading={group.heading}>
                  {group.commands.map((command) => {
                    const Icon = command.icon
                    const openIdentifier = (next: IdentifierMode) => { setIdentifierMode(next); setMode(next) }
                    return (
                      <CommandItem
                        key={command.id}
                        value={command.label}
                        keywords={[...command.keywords]}
                        disabled={submitting}
                        onSelect={command.id === "open-case-ids" ? () => openIdentifier("case-ids") : command.id === "open-shipment-ids" ? () => openIdentifier("shipment-ids") : command.id === "search-skus" ? () => openIdentifier("sku-ids") : () => void openAccounts()}
                      >
                        <Icon aria-hidden="true" />
                        <span>{command.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            ))}
          </CommandList>
          {errorAlert()}
        </> : mode === "accounts" ? <>
          <div className="p-1 pb-0">{backButton()}</div>
          {activeSwitch ? (
            <Alert className="mx-2 my-1" role="status">
              <AlertTitle>Switching to {activeSwitch.storeName}</AlertTitle>
              <AlertDescription>Stage: {activeSwitch.stage}</AlertDescription>
              <div className="mt-2 flex gap-2">
                <Button disabled={submitting} onClick={() => void handleSwitchAction("focus")} size="xs" type="button" variant="outline">Go to login</Button>
                <Button disabled={submitting} onClick={() => void handleSwitchAction("cancel")} size="xs" type="button" variant="destructive">Cancel switch</Button>
              </div>
            </Alert>
          ) : null}
          <CommandInput autoFocus aria-label="Search accounts" disabled={submitting} onValueChange={(value) => { setAccountSearch(value); setError(null) }} placeholder="Search stores..." value={accountSearch} />
          <CommandList aria-label="Accounts">
            <CommandEmpty>No matching stores.</CommandEmpty>
            <CommandGroup heading="Stores">
              {stores.map((store) => (
                <CommandItem key={store.id} value={store.name} disabled={submitting} onSelect={() => void chooseStore(store)}>
                  <Building2 aria-hidden="true" />
                  <span>{store.name}</span>
                </CommandItem>
              ))}
              {stores.length === 0 ? <div className="px-3 py-5 text-center text-sm text-muted-foreground">No stores configured.</div> : null}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Configuration">
              <CommandItem value="Manage Accounts" disabled={submitting} onSelect={() => void manageAccounts()}>
                <Settings aria-hidden="true" />
                <span>Manage Accounts</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
          {errorAlert()}
        </> : mode === "unlock" ? <div className="p-1">
          {backButton("Accounts", () => { setMode("accounts"); setError(null) })}
          <form autoComplete="off" className="space-y-2 px-2 pb-2" onSubmit={(event) => event.preventDefault()}>
            <p className="text-sm text-foreground">Unlock to switch to {selectedStore?.name}.</p>
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
            <Button className="w-full" disabled={submitting} onClick={() => void unlockAndStart()} type="button">
              {submitting ? "Unlocking…" : "Unlock and switch"}
            </Button>
          </form>
          {errorAlert("unlock-error")}
        </div> : mode === "confirm-ids" ? <div className="p-1">
          {backButton("Back", () => { setMode(identifierMode); setError(null) })}
          <Alert className="mx-1 mb-2" role="status">
            <AlertTitle>Open {pendingIds.length} {inputMode.noun} tabs in the background?</AlertTitle>
            <AlertDescription>This may briefly use significant browser resources.</AlertDescription>
          </Alert>
          <div className="flex gap-2 px-1 pb-2">
            <Button className="flex-1" disabled={submitting} onClick={() => setMode(identifierMode)} type="button" variant="outline">Cancel</Button>
            <Button autoFocus className="flex-1" disabled={submitting} onClick={() => void runIdentifiers(pendingIds)} type="button">
              {submitting ? "Opening…" : `Open ${pendingIds.length} tabs`}
            </Button>
          </div>
          {errorAlert()}
        </div> : <div className="p-1">
          {backButton()}
          <Textarea
            ref={identifierInputRef}
            aria-describedby={error ? "identifier-input-error" : "identifier-input-count"}
            aria-invalid={Boolean(error)}
            aria-label={inputMode.ariaLabel}
            className="identifier-input no-scrollbar min-h-32 resize-none"
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
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <p id="identifier-input-count" aria-live="polite" className="m-0 text-xs text-muted-foreground">
              {currentIds.length} unique {inputMode.unit}{currentIds.length === 1 ? "" : "s"}
            </p>
            <Button disabled={submitting || currentIds.length === 0} onClick={submitIdentifiers} size="sm" type="button">
              {submitting ? "Opening…" : "Open"}
            </Button>
          </div>
          {errorAlert("identifier-input-error")}
        </div>}
      </CommandDialog>
    </div>
  )
}
