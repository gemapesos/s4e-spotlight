import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "../../lib/utils"

type DialogProps = React.ComponentProps<typeof DialogPrimitive.Root>

function Dialog(props: DialogProps) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

type DialogPortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>

function DialogPortal(props: DialogPortalProps) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]",
        "data-[open]:animate-[palette-fade-in_140ms_ease-out] data-[closed]:animate-[palette-fade-out_100ms_ease-in]",
        className,
      )}
      {...props}
    />
  )
}

function DialogPopup({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPrimitive.Popup
      data-slot="dialog-content"
      className={cn(
        "fixed top-1/3 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 overflow-hidden rounded-xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-sm",
        "data-[open]:animate-[palette-dialog-in_140ms_cubic-bezier(0.16,1,0.3,1)] data-[closed]:animate-[palette-dialog-out_100ms_ease-in]",
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title className={cn("sr-only", className)} {...props} />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("sr-only", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
}
