/** The store picker: a running switch, the vault's stores, and Manage accounts. */
import type * as React from "react"
import { Building2, Settings } from "lucide-react"

import {
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
import { CurrentBadge, ErrorAlert } from "@/palette/parts"
import type { AccountStoreSummary, ActiveSwitchSummary } from "@/shared/messages"
import { SWITCH_STAGE_LABELS } from "@/components/switch/SwitchProgress"

export function AccountsScreen({
  accountSearch,
  activeSwitch,
  busy,
  chooseStore,
  currentStore,
  error,
  handleSwitchAction,
  manageAccounts,
  onAccountSearchChange,
  returnToCommands,
  stores,
  submitting,
}: {
  accountSearch: string
  activeSwitch: ActiveSwitchSummary | undefined
  busy: React.ReactNode
  chooseStore: (store: AccountStoreSummary) => Promise<void>
  currentStore: AccountStoreSummary | null
  error: string | null
  handleSwitchAction: (action: "focus" | "cancel") => Promise<void>
  manageAccounts: () => Promise<void>
  onAccountSearchChange: (value: string) => void
  returnToCommands: () => void
  stores: AccountStoreSummary[]
  submitting: boolean
}) {
  const currentStoreLabel = `Current store: ${currentStore?.name ?? "Unknown"}`
  return <>
    <CommandHeader backDisabled={submitting} divider={false} onBack={returnToCommands}>
      <CommandInput
        autoFocus
        aria-label="Search accounts"
        compact
        disabled={submitting}
        onValueChange={onAccountSearchChange}
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
    <ErrorAlert error={error} />
    <CommandFooter
      end={<>
        <CommandHint keys={["↵"]}>Switch</CommandHint>
        <CommandHint keys={["esc"]}>{accountSearch ? "Clear" : "Back"}</CommandHint>
      </>}
    >
      {busy}
    </CommandFooter>
  </>
}
