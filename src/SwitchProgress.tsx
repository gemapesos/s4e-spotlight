import * as React from "react"
import { CheckIcon, CircleAlert, TriangleAlertIcon } from "lucide-react"

import type { AccountsStatus, ActiveSwitchSummary } from "@/CommandPalette"
import { PrimaryButton } from "@/components/panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CommandFooter, CommandHeader, CommandHint } from "@/components/ui/command"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** What an account switch is doing, in the user's terms. */
export const SWITCH_STAGE_LABELS: Record<string, string> = {
  logout: "Signing out of the current account…",
  signin: "Opening Amazon sign-in…",
  email: "Entering the account email…",
  password: "Entering the password…",
  otp: "Entering the verification code…",
  paused: "Sign-in needs your attention.",
  store: "Opening and checking the selected store…",
  authenticated: "Opening the store…",
}

const POLL_INTERVAL_MS = 750

interface SwitchStep {
  id: string
  label: string
  /** The background job stages that belong to this step. */
  stages: readonly string[]
}

/** The switch's steps, shown the way Generate reports shows its sections. */
const SIGN_IN_STEPS: readonly SwitchStep[] = [
  { id: "sign-out", label: "Sign out", stages: ["logout"] },
  { id: "sign-in", label: "Sign in", stages: ["signin", "email", "password"] },
  { id: "code", label: "Verification code", stages: ["otp"] },
  { id: "store", label: "Open store", stages: ["store", "authenticated"] },
]
const STORE_ONLY_STEPS = SIGN_IN_STEPS.slice(-1)

type StepStatus = "pending" | "active" | "attention" | "complete"

const STEP_DETAIL: Record<StepStatus, string> = {
  pending: "Waiting",
  active: "",
  attention: "Needs you",
  complete: "Done",
}

interface SwitchProgressState {
  steps: Array<{ id: string; label: string; status: StepStatus }>
  completed: number
  total: number
  percent: number
  paused: boolean
}

function switchProgress(active: ActiveSwitchSummary): SwitchProgressState {
  const paused = active.stage === "paused"
  const stage = paused ? active.resumeStage : active.stage
  const steps = active.signIn ? SIGN_IN_STEPS : STORE_ONLY_STEPS
  const current = Math.max(0, steps.findIndex((step) => stage !== undefined && step.stages.includes(stage)))
  return {
    steps: steps.map((step, index) => ({
      id: step.id,
      label: step.label,
      status: index < current ? "complete" : index > current ? "pending" : paused ? "attention" : "active",
    })),
    completed: current,
    total: steps.length,
    percent: Math.round(((current + 0.5) / steps.length) * 100),
    paused,
  }
}

