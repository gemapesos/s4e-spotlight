/** The report's sections, in the order they show everywhere, with each one's name and request. */
export const REPORT_SOURCES = ["unfulfillable", "feedback", "stranded", "suppressed", "shippingQueue"] as const
export type ReportSource = (typeof REPORT_SOURCES)[number]

export const REPORT_SOURCE_DETAILS = {
  unfulfillable: { label: "Unfulfillable", fetchType: "REPORTS_FETCH_UNFULFILLABLE", fetchError: "Couldn’t load unfulfillable inventory." },
  feedback: { label: "Seller Feedback", fetchType: "REPORTS_FETCH_FEEDBACK", fetchError: "Couldn’t load seller feedback." },
  stranded: { label: "Stranded", fetchType: "REPORTS_FETCH_STRANDED", fetchError: "Couldn’t load stranded inventory." },
  suppressed: { label: "Suppressed", fetchType: "REPORTS_FETCH_SUPPRESSED", fetchError: "Couldn’t load search-suppressed inventory." },
  shippingQueue: { label: "Shipping Queue", fetchType: "REPORTS_FETCH_SHIPPING_QUEUE", fetchError: "Couldn’t load shipping queue." },
} as const satisfies Record<ReportSource, { label: string; fetchType: string; fetchError: string }>

export function isReportSource(value: unknown): value is ReportSource {
  return (REPORT_SOURCES as readonly unknown[]).includes(value)
}

export type ReportFetchType = (typeof REPORT_SOURCE_DETAILS)[ReportSource]["fetchType"]

/** The section a REPORTS_FETCH_* message asks for. */
export function reportSourceFor(type: unknown): ReportSource | undefined {
  return REPORT_SOURCES.find((source) => REPORT_SOURCE_DETAILS[source].fetchType === type)
}
