import { CheckIcon, CircleAlertIcon, TriangleAlertIcon } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"
import { REPORT_PROGRESS_ROWS, reportSourceDetail, reportSourcePercent, reportWorkbookStatus, type ReportProgressState, type ReportSourceState, type ReportStageStatus } from "@/lib/reportProgress"
import type { ReportSource } from "@/reports/sources"
import type { ReportWarning } from "@/lib/reports"
import { cn } from "@/lib/utils"

export interface ReportProgressPanelProps {
  failed?: boolean
  progress: ReportProgressState
  submitting: boolean
  /** Sections that loaded only partly, shown once the report is ready. */
  warnings?: readonly ReportWarning[]
}

const PREPARE_DETAIL = "Connecting to Seller Central…"

function sourceLabel(source: ReportSource): string {
  return REPORT_PROGRESS_ROWS.find((row) => row.id === source)?.label ?? source
}

function stageIcon(status: ReportStageStatus, stopped: boolean, partial: boolean) {
  if (status === "complete" && partial) return <TriangleAlertIcon aria-hidden="true" className="size-4 text-warning" />
  if (status === "complete") {
    return (
      <span aria-hidden="true" className="flex size-4 animate-check-in items-center justify-center rounded-full bg-primary text-primary-foreground">
        <CheckIcon className="size-2.5" strokeWidth={3.5} />
      </span>
    )
  }
  if (status === "error") return <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
  if (status === "active" && !stopped) return <Spinner aria-hidden="true" className="size-4 text-foreground" role="presentation" />
  return <span aria-hidden="true" className="size-4 rounded-full border-[0.0938rem] border-dashed border-ring" />
}

function sourcePercent(source: ReportSource, state: ReportSourceState): number | null {
  if (state.status === "pending") return 0
  return reportSourcePercent({
    source,
    status: state.status === "error" ? "error" : state.status === "complete" ? "complete" : "active",
    loaded: state.loaded,
    total: state.total,
    phase: state.phase,
  })
}

function liveSummary(
  progress: ReportProgressState,
  submitting: boolean,
  failed: boolean,
  warnings: readonly ReportWarning[],
): string {
  if (failed) return "Report generation failed."
  if (progress.prepare === "active") return PREPARE_DETAIL
  if (reportWorkbookStatus(progress, submitting) === "complete") {
    return warnings.length ? `Report ready. ${warnings.map((warning) => warning.text).join(" ")}` : "Report ready."
  }
  const active = progress.sections
    .filter((source) => progress.sources[source].status === "active")
    .map(sourceLabel)
  if (active.length > 0) return `${active.join(", ")}.`
  return "Generating report."
}

interface DetailLine {
  id: string
  text: string
  tone?: "error" | "warning"
}

/** Lines under the rows: connection status, failures and partial loads, or counts for active sources. */
function detailLines(progress: ReportProgressState, failed: boolean, warnings: readonly ReportWarning[]): DetailLine[] {
  if (progress.prepare === "active") return failed ? [] : [{ id: "prepare", text: PREPARE_DETAIL }]
  const notes: DetailLine[] = []
  const counted: DetailLine[] = []
  for (const source of progress.sections) {
    const state = progress.sources[source]
    if (state.status === "error") {
      notes.push({ id: source, text: state.error ?? `${sourceLabel(source)} failed.`, tone: "error" })
      continue
    }
    if (state.status !== "active") continue
    if (state.loaded == null && state.total == null) continue
    counted.push({ id: source, text: reportSourceDetail(source, state) })
  }
  warnings.forEach((warning, index) => notes.push({ id: `${warning.source}-${index}`, text: warning.text, tone: "warning" }))
  return notes.length > 0 ? notes : counted
}

export function ReportProgressPanel({ failed = false, progress, submitting, warnings = [] }: ReportProgressPanelProps) {
  const details = detailLines(progress, failed, warnings)
  const notes = details.filter((detail) => detail.tone)
  const partialSources = new Set(warnings.map((warning) => warning.source))

  return (
    <div className="flex flex-col px-1.5 py-2">
      <p aria-live="polite" className="sr-only">{liveSummary(progress, submitting, failed, warnings)}</p>
      <div className="flex flex-col" role="list">
        {REPORT_PROGRESS_ROWS.filter((row) => progress.sections.includes(row.id)).map((row) => {
          const state = progress.sources[row.id]
          return (
            <ProgressRow
              key={row.id}
              current={state.status === "active" && !failed && progress.prepare !== "active"}
              detail={rowDetail(row.id, state, progress.prepare === "active")}
              label={row.label}
              partial={partialSources.has(row.id)}
              percent={sourcePercent(row.id, state)}
              status={state.status}
              stopped={failed}
            />
          )
        })}
      </div>
      {progress.prepare === "active" && !failed ? (
        <p className="m-0 px-2 pt-1 text-xs leading-4 text-muted-foreground">{PREPARE_DETAIL}</p>
      ) : null}
      {notes.map((note) => (
        <div
          key={note.id}
          className={cn(
            "mt-1 flex min-h-8 items-center gap-2.5 rounded-[0.375rem] px-2 py-1.5 text-xs leading-4",
            note.tone === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
          )}
        >
          <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">{note.text}</span>
        </div>
      ))}
    </div>
  )
}

/** The short status at the end of a row. */
function rowDetail(source: ReportSource, state: ReportSourceState, preparing: boolean): string {
  if (state.status === "pending" || preparing) return "Waiting"
  if (state.status === "error") return "Failed"
  if (state.status === "complete") {
    const rows = state.loaded ?? state.total
    if (rows == null) return "Done"
    return `${rows.toLocaleString("en-US")} ${rows === 1 ? "row" : "rows"}`
  }
  return reportSourceDetail(source, state)
}

function ProgressRow({
  current,
  detail,
  label,
  partial,
  percent,
  status,
  stopped,
}: {
  current: boolean
  detail: string
  label: string
  /** Finished, but some of its data couldn't be loaded. */
  partial: boolean
  percent: number | null
  status: ReportStageStatus
  /** The run failed, so active rows stop animating. */
  stopped: boolean
}) {
  return (
    <div
      aria-current={current ? "step" : undefined}
      aria-label={label}
      aria-valuetext={typeof percent === "number" ? `${percent}%` : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-[0.375rem] px-2 transition-colors duration-150",
        current && "bg-muted",
      )}
      role="listitem"
    >
      <span className="flex size-4 shrink-0 items-center justify-center">{stageIcon(status, stopped, partial)}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          current ? "font-medium text-foreground" : status === "pending" ? "text-muted-foreground" : "text-foreground/80",
        )}
      >
        {label}
      </span>
      <span className={cn("shrink-0 text-xs leading-4 tabular-nums", current ? "text-foreground/70" : "text-muted-foreground")}>
        {detail}
      </span>
    </div>
  )
}