/** Follows the running switch until it reaches its store, or ends without reaching it. */
function useSwitchStatus(
  onGetAccountsStatus: () => Promise<AccountsStatus>,
  { doneStoreName, onEnded }: { doneStoreName?: string; onEnded: () => void },
) {
  const [active, setActive] = React.useState<ActiveSwitchSummary | null>(null)
  const [doneName, setDoneName] = React.useState<string | null>(doneStoreName ?? null)
  const lastActive = React.useRef<ActiveSwitchSummary | null>(null)
  const onEndedRef = React.useRef(onEnded)
  onEndedRef.current = onEnded

  React.useEffect(() => {
    if (doneName) return
    let cancelled = false
    let timer: number | undefined
    const refresh = async () => {
      try {
        const status = await onGetAccountsStatus()
        if (cancelled) return
        if (!status.activeSwitch) {
          const last = lastActive.current
          if (last && status.currentStore?.id === last.storeId) setDoneName(last.storeName)
          else onEndedRef.current()
          return
        }
        lastActive.current = status.activeSwitch
        setActive(status.activeSwitch)
      } catch { /* the worker may be restarting; keep checking */ }
      if (!cancelled) timer = window.setTimeout(() => void refresh(), POLL_INTERVAL_MS)
    }
    void refresh()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [doneName, onGetAccountsStatus])

  return { active, doneName }
}

/** A finished switch waits for the user: any real click or key press on the page dismisses it. */
function useDismissOnUserInput(enabled: boolean, onDismiss: () => void, isUserEvent: (event: Event) => boolean) {
  const latest = React.useRef({ onDismiss, isUserEvent })
  latest.current = { onDismiss, isUserEvent }
  React.useEffect(() => {
    if (!enabled) return
    const dismiss = (event: Event) => {
      if (latest.current.isUserEvent(event)) latest.current.onDismiss()
    }
    window.addEventListener("pointerdown", dismiss, true)
    window.addEventListener("keydown", dismiss, true)
    return () => {
      window.removeEventListener("pointerdown", dismiss, true)
      window.removeEventListener("keydown", dismiss, true)
    }
  }, [enabled])
}

/** Real clicks and key presses, not page-made ones. */
const isTrustedEvent = (event: Event) => event.isTrusted

function useAction() {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const run = async (action: () => Promise<void>, then?: () => void) => {
    setBusy(true)
    setError(null)
    try {
      await action()
      then?.()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t update the store switch.")
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, run }
}

function CheckBubble({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn("flex size-4 animate-check-in items-center justify-center rounded-full bg-primary text-primary-foreground", className)}>
      <CheckIcon className="size-2.5" strokeWidth={3.5} />
    </span>
  )
}

function stepIcon(status: StepStatus) {
  if (status === "complete") return <CheckBubble />
  if (status === "active") return <Spinner aria-hidden="true" className="size-4 text-foreground" role="presentation" />
  if (status === "attention") return <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
  return <span aria-hidden="true" className="size-4 rounded-full border-[0.0938rem] border-dashed border-ring" />
}

/** The step rows, laid out like the report section rows. */
function SwitchSteps({ steps, compact = false }: { steps: SwitchProgressState["steps"]; compact?: boolean }) {
  return (
    <div className="flex flex-col" role="list">
      {steps.map((step) => {
        const current = step.status === "active" || step.status === "attention"
        return (
          <div
            key={step.id}
            aria-current={current ? "step" : undefined}
            aria-label={`${step.label}: ${STEP_DETAIL[step.status] || "In progress"}`}
            className={cn("flex items-center gap-2.5 rounded-[0.375rem] px-2", compact ? "h-7" : "h-8", current && "bg-muted")}
            role="listitem"
          >
            <span className="flex size-4 shrink-0 items-center justify-center">{stepIcon(step.status)}</span>
            <span className={cn("min-w-0 flex-1 truncate text-sm", current ? "font-medium text-foreground" : step.status === "pending" ? "text-muted-foreground" : "text-foreground/80")}>
              {step.label}
            </span>
            <span className={cn("shrink-0 text-xs leading-4", current ? "text-foreground/70" : "text-muted-foreground")}>{STEP_DETAIL[step.status]}</span>
          </div>
        )
      })}
    </div>
  )
}

export interface SwitchScreenProps {
  /** Opens on the finished state, in the tab the switch reloaded. */
  doneStoreName?: string
  isUserEvent?: (event: Event) => boolean
  onCancel: () => Promise<void>
  /** Hides the palette while the switch keeps running, or closes the finished screen. */
  onClose: () => void
  /** The switch ended without reaching its store. */
  onEnded: () => void
  onGetAccountsStatus: () => Promise<AccountsStatus>
  onShowSignIn: () => Promise<void>
}

/**
 * The palette screen for a running switch. Seller Central is unusable until the switch
 * finishes, so the switch takes the palette over like Generate reports does.
 */
export function SwitchScreen({
  doneStoreName,
  isUserEvent = isTrustedEvent,
  onCancel,
  onClose,
  onEnded,
  onGetAccountsStatus,
  onShowSignIn,
}: SwitchScreenProps) {
  const { active, doneName } = useSwitchStatus(onGetAccountsStatus, { doneStoreName, onEnded })
  const { busy, error, run } = useAction()
  useDismissOnUserInput(Boolean(doneName), onClose, isUserEvent)
  const progress = active && !doneName ? switchProgress(active) : null
  const percent = doneName ? 100 : progress?.percent ?? 0
  const title = doneName ? `Switched to ${doneName}` : progress?.paused ? "Needs attention" : active ? `Switching to ${active.storeName}` : "Switching stores"

  return (
    <>
      <CommandHeader
        aside={progress ? <span className="tabular-nums">{progress.completed} of {progress.total}</span> : null}
        divider={
          <div aria-label="Store switch progress" aria-valuemax={100} aria-valuemin={0} aria-valuenow={percent} className="h-0.5 shrink-0 bg-muted" role="progressbar">
            <div className="h-full bg-primary transition-[width] duration-400 ease-out-expo motion-reduce:transition-none" style={{ width: `${percent}%` }} />
          </div>
        }
        onBack={onClose}
        parent="Switch store"
        title={title}
      />
      {doneName ? (
        <div className="flex gap-3 px-4 py-5" role="status">
          <span aria-hidden="true" className="flex size-8 shrink-0 animate-check-in items-center justify-center rounded-[0.5rem] bg-primary text-primary-foreground">
            <CheckIcon className="size-4" strokeWidth={3} />
          </span>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-base leading-6 font-medium">{doneName} is ready</p>
            <p className="m-0 text-sm text-muted-foreground">Seller Central now shows this store. Click anywhere or press any key to continue.</p>
          </div>
        </div>
      ) : active && progress ? (
        <div className="flex flex-col px-1.5 py-2">
          <SwitchSteps steps={progress.steps} />
          <div aria-live="polite">
            {progress.paused ? (
              <div className="mt-1 flex min-h-8 items-center gap-2.5 rounded-[0.375rem] bg-warning/10 px-2 py-1.5 text-xs leading-4 text-warning">
                <TriangleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">{active.attentionMessage ?? SWITCH_STAGE_LABELS.paused}</span>
              </div>
            ) : (
              <p className="m-0 px-2 pt-1 text-xs leading-4 text-muted-foreground">{SWITCH_STAGE_LABELS[active.stage] ?? "Switching stores…"}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="m-0 flex items-center gap-2.5 px-4 py-5 text-sm text-muted-foreground" role="status">
          <Spinner aria-hidden="true" className="size-4" role="presentation" />
          Starting the switch…
        </p>
      )}
      {error ? (
        <Alert className="mx-1.5 mb-1.5 w-auto" variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <CommandFooter
        action
        end={doneName ? (
          <PrimaryButton autoFocus onClick={onClose} type="button">Done</PrimaryButton>
        ) : <>
          <Button className="rounded-[0.5rem] text-destructive hover:text-destructive" disabled={busy || !active} onClick={() => void run(onCancel, onEnded)} type="button" variant="ghost">
            Cancel switch
          </Button>
          {progress?.paused ? (
            <PrimaryButton autoFocus disabled={busy} onClick={() => void run(onShowSignIn)} type="button">Show sign-in</PrimaryButton>
          ) : (
            <Button className="rounded-[0.5rem]" disabled={busy || !active} onClick={() => void run(onShowSignIn)} type="button" variant="outline">
              Show sign-in
            </Button>
          )}
        </>}
      >
        <CommandHint keys={["esc"]}>{doneName ? "Close" : "Hide, keeps running"}</CommandHint>
      </CommandFooter>
    </>
  )
}

export interface SwitchStatusCardProps {
  /** Opens on the finished state. */
  doneStoreName?: string
  isUserEvent?: (event: Event) => boolean
  onCancel: () => Promise<void>
  /** The switch ended without finishing, or the user dismissed the finished card. */
  onDismiss: () => void
  onGetAccountsStatus: () => Promise<AccountsStatus>
  onShowSignIn: () => Promise<void>
}

/**
 * The small form of the switch, for pages the switch doesn't take over: after the palette is
 * hidden, or in another tab. Once finished it stays until the user clicks or presses a key.
 */
export function SwitchStatusCard({
  doneStoreName,
  isUserEvent = isTrustedEvent,
  onCancel,
  onDismiss,
  onGetAccountsStatus,
  onShowSignIn,
}: SwitchStatusCardProps) {
  const { active, doneName } = useSwitchStatus(onGetAccountsStatus, { doneStoreName, onEnded: onDismiss })
  const { busy, error, run } = useAction()
  useDismissOnUserInput(Boolean(doneName), onDismiss, isUserEvent)

  if (!active && !doneName) return null

  const progress = active && !doneName ? switchProgress(active) : null
  const title = doneName ? `Switched to ${doneName}` : progress?.paused ? "Needs attention" : `Switching to ${active?.storeName}`
  const detail = doneName
    ? "Seller Central now shows this store."
    : progress?.paused
      ? active?.attentionMessage ?? SWITCH_STAGE_LABELS.paused
      : SWITCH_STAGE_LABELS[active?.stage ?? ""] ?? "Switching stores…"

  return (
    <section
      aria-label="Store switch"
      className="fixed right-4 bottom-4 z-50 flex w-[20rem] animate-download-in flex-col overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] ring-1 ring-foreground/10"
      data-slot="switch-status"
    >
      <div className="flex items-start gap-2.5 px-3.5 pt-3 pb-2.5">
        <span className="flex h-5 w-4 shrink-0 items-center justify-center">
          {doneName ? <CheckBubble /> : progress?.paused ? <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" /> : <Spinner aria-hidden="true" className="text-foreground/70" role="presentation" />}
        </span>
        <div aria-live="polite" className="flex min-w-0 flex-1 flex-col gap-0.5" role="status">
          <span className="truncate font-medium">{title}</span>
          <span className="text-xs leading-4 text-muted-foreground">{detail}</span>
        </div>
      </div>
      <div className="px-3.5 pb-2.5">
        <Progress aria-label="Store switch progress" value={doneName ? 100 : progress?.percent ?? 0} />
      </div>
      {progress ? (
        <>
          <div className="px-1.5 pb-1.5">
            <SwitchSteps compact steps={progress.steps} />
          </div>
          <div className="flex items-center justify-end gap-1.5 border-t border-border px-2.5 py-2">
            {error ? <span className="mr-auto min-w-0 truncate text-xs leading-4 text-destructive">{error}</span> : null}
            <button
              className="h-7 shrink-0 rounded-[0.375rem] bg-background px-2.5 text-xs leading-4 font-medium text-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted disabled:opacity-50"
              disabled={busy}
              onClick={() => void run(onShowSignIn)}
              type="button"
            >
              Show sign-in
            </button>
            <button
              className="h-7 shrink-0 rounded-[0.375rem] px-2.5 text-xs leading-4 font-medium text-destructive transition-colors hover:bg-muted disabled:opacity-50"
              disabled={busy}
              onClick={() => void run(onCancel)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </>
      ) : null}
    </section>
  )
}
