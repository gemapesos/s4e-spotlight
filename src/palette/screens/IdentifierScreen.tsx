/** Pasting IDs or SKUs to open, or to remove in bulk. */
import type * as React from "react"

import { PrimaryButton } from "@/components/panel"
import { CommandFooter, CommandHeader, CommandHint } from "@/components/ui/command"
import type { InputModeDefinition } from "@/palette/CommandPalette"
import type { FadeMaskState } from "@/lib/fadeMask"
import { ErrorAlert } from "@/palette/parts"

const MAX_ID_CHIPS = 12

function identifierActionLabel(count: number, noun: string, verb = "Open"): string {
  if (count === 0) return verb
  return `${verb} ${count} ${noun}${count === 1 ? "" : "s"}`
}

export function IdentifierScreen({
  currentIds,
  duplicateIds,
  error,
  fadeMask,
  identifierInput,
  identifierInputRef,
  inputMode,
  onIdentifierInputChange,
  returnToCommands,
  submitIdentifiers,
  submitting,
  updateFadeMask,
}: {
  currentIds: string[]
  duplicateIds: number
  error: string | null
  fadeMask: FadeMaskState
  identifierInput: string
  identifierInputRef: React.RefObject<HTMLTextAreaElement | null>
  inputMode: InputModeDefinition
  onIdentifierInputChange: (value: string) => void
  returnToCommands: () => void
  submitIdentifiers: () => void
  submitting: boolean
  updateFadeMask: () => void
}) {
  return <>
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
        onChange={(event) => onIdentifierInputChange(event.target.value)}
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
    <ErrorAlert error={error} id="identifier-input-error" />
    <p aria-live="polite" className="sr-only" id="identifier-input-count">
      {currentIds.length} unique {inputMode.unit}{currentIds.length === 1 ? "" : "s"}
    </p>
    <CommandFooter
      action
      end={(
        <PrimaryButton disabled={submitting || currentIds.length === 0} onClick={submitIdentifiers} type="button">
          {submitting ? inputMode.busyLabel ?? "Opening…" : identifierActionLabel(currentIds.length, inputMode.noun, inputMode.verb)}
        </PrimaryButton>
      )}
    >
      <CommandHint keys={["⇧↵"]}>New line</CommandHint>
      <CommandHint keys={["esc"]}>Clear, then back</CommandHint>
    </CommandFooter>
  </>
}
