import * as React from "react"

import type { LucideIcon } from "lucide-react"
import { Building2, Clock, Download, FileJson, FileSpreadsheet, FolderOpen, Package, Truck } from "lucide-react"

import { KeyHint, PanelFooter } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { createLogger, describeError, errorMessage } from "@/lib/log"
import {
  FEATURES,
  loadSettings,
  parseSettings,
  saveSettings,
  type ExtensionSettings,
  type FeatureId,
} from "@/lib/settings"
import {
  clearLogs,
  downloadLogs,
  formatSeconds,
  readLogs,
  summarizeLastReport,
  type LastReportSummary,
} from "@/popup/diagnostics"

const popupLog = createLogger("popup")

export function openTimeOutFormPage(): void {
  void chrome.tabs.create({ url: chrome.runtime.getURL("timeout.html") })
}

function openAccountsPage(): void {
  void chrome.runtime.openOptionsPage()
}

const FEATURE_ICONS: Record<FeatureId, LucideIcon> = {
  "open-case-ids": FolderOpen,
  "scrape-case": FileJson,
  "open-shipment-ids": Truck,
  "search-skus": Package,
  "time-out": Clock,
  "generate-reports": FileSpreadsheet,
  accounts: Building2,
}

const FEATURE_LINKS: Partial<Record<FeatureId, { label: string; open: () => void }>> = {
  "time-out": { label: "Edit form values", open: openTimeOutFormPage },
  accounts: { label: "Manage accounts", open: openAccountsPage },
}

function lastReportText(summary: LastReportSummary): string {
  const parts = [`Last report took ${formatSeconds(summary.ms)}`]
  if (summary.slowest) parts.push(`${summary.slowest.label} was slowest (${formatSeconds(summary.slowest.ms)})`)
  if (summary.failed.length > 0) parts.push(`${summary.failed.join(", ")} failed`)
  return `${parts.join(" · ")}.`
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/u.test(navigator.platform)

/** A row link in the popup, such as Edit form values. */
function RowLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Button
      className="h-6 rounded-[0.375rem] px-2 text-xs font-medium text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
      onClick={onClick}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}

function GroupHeading({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 className="m-0 px-2 pt-2 pb-1 text-xs leading-4 font-medium text-muted-foreground" id={id}>{children}</h2>
}

function useDiagnostics() {
  const [busy, setBusy] = React.useState(false)
  const [summary, setSummary] = React.useState<LastReportSummary | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const available = typeof chrome !== "undefined" && typeof chrome.runtime?.sendMessage === "function"

  React.useEffect(() => {
    if (!available) return
    let cancelled = false
    void readLogs().then(
      (entries) => { if (!cancelled) setSummary(summarizeLastReport(entries)) },
      () => undefined,
    )
    return () => { cancelled = true }
  }, [available])

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    try {
      setStatus(await action())
    } catch (error) {
      setStatus(errorMessage(error, "Couldn’t read the logs."))
    } finally {
      setBusy(false)
    }
  }

  const download = () => void run(async () => {
    const entries = await readLogs()
    downloadLogs(entries)
    return `Downloaded ${entries.length} log ${entries.length === 1 ? "entry" : "entries"}.`
  })
  const clear = () => void run(async () => {
    await clearLogs()
    setSummary(null)
    return "Logs cleared."
  })

  return { available, busy, clear, download, status, summary }
}

export function PopupApp() {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const diagnostics = useDiagnostics()

  React.useEffect(() => {
    void loadSettings().then(setSettings, (caught: unknown) => {
      popupLog.error("settings.loadFailed", { error: describeError(caught) })
      setError(errorMessage(caught, "Couldn’t load settings."))
    })
  }, [])

  const persist = React.useCallback(async (next: ExtensionSettings) => {
    const parsed = parseSettings(next)
    setSettings(parsed)
    try {
      await saveSettings(parsed)
      setError(null)
    } catch (caught) {
      popupLog.error("settings.saveFailed", { error: describeError(caught) })
      setError(errorMessage(caught, "Couldn’t save settings."))
    }
  }, [])

  const setFeature = React.useCallback(
    (id: FeatureId, enabled: boolean) => {
      if (!settings) return
      void persist({
        ...settings,
        features: { ...settings.features, [id]: enabled },
      })
    },
    [persist, settings],
  )

  const errorMessageView = error ? (
    <p className="m-0 px-3 py-2 text-xs leading-4 text-destructive" role="alert">{error}</p>
  ) : null

  return (
    <div className="w-80 bg-popover text-sm text-popover-foreground">
      <header className="flex h-11 items-center justify-between px-3">
        <h1 className="m-0 text-sm font-medium">S4E Spotlight</h1>
        <span className="text-xs leading-4 text-muted-foreground">
          <KeyHint keys={[isMac ? "⌘" : "Ctrl", "/"]}>to open</KeyHint>
        </span>
      </header>
      <div aria-hidden="true" className="h-px bg-border" />
      {!settings ? (
        errorMessageView ?? <p className="m-0 px-3 py-3 text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col px-1.5 py-1">
          <GroupHeading id="commands-heading">Commands</GroupHeading>
          <ul aria-labelledby="commands-heading" className="m-0 flex list-none flex-col p-0">
            {FEATURES.map((feature) => {
              const link = FEATURE_LINKS[feature.id]
              const Icon = FEATURE_ICONS[feature.id]
              const enabled = settings.features[feature.id]
              return (
                <li
                  key={feature.id}
                  className="flex h-10 items-center gap-2 rounded-[0.375rem] pr-2 pl-2 transition-colors duration-150 hover:bg-muted"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <label
                    className={cn("min-w-0 flex-1 cursor-pointer truncate", enabled ? "text-foreground/80" : "text-muted-foreground")}
                    htmlFor={`feature-${feature.id}`}
                  >
                    {feature.label}
                  </label>
                  {link ? <RowLink onClick={link.open}>{link.label}</RowLink> : null}
                  <Switch
                    checked={enabled}
                    id={`feature-${feature.id}`}
                    onCheckedChange={(checked) => setFeature(feature.id, checked)}
                  />
                </li>
              )
            })}
          </ul>
          {errorMessageView}
          <div aria-hidden="true" className="-mx-1.5 my-1 h-px bg-border" />
          <section aria-labelledby="diagnostics-heading">
            <GroupHeading id="diagnostics-heading">Diagnostics</GroupHeading>
            <p className="m-0 px-2 pb-2 text-xs leading-4 text-muted-foreground">
              {diagnostics.summary ? lastReportText(diagnostics.summary) : "Timings and errors from report runs show here."} Logs stay on this device.
            </p>
          </section>
        </div>
      )}
      <PanelFooter
        action
        end={<>
          <Button
            className="rounded-[0.5rem] px-2.5 text-foreground/80"
            disabled={!diagnostics.available || diagnostics.busy}
            onClick={diagnostics.clear}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
          <Button
            className="gap-1.5 rounded-[0.5rem] bg-background px-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50"
            disabled={!diagnostics.available || diagnostics.busy}
            onClick={diagnostics.download}
            type="button"
            variant="ghost"
          >
            <Download aria-hidden="true" />
            Download logs
          </Button>
        </>}
      >
        <span aria-live="polite" className="truncate">{diagnostics.status}</span>
      </PanelFooter>
    </div>
  )
}
