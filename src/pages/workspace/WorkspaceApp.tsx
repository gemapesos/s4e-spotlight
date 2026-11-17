import * as React from "react"
import { Camera, FileJson, FileSpreadsheet, Lock, LockOpen, type LucideIcon } from "lucide-react"

import { Notice } from "@/components/panel"
import { ACTIVE_JOB_STORAGE_KEY, SESSION_KEY_STORAGE_KEY } from "@/shared/accounts"
import { isReportProgressMessage } from "@/reports/progress"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import { DEFAULT_ENABLED_FEATURES, isFeatureEnabled, parseSettings, type EnabledFeatures, type FeatureId } from "@/shared/settings"
import { cn } from "@/lib/utils"
import { dispatchReportProgress } from "@/reports/generate"
import { checkSellerCentralSession, getAccountsStatus, openSellerCentral } from "@/shared/requests"
import { AccountsTab } from "@/pages/workspace/AccountsTab"
import { CasesTab } from "@/pages/workspace/CasesTab"
import { ReportsTab } from "@/pages/workspace/ReportsTab"
import { ShipmentsTab } from "@/pages/workspace/ShipmentsTab"
import type { WorkspaceLaunch, WorkspaceRuns, WorkspaceTab } from "@/pages/workspace/workspaceParts"
import { isFromWorker, sendToBackground, type AccountsStatus } from "@/shared/messages"

const TABS: ReadonlyArray<{ id: WorkspaceTab; label: string; feature: FeatureId; icon: LucideIcon }> = [
  { id: "reports", label: "Reports", feature: "generate-reports", icon: FileSpreadsheet },
  { id: "cases", label: "Cases", feature: "scrape-case", icon: FileJson },
  { id: "shipments", label: "Shipments", feature: "shipment-screenshots", icon: Camera },
  { id: "accounts", label: "Accounts", feature: "accounts", icon: Lock },
]
const TAB_SHIFT_REM = 0.75
const TAB_SLIDE_MS = 220

function isWorkspaceTab(value: unknown): value is WorkspaceTab {
  return value === "reports" || value === "cases" || value === "shipments" || value === "accounts"
}

/**
 * The workspace window: results.html opened by the background as a small popup window.
 * This document is packaged and not web-accessible; it owns every result, download and the
 * master password typed into it. The background checks that runs and unlocks come from here.
 */
