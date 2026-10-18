export const REPORTS_PROGRESS_TYPE = "REPORTS_PROGRESS"

export const REPORT_SOURCES = ["unfulfillable", "feedback", "stranded", "suppressed", "shippingQueue"] as const
export type ReportSource = (typeof REPORT_SOURCES)[number]
export type ReportStageStatus = "pending" | "active" | "complete" | "error"
export type ReportProgressPhase = "listings" | "removal" | "issues" | "details"

export type ReportProgressEvent = {
  source: ReportSource
  status: "active" | "complete" | "error"
  loaded?: number
  total?: number
  phase?: ReportProgressPhase
  /** Why the source failed, when status is "error". */
  error?: string
}

export type ReportSourceState = {
  status: ReportStageStatus
  loaded?: number
  total?: number
  phase?: ReportProgressPhase
  error?: string
}

export type ReportProgressState = {
  prepare: ReportStageStatus
  sources: Record<ReportSource, ReportSourceState>
  workbook: ReportStageStatus
}

export const REPORT_PROGRESS_ROWS = [
  { id: "unfulfillable", label: "Unfulfillable listings" },
  { id: "feedback", label: "Seller feedback" },
  { id: "stranded", label: "Stranded inventory" },
  { id: "suppressed", label: "Search suppressed listings" },
  { id: "shippingQueue", label: "Shipping queue" },
] as const

export const INITIAL_REPORT_PROGRESS: ReportProgressState = {
  prepare: "active",
  sources: {
    unfulfillable: { status: "pending" },
    feedback: { status: "pending" },
    stranded: { status: "pending" },
    suppressed: { status: "pending" },
    shippingQueue: { status: "pending" },
  },
  workbook: "pending",
}

export function isReportSource(value: unknown): value is ReportSource {
  return (REPORT_SOURCES as readonly unknown[]).includes(value)
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
        error: event.error,
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
  if (event.source === "suppressed") return suppressedProgressPercent(event)
  if (event.source === "shippingQueue") return shippingQueueProgressPercent(event)
  return null
}

type PercentInput = Pick<ReportProgressEvent, "loaded" | "total" | "phase" | "status">

function fraction(loaded: number | undefined, total: number): number {
  return Math.min(1, (loaded ?? 0) / total)
}

/** Listings fill the first 80%; the per-item follow-up phase fills the rest. */
function twoPhasePercent(event: PercentInput, followUpPhase: ReportProgressPhase): number {
  if (event.status === "complete") return 100
  const total = event.total ?? 0
  if (event.phase === followUpPhase) return total <= 0 ? 100 : 80 + Math.round(20 * fraction(event.loaded, total))
  if (total <= 0) return event.loaded ? 80 : 0
  return Math.round(80 * fraction(event.loaded, total))
}

/** Loaded over total, or null (indeterminate) until a total is known. */
function countedPercent(event: Omit<PercentInput, "phase">): number | null {
  if (event.status === "complete") return 100
  const total = event.total
  if (total == null || total <= 0) return null
  return Math.round(100 * fraction(event.loaded, total))
}

export function unfulfillableProgressPercent(event: PercentInput): number | null {
  return twoPhasePercent(event, "removal")
}

export function suppressedProgressPercent(event: PercentInput): number | null {
  return twoPhasePercent(event, "issues")
}

export function feedbackProgressPercent(event: Omit<PercentInput, "phase">): number | null {
  return countedPercent(event)
}

export function shippingQueueProgressPercent(event: Omit<PercentInput, "phase">): number | null {
  return countedPercent(event)
}

export function reportSourceDetail(source: ReportSource, state: ReportSourceState): string {
  if (state.status === "pending") return "Waiting"
  if (state.status === "complete") return "Done"
  if (state.status === "error") return state.error ? `Failed: ${state.error}` : "Failed"
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
  if (source === "suppressed") {
    if (state.phase === "issues") {
      if (state.total) return `Suppression reasons ${state.loaded ?? 0} of ${state.total}`
      return "Loading suppression reasons"
    }
    if (state.total != null) return `${state.loaded ?? 0} of ${state.total} listings`
    if (state.loaded) return `${state.loaded} listings`
    return "Loading listings"
  }
  if (source === "shippingQueue") {
    if (state.phase === "details") {
      if (state.total) return `Shipment details ${state.loaded ?? 0} of ${state.total}`
      return "Loading shipment details"
    }
    if (state.total != null) return `${state.loaded ?? 0} of ${state.total} shipments`
    if (state.loaded) return `${state.loaded} shipments`
    return "Loading shipments"
  }
  return "Loading"
}
