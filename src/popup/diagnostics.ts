import {
  LOGS_CLEAR_MESSAGE,
  LOGS_GET_MESSAGE,
  type LogData,
  type LogEntry,
} from "@/lib/log"
import { REPORT_PROGRESS_ROWS } from "@/lib/reportProgress"
import { saveJsonFile } from "@/shared/download"
import { sendToBackground } from "@/shared/messages"

export interface LastReportSummary {
  at: number
  ms: number
  slowest?: { label: string; ms: number }
  failed: string[]
}

export async function readLogs(): Promise<LogEntry[]> {
  return (await sendToBackground({ type: LOGS_GET_MESSAGE })).entries
}

export async function clearLogs(): Promise<void> {
  await sendToBackground({ type: LOGS_CLEAR_MESSAGE })
}

function sourceLabel(source: string): string {
  return REPORT_PROGRESS_ROWS.find((row) => row.id === source)?.label ?? source
}

/** The most recent finished report run, from the palette's "report.run" entry. */
export function summarizeLastReport(entries: readonly LogEntry[]): LastReportSummary | null {
  const run = [...entries].reverse().find((entry) => entry.ctx === "palette" && entry.event === "report.run")
  if (!run || typeof run.ms !== "number") return null
  const sources = (run.data?.sources ?? {}) as Record<string, LogData>
  const slowestId = typeof run.data?.slowest === "string" ? run.data.slowest : undefined
  const slowestMs = slowestId ? sources[slowestId]?.ms : undefined
  const failed = Array.isArray(run.data?.failed) ? run.data.failed.filter((id): id is string => typeof id === "string") : []
  return {
    at: run.t,
    ms: run.ms,
    ...(slowestId && typeof slowestMs === "number" ? { slowest: { label: sourceLabel(slowestId), ms: slowestMs } } : {}),
    failed: failed.map(sourceLabel),
  }
}

export function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`
}

export function logsFileName(date = new Date()): string {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-")
  return `s4e-spotlight-logs-${day}.json`
}

export function downloadLogs(entries: readonly LogEntry[], targetDocument: Document = document): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    extensionVersion: chrome.runtime.getManifest?.().version,
    userAgent: navigator.userAgent,
    entries,
  }
  saveJsonFile(payload, logsFileName(), targetDocument)
}
