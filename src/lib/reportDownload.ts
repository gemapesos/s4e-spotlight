import {
  buildReportWorkbook,
  downloadBytes,
  reportFileName,
  reportWorkbookSheets,
  sheetsReportFileName,
  type GeneratedReport,
  type ReportDownloadFormat,
} from "./reports"
import { sheetPasteSheets } from "./sheetPaste"

/** Builds the Raw or Sheets workbook and downloads it. */
export function downloadGeneratedReport(
  report: GeneratedReport,
  format: ReportDownloadFormat,
  targetDocument: Document = document,
): { fileName: string; bytes: number } {
  const workbook = format === "sheets"
    ? buildReportWorkbook(sheetPasteSheets(report))
    : buildReportWorkbook(reportWorkbookSheets(report))
  const fileName = format === "sheets"
    ? sheetsReportFileName(report.storeName, report.generatedAt)
    : reportFileName(report.storeName, report.generatedAt)
  downloadBytes(workbook, fileName, targetDocument)
  return { fileName, bytes: workbook.byteLength }
}
