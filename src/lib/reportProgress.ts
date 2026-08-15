export const REPORTS_PROGRESS_TYPE = "REPORTS_PROGRESS"

export const REPORT_SOURCES = ["unfulfillable", "feedback", "stranded"] as const
export type ReportSource = (typeof REPORT_SOURCES)[number]
export type ReportStageStatus = "pending" | "active" | "complete" | "error"
export type ReportProgressPhase = "listings" | "removal"

export type ReportProgressEvent = {
  source: ReportSource
  status: "active" | "complete" | "error"
  loaded?: number
  total?: number
  phase?: ReportProgressPhase
}

export type ReportSourceState = {
  status: ReportStageStatus
  loaded?: number
  total?: number
  phase?: ReportProgressPhase
}

export type ReportProgressState = {
  prepare: ReportStageStatus
  sources: Record<ReportSource, ReportSourceState>
  workbook: ReportStageStatus
}

export const REPORT_PROGRESS_ROWS = [
  { id: "prepare", label: "Opening Seller Central" },
  { id: "unfulfillable", label: "Unfulfillable listings" },
  { id: "feedback", label: "Seller feedback" },
  { id: "stranded", label: "Stranded inventory" },
  { id: "workbook", label: "Building spreadsheet" },
] as const

export const INITIAL_REPORT_PROGRESS: ReportProgressState = {
  prepare: "active",
  sources: {
    unfulfillable: { status: "pending" },
    feedback: { status: "pending" },
    stranded: { status: "pending" },
  },
  workbook: "pending",
}

export function isReportSource(value: unknown): value is ReportSource {
  return value === "unfulfillable" || value === "feedback" || value === "stranded"
}

export function isReportProgressEvent(value: unknown): value is ReportProgressEvent {
  if (!value || typeof value !== "object") return false
  const record = value as { source?: unknown; status?: unknown }
  if (!isReportSource(record.source)) return false
  return record.status === "active" || record.status === "complete" || record.status === "error"
}

export function isReportProgressMessage(
  value: unknown,
): value is ReportProgressEvent & { type: typeof REPORTS_PROGRESS_TYPE } {
  return Boolean(
    value
    && typeof value === "object"
    && (value as { type?: unknown }).type === REPORTS_PROGRESS_TYPE
    && isReportProgressEvent(value),
  )
}

export function applyReportProgressEvent(
  state: ReportProgressState,
  event: ReportProgressEvent,
): ReportProgressState {
  const status: ReportStageStatus = event.status === "error"
    ? "error"
    : event.status === "complete"
      ? "complete"
      : "active"
  return {
    ...state,
    sources: {
      ...state.sources,
      [event.source]: {
        status,
        loaded: event.loaded,
        total: event.total,
        phase: event.phase,
      },
    },
  }
}

export function sourcesReadyForWorkbook(state: ReportProgressState): boolean {
  return REPORT_SOURCES.every((source) => {
    const status = state.sources[source].status
    return status === "complete" || status === "error"
  })
}

export function reportWorkbookStatus(state: ReportProgressState, submitting: boolean): ReportStageStatus {
  if (state.workbook === "complete") return "complete"
  if (sourcesReadyForWorkbook(state) && submitting) return "active"
  return state.workbook
}

export function reportSourcePercent(event: Pick<ReportProgressEvent, "source" | "status" | "loaded" | "total" | "phase">): number | null {
  if (event.status === "complete") return 100
  if (event.status === "error") return null
  if (event.source === "unfulfillable") return unfulfillableProgressPercent(event)
  if (event.source === "feedback") return feedbackProgressPercent(event)
  return null
}

export function unfulfillableProgressPercent(
  event: Pick<ReportProgressEvent, "loaded" | "total" | "phase" | "status">,
): number | null {
  if (event.status === "complete") return 100
  if (event.phase === "removal") {
    const total = event.total ?? 0
    if (total <= 0) return 100
    return 80 + Math.round(20 * Math.min(1, (event.loaded ?? 0) / total))
  }
  const total = event.total ?? 0
  if (total <= 0) return event.loaded ? 80 : 0
  return Math.round(80 * Math.min(1, (event.loaded ?? 0) / total))
}

export function feedbackProgressPercent(
  event: Pick<ReportProgressEvent, "loaded" | "total" | "status">,
): number | null {
  if (event.status === "complete") return 100
  const total = event.total
  if (total == null || total <= 0) return null
  return Math.round(100 * Math.min(1, (event.loaded ?? 0) / total))
}

export function reportSourceDetail(source: ReportSource, state: ReportSourceState): string {
  if (state.status === "pending") return "Waiting"
  if (state.status === "complete") return "Done"
  if (state.status === "error") return "Failed"
  if (source === "unfulfillable") {
    if (state.phase === "removal") {
      if (state.total) return `Removal status ${state.loaded ?? 0} of ${state.total}`
      return "Checking removal status"
    }
    if (state.total) return `${state.loaded ?? 0} of ${state.total} listings`
    if (state.loaded) return `${state.loaded} listings`
    return "Loading listings"
  }
  if (source === "feedback") {
    if (state.total) return `Page ${state.loaded ?? 0} of ${state.total}`
    if (state.loaded) return `Page ${state.loaded}`
    return "Loading"
  }
  return "Loading"
}
