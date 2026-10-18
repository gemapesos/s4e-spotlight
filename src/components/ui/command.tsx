import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { fadeMaskForScroll, type FadeMaskState } from "@/lib/fadeMask"
import { commandFilter } from "@/lib/searchScore"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

const SURFACE_HEIGHT_DURATION_MS = 280
const SURFACE_HEIGHT_EASING = "cubic-bezier(0.16, 1, 0.3, 1)"

function prefersReducedMotion(targetWindow: Window | null): boolean {
  return Boolean(targetWindow?.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
}

/**
 * cmdk prevents the default of every Enter inside the palette to select a list item, which
 * also stops Enter from pressing a focused button. Press the button here instead.
 */
function pressFocusedButtonOnEnter(event: React.KeyboardEvent<HTMLDivElement>): void {
  if (event.key !== "Enter" || event.nativeEvent.isComposing) return
  const target = event.target
  if (!(target instanceof HTMLButtonElement) || target.disabled) return
  event.preventDefault()
  target.click()
}

function Command({
  className,
  filter = commandFilter,
  loop = true,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full min-h-0 flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
      filter={filter}
      loop={loop}
      {...props}
    />
  )
}

function PaletteSurface({
  children,
  commandRef,
  contentKey,
  contentRef,
  filter,
  title,
}: {
  children: React.ReactNode
  commandRef: React.RefObject<HTMLDivElement | null>
  contentKey?: React.Key
  contentRef: React.RefObject<HTMLDivElement | null>
  filter?: React.ComponentProps<typeof CommandPrimitive>["filter"]
  title: string
}) {
  const previousHeightRef = React.useRef<number | null>(null)
  const heightAnimationRef = React.useRef<Animation | null>(null)
  const previousKeyRef = React.useRef(contentKey)
  const hasMountedRef = React.useRef(false)
  const animateSwap = hasMountedRef.current && previousKeyRef.current !== contentKey
  previousKeyRef.current = contentKey
  hasMountedRef.current = true

  React.useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return

    heightAnimationRef.current?.cancel()
    heightAnimationRef.current = null

    const nextHeight = el.offsetHeight
    const prevHeight = previousHeightRef.current
    previousHeightRef.current = nextHeight

    const targetWindow = el.ownerDocument.defaultView
    if (
      prevHeight == null ||
      prevHeight === nextHeight ||
      prefersReducedMotion(targetWindow) ||
      typeof el.animate !== "function"
    ) {
      return
    }

    const animation = el.animate(
      [{ height: `${prevHeight}px` }, { height: `${nextHeight}px` }],
      { duration: SURFACE_HEIGHT_DURATION_MS, easing: SURFACE_HEIGHT_EASING },
    )
    heightAnimationRef.current = animation
    animation.onfinish = () => {
      if (heightAnimationRef.current === animation) heightAnimationRef.current = null
      previousHeightRef.current = el.offsetHeight
    }
    animation.oncancel = () => {
      if (heightAnimationRef.current === animation) heightAnimationRef.current = null
    }

    return () => {
      animation.cancel()
    }
  }, [contentKey, contentRef])

  React.useEffect(() => {
    const el = contentRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(() => {
      if (heightAnimationRef.current) return
      previousHeightRef.current = el.offsetHeight
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [contentRef])

  return (
    <Command
      key={contentKey}
      ref={commandRef}
      className={animateSwap ? "animate-surface-in motion-reduce:animate-none!" : undefined}
      filter={filter}
      label={title === "Accounts" ? "Search accounts" : "Search commands"}
      onKeyDown={pressFocusedButtonOnEnter}
      tabIndex={-1}
    >
      {children}
    </Command>
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  container,
  contentKey,
  filter,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  container?: HTMLElement | ShadowRoot
  contentKey?: React.Key
  filter?: React.ComponentProps<typeof CommandPrimitive>["filter"]
  onEscapeKeyDown?: React.ComponentProps<typeof DialogContent>["onEscapeKeyDown"]
}) {
  const commandRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    const command = commandRef.current
    if (contentKey === undefined || !command) return
    if (command.querySelector("input, textarea, [contenteditable=true]")) return
    // Keep a control that focused itself (autoFocus) on this screen.
    const active = (command.getRootNode() as Document | ShadowRoot).activeElement
    if (active && active !== command && command.contains(active)) return
    command.focus()
  }, [contentKey])

  return (
    <Dialog {...props}>
      <DialogContent
        ref={contentRef}
        className={cn(
          "top-1/3 left-1/2 -translate-x-1/2 translate-y-0 overflow-hidden rounded-xl! p-0",
          className
        )}
        container={container}
        onEscapeKeyDown={onEscapeKeyDown}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          commandRef.current?.querySelector<HTMLElement>("[data-slot=command-input], textarea, input")?.focus()
        }}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <PaletteSurface
          commandRef={commandRef}
          contentKey={contentKey}
          contentRef={contentRef}
          filter={filter}
          title={title}
        >
          {children}
        </PaletteSurface>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  onScroll,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")

  const updateFadeMask = React.useCallback(() => {
    const list = listRef.current
    if (!list) return setFadeMask("none")
    setFadeMask(fadeMaskForScroll(list))
  }, [])

  React.useLayoutEffect(() => {
    const list = listRef.current
    if (!list) return
    updateFadeMask()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(updateFadeMask)
    observer.observe(list)
    const sizer = list.querySelector("[cmdk-list-sizer]")
    if (sizer) observer.observe(sizer)
    return () => observer.disconnect()
  }, [updateFadeMask])

  return (
    <CommandPrimitive.List
      data-slot="command-list"
      data-fade-mask={fadeMask}
      className={cn(
        "scroll-fade no-scrollbar max-h-80 min-h-0 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
      ref={listRef}
      onScroll={(event) => {
        updateFadeMask()
        onScroll?.(event)
      }}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
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
        "overflow-x-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
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
        "group/command-item relative flex scroll-my-1 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors duration-150 select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
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
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
