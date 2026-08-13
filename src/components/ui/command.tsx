import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Check, Search } from "lucide-react"

import { cn } from "../../lib/utils"
import {
  Dialog,
  DialogBackdrop,
  DialogDescription,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from "./dialog"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground",
        className,
      )}
      {...props}
    />
  )
}

interface CommandDialogProps
  extends Omit<React.ComponentProps<typeof Dialog>, "children" | "onOpenChange"> {
  container: ShadowRoot | HTMLElement
  contentKey?: React.Key
  title?: string
  description?: string
  className?: string
  children?: React.ReactNode
  onOpenChange?: React.ComponentProps<typeof Dialog>["onOpenChange"]
}

function CommandDialog({
  container,
  contentKey,
  title = "Command Palette",
  description = "Search for a command to run.",
  children,
  className,
  onOpenChange,
  ...props
}: CommandDialogProps) {
  const commandRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const command = commandRef.current
    if (contentKey === undefined || !command) return
    if (command.querySelector("input, textarea, [contenteditable=true]")) return

    command.focus()
  }, [contentKey])

  return (
    <Dialog
      modal="trap-focus"
      onOpenChange={onOpenChange}
      {...props}
    >
      <DialogPortal container={container}>
        <DialogBackdrop />
        <DialogPopup className={cn("p-0", className)}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <Command
            key={contentKey}
            ref={commandRef}
            label={title === "Accounts" ? "Search accounts" : "Search commands"}
            tabIndex={-1}
          >
            {children}
          </Command>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <div className="flex h-8 w-full min-w-0 items-center rounded-lg border border-input/30 bg-input/30 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
        <Search className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "h-full w-full min-w-0 bg-transparent px-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className,
      )}
      {...props}
    />
  )
}

function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm text-muted-foreground"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none select-none",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}
      <Check
        className="ml-auto hidden opacity-0 group-data-[checked=true]/command-item:block group-data-[checked=true]/command-item:opacity-100 group-has-[[data-slot=command-shortcut]]/command-item:hidden"
        aria-hidden="true"
      />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-[selected=true]/command-item:text-foreground",
        className,
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
}
