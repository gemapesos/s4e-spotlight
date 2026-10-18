import { FEEDBACK_INCOMPLETE_NOTE, feedbackSheetRows, type SellerFeedback } from "./feedback"
import type { WorkbookCell } from "./xlsxWorkbook"

export const DAILY_TASK_SECTIONS = [
  "Feedback Manager",
  "Disposal Orders",
  "Open Cases",
] as const

export function dailyTasksSheetRows(feedbacks: readonly SellerFeedback[] = []): Array<Array<WorkbookCell>> {
  const incomplete = feedbacks.some((feedback) => feedback.feedbackIncomplete)
  return [
    [DAILY_TASK_SECTIONS[0]],
    ...(incomplete ? [[FEEDBACK_INCOMPLETE_NOTE]] : []),
    ...feedbackSheetRows(feedbacks),
    [],
    [DAILY_TASK_SECTIONS[1]],
    [],
    [DAILY_TASK_SECTIONS[2]],
  ]
}
