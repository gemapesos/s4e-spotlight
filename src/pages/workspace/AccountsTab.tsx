import * as React from "react"
import { Building2, ExternalLink, Lock, Search, Settings, TriangleAlertIcon } from "lucide-react"

import { Field, HeaderButton, Kbd, Notice, PanelFooter, PrimaryButton } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { errorMessage } from "@/shared/log"
import { moveRowFocus, WorkspaceBody, type WorkspaceLaunch } from "@/pages/workspace/workspaceParts"
import { CheckBubble, SWITCH_STAGE_LABELS, SwitchSteps, switchProgress } from "@/components/switch/SwitchProgress"
import { sendToBackground, type AccountsStatus, type AccountStoreSummary, type ActiveSwitchSummary } from "@/shared/messages"

const SWITCH_POLL_MS = 750

/** A running switch, or the one that just finished, as a card above the store list. */
function SwitchCard({
  active,
  busy,
  doneName,
  onCancel,
  onDismiss,
  onShowSignIn,
}: {
  active: ActiveSwitchSummary | undefined
  busy: boolean
  doneName: string | null
  onCancel: () => void
  onDismiss: () => void
  onShowSignIn: () => void
}) {
  const progress = active && !doneName ? switchProgress(active) : null
  const title = doneName ? `Switched to ${doneName}` : progress?.paused ? "Needs attention" : `Switching to ${active?.storeName ?? "your store"}`
  const detail = doneName
    ? "Seller Central now shows this store."
    : progress?.paused
      ? active?.attentionMessage ?? SWITCH_STAGE_LABELS.paused
      : "Runs in its own window. You can keep working."
  return (
    <section aria-label="Store switch" className="flex shrink-0 flex-col gap-1.5 rounded-[0.625rem] bg-muted pt-2.5 pr-2.5 pb-2 pl-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-4 shrink-0 items-center justify-center">
          {doneName ? <CheckBubble /> : progress?.paused
            ? <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
            : <Spinner aria-hidden="true" className="size-4 text-foreground/70" role="presentation" />}
        </span>
        <div aria-live="polite" className="flex min-w-0 flex-1 flex-col" role="status">
          <span className="truncate font-medium">{title}</span>
          <span className="text-xs leading-4 text-muted-foreground">{detail}</span>
        </div>
        {progress ? <span className="self-start pt-0.5 text-xs leading-4 text-muted-foreground tabular-nums">{progress.completed} of {progress.total}</span> : null}
      </div>
      {progress ? <>
        <div aria-hidden="true" className="my-0.5 ml-[1.625rem] h-px bg-border" />
        <div className="pl-4">
          <SwitchSteps compact steps={progress.steps} />
        </div>
      </> : null}
      <div className="flex justify-end gap-1 pt-0.5">
        {doneName ? (
          <HeaderButton onClick={onDismiss} type="button">Done</HeaderButton>
        ) : <>
          <Button
            className="h-7 rounded-[0.375rem] px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy || !active}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Cancel switch
          </Button>
          <HeaderButton disabled={busy || !active} onClick={onShowSignIn} type="button">Show sign-in</HeaderButton>
        </>}
      </div>
    </section>
  )
}

