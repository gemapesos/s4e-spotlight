/** Pieces the palette's screens share. */
import type * as React from "react"
import { CircleAlert, type LucideIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"

export function ErrorAlert({ error, id }: { error: string | null; id?: string }) {
  if (!error) return null
  return (
    <Alert className="mx-1.5 mb-1.5 w-auto" id={id} variant="destructive">
      <CircleAlert aria-hidden="true" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

/** A question or notice with an icon tile, used by the confirmation screens. */
export function Notice({ icon: Icon, heading, body, role = "status" }: {
  icon: LucideIcon
  heading: string
  body: React.ReactNode
  role?: "alert" | "status"
}) {
  return (
    <div className="flex gap-3 px-4 py-5" role={role}>
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] bg-muted text-foreground/80">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="m-0 text-base leading-6 font-medium">{heading}</p>
        <p className="m-0 text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

export function CurrentBadge() {
  return (
    <span className="inline-flex h-5 items-center rounded-full px-2 text-xs leading-4 font-medium text-foreground/70 ring-1 ring-border ring-inset">
      Current
    </span>
  )
}
