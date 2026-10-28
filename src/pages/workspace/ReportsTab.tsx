import * as React from "react"
import { CheckIcon, Download, FileText, LogIn } from "lucide-react"

import { HeaderButton, Kbd, KeyHint, Notice, PanelFooter, PrimaryButton } from "@/components/panel"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/shared/log"
import { downloadGeneratedReport } from "@/reports/download"
import { applyReportProgressEvent, INITIAL_REPORT_PROGRESS, REPORT_PROGRESS_ROWS, type ReportProgressState } from "@/reports/progress"
import { REPORT_SOURCES, type ReportSource } from "@/reports/sources"
import { reportWarnings, sheetsReportFileName, type GeneratedReport, type ReportDownloadFormat } from "@/reports/report"
import type { SellerCentralSessionState } from "@/sellerCentral/session"
import { cn } from "@/lib/utils"
import { generateReports, prepareReports } from "@/reports/generate"
import { ReportProgressPanel } from "@/pages/workspace/ReportProgressPanel"
import {
  formatDuration,
  MOD_KEY,
  moveRowFocus,
  plural,
  ResultHeader,
  StoreStrip,
  useTabKeys,
  WorkspaceBody,
  type WorkspaceRuns,
} from "@/pages/workspace/workspaceParts"
import { sendToBackground, type AccountsStatus } from "@/shared/messages"

type Phase = "pick" | "running" | "ready" | "signed-out"

