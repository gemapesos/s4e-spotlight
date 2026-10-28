/** What a bulk removal opened and skipped, and the next removal order ID. */
import { CircleAlert, PackageMinus } from "lucide-react"

import type { BulkRemovalSummary } from "@/shared/messages"

export function RemovalSummary({ summary }: { summary: BulkRemovalSummary | null }) {
  if (!summary) return null
  const { openedCount, skipped, nextRemovalOrderId, eligibilityUnknown } = summary
  const Icon = openedCount ? PackageMinus : CircleAlert
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      <div className="flex gap-3" role={openedCount ? "status" : "alert"}>
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
          <Icon className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="m-0 text-base leading-6 font-medium">
            {openedCount ? `Opened a removal for ${openedCount} SKU${openedCount === 1 ? "" : "s"}` : "No SKUs can be removed"}
          </p>
          <p className="m-0 text-sm text-muted-foreground">
            {openedCount
              ? "Choose the method, address and quantities on Amazon’s Create removal order page, then review it."
              : "Nothing was opened."}
            {eligibilityUnknown ? " Amazon didn’t confirm eligibility for every SKU; its form checks them again." : null}
          </p>
        </div>
      </div>
      {nextRemovalOrderId ? (
        <div className="flex items-center justify-between gap-3 rounded-[0.625rem] bg-muted px-3 py-2">
          <span className="text-xs leading-4 text-muted-foreground">Next removal order ID</span>
          <span className="font-mono text-sm font-medium select-all">{nextRemovalOrderId}</span>
        </div>
      ) : null}
      {skipped.length ? (
        <div className="flex flex-col gap-1.5">
          <p className="m-0 text-xs leading-4 font-medium text-muted-foreground">Skipped {skipped.length} SKU{skipped.length === 1 ? "" : "s"}</p>
          <ul aria-label="Skipped SKUs" className="no-scrollbar m-0 flex max-h-36 list-none flex-col gap-1 overflow-y-auto p-0">
            {skipped.map(({ sku, reason }) => (
              <li key={sku} className="flex min-w-0 gap-2 text-sm">
                <span className="shrink-0 font-mono text-foreground/80">{sku}</span>
                <span className="min-w-0 truncate text-muted-foreground" title={reason}>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
