/** Runs a report for the workspace window: asks the worker for each chosen section, then builds the report. */
import { createLogger, describeError, errorMessage, logNow, type LogData } from "@/lib/log"
import type { ReportProgressEvent } from "@/lib/reportProgress"
import { reportWarnings, type GeneratedReport } from "@/lib/reports"
import { REPORT_SOURCES, type ReportSource } from "@/reports/sources"
import { sendToBackground } from "@/shared/messages"
import { getAccountsStatus } from "@/shared/requests"

// The popup's last-report summary reads this run's "report.run" entry under "palette".
const paletteLog = createLogger("palette")

export async function prepareReports(sections: readonly ReportSource[] = REPORT_SOURCES): Promise<{ loggedInToStore: boolean; runId?: string }> {
  const response = await sendToBackground({ type: "REPORTS_PREPARE", sections })
  return { loggedInToStore: response.loggedInToStore !== false, runId: response.runId }
}

const reportProgressListeners = new Set<(event: ReportProgressEvent) => void>()

export function subscribeReportProgress(listener: (event: ReportProgressEvent) => void): () => void {
  reportProgressListeners.add(listener)
  return () => { reportProgressListeners.delete(listener) }
}

export function dispatchReportProgress(event: ReportProgressEvent): void {
  for (const listener of reportProgressListeners) listener(event)
}

export interface GenerateReportsOptions {
  /** The run REPORTS_PREPARE started; the worker only answers fetches for it. */
  runId: string
  sections?: readonly ReportSource[]
  /** Defaults to the store the vault last switched to. */
  storeName?: string
  onProgress?: (event: ReportProgressEvent) => void
  now?: Date
}

export async function generateReports({
  runId,
  sections = REPORT_SOURCES,
  storeName: currentStoreName,
  onProgress,
  now = new Date(),
}: GenerateReportsOptions): Promise<GeneratedReport> {
  const unsubscribe = onProgress ? subscribeReportProgress(onProgress) : () => undefined
  const done = paletteLog.time("report.run")
  const sources: Partial<Record<ReportSource, LogData>> = {}
  /**
   * Resolves a chosen source to its value, or to `fallback` after reporting the failure.
   * A source that wasn't chosen resolves to `fallback` without a request.
   */
  const track = <T,>(source: ReportSource, request: () => Promise<T>, fallback: T, count: (value: T) => number) => {
    if (!sections.includes(source)) return Promise.resolve(fallback)
    const startedAt = logNow()
    const elapsed = () => Math.round(logNow() - startedAt)
    return request().then(
      (value) => {
        const rows = count(value)
        sources[source] = { ms: elapsed(), count: rows }
        onProgress?.({ source, status: "complete", loaded: rows, total: rows })
        return value
      },
      (error: unknown) => {
        const message = errorMessage(error, "Couldn’t load this report section.")
        sources[source] = { ms: elapsed(), error: message }
        paletteLog.warn("report.sourceFailed", { source, error: describeError(error) })
        onProgress?.({ source, status: "error", error: message })
        return fallback
      },
    )
  }
  try {
    const storeName =
      currentStoreName !== undefined
        ? currentStoreName
        : (await getAccountsStatus()).currentStore?.name ?? ""
    for (const source of sections) onProgress?.({ source, status: "active" })
    const length = (items: readonly unknown[]) => items.length
    const [unfulfillable, feedbacks, strandedListings, suppressedListings, shipments] = await Promise.all([
      track(
        "unfulfillable",
        async () => {
          const { listings, nextRemovalOrderId } = await sendToBackground({ type: "REPORTS_FETCH_UNFULFILLABLE", runId })
          return { listings, nextRemovalOrderId }
        },
        { listings: [], nextRemovalOrderId: null },
        (value) => value.listings.length,
      ),
      track("feedback", async () => (await sendToBackground({ type: "REPORTS_FETCH_FEEDBACK", runId })).feedbacks, [], length),
      track("stranded", async () => (await sendToBackground({ type: "REPORTS_FETCH_STRANDED", runId })).listings, [], length),
      track("suppressed", async () => (await sendToBackground({ type: "REPORTS_FETCH_SUPPRESSED", runId })).listings, [], length),
      track("shippingQueue", async () => (await sendToBackground({ type: "REPORTS_FETCH_SHIPPING_QUEUE", runId })).shipments, [], length),
    ])
    const timed = Object.entries(sources) as Array<[ReportSource, LogData]>
    const slowest = timed.reduce<[ReportSource, LogData] | undefined>(
      (best, entry) => (!best || Number(entry[1].ms) > Number(best[1].ms) ? entry : best),
      undefined,
    )
    const report: GeneratedReport = {
      storeName,
      generatedAt: now,
      sections,
      unfulfillableListings: unfulfillable.listings,
      nextRemovalOrderId: unfulfillable.nextRemovalOrderId,
      feedbacks,
      strandedListings,
      suppressedListings,
      shipments,
    }
    const warnings = reportWarnings(report)
    done({
      sections: [...sections],
      sources,
      slowest: slowest?.[0],
      failed: timed.filter(([, data]) => data.error).map(([source]) => source),
      ...(warnings.length ? { warnings: warnings.map(({ source, text }) => `${source}: ${text}`) } : {}),
    })
    return report
  } catch (error) {
    done({ error: describeError(error), sources }, "error")
    throw error
  } finally {
    unsubscribe()
  }
}
