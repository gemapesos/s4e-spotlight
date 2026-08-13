import * as React from "react"
import type { LucideIcon } from "lucide-react"
import {
  Building2,
  ChevronLeft,
  CreditCard,
  FolderOpen,
  Settings,
  Truck,
  User,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./components/ui/command"
import { extractCaseIds } from "./lib/caseIds"
import { extractShipmentIds } from "./lib/shipmentIds"

type PaletteMode = "commands" | "case-ids" | "shipment-ids" | "accounts" | "unlock"
type FadeMaskState = "none" | "top" | "bottom" | "both"

interface InputModeDefinition {
  ariaLabel: string
  description: string
  extractIds: (input: string) => string[]
  invalidError: string
  openError: string
  placeholder: string
  submit: (ids: string[]) => Promise<void> | void
}

export interface CommandDefinition {
  id: string
  label: string
  icon: LucideIcon
  disabled?: boolean
  shortcut?: string
}

export interface AccountStoreSummary { id: string; name: string }
export interface AccountsStatus { initialized: boolean; unlocked: boolean; stores: AccountStoreSummary[] }

export const commandGroups: ReadonlyArray<{
  heading: string
  commands: ReadonlyArray<CommandDefinition>
}> = [
  {
    heading: "Suggestions",
    commands: [
      { id: "open-case-ids", label: "Open Case ID/s", icon: FolderOpen },
      { id: "open-shipment-ids", label: "Open Shipment IDs", icon: Truck },
    ],
  },
  {
    heading: "Settings",
    commands: [
      { id: "profile", label: "Profile", icon: User, shortcut: "⌘P" },
      { id: "billing", label: "Billing", icon: CreditCard, shortcut: "⌘B" },
      { id: "settings", label: "Settings", icon: Settings, shortcut: "⌘S" },
      { id: "accounts", label: "Accounts", icon: Building2 },
    ],
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
  onManageAccounts = async () => undefined,
  onOpenChange,
}: CommandPaletteProps) {
  const [mode, setMode] = React.useState<PaletteMode>("commands")
  const [identifierInput, setIdentifierInput] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [stores, setStores] = React.useState<AccountStoreSummary[]>([])
  const [selectedStore, setSelectedStore] = React.useState<AccountStoreSummary | null>(null)
  const [masterPassword, setMasterPassword] = React.useState("")
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")
  const identifierInputRef = React.useRef<HTMLTextAreaElement>(null)
  const close = React.useCallback(() => onOpenChange(false), [onOpenChange])
  const inputMode = React.useMemo<InputModeDefinition | null>(() => {
    if (mode === "case-ids") {
      return {
        ariaLabel: "Case IDs",
        description:
          "Enter one or more 11-digit Amazon Seller Central Case IDs.",
        extractIds: extractCaseIds,
        invalidError: "Enter at least one 11-digit Case ID.",
        openError: "Couldn’t open case tabs. Please try again.",
        placeholder:
          "Paste Case IDs here…\n\nEnter to open · Shift+Enter for a new line",
        submit: onOpenCaseIds,
      }
    }

    if (mode === "shipment-ids") {
      return {
        ariaLabel: "Shipment IDs",
        description:
          "Enter one or more Amazon Seller Central FBA Shipment IDs.",
        extractIds: extractShipmentIds,
        invalidError: "Enter at least one valid FBA Shipment ID.",
        openError: "Couldn’t open shipment tabs. Please try again.",
        placeholder:
          "Paste Shipment IDs here…\n\nEnter to open · Shift+Enter for a new line",
        submit: onOpenShipmentIds,
      }
    }

    return null
  }, [mode, onOpenCaseIds, onOpenShipmentIds])

  React.useEffect(() => {
    if (open) return

    setMode("commands")
    setIdentifierInput("")
    setError(null)
    setSubmitting(false)
    setSelectedStore(null)
    setMasterPassword("")
  }, [open])

  React.useEffect(() => {
    if (inputMode) identifierInputRef.current?.focus()
  }, [inputMode])

  const updateFadeMask = React.useCallback(() => {
    const input = identifierInputRef.current
    if (!input) {
      setFadeMask("none")
      return
    }

    const threshold = 1
    const hasOverflow = input.scrollHeight - input.clientHeight > threshold
    const hasContentAbove = hasOverflow && input.scrollTop > threshold
    const hasContentBelow =
      hasOverflow &&
      input.scrollTop + input.clientHeight < input.scrollHeight - threshold

    setFadeMask(
      hasContentAbove && hasContentBelow
        ? "both"
        : hasContentAbove
          ? "top"
          : hasContentBelow
            ? "bottom"
            : "none",
    )
  }, [])

  React.useLayoutEffect(() => {
    if (!inputMode) return
    updateFadeMask()
  }, [identifierInput, inputMode, updateFadeMask])

  const submitIdentifiers = React.useCallback(async () => {
    if (submitting || !inputMode) return

    const ids = inputMode.extractIds(identifierInput)
    if (ids.length === 0) {
      setError(inputMode.invalidError)
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      await inputMode.submit(ids)
      close()
    } catch {
      setError(inputMode.openError)
      setSubmitting(false)
    }
  }, [close, identifierInput, inputMode, submitting])

  const openAccounts = React.useCallback(async () => {
    setError(null); setSubmitting(true)
    try {
      const status = await onGetAccountsStatus()
      setStores(status.stores); setMode("accounts")
    } catch { setError("Couldn’t load accounts. Please try again.") }
    finally { setSubmitting(false) }
  }, [onGetAccountsStatus])

  const chooseStore = React.useCallback(async (store: AccountStoreSummary) => {
    setError(null); setSubmitting(true)
    try {
      const status = await onGetAccountsStatus()
      if (!status.unlocked) { setSelectedStore(store); setMode("unlock"); setSubmitting(false); return }
      await onStartAccountSwitch(store.id); close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t start the account switch.")
      setSubmitting(false)
    }
  }, [close, onGetAccountsStatus, onStartAccountSwitch])

  const unlockAndStart = React.useCallback(async () => {
    if (!selectedStore || submitting) return
    setError(null); setSubmitting(true)
    try {
      await onUnlockAccounts(masterPassword)
      await onStartAccountSwitch(selectedStore.id)
      close()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t unlock accounts.")
      setSubmitting(false)
    }
  }, [close, masterPassword, onStartAccountSwitch, onUnlockAccounts, selectedStore, submitting])

  return (
    <div className="palette-scope">
      <CommandDialog
        container={container}
        open={open}
        onOpenChange={onOpenChange}
        description={inputMode?.description}
      >
        {mode === "commands" ? (
          <>
            <CommandInput
              autoFocus
              aria-label="Search commands"
              placeholder="Type a command or search..."
            />
            <CommandList aria-label="Suggestions">
              <CommandEmpty>No results found.</CommandEmpty>
              {commandGroups.map((group, groupIndex) => (
                <React.Fragment key={group.heading}>
                  {groupIndex > 0 ? <CommandSeparator /> : null}
                  <CommandGroup heading={group.heading}>
                    {group.commands.map((command) => {
                      const Icon = command.icon

                      return (
                        <CommandItem
                          key={command.id}
                          value={command.label}
                          disabled={command.disabled}
                          onSelect={
                            command.id === "open-case-ids"
                              ? () => setMode("case-ids")
                              : command.id === "open-shipment-ids"
                                ? () => setMode("shipment-ids")
                              : command.id === "accounts"
                                ? () => void openAccounts()
                              : close
                          }
                        >
                          <Icon aria-hidden="true" />
                          <span>{command.label}</span>
                          {command.shortcut ? (
                            <CommandShortcut>{command.shortcut}</CommandShortcut>
                          ) : null}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </React.Fragment>
              ))}
            </CommandList>
          </>
        ) : mode === "accounts" ? (
          <>
            <div className="p-1 pb-0"><button className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setMode("commands")}><ChevronLeft aria-hidden="true" className="size-4" />Back</button></div>
            <CommandList aria-label="Accounts">
              <CommandGroup heading="Accounts">
                {stores.map((store) => <CommandItem key={store.id} value={store.name} disabled={submitting} onSelect={() => void chooseStore(store)}><Building2 aria-hidden="true" /><span>{store.name}</span></CommandItem>)}
                {stores.length === 0 ? <div className="px-3 py-5 text-center text-sm text-muted-foreground">No stores configured.</div> : null}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Configuration"><CommandItem value="Manage Accounts" onSelect={() => void onManageAccounts().then(close)}><Settings aria-hidden="true" /><span>Manage Accounts</span></CommandItem></CommandGroup>
            </CommandList>
            {error ? <p role="alert" className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </>
        ) : mode === "unlock" ? (
          <div className="p-1">
            <button className="mb-1 flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setMode("accounts"); setError(null) }}><ChevronLeft aria-hidden="true" className="size-4" />Accounts</button>
            <div className="px-2 pb-2"><p className="mb-2 text-sm text-foreground">Unlock to switch to {selectedStore?.name}.</p><input autoFocus aria-label="Master password" className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring" disabled={submitting} type="password" value={masterPassword} onChange={(event) => { setMasterPassword(event.target.value); setError(null) }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void unlockAndStart() } }} /></div>
            {error ? <p role="alert" className="px-2 pb-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          </div>
        ) : (
          <div className="p-1">
            <div className="identifier-input-shell rounded-lg border border-input/30 bg-input/30 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
              <textarea
                ref={identifierInputRef}
                aria-describedby={error ? "identifier-input-error" : undefined}
                aria-invalid={error ? "true" : undefined}
                aria-label={inputMode?.ariaLabel}
                className="identifier-input no-scrollbar block min-h-32 w-full resize-none bg-transparent p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-wait disabled:opacity-60"
                data-fade-mask={fadeMask}
                disabled={submitting}
                onChange={(event) => {
                  setIdentifierInput(event.target.value)
                  if (error) setError(null)
                }}
                onScroll={updateFadeMask}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return

                  if (event.shiftKey || event.nativeEvent.isComposing) {
                    event.stopPropagation()
                    return
                  }

                  event.preventDefault()
                  event.stopPropagation()
                  void submitIdentifiers()
                }}
                placeholder={inputMode?.placeholder}
                value={identifierInput}
              />
            </div>
            {error ? (
              <p
                id="identifier-input-error"
                role="alert"
                className="px-2 py-1 text-xs text-red-600 dark:text-red-400"
              >
                {error}
              </p>
            ) : null}
          </div>
        )}
      </CommandDialog>
    </div>
  )
}
