import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { Building2, ChevronLeft, FolderOpen, Settings, Truck } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./components/ui/command"
import { extractCaseIds } from "./lib/caseIds"
import { extractShipmentIds } from "./lib/shipmentIds"

type PaletteMode = "commands" | "case-ids" | "shipment-ids" | "confirm-ids" | "accounts" | "unlock"
type IdentifierMode = "case-ids" | "shipment-ids"
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
}

export interface CommandDefinition {
  id: string
  label: string
  icon: LucideIcon
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
      { id: "open-case-ids", label: "Open Case ID/s", icon: FolderOpen },
      { id: "open-shipment-ids", label: "Open Shipment IDs", icon: Truck },
    ],
  },
  {
    heading: "Configuration",
    commands: [{ id: "accounts", label: "Accounts", icon: Building2 }],
  },
] as const

export interface CommandPaletteProps {
  container: ShadowRoot | HTMLElement
  open: boolean
  onOpenCaseIds: (caseIds: string[]) => Promise<void> | void
  onOpenShipmentIds: (shipmentIds: string[]) => Promise<void> | void
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

  const inputMode = React.useMemo<InputModeDefinition>(() => identifierMode === "case-ids" ? {
    ariaLabel: "Case IDs",
    description: "Enter one or more 11-digit Amazon Seller Central Case IDs.",
    extractIds: extractCaseIds,
    invalidError: "Enter at least one 11-digit Case ID.",
    noun: "case",
    placeholder: "Paste Case IDs here…\n\nEnter to open · Shift+Enter for a new line",
    submit: onOpenCaseIds,
    title: "Open Case IDs",
  } : {
    ariaLabel: "Shipment IDs",
    description: "Enter one or more Amazon Seller Central FBA Shipment IDs.",
    extractIds: extractShipmentIds,
    invalidError: "Enter at least one valid FBA Shipment ID.",
    noun: "shipment",
    placeholder: "Paste Shipment IDs here…\n\nEnter to open · Shift+Enter for a new line",
    submit: onOpenShipmentIds,
    title: "Open Shipment IDs",
  }, [identifierMode, onOpenCaseIds, onOpenShipmentIds])

