import { CheckIcon, CircleIcon } from "lucide-react"

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
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
import { cn } from "@/lib/utils"

export interface ReportProgressPanelProps {
  failed?: boolean
  progress: ReportProgressState
  submitting: boolean
}

function stageIcon(status: ReportStageStatus, failed: boolean) {
  if (status === "complete") return <CheckIcon aria-hidden="true" className="text-foreground" />
  if (status === "active" && !failed) return <Spinner className="size-4" />
  return (
    <CircleIcon
      aria-hidden="true"
      className={cn("size-4", status === "error" || (status === "active" && failed) ? "text-foreground" : "text-muted-foreground/50")}
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

function liveSummary(progress: ReportProgressState, submitting: boolean, failed: boolean): string {
  if (failed) return "Report generation failed."
  if (progress.prepare === "active") return "Opening Seller Central."
  const workbook = reportWorkbookStatus(progress, submitting)
  if (workbook === "active") return "Building spreadsheet."
  const active = REPORT_SOURCES
    .filter((source) => progress.sources[source].status === "active")
    .flatMap((source) => {
      const label = REPORT_PROGRESS_ROWS.find((row) => row.id === source)?.label
      return label ? [label] : []
    })
  if (active.length > 0) return `${active.join(", ")}.`
  return "Generating report."
}

export function ReportProgressPanel({ failed = false, progress, submitting }: ReportProgressPanelProps) {
  const workbook = reportWorkbookStatus(progress, submitting)

  return (
    <div className="grid gap-2 px-2 py-2">
      <p aria-live="polite" className="sr-only">{liveSummary(progress, submitting, failed)}</p>
      <ItemGroup className="gap-1">
        {REPORT_PROGRESS_ROWS.map((row) => {
          if (row.id === "prepare") {
            return (
              <ProgressRow
                key={row.id}
                current={progress.prepare === "active"}
                failed={false}
                label={row.label}
                showBar={false}
                status={progress.prepare}
              />
            )
          }
          if (row.id === "workbook") {
            return (
              <ProgressRow
                key={row.id}
                current={workbook === "active"}
                failed={false}
                label={row.label}
                showBar={false}
                status={workbook}
              />
            )
          }
          const source = row.id
          const state = progress.sources[source]
          const percent = sourcePercent(source, state)
          return (
            <ProgressRow
              key={row.id}
              current={state.status === "active"}
              detail={reportSourceDetail(source, state)}
              failed={state.status === "error"}
              label={row.label}
              percent={percent}
              showBar
              status={state.status}
            />
          )
        })}
      </ItemGroup>
    </div>
  )
}

function ProgressRow({
  current,
  detail,
  failed,
  label,
  percent,
  showBar,
  status,
}: {
  current: boolean
  detail?: string
  failed: boolean
  label: string
  percent?: number | null
  showBar: boolean
  status: ReportStageStatus
}) {
  const percentLabel = showBar && typeof percent === "number" ? `${percent}%` : null
  return (
    <Item
      aria-current={current ? "step" : undefined}
      className="items-start px-2 py-1.5"
      role="listitem"
      size="sm"
      variant={current ? "muted" : "default"}
    >
      <ItemMedia variant="icon">{stageIcon(status, failed)}</ItemMedia>
      <ItemContent className="gap-1">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <ItemTitle className={cn(status === "pending" && "text-muted-foreground")}>{label}</ItemTitle>
          {percentLabel ? (
            <span className="text-xs tabular-nums text-muted-foreground">{percentLabel}</span>
          ) : null}
        </div>
        {showBar ? (
          <Progress
            aria-label={label}
            value={status === "pending" || status === "error" ? 0 : percent ?? null}
          />
        ) : null}
        {detail && status !== "pending" ? (
          <ItemDescription className="text-xs">{detail}</ItemDescription>
        ) : null}
      </ItemContent>
    </Item>
  )
}
