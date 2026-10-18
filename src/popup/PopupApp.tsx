import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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

function Diagnostics() {
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

  return (
    <section aria-labelledby="diagnostics-heading" className="grid gap-2 px-4 py-3">
      <div>
        <h2 className="text-sm font-medium" id="diagnostics-heading">Diagnostics</h2>
        <p className="text-xs text-muted-foreground">
          {summary ? lastReportText(summary) : "Timings and errors stay on this device."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          disabled={!available || busy}
          onClick={() => void run(async () => {
            const entries = await readLogs()
            downloadLogs(entries)
            return `Downloaded ${entries.length} log ${entries.length === 1 ? "entry" : "entries"}.`
          })}
          size="sm"
          type="button"
          variant="outline"
        >
          Download logs
        </Button>
        <Button
          disabled={!available || busy}
          onClick={() => void run(async () => {
            await clearLogs()
            setSummary(null)
            return "Logs cleared."
          })}
          size="sm"
          type="button"
          variant="ghost"
        >
          Clear
        </Button>
      </div>
      {status ? <p aria-live="polite" className="text-xs text-muted-foreground">{status}</p> : null}
    </section>
  )
}

export function PopupApp() {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null)
  const [error, setError] = React.useState<string | null>(null)

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
    <p className="px-4 py-2.5 text-sm text-destructive" role="alert">{error}</p>
  ) : null

  if (!settings) {
    return (
      <div className="w-80 bg-background text-sm text-foreground">
        {errorMessageView ?? <p className="px-4 py-3 text-muted-foreground">Loading…</p>}
      </div>
    )
  }

  return (
    <div className="w-80 bg-background text-foreground">
      <header className="px-4 py-3">
        <h1 className="text-sm font-medium">Settings</h1>
      </header>
      <Separator />
      <ul>
        {FEATURES.map((feature, index) => {
          const link = FEATURE_LINKS[feature.id]
          return (
            <li key={feature.id}>
              {index ? <Separator /> : null}
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <Label htmlFor={`feature-${feature.id}`}>
                  {feature.label}
                </Label>
                <Switch
                  checked={settings.features[feature.id]}
                  id={`feature-${feature.id}`}
                  onCheckedChange={(checked) => setFeature(feature.id, checked)}
                />
              </div>
              {link ? (
                <div className="px-4 pb-2.5">
                  <Button onClick={link.open} size="sm" type="button" variant="ghost">
                    {link.label}
                  </Button>
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
      {errorMessageView}
      <Separator />
      <Diagnostics />
    </div>
  )
}