  const currentIds = React.useMemo(() => inputMode.extractIds(identifierInput), [identifierInput, inputMode])
  const filteredStores = React.useMemo(() => {
    const query = accountSearch.trim().toLocaleLowerCase()
    return query ? stores.filter(({ name }) => name.toLocaleLowerCase().includes(query)) : stores
  }, [accountSearch, stores])

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
    if (mode === "case-ids" || mode === "shipment-ids") identifierInputRef.current?.focus()
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
    if (mode === "case-ids" || mode === "shipment-ids") updateFadeMask()
  }, [identifierInput, mode, updateFadeMask])

  const runIdentifiers = React.useCallback(async (ids: string[]) => {
    setError(null)
    setSubmitting(true)
    try {
      await inputMode.submit(ids)
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `Couldn’t open ${inputMode.noun} tabs. Please try again.`)
      setSubmitting(false)
    }
  }, [close, inputMode])

  const submitIdentifiers = React.useCallback(() => {
    if (submitting) return
    if (currentIds.length === 0) return setError(inputMode.invalidError)
    if (currentIds.length > MAX_BULK_IDS) return setError(`Open no more than ${MAX_BULK_IDS} IDs at a time.`)
    if (currentIds.length > CONFIRM_THRESHOLD) {
      setPendingIds(currentIds)
      setError(null)
      setMode("confirm-ids")
      return
    }
    void runIdentifiers(currentIds)
  }, [currentIds, inputMode.invalidError, runIdentifiers, submitting])

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

  const handleOpenChange = React.useCallback<NonNullable<React.ComponentProps<typeof CommandDialog>["onOpenChange"]>>((nextOpen, details) => {
    if (nextOpen || details.reason !== "escape-key") return onOpenChange(nextOpen)
    details.cancel()
    if (submitting) return
    setError(null)
    if (mode === "commands") {
      if (commandSearch) return setCommandSearch("")
      return onOpenChange(false)
    }
    if (mode === "case-ids" || mode === "shipment-ids") {
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
    <button className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50" disabled={submitting} onClick={action} type="button"><ChevronLeft aria-hidden="true" className="size-4" />{label}</button>
  )

  return (
    <div className="palette-scope">
      <CommandDialog container={container} contentKey={mode} description={description} open={open} onOpenChange={handleOpenChange} title={title}>
        {mode === "commands" ? <>
          <CommandInput autoFocus aria-label="Search commands" disabled={submitting} onValueChange={(value) => { setCommandSearch(value); setError(null) }} placeholder="Type a command or search..." value={commandSearch} />
          {submitting ? <p aria-live="polite" className="px-3 py-2 text-sm text-muted-foreground">Loading accounts…</p> : null}
          <CommandList aria-label="Commands"><CommandEmpty>No results found.</CommandEmpty>{commandGroups.map((group, index) => <React.Fragment key={group.heading}>{index ? <CommandSeparator /> : null}<CommandGroup heading={group.heading}>{group.commands.map((command) => { const Icon = command.icon; return <CommandItem key={command.id} value={command.label} disabled={submitting} onSelect={command.id === "open-case-ids" ? () => { setIdentifierMode("case-ids"); setMode("case-ids") } : command.id === "open-shipment-ids" ? () => { setIdentifierMode("shipment-ids"); setMode("shipment-ids") } : () => void openAccounts()}><Icon aria-hidden="true" /><span>{command.label}</span></CommandItem> })}</CommandGroup></React.Fragment>)}</CommandList>
          {error ? <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </> : mode === "accounts" ? <>
          <div className="p-1 pb-0">{backButton()}</div>
          {activeSwitch ? <div className="mx-2 my-1 rounded-lg border border-input p-2 text-sm"><p className="m-0 font-medium">Switching to {activeSwitch.storeName}</p><p className="m-0 mt-1 text-xs text-muted-foreground">Stage: {activeSwitch.stage}</p><div className="mt-2 flex gap-2"><button className="rounded-md border border-input px-2 py-1 text-xs" disabled={submitting} onClick={() => void handleSwitchAction("focus")} type="button">Go to login</button><button className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-600 dark:text-red-400" disabled={submitting} onClick={() => void handleSwitchAction("cancel")} type="button">Cancel switch</button></div></div> : null}
          <CommandInput autoFocus aria-label="Search accounts" disabled={submitting} onValueChange={(value) => { setAccountSearch(value); setError(null) }} placeholder="Search stores..." value={accountSearch} />
          <CommandList aria-label="Accounts"><CommandEmpty>No matching stores.</CommandEmpty><CommandGroup heading="Stores">{filteredStores.map((store) => <CommandItem key={store.id} value={store.name} disabled={submitting} onSelect={() => void chooseStore(store)}><Building2 aria-hidden="true" /><span>{store.name}</span></CommandItem>)}{stores.length === 0 ? <div className="px-3 py-5 text-center text-sm text-muted-foreground">No stores configured.</div> : null}</CommandGroup><CommandSeparator /><CommandGroup heading="Configuration"><CommandItem value="Manage Accounts" disabled={submitting} onSelect={() => void manageAccounts()}><Settings aria-hidden="true" /><span>Manage Accounts</span></CommandItem></CommandGroup></CommandList>
          {error ? <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </> : mode === "unlock" ? <div className="p-1">
          {backButton("Accounts", () => { setMode("accounts"); setError(null) })}
          <div className="px-2 pb-2">
            <p className="mb-2 text-sm text-foreground">Unlock to switch to {selectedStore?.name}.</p>
            <form autoComplete="off" onSubmit={(event) => event.preventDefault()}>
              <input
                autoFocus
                aria-describedby={error ? "unlock-error" : undefined}
                aria-invalid={Boolean(error)}
                aria-label="Master password"
                autoComplete="new-password"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
                name="s4e-spotlight-vault-unlock"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring"
                disabled={submitting}
                type="password"
                value={masterPassword}
                onChange={(event) => { setMasterPassword(event.target.value); setError(null) }}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void unlockAndStart() } }}
              />
              <button className="mt-2 h-9 w-full rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50" disabled={submitting} onClick={() => void unlockAndStart()} type="button">{submitting ? "Unlocking…" : "Unlock and switch"}</button>
            </form>
          </div>
          {error ? <p id="unlock-error" role="alert" className="px-2 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </div> : mode === "confirm-ids" ? <div className="p-1">
          {backButton("Back", () => { setMode(identifierMode); setError(null) })}
          <div className="px-3 pb-3"><p className="my-2 text-sm">Open {pendingIds.length} {inputMode.noun} tabs in the background?</p><p className="mb-3 text-xs text-muted-foreground">This may briefly use significant browser resources.</p><div className="flex gap-2"><button className="h-9 flex-1 rounded-lg border border-input px-3 text-sm" disabled={submitting} onClick={() => setMode(identifierMode)} type="button">Cancel</button><button autoFocus className="h-9 flex-1 rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50" disabled={submitting} onClick={() => void runIdentifiers(pendingIds)} type="button">{submitting ? "Opening…" : `Open ${pendingIds.length} tabs`}</button></div></div>
          {error ? <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </div> : <div className="p-1">
          {backButton()}
          <div className="identifier-input-shell rounded-lg border border-input/30 bg-input/30 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30"><textarea ref={identifierInputRef} aria-describedby={error ? "identifier-input-error" : "identifier-input-count"} aria-invalid={Boolean(error)} aria-label={inputMode.ariaLabel} className="identifier-input no-scrollbar block min-h-32 w-full resize-none bg-transparent p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-wait disabled:opacity-60" data-fade-mask={fadeMask} disabled={submitting} onChange={(event) => { setIdentifierInput(event.target.value); setError(null) }} onScroll={updateFadeMask} onKeyDown={(event) => { if (event.key !== "Enter") return; if (event.shiftKey || event.nativeEvent.isComposing) { event.stopPropagation(); return } event.preventDefault(); event.stopPropagation(); submitIdentifiers() }} placeholder={inputMode.placeholder} value={identifierInput} /></div>
          <div className="flex items-center justify-between gap-2 px-2 py-1"><p id="identifier-input-count" aria-live="polite" className="m-0 text-xs text-muted-foreground">{currentIds.length} unique {inputMode.noun} ID{currentIds.length === 1 ? "" : "s"}</p><button className="h-8 rounded-lg bg-foreground px-3 text-xs font-medium text-background disabled:opacity-50" disabled={submitting || currentIds.length === 0} onClick={submitIdentifiers} type="button">{submitting ? "Opening…" : "Open"}</button></div>
          {error ? <p id="identifier-input-error" role="alert" className="px-2 pb-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </div>}
      </CommandDialog>
    </div>
  )
}
