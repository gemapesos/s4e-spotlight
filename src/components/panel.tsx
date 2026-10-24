import * as React from "react"
import { CircleAlertIcon, CircleCheckIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

/**
 * The shared anatomy of the palette and the extension pages: surfaces with a header row and a
 * hairline, rows, and a footer band that holds a screen's keys and its main action.
 */

function Kbd({
  className,
  inverted = false,
  muted = false,
  ...props
}: React.ComponentProps<"kbd"> & {
  /** On a primary button. */
  inverted?: boolean
  /** On an outline button. */
  muted?: boolean
}) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-[1.125rem] min-w-[1.125rem] shrink-0 items-center justify-center rounded-[0.25rem] px-1 font-sans text-[0.6875rem] leading-[1.125rem] font-medium",
        inverted
          ? "bg-primary-foreground/15 text-primary-foreground"
          : muted
            ? "bg-muted text-foreground/70"
            : "bg-background text-foreground/70 shadow-[0_0_0_0.0625rem] shadow-foreground/12",
        className
      )}
      {...props}
    />
  )
}

/** One or more keys and what they do, for a footer band. */
function KeyHint({ keys, children }: { keys: readonly string[]; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {keys.map((key) => <Kbd key={key}>{key}</Kbd>)}
      {children ? <span className="ml-0.5">{children}</span> : null}
    </span>
  )
}

/**
 * The bottom band of a surface: status or hints on the left, hints or the main action on the
 * right. With an action it grows to 48px so the 32px button has room.
 */
function PanelFooter({
  action = false,
  children,
  className,
  end,
}: {
  /** The right side holds buttons. */
  action?: boolean
  children?: React.ReactNode
  className?: string
  end?: React.ReactNode
}) {
  return (
    <div
      data-slot="panel-footer"
      className={cn(
        "flex shrink-0 items-center gap-3 border-t bg-muted/50 text-xs leading-4 text-muted-foreground",
        action ? "h-12 pr-2 pl-3" : "h-10 px-3",
        children ? "justify-between" : "justify-end",
        className,
      )}
    >
      {children ? <div className="flex min-w-0 items-center gap-3">{children}</div> : null}
      {end ? <div className={cn("flex shrink-0 items-center", action ? "gap-1" : "gap-3")}>{end}</div> : null}
    </div>
  )
}

/** The main action of a surface, with the key that triggers it. */
function PrimaryButton({
  children,
  className,
  keys = "↵",
  ...props
}: React.ComponentProps<typeof Button> & { keys?: string }) {
  return (
    <Button className={cn("gap-2 rounded-[0.5rem] pr-1.5 pl-3", className)} {...props}>
      {children}
      <Kbd aria-hidden="true" inverted>{keys}</Kbd>
    </Button>
  )
}

/** Cancel, with esc. A single ring, not the outline variant's border. */
function CancelButton({ children = "Cancel", className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "mr-1 gap-2 rounded-[0.5rem] bg-background pr-1.5 pl-3 text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
        className,
      )}
      variant="ghost"
      {...props}
    >
      {children}
      <Kbd aria-hidden="true" muted>esc</Kbd>
    </Button>
  )
}

/** A small secondary button for a surface header, such as Add store. */
function HeaderButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "h-7 gap-1.5 rounded-[0.375rem] bg-background px-2.5 text-xs text-foreground ring-1 ring-foreground/10 hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      variant="ghost"
      {...props}
    />
  )
}

/** A white card with a ring, the container for every block on a page. */
function Surface({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="surface"
      className={cn("overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10", className)}
      {...props}
    />
  )
}

/** A surface's title row and the hairline under it. */
function SurfaceHeader({
  action,
  count,
  id,
  title,
}: {
  action?: React.ReactNode
  count?: number
  id?: string
  title: string
}) {
  return (
    <>
      <div className={cn("flex h-11 items-center gap-2 pl-4", action ? "pr-2" : "pr-4")}>
        <h2 className="m-0 text-sm font-medium" id={id}>{title}</h2>
        {count === undefined ? null : <span className="text-xs leading-4 text-muted-foreground tabular-nums">{count}</span>}
        {action ? <div className="ml-auto flex items-center gap-1">{action}</div> : null}
      </div>
      <div aria-hidden="true" className="h-px bg-border" />
    </>
  )
}

