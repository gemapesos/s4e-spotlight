import * as React from "react"
import { Building2 } from "lucide-react"

import type { AccountsStatus } from "@/CommandPalette"
import { HeaderButton } from "@/components/panel"
import type { SellerCentralSessionState } from "@/lib/sellerCentralSession"
import { cn } from "@/lib/utils"

export type WorkspaceTab = "reports" | "cases" | "accounts"

/** What the palette asked the window to show. `serial` changes on every launch, even a repeat. */
export interface WorkspaceLaunch {
  mode: WorkspaceTab
  caseIds: string[]
  resumeId?: string
  storeName?: string
  serial: number
}

/** Runs this window owns, so the background's progress reaches the right tab and closing cancels them. */
export interface WorkspaceRuns {
  report?: string
  cases?: string
}

/** The modifier for "do the main action" shortcuts, as this platform writes it. */
export const MOD_KEY = typeof navigator !== "undefined" && /Mac|iPhone|iPad/u.test(navigator.platform) ? "⌘" : "Ctrl"

export function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000))
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : pluralForm}`
}

/** A tab's scrolling body, inset 12 px like every surface body. */
export function WorkspaceBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3", className)} {...props} />
}

/** Which store the work runs against, and whether Seller Central is signed in. */
export function StoreStrip({
  onChange,
  onOpenSellerCentral,
  session,
  status,
}: {
  /** Shows the Accounts tab; left out when store switching is turned off. */
  onChange?: () => void
  onOpenSellerCentral: () => void
  session: SellerCentralSessionState
  status: AccountsStatus | null
}) {
  const detail = session === "signed-in"
    ? "Signed in to Seller Central"
    : session === "signed-out"
      ? "Not signed in to Seller Central"
      : "Seller Central opens when you start"
  return (
    <div className="flex min-h-12 shrink-0 items-center gap-2.5 rounded-[0.625rem] bg-muted py-1.5 pr-2 pl-3">
      <Building2 aria-hidden="true" className="size-4 shrink-0 text-foreground/80" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate leading-[1.125rem] font-medium">{status?.currentStore?.name ?? "Seller Central"}</span>
        <span className="truncate text-xs leading-4 text-muted-foreground">{detail}</span>
      </div>
      {session === "signed-out" ? (
        <HeaderButton onClick={onOpenSellerCentral} type="button">Open Seller Central</HeaderButton>
      ) : onChange ? (
        <HeaderButton onClick={onChange} type="button">Change</HeaderButton>
      ) : null}
    </div>
  )
}

/**
 * The title of a run and its 2 px bar. `percent` of null draws the bar moving, for work that
 * can't count its own progress.
 */
export function ResultHeader({
  aside,
  meta,
  percent,
  title,
}: {
  aside?: React.ReactNode
  meta: string
  percent: number | null
  title: string
}) {
  return (
    <div className="flex shrink-0 flex-col gap-2.5 px-2 pt-1">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="m-0 text-base leading-6 font-medium">{title}</h2>
          <p className="m-0 truncate text-xs leading-4 text-muted-foreground">{meta}</p>
        </div>
        {aside ? <div className="flex shrink-0 items-center text-xs leading-4 text-muted-foreground tabular-nums">{aside}</div> : null}
      </div>
      <div
        aria-label={title}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent ?? undefined}
        className="relative h-0.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
      >
        {percent === null ? (
          <div className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary" data-slot="progress-indeterminate" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-400 ease-out-expo motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  )
}

/** Up and down move focus between a list's rows, like the palette's highlight. */
export function moveRowFocus(event: React.KeyboardEvent<HTMLElement>, rowSelector: string): void {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(rowSelector))
  if (rows.length === 0) return
  event.preventDefault()
  const index = rows.indexOf(document.activeElement as HTMLElement)
  const next = event.key === "ArrowDown" ? (index + 1) % rows.length : (index - 1 + rows.length) % rows.length
  rows[index === -1 ? 0 : next]?.focus()
}

/** Keys for a tab while it is showing; a hidden tab ignores them. */
export function useTabKeys(enabled: boolean, handler: (event: KeyboardEvent) => void): void {
  const latest = React.useRef(handler)
  latest.current = handler
  React.useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => latest.current(event)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled])
}
