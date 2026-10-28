/** The palette's first screen: commands, IDs and stores found in the search, and the current store. */
import * as React from "react"
import { Building2, FolderOpen, Package, PackageMinus, Truck } from "lucide-react"

import {
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandHint,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import type { CommandDefinition, IdentifierMode } from "@/CommandPalette"
import { CurrentBadge, ErrorAlert } from "@/palette/parts"
import type { AccountStoreSummary } from "@/shared/messages"

function detectedIdentifierLabel(noun: string, ids: string[]): string {
  if (ids.length === 1) return `Open ${noun} ${ids[0]}`
  return `Open ${ids.length} ${noun} IDs`
}

export function CommandsScreen({
  accountsEnabled,
  accountsLoaded,
  busy,
  chooseStore,
  commandSearch,
  currentStore,
  detectedCaseIds,
  detectedRemovalOrderIds,
  detectedShipmentIds,
  error,
  hasDetectedIds,
  matchedStores,
  onCommandSearchChange,
  selectCommand,
  showSkuFallback,
  skuFallbackQuery,
  submitIdBatch,
  submitting,
  visibleGroups,
}: {
  accountsEnabled: boolean
  accountsLoaded: boolean
  busy: React.ReactNode
  chooseStore: (store: AccountStoreSummary) => Promise<void>
  commandSearch: string
  currentStore: AccountStoreSummary | null
  detectedCaseIds: string[]
  detectedRemovalOrderIds: string[]
  detectedShipmentIds: string[]
  error: string | null
  hasDetectedIds: boolean
  matchedStores: AccountStoreSummary[]
  onCommandSearchChange: (value: string) => void
  selectCommand: (commandId: string) => void
  showSkuFallback: boolean
  skuFallbackQuery: string
  submitIdBatch: (target: IdentifierMode, ids: string[]) => void
  submitting: boolean
  visibleGroups: ReadonlyArray<{ heading: string; commands: ReadonlyArray<CommandDefinition> }>
}) {
  const currentStoreLabel = `Current store: ${currentStore?.name ?? "Unknown"}`
  return <>
    <CommandInput
      autoFocus
      aria-label="Search commands"
      disabled={submitting}
      onValueChange={onCommandSearchChange}
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
    <ErrorAlert error={error} />
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
  </>
}