export function ReportsTab({
  hidden,
  onChangeStore,
  onOpenSellerCentral,
  runs,
  session,
  status,
}: {
  hidden: boolean
  onChangeStore?: () => void
  onOpenSellerCentral: () => void
  runs: React.RefObject<WorkspaceRuns>
  session: SellerCentralSessionState
  status: AccountsStatus | null
}) {
  const [phase, setPhase] = React.useState<Phase>("pick")
  const [sections, setSections] = React.useState<readonly ReportSource[]>(REPORT_SOURCES)
  const [progress, setProgress] = React.useState<ReportProgressState>(INITIAL_REPORT_PROGRESS)
  const [report, setReport] = React.useState<GeneratedReport | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [elapsedMs, setElapsedMs] = React.useState(0)
  /** Bumped when a run is stopped or replaced, so its late results are ignored. */
  const token = React.useRef(0)
  const startedAt = React.useRef(0)

  const toggle = (source: ReportSource) => {
    setSections((current) => current.includes(source)
      ? current.filter((id) => id !== source)
      : REPORT_SOURCES.filter((id) => id === source || current.includes(id)))
  }

  const generate = async () => {
    if (sections.length === 0 || phase === "running") return
    const run = ++token.current
    const chosen = sections
    startedAt.current = Date.now()
    setError(null)
    setReport(null)
    setProgress({ ...INITIAL_REPORT_PROGRESS, prepare: "active", sections: chosen })
    setPhase("running")
    let runId: string | undefined
    try {
      const prepared = await prepareReports(chosen)
      runId = prepared.runId
      if (run !== token.current) return
      if (!prepared.loggedInToStore) {
        setPhase("signed-out")
        return
      }
      if (!runId) throw new Error("Couldn’t start this report. Please try again.")
      runs.current.report = runId
      setProgress((current) => {
        const sources = { ...current.sources }
        for (const source of chosen) sources[source] = { status: "active" }
        return { ...current, prepare: "complete", sources }
      })
      const result = await generateReports({
        runId,
        sections: chosen,
        onProgress: (event) => {
          if (run !== token.current || !chosen.includes(event.source)) return
          setProgress((current) => applyReportProgressEvent(current, event))
        },
      })
      if (run !== token.current) return
      setReport(result)
      setProgress((current) => ({ ...current, workbook: "complete" }))
      setElapsedMs(Date.now() - startedAt.current)
      setPhase("ready")
    } catch (caught) {
      if (run !== token.current) return
      setError(errorMessage(caught, "Couldn’t generate the report. Please try again."))
      setPhase("pick")
    } finally {
      if (runId) {
        if (runs.current.report === runId) runs.current.report = undefined
        await sendToBackground({ type: run === token.current ? "RESULTS_FINISH" : "RESULTS_CANCEL", runId }).catch(() => undefined)
      }
    }
  }

  const stop = () => {
    token.current += 1
    const runId = runs.current.report
    runs.current.report = undefined
    if (runId) void sendToBackground({ type: "RESULTS_CANCEL", runId }).catch(() => undefined)
    setPhase("pick")
  }

  const download = (format: ReportDownloadFormat) => {
    if (!report) return
    try {
      downloadGeneratedReport(report, format, document)
    } catch (caught) {
      setError(errorMessage(caught, "Couldn’t save the workbook."))
    }
  }

  useTabKeys(!hidden, (event) => {
    if (event.isComposing) return
    if (phase === "pick" && event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void generate()
    } else if (phase === "running" && event.key === "Escape") {
      event.preventDefault()
      stop()
    } else if (phase === "signed-out" && event.key === "Escape") {
      event.preventDefault()
      setPhase("pick")
    }
  })

  const storeLabel = report?.storeName || status?.currentStore?.name || "Seller Central"
  const done = progress.sections.filter((source) => progress.sources[source].status === "complete").length
  const warnings = report ? reportWarnings(report) : []

  return (
    <section aria-labelledby="workspace-tab-reports" className="flex min-h-0 flex-1 flex-col" hidden={hidden} id="workspace-panel-reports" role="tabpanel">
      {phase === "pick" ? <>
        <WorkspaceBody>
          <StoreStrip onChange={onChangeStore} onOpenSellerCentral={onOpenSellerCentral} session={session} status={status} />
          <div aria-labelledby="report-sections-heading" className="flex flex-col" onKeyDown={(event) => moveRowFocus(event, "[data-section-row]")} role="group">
            <h2 className="m-0 px-2 pt-1 pb-1 text-xs leading-4 font-medium text-muted-foreground" id="report-sections-heading">Include</h2>
            {REPORT_PROGRESS_ROWS.map((row) => {
              const checked = sections.includes(row.id)
              return (
                <button
                  key={row.id}
                  aria-checked={checked}
                  className={cn(
                    "group/row flex h-9 w-full shrink-0 items-center gap-2.5 rounded-[0.375rem] px-2 text-left text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:font-medium",
                    checked ? "text-foreground/80 focus-visible:text-foreground" : "text-muted-foreground",
                  )}
                  data-section-row
                  onClick={() => toggle(row.id)}
                  role="checkbox"
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border",
                      checked ? "border-primary bg-primary text-primary-foreground" : "border-ring bg-background dark:bg-input/30",
                    )}
                  >
                    {checked ? <CheckIcon className="size-3 animate-check-in" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{row.label}</span>
                  <Kbd aria-hidden="true" className="opacity-0 transition-opacity duration-150 group-focus-visible/row:opacity-100">space</Kbd>
                </button>
              )
            })}
          </div>
          <p className="m-0 px-2 text-xs leading-4 text-muted-foreground">Results and downloads stay in this window. Seller Central keeps its own tab.</p>
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter
          action
          end={<PrimaryButton disabled={sections.length === 0} keys={`${MOD_KEY}↵`} onClick={() => void generate()} type="button">Generate report</PrimaryButton>}
        >
          <span className="tabular-nums">{sections.length} of {REPORT_SOURCES.length} sections</span>
        </PanelFooter>
      </> : phase === "signed-out" ? <>
        <WorkspaceBody className="pt-5">
          <div className="flex gap-3 px-1" role="alert">
            <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
              <LogIn className="size-4" />
            </span>
            <div className="flex flex-col gap-1">
              <p className="m-0 text-base leading-6 font-medium">Sign in to a Seller Central store</p>
              <p className="m-0 text-muted-foreground">
                Reports need a signed-in store. {onChangeStore ? "Switch to one of your stores, or sign in on Seller Central, then try again." : "Sign in on Seller Central, then try again."}
              </p>
            </div>
          </div>
        </WorkspaceBody>
        <PanelFooter
          action
          end={onChangeStore ? <>
            <Button className="mr-1 rounded-[0.5rem] bg-background px-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30" onClick={onOpenSellerCentral} type="button" variant="ghost">
              Open Seller Central
            </Button>
            <PrimaryButton autoFocus onClick={onChangeStore} type="button">Switch store</PrimaryButton>
          </> : <PrimaryButton autoFocus onClick={onOpenSellerCentral} type="button">Open Seller Central</PrimaryButton>}
        >
          <KeyHint keys={["esc"]}>Back</KeyHint>
        </PanelFooter>
      </> : <>
        <WorkspaceBody className="pt-4">
          <ResultHeader
            aside={phase === "ready"
              ? <HeaderButton onClick={() => { setReport(null); setPhase("pick") }} type="button">New report</HeaderButton>
              : `${done} of ${progress.sections.length}`}
            meta={phase === "ready"
              ? `${storeLabel} · ${plural(progress.sections.length, "section")} · finished in ${formatDuration(elapsedMs)}`
              : `${storeLabel} · ${plural(progress.sections.length, "section")}`}
            percent={progress.sections.length ? Math.round((100 * done) / progress.sections.length) : 0}
            title={phase === "ready" ? "Report ready" : "Generating report"}
          />
          <ReportProgressPanel failed={Boolean(error)} progress={progress} submitting={phase === "running"} warnings={warnings} />
          {error ? <Notice error message={error} onDismiss={() => setError(null)} /> : null}
        </WorkspaceBody>
        <PanelFooter
          action
          end={<>
            <Button
              aria-label="Download raw workbook"
              className="rounded-[0.5rem] text-foreground/80"
              disabled={phase !== "ready"}
              onClick={() => download("raw")}
              size="icon"
              title="Download raw workbook (debug)"
              type="button"
              variant="ghost"
            >
              <FileText aria-hidden="true" />
            </Button>
            <PrimaryButton autoFocus={phase === "ready"} disabled={phase !== "ready"} onClick={() => download("sheets")} type="button">
              <Download aria-hidden="true" />
              Download
            </PrimaryButton>
          </>}
        >
          {phase === "ready" && report
            ? <span className="truncate">{sheetsReportFileName(report.storeName, report.generatedAt)}</span>
            : <KeyHint keys={["esc"]}>Stop</KeyHint>}
        </PanelFooter>
      </>}
    </section>
  )
}
