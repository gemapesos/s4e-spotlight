import { CheckIcon, CircleAlertIcon, CircleIcon, TriangleAlertIcon } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import {
  REPORT_PROGRESS_ROWS,
  REPORT_SOURCES,
  reportSourceDetail,
  reportSourcePercent,
  reportWorkbookStatus,
  type ReportProgressState,
  type ReportSource,
  type ReportSourceState,
  type ReportStageStatus,
} from "@/lib/reportProgress"
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
  if (status === "complete") return <CheckIcon aria-hidden="true" className="size-4 text-foreground" />
  if (status === "error") return <CircleAlertIcon aria-hidden="true" className="size-4 text-destructive" />
  if (status === "active" && !stopped) return <Spinner className="size-4" />
  return (
    <CircleIcon
      aria-hidden="true"
      className={cn("size-4", status === "active" ? "text-foreground" : "text-muted-foreground/50")}
    />
  )
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
  const active = REPORT_SOURCES
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
  for (const source of REPORT_SOURCES) {
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
  const stacked = details.some((detail) => detail.tone)
  const partialSources = new Set(warnings.map((warning) => warning.source))

  return (
    <div className="grid gap-1 px-2 py-2">
      <p aria-live="polite" className="sr-only">{liveSummary(progress, submitting, failed, warnings)}</p>
      <div className="grid gap-0.5" role="list">
        {REPORT_PROGRESS_ROWS.map((row) => {
          const state = progress.sources[row.id]
          return (
            <ProgressRow
              key={row.id}
              current={state.status === "active" && !failed}
              label={row.label}
              partial={partialSources.has(row.id)}
              percent={sourcePercent(row.id, state)}
              status={state.status}
              stopped={failed}
            />
          )
        })}
      </div>
      <div
        className={cn(
          "flex min-h-4 min-w-0 px-1.5 text-xs text-muted-foreground",
          stacked ? "flex-col gap-0.5" : "items-center gap-3",
        )}
      >
        {details.map((detail) => (
          <span
            key={detail.id}
            className={cn(
              "min-w-0 truncate",
              detail.tone === "error" && "text-destructive",
              detail.tone === "warning" && "text-warning",
            )}
            title={detail.tone ? detail.text : undefined}
          >
            {detail.text}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProgressRow({
  current,
  label,
  partial,
  percent,
  status,
  stopped,
}: {
  current: boolean
  label: string
  /** Finished, but some of its data couldn't be loaded. */
  partial: boolean
  percent: number | null
  status: ReportStageStatus
  /** The run failed, so active rows stop animating. */
  stopped: boolean
}) {
  const percentLabel = typeof percent === "number" ? `${percent}%` : null
  return (
    <div
      aria-current={current ? "step" : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-150",
        current && "bg-muted/50",
      )}
      role="listitem"
    >
      <span className="flex size-4 shrink-0 items-center justify-center">{stageIcon(status, stopped, partial)}</span>
      <span className={cn("min-w-0 flex-1 truncate text-sm", status === "pending" && "text-muted-foreground")}>
        {label}
      </span>
      <Progress
        aria-label={label}
        className="h-1 w-16 shrink-0"
        value={status === "pending" || status === "error" || stopped ? percent ?? 0 : percent ?? null}
      />
      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{percentLabel}</span>
    </div>
  )
}