export function WorkspaceApp() {
  const [tab, setTab] = React.useState<WorkspaceTab>("reports")
  /** The window draws once it knows which tab it opened for, so it never flashes the wrong one. */
  const [ready, setReady] = React.useState(false)
  const [launch, setLaunch] = React.useState<WorkspaceLaunch | null>(null)
  const [error, setError] = React.useState("")
  const [features, setFeatures] = React.useState<EnabledFeatures>(DEFAULT_ENABLED_FEATURES)
  const [status, setStatus] = React.useState<AccountsStatus | null>(null)
  const [session, setSession] = React.useState<SellerCentralSessionState>("unknown")
  const runs = React.useRef<WorkspaceRuns>({})
  const panels = React.useRef<HTMLDivElement>(null)
  const previousTab = React.useRef(tab)
  const slideTabs = React.useRef(false)
  /** Arrow keys move focus along the tabs, so the new tab mustn't take it. */
  const keyboardTabMove = React.useRef(false)

  const refreshStatus = React.useCallback(async () => {
    try { setStatus(await getAccountsStatus()) } catch { /* the worker may be restarting; keep the last status */ }
  }, [])
  const refreshSession = React.useCallback(() => {
    void checkSellerCentralSession().then(setSession)
  }, [])

  const showLaunch = React.useCallback(async (launchId: string | null) => {
    try {
      const value = await sendToBackground({ type: "RESULTS_INIT", launchId })
      const mode = isWorkspaceTab(value.mode) ? value.mode : "reports"
      setLaunch((current) => ({
        mode,
        caseIds: Array.isArray(value.caseIds) ? value.caseIds.filter((id): id is string => typeof id === "string") : [],
        ...(typeof value.resumeId === "string" ? { resumeId: value.resumeId, storeName: String(value.storeName ?? "") } : {}),
        serial: (current?.serial ?? 0) + 1,
      }))
      setTab(mode)
      setError("")
    } catch {
      setError("This window has expired. Open it again from the palette.")
    } finally {
      setReady(true)
    }
  }, [])

  React.useEffect(() => {
    document.title = "S4E Spotlight"
    void showLaunch(new URLSearchParams(window.location.search).get("launch"))
    void refreshStatus()
    refreshSession()
    void sendToBackground({ type: "GET_SETTINGS" }).then(
      (response) => setFeatures(parseSettings(response.settings).features),
      () => undefined,
    )

    const onMessage = (message: unknown, sender: chrome.runtime.MessageSender, respond: (value: unknown) => void) => {
      // Only the background may drive this window.
      if (!isFromWorker(sender)) return
      if (!message || typeof message !== "object" || !("type" in message)) return
      const record = message as Record<string, unknown>
      if (record.type === "ACCOUNTS_RESUME_CHECK") { respond({ ok: true }); return }
      if (record.type === "RESULTS_SHOW" && typeof record.launchId === "string") {
        respond({ ok: true })
        void showLaunch(record.launchId)
        void refreshStatus()
        return
      }
      if (isReportProgressMessage(message) && (message as { runId?: unknown }).runId === runs.current.report) dispatchReportProgress(message)
    }
    chrome.runtime.onMessage?.addListener(onMessage)

    // Another page can lock the vault or start a switch; follow it.
    const onStorage = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === "session" && (SESSION_KEY_STORAGE_KEY in changes || ACTIVE_JOB_STORAGE_KEY in changes)) void refreshStatus()
    }
    chrome.storage?.onChanged?.addListener(onStorage)
    const onFocus = () => { void refreshStatus(); refreshSession() }
    window.addEventListener("focus", onFocus)

    // Closing the window stops whatever it was running.
    const onLeave = () => {
      for (const runId of [runs.current.report, runs.current.cases]) {
        if (runId) void sendToBackground({ type: "RESULTS_CANCEL", runId }).catch(() => undefined)
      }
      runs.current = {}
    }
    window.addEventListener("pagehide", onLeave)
    return () => {
      chrome.runtime.onMessage?.removeListener(onMessage)
      chrome.storage?.onChanged?.removeListener(onStorage)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pagehide", onLeave)
      onLeave()
    }
  }, [refreshSession, refreshStatus, showLaunch])

  const visibleTabs = TABS.filter((item) => item.id === tab || isFeatureEnabled(features, item.feature))
  const changeStore = isFeatureEnabled(features, "accounts") ? () => setTab("accounts") : undefined
  const openSeller = () => void openSellerCentral().then(refreshSession, () => setError("Couldn’t open Seller Central."))

  // ⌘1–4 jump between tabs from anywhere in the window.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return
      const target = visibleTabs[Number(event.key) - 1]
      if (!target) return
      event.preventDefault()
      setTab(target.id)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  // The new tab's body slides 12 px toward where you are going, like a palette screen.
  React.useLayoutEffect(() => {
    const from = TABS.findIndex((item) => item.id === previousTab.current)
    const to = TABS.findIndex((item) => item.id === tab)
    previousTab.current = tab
    // Opening on a tab isn't a move between tabs.
    if (!slideTabs.current) return
    const panel = panels.current?.querySelector<HTMLElement>(`#workspace-panel-${tab}`)
    if (from === to || !panel || typeof panel.animate !== "function" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    panel.animate(
      [{ opacity: 0, transform: `translateX(${to > from ? TAB_SHIFT_REM : -TAB_SHIFT_REM}rem)` }, { opacity: 1, transform: "none" }],
      { duration: TAB_SLIDE_MS, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
    )
  }, [tab])
  React.useEffect(() => { if (ready) slideTabs.current = true }, [ready])

  // Opening the window, a new launch or a tab change puts the cursor in that tab's field, once
  // the field exists: the Accounts tab draws its password or search field after the status loads.
  const vaultState = status ? `${status.initialized}:${status.unlocked}` : ""
  React.useEffect(() => {
    if (!ready) return
    if (keyboardTabMove.current) {
      keyboardTabMove.current = false
      return
    }
    panels.current?.querySelector<HTMLElement>(`#workspace-panel-${tab} [data-autofocus]:not(:disabled)`)?.focus({ preventScroll: true })
  }, [launch?.serial, ready, tab, vaultState])

  if (!ready) return <div className="h-svh bg-popover" />

  return (
    <div className="flex h-svh min-h-0 flex-col bg-popover text-sm text-popover-foreground">
      <div
        aria-label="S4E Spotlight"
        className="m-2 grid h-9 shrink-0 gap-0.5 rounded-[0.625rem] bg-muted p-[0.1875rem]"
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
          event.preventDefault()
          const index = visibleTabs.findIndex((item) => item.id === tab)
          const next = visibleTabs[(index + (event.key === "ArrowRight" ? 1 : -1) + visibleTabs.length) % visibleTabs.length]
          keyboardTabMove.current = true
          setTab(next.id)
          document.getElementById(`workspace-tab-${next.id}`)?.focus()
        }}
        role="tablist"
        style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))` }}
      >
        {visibleTabs.map((item) => {
          const selected = item.id === tab
          const Icon = item.id === "accounts" && status?.unlocked ? LockOpen : item.icon
          return (
            <button
              key={item.id}
              aria-controls={`workspace-panel-${item.id}`}
              aria-selected={selected}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-[0.4375rem] text-[0.8125rem] leading-[1.125rem] font-medium outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/50",
                selected
                  ? "bg-background text-foreground shadow-[0_0_0_0.0625rem_rgb(10_10_10/0.08),0_0.0625rem_0.125rem_rgb(0_0_0/0.06)] dark:bg-input/40"
                  : "text-muted-foreground hover:text-foreground",
              )}
              id={`workspace-tab-${item.id}`}
              onClick={() => setTab(item.id)}
              role="tab"
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <Icon aria-hidden="true" className="size-3.5" />
              {item.label}
            </button>
          )
        })}
      </div>
      <div aria-hidden="true" className="h-px shrink-0 bg-border" />
      {error ? <div className="shrink-0 px-3 pt-3"><Notice error message={error} onDismiss={() => setError("")} /></div> : null}
      <div ref={panels} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ReportsTab
          hidden={tab !== "reports"}
          onChangeStore={changeStore}
          onOpenSellerCentral={openSeller}
          runs={runs}
          session={session}
          status={status}
        />
        <CasesTab
          hidden={tab !== "cases"}
          launch={launch}
          onChangeStore={changeStore}
          onOpenSellerCentral={openSeller}
          runs={runs}
          session={session}
          status={status}
        />
        <ShipmentsTab
          hidden={tab !== "shipments"}
          launch={launch}
          onChangeStore={changeStore}
          onOpenSellerCentral={openSeller}
          session={session}
          status={status}
        />
        <AccountsTab
          hidden={tab !== "accounts"}
          launch={launch}
          onStatusChange={refreshSession}
          refreshStatus={refreshStatus}
          status={status}
        />
      </div>
    </div>
  )
}
