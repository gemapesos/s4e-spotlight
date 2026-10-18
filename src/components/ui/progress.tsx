import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const indeterminate = value == null
  const percent = indeterminate ? 0 : Math.min(100, Math.max(0, value || 0))

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      data-indeterminate={indeterminate || undefined}
      className={cn(
        "relative h-1 w-full overflow-hidden rounded-full bg-muted",
        className
      )}
      value={indeterminate ? null : value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-transform duration-500 ease-out-expo motion-reduce:transition-none"
        style={{ transform: `translateX(-${100 - percent}%)` }}
      />
      <span
        aria-hidden="true"
        data-slot="progress-indeterminate"
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-[35%] bg-primary motion-reduce:hidden",
          indeterminate ? "opacity-100" : "opacity-0 transition-opacity duration-300 ease-out",
        )}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