export function AccountsTab({
  hidden,
  launch,
  onStatusChange,
  refreshStatus,
  status,
}: {
  hidden: boolean
  launch: WorkspaceLaunch | null
  /** Called after anything that changes the vault or the current store. */
  onStatusChange: () => void
  refreshStatus: () => Promise<void>
  status: AccountsStatus | null
}) {
  const [password, setPassword] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [resume, setResume] = React.useState<{ id: string; storeName: string } | null>(
    () => launch?.resumeId ? { id: launch.resumeId, storeName: launch.storeName || "the selected store" } : null,
  )
  const [doneName, setDoneName] = React.useState<string | null>(null)
  const lastActive = React.useRef<ActiveSwitchSummary | null>(null)

  // An unlock the palette asked for names the store to switch to once the vault opens.
  const appliedLaunch = React.useRef(launch?.serial)
  const launchSerial = launch?.serial
  React.useEffect(() => {
    if (!launch || launch.serial === appliedLaunch.current) return
    appliedLaunch.current = launch.serial
    if (!launch.resumeId) return
    setResume({ id: launch.resumeId, storeName: launch.storeName || "the selected store" })
    setError(null)
  }, [launchSerial])

  // Follow a running switch; when it ends at its store, keep a finished card until dismissed.
  const active = status?.activeSwitch
  React.useEffect(() => {
    if (active) {
      lastActive.current = active
      setDoneName(null)
      const timer = window.setInterval(() => void refreshStatus(), SWITCH_POLL_MS)
      return () => window.clearInterval(timer)
    }
    const last = lastActive.current
    lastActive.current = null
    if (last && status?.currentStore?.id === last.storeId) {
      setDoneName(last.storeName)
      onStatusChange()
    }
  }, [active, onStatusChange, refreshStatus, status?.currentStore?.id])

  const run = async (action: () => Promise<unknown>, failure: string) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(errorMessage(caught, failure))
    } finally {
      setBusy(false)
      await refreshStatus()
    }
  }

  const unlock = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || !password) return
    void run(async () => {
      await sendToBackground({ type: "ACCOUNTS_UNLOCK", masterPassword: password })
      setPassword("")
      onStatusChange()
      if (!resume) return
      const pending = resume
      setResume(null)
      // Starts the palette's switch; a window opened only for this unlock then closes.
      await sendToBackground({ type: "ACCOUNTS_RESUME_SWITCH", resumeId: pending.id })
    }, "Couldn’t unlock accounts.")
  }

  const choose = (store: AccountStoreSummary) => {
    if (busy) return
    void run(async () => {
      if (status?.currentStore?.id === store.id) {
        await sendToBackground({ type: "ACCOUNTS_FOCUS_CURRENT_STORE" })
        return
      }
      setDoneName(null)
      await sendToBackground({ type: "ACCOUNTS_START_SWITCH", storeId: store.id })
    }, "Couldn’t start the store switch.")
  }

  const openAccountsPage = () => void run(() => sendToBackground({ type: "ACCOUNTS_OPEN_OPTIONS" }), "Couldn’t open the Accounts page.")

  const panelProps = {
    "aria-labelledby": "workspace-tab-accounts",
    className: "flex min-h-0 flex-1 flex-col",
    hidden,
    id: "workspace-panel-accounts",
    role: "tabpanel",
  } as const

  if (!status) {
    return (
      <section {...panelProps}>
        <WorkspaceBody><p className="m-0 px-2 py-2 text-muted-foreground">Loading…</p></WorkspaceBody>
      </section>
    )
  }

  if (!status.initialized || !status.unlocked) {
    const setUp = !status.initialized
    return (
      <section {...panelProps}>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={setUp ? (event) => { event.preventDefault(); openAccountsPage() } : unlock}>
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-x-hidden overflow-y-auto px-6 pt-10 pb-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-[0.625rem] bg-muted text-foreground/80">
                <Lock className="size-[1.125rem]" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="m-0 text-base leading-6 font-medium">{setUp ? "Set up accounts first" : "Unlock accounts"}</h2>
                <p className="m-0 max-w-80 text-muted-foreground">
                  {setUp
                    ? "Create the encrypted vault on the Accounts page, then switch stores from here or the palette."
                    : "Typed here, in an extension window, so no web page can read it. Stays unlocked until Chrome closes."}
                </p>
              </div>
            </div>
            {setUp ? null : (
              <Field htmlFor="workspace-master-password" label="Master password">
                <Input
                  autoComplete="current-password"
                  data-autofocus
                  className="h-10 rounded-[0.625rem] px-3"
                  disabled={busy}
                  id="workspace-master-password"
                  onChange={(event) => { setPassword(event.target.value); setError(null) }}
                  type="password"
                  value={password}
                />
              </Field>
            )}
            {resume && !setUp ? (
              <div className="flex min-h-11 items-center gap-2.5 rounded-[0.625rem] bg-muted px-3 py-2">
                <Building2 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 text-foreground/80">Then switch to <span className="font-medium text-foreground">{resume.storeName}</span></span>
                <span className="shrink-0 text-xs leading-4 text-muted-foreground">From the palette</span>
              </div>
            ) : null}
            {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
          </div>
          <PanelFooter
            action
            end={setUp
              ? <PrimaryButton disabled={busy} type="submit">Open Accounts page</PrimaryButton>
              : <PrimaryButton disabled={busy || !password} type="submit">{busy ? "Unlocking…" : resume ? "Unlock and switch" : "Unlock"}</PrimaryButton>}
          >
            {setUp ? null : (
              <span className="inline-flex items-center gap-0.5">
                Forgot it?
                <Button
                  className="h-7 rounded-[0.375rem] px-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={busy}
                  onClick={openAccountsPage}
                  type="button"
                  variant="ghost"
                >
                  Reset vault
                </Button>
              </span>
            )}
          </PanelFooter>
        </form>
      </section>
    )
  }

  const filter = query.trim().toLowerCase()
  const stores = filter ? status.stores.filter((store) => store.name.toLowerCase().includes(filter)) : status.stores

  return (
    <section {...panelProps}>
      <WorkspaceBody>
        <label className="flex h-8 shrink-0 cursor-text items-center gap-2 rounded-[0.5rem] bg-muted px-2.5">
          <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search stores"
            data-autofocus
            className="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return
              event.preventDefault()
              document.querySelector<HTMLElement>("[data-store-row]")?.focus()
            }}
            placeholder="Search stores…"
            value={query}
          />
        </label>
        {active || doneName ? (
          <SwitchCard
            active={active}
            busy={busy}
            doneName={doneName}
            onCancel={() => void run(() => sendToBackground({ type: "ACCOUNTS_CANCEL_SWITCH" }), "Couldn’t cancel the switch.")}
            onDismiss={() => setDoneName(null)}
            onShowSignIn={() => void run(() => sendToBackground({ type: "ACCOUNTS_FOCUS_SWITCH" }), "Couldn’t show the sign-in window.")}
          />
        ) : null}
        <div aria-labelledby="workspace-stores-heading" className="flex flex-col" onKeyDown={(event) => moveRowFocus(event, "[data-store-row]")} role="group">
          <h2 className="m-0 px-2 pt-1 pb-1 text-xs leading-4 font-medium text-muted-foreground" id="workspace-stores-heading">Stores</h2>
          {stores.map((store) => {
            const current = status.currentStore?.id === store.id
            const switching = active?.storeId === store.id
            return (
              <button
                key={store.id}
                className="group/row flex h-9 w-full shrink-0 items-center gap-2 rounded-[0.375rem] px-2 text-left text-sm text-foreground/80 outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:font-medium focus-visible:text-foreground disabled:opacity-50"
                data-store-row
                disabled={busy}
                onClick={() => choose(store)}
                type="button"
              >
                <Building2 aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-focus-visible/row:text-foreground" />
                <span className="min-w-0 flex-1 truncate">{store.name}</span>
                {current ? (
                  <span className="inline-flex h-5 items-center rounded-full px-2 text-xs leading-4 font-medium text-foreground/70 ring-1 ring-border ring-inset">Current</span>
                ) : switching ? (
                  <span className="text-xs leading-4 font-normal text-muted-foreground">Switching…</span>
                ) : (
                  <Kbd aria-hidden="true" className="opacity-0 transition-opacity duration-150 group-focus-visible/row:opacity-100">↵</Kbd>
                )}
              </button>
            )
          })}
          {stores.length === 0 ? (
            <p className="m-0 px-2 py-6 text-center text-muted-foreground">{filter ? "No matching stores." : "No stores yet. Add them on the Accounts page."}</p>
          ) : null}
          <div aria-hidden="true" className="-mx-3 my-1 h-px bg-border" />
          <button
            className="group/row flex h-9 w-full shrink-0 items-center gap-2 rounded-[0.375rem] px-2 text-left text-sm text-foreground/80 outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:text-foreground"
            data-store-row
            onClick={openAccountsPage}
            type="button"
          >
            <Settings aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">Manage accounts</span>
            <ExternalLink aria-hidden="true" className="size-3.5 shrink-0 text-ring" />
          </button>
        </div>
        {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
      </WorkspaceBody>
      <PanelFooter
        action
        end={(
          <Button
            className="gap-1.5 rounded-[0.5rem] bg-background px-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50"
            disabled={busy}
            onClick={() => void run(async () => { await sendToBackground({ type: "ACCOUNTS_LOCK" }); onStatusChange() }, "Couldn’t lock accounts.")}
            type="button"
            variant="ghost"
          >
            <Lock aria-hidden="true" />
            Lock
          </Button>
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
          Unlocked until Chrome closes
        </span>
      </PanelFooter>
    </section>
  )
}