/** The padded column of rows inside a surface. */
function SurfaceList({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col px-1.5 py-1", className)} {...props} />
}

/** A list row: icon, label, details, trailing controls. Hover lights it like a palette row. */
const surfaceRowClassName =
  "group/row flex min-h-10 items-center gap-2 rounded-[0.375rem] pr-1 pl-2 text-sm text-foreground/80 transition-colors duration-150 hover:bg-muted [&>svg:first-child]:size-4 [&>svg:first-child]:shrink-0 [&>svg:first-child]:text-muted-foreground"

/** A row that is itself a button, such as a vault action. */
function ActionRow({
  className,
  description,
  icon: Icon,
  label,
  trailing,
  ...props
}: Omit<React.ComponentProps<"button">, "children"> & {
  description?: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>
  label: string
  trailing?: React.ReactNode
}) {
  return (
    <button
      className={cn(
        surfaceRowClassName,
        "w-full cursor-pointer border-0 bg-transparent text-left outline-none focus-visible:bg-muted focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      type="button"
      {...props}
    >
      <Icon aria-hidden="true" />
      <span className="shrink-0 sm:w-52">{label}</span>
      <span className="min-w-0 flex-1 truncate text-xs leading-4 text-muted-foreground">{description}</span>
      {trailing}
    </button>
  )
}

/** A quiet notice row for the result of an action; errors stay until dismissed. */
function Notice({
  error = false,
  message,
  onDismiss,
}: {
  error?: boolean
  message: string
  onDismiss: () => void
}) {
  const Icon = error ? CircleAlertIcon : CircleCheckIcon
  return (
    <div
      className={cn(
        "flex min-h-10 animate-in items-center gap-2.5 rounded-[0.625rem] py-1.5 pr-1.5 pl-3 text-sm duration-200 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none",
        error ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground",
      )}
      role={error ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      <button
        aria-label="Dismiss"
        className="flex size-7 shrink-0 items-center justify-center rounded-[0.375rem] text-current opacity-70 transition-colors hover:bg-foreground/5 hover:opacity-100"
        onClick={onDismiss}
        type="button"
      >
        <XIcon aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  )
}

/** A field with its label above it, 12px and muted like the palette's. */
function Field({
  children,
  className,
  htmlFor,
  label,
}: {
  children: React.ReactNode
  className?: string
  htmlFor: string
  label: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label className="text-xs leading-4 font-medium text-muted-foreground" htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  )
}

/**
 * An extension page: a top bar with the breadcrumb and a status, then a 720px column with the
 * title and the page's surfaces.
 */
function PageShell({
  children,
  description,
  heading = true,
  status,
  title,
}: {
  children: React.ReactNode
  description?: string
  /** Off for a page that is one centered surface, such as unlocking. */
  heading?: boolean
  status?: React.ReactNode
  title: string
}) {
  return (
    <div className="min-h-svh bg-muted/40 text-sm text-foreground dark:bg-background">
      <header className="flex h-14 items-center justify-between gap-4 border-b bg-background px-6">
        <p className="m-0 flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-muted-foreground">S4E Spotlight</span>
          <span aria-hidden="true" className="text-muted-foreground/40">/</span>
          <span className="truncate font-medium">{title}</span>
        </p>
        {status ? <div className="flex shrink-0 items-center gap-1.5 text-xs leading-4 text-muted-foreground">{status}</div> : null}
      </header>
      <main className="mx-auto flex w-full max-w-[45rem] flex-col gap-4 px-4 pt-8 pb-12">
        {heading ? (
          <div className="flex flex-col gap-1 px-1">
            <h1 className="m-0 text-2xl font-semibold tracking-tight">{title}</h1>
            {description ? <p className="m-0 text-muted-foreground">{description}</p> : null}
          </div>
        ) : <h1 className="sr-only">{title}</h1>}
        {children}
      </main>
    </div>
  )
}

/** A dot and a word for the top bar, such as Unlocked. */
function StatusDot({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-foreground" : "bg-ring")} />
      {children}
    </span>
  )
}

/** A dialog in the palette's anatomy: a title row and hairline, the body, then a footer band. */
function PanelDialogContent({
  children,
  className,
  title,
  ...props
}: React.ComponentProps<typeof DialogContent> & { title: string }) {
  return (
    <DialogContent
      className={cn(
        "gap-0 overflow-hidden p-0 shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] sm:max-w-[30rem] [&>[data-slot=dialog-close]]:top-2 [&>[data-slot=dialog-close]]:right-2",
        className,
      )}
      {...props}
    >
      <div className="flex h-11 items-center pr-12 pl-4">
        <DialogTitle className="text-sm leading-5 font-medium">{title}</DialogTitle>
      </div>
      <div aria-hidden="true" className="h-px bg-border" />
      {children}
    </DialogContent>
  )
}

export {
  ActionRow,
  CancelButton,
  Field,
  HeaderButton,
  Kbd,
  KeyHint,
  Notice,
  PageShell,
  PanelDialogContent,
  PanelFooter,
  PrimaryButton,
  StatusDot,
  Surface,
  SurfaceHeader,
  SurfaceList,
  surfaceRowClassName,
}
