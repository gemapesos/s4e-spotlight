import { feedbackSheetRows, type SellerFeedback } from "./feedback"
import type { WorkbookCell } from "./xlsxWorkbook"

export const DAILY_TASK_SECTIONS = [
  "Feedback Manager",
  "Disposal Orders",
  "Open Cases",
] as const

export function dailyTasksSheetRows(feedbacks: readonly SellerFeedback[] = []): Array<Array<WorkbookCell>> {
  return [
    [DAILY_TASK_SECTIONS[0]],
    ...feedbackSheetRows(feedbacks),
    [],
    [DAILY_TASK_SECTIONS[1]],
    [],
    [DAILY_TASK_SECTIONS[2]],
  ]
}
