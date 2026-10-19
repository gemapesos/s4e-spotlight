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
import { SearchIcon, CheckIcon, ChevronLeftIcon, ExternalLinkIcon } from "lucide-react"

const SURFACE_HEIGHT_DURATION_MS = 280
const SURFACE_HEIGHT_EASING = "cubic-bezier(0.16, 1, 0.3, 1)"
/** In rem, so the slide matches the design on pages that shrink the root font (Seller Central). */
const SURFACE_SHIFT_REM = 0.75
/** Rows fade up one after another when a screen opens; only the first few, so long lists don't drag. */
const ROW_STAGGER_LIMIT = 8
const ROW_STAGGER_STEP_MS = 18
const ROW_ENTER_DURATION_MS = 200
const HIGHLIGHT_DURATION_MS = 140

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
        "flex size-full min-h-0 flex-col overflow-hidden rounded-xl! bg-popover text-sm text-popover-foreground",
        className
      )}
      filter={filter}
      loop={loop}
      {...props}
    />
  )
}

/** Fades the first rows of a freshly opened screen up into place, one after another. */
function staggerRows(command: HTMLElement | null): void {
  if (!command || prefersReducedMotion(command.ownerDocument.defaultView)) return
  const rows = Array.from(command.querySelectorAll<HTMLElement>("[cmdk-item]")).slice(0, ROW_STAGGER_LIMIT)
  rows.forEach((row, index) => {
    if (typeof row.animate !== "function") return
    row.animate(
      [{ opacity: 0, transform: "translateY(0.25rem)" }, { opacity: 1, transform: "none" }],
      {
        delay: index * ROW_STAGGER_STEP_MS,
        duration: ROW_ENTER_DURATION_MS,
        easing: SURFACE_HEIGHT_EASING,
        fill: "backwards",
      },
    )
  })
}

function PaletteSurface({
  children,
  commandRef,
  contentDepth = 0,
  contentKey,
  contentRef,
  defaultValue,
  filter,
  onKeyDown,
  title,
}: {
  children: React.ReactNode
  commandRef: React.RefObject<HTMLDivElement | null>
  contentDepth?: number
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  contentKey?: React.Key
  contentRef: React.RefObject<HTMLDivElement | null>
  defaultValue?: string
  filter?: React.ComponentProps<typeof CommandPrimitive>["filter"]
  title: string
}) {
  const previousHeightRef = React.useRef<number | null>(null)
  const heightAnimationRef = React.useRef<Animation | null>(null)
  const previousKeyRef = React.useRef(contentKey)
  const previousDepthRef = React.useRef(contentDepth)
  const shiftRef = React.useRef(SURFACE_SHIFT_REM)
  const hasMountedRef = React.useRef(false)
  const animateSwap = hasMountedRef.current && previousKeyRef.current !== contentKey
  if (animateSwap) shiftRef.current = contentDepth < previousDepthRef.current ? -SURFACE_SHIFT_REM : SURFACE_SHIFT_REM
  previousKeyRef.current = contentKey
  previousDepthRef.current = contentDepth
  hasMountedRef.current = true

  React.useLayoutEffect(() => {
    staggerRows(commandRef.current)
  }, [commandRef, contentKey])

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
      style={{ "--surface-shift": `${shiftRef.current}rem` } as React.CSSProperties}
      defaultValue={defaultValue}
      filter={filter}
      label={title === "Accounts" ? "Search accounts" : "Search commands"}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (!event.defaultPrevented) pressFocusedButtonOnEnter(event)
      }}
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
  contentDepth,
  contentKey,
  defaultValue,
  filter,
  onEscapeKeyDown,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  container?: HTMLElement | ShadowRoot
  /** How deep the current screen sits; going shallower slides the new screen in from the left. */
  contentDepth?: number
  contentKey?: React.Key
  /** The item highlighted when a screen opens; the first item when unset. */
  defaultValue?: string
  filter?: React.ComponentProps<typeof CommandPrimitive>["filter"]
  onEscapeKeyDown?: React.ComponentProps<typeof DialogContent>["onEscapeKeyDown"]
  /** Runs before the palette's own key handling; prevent default to take a key over. */
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
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
          "top-1/3 left-1/2 w-[35rem] -translate-x-1/2 translate-y-0 gap-0 overflow-hidden rounded-xl! p-0 shadow-[0_1.5rem_3rem_-1rem_rgb(0_0_0/0.22)] sm:max-w-[35rem]",
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
          contentDepth={contentDepth}
          contentKey={contentKey}
          contentRef={contentRef}
          defaultValue={defaultValue}
          filter={filter}
          onKeyDown={onKeyDown}
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
  compact = false,
  wrapperClassName,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input> & {
  /** The 32px field that sits in a screen header beside the back button. */
  compact?: boolean
  wrapperClassName?: string
}) {
  return (
    <div data-slot="command-input-wrapper" className={cn(compact ? "min-w-0 flex-1" : "px-1.5 pt-1.5", wrapperClassName)}>
      <label
        className={cn(
          "flex cursor-text items-center gap-2 bg-muted px-2.5 has-disabled:opacity-50",
          compact ? "h-8 rounded-[0.5rem]" : "h-10 rounded-[0.625rem]",
        )}
      >
        <SearchIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </label>
    </div>
  )
}

function CommandList({
  children,
  className,
  onScroll,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null)
  const highlightRef = React.useRef<HTMLDivElement>(null)
  const [fadeMask, setFadeMask] = React.useState<FadeMaskState>("none")

  // One highlight glides to the selected row instead of each row lighting up on its own.
  React.useLayoutEffect(() => {
    const list = listRef.current
    const highlight = highlightRef.current
    if (!list || !highlight || typeof MutationObserver === "undefined") return
    let placed = false
    const place = () => {
      const item = list.querySelector<HTMLElement>("[cmdk-item][data-selected=true]")
      if (!item || item.offsetHeight === 0) {
        highlight.style.opacity = "0"
        placed = false
        return
      }
      const glide = placed && !prefersReducedMotion(list.ownerDocument.defaultView)
      highlight.style.transition = glide
        ? `transform ${HIGHLIGHT_DURATION_MS}ms ${SURFACE_HEIGHT_EASING}, height ${HIGHLIGHT_DURATION_MS}ms ${SURFACE_HEIGHT_EASING}`
        : "none"
      highlight.style.transform = `translateY(${item.offsetTop}px)`
      highlight.style.height = `${item.offsetHeight}px`
      highlight.style.opacity = "1"
      placed = true
    }
    place()
    const mutations = new MutationObserver(place)
    mutations.observe(list, { attributes: true, attributeFilter: ["data-selected"], childList: true, subtree: true })
    const resizes = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place)
    const sizer = list.querySelector("[cmdk-list-sizer]")
    if (resizes && sizer) resizes.observe(sizer)
    return () => {
      mutations.disconnect()
      resizes?.disconnect()
    }
  }, [])

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
      data-glide="on"
      className={cn(
        "scroll-fade no-scrollbar max-h-80 min-h-0 scroll-py-1 overflow-x-hidden overflow-y-auto px-1.5 py-1 outline-none **:[[cmdk-list-sizer]]:relative",
        className
      )}
      {...props}
      ref={listRef}
      onScroll={(event) => {
        updateFadeMask()
        onScroll?.(event)
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 w-full rounded-[0.375rem] bg-muted opacity-0"
        data-slot="command-highlight"
        ref={highlightRef}
      />
      {children}
    </CommandPrimitive.List>
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
        "overflow-x-hidden text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:leading-4 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
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
      className={cn("-mx-1.5 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  end,
  external = false,
  selectedHint,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  /** Replaces the trailing check mark, e.g. a badge. */
  end?: React.ReactNode
  /** The command opens a page in a new tab. */
  external?: boolean
  /** A key shown on the row only while it is selected, e.g. ↵. */
  selectedHint?: string
}) {
  const trailing = end !== undefined ? end : external ? (
    <ExternalLinkIcon aria-hidden="true" className="size-3.5! text-ring" />
  ) : selectedHint ? (
    <CommandKbd aria-hidden="true" className="opacity-0 transition-opacity duration-150 group-data-selected/command-item:opacity-100">{selectedHint}</CommandKbd>
  ) : (
    <CheckIcon className="opacity-0 group-has-data-[slot=command-checkbox]/command-item:hidden group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
  )

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-8 scroll-my-1 cursor-default items-center gap-2 rounded-[0.375rem] px-2 text-sm text-foreground/80 outline-hidden transition-colors duration-150 select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted in-data-[glide=on]:data-selected:bg-transparent! data-selected:font-medium data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[svg]:text-muted-foreground data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      {trailing ? <span className="ml-auto flex shrink-0 items-center">{trailing}</span> : null}
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

/** A leading checkbox for toggle rows; it follows the row's data-checked. */
function CommandCheckbox({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      data-slot="command-checkbox"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-[0.25rem] border border-ring bg-background text-primary-foreground group-data-[checked=true]/command-item:border-primary group-data-[checked=true]/command-item:bg-primary dark:bg-input/30 dark:group-data-[checked=true]/command-item:bg-primary",
        className
      )}
      {...props}
    >
      <CheckIcon className="size-3! text-primary-foreground! opacity-0 group-data-[checked=true]/command-item:animate-check-in group-data-[checked=true]/command-item:opacity-100" strokeWidth={3} />
    </span>
  )
}

function CommandKbd({
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
      data-slot="command-kbd"
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

/** One or more keys and what they do, for the footer. */
function CommandHint({ keys, children }: { keys: readonly string[]; children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1">
      {keys.map((key) => <CommandKbd key={key}>{key}</CommandKbd>)}
      {children ? <span className="ml-0.5">{children}</span> : null}
    </span>
  )
}

/**
 * The top of every screen below Commands: a back button and where you are, or a control in place
 * of the breadcrumb. Back acts on pointer press so the screen swap feels immediate.
 */
function CommandHeader({
  aside,
  backDisabled,
  children,
  divider = true,
  onBack,
  parent,
  title,
}: {
  aside?: React.ReactNode
  backDisabled?: boolean
  children?: React.ReactNode
  /** A hairline under the header; pass a node (a progress bar) to draw that instead. */
  divider?: boolean | React.ReactNode
  onBack: () => void
  parent?: string
  title?: string
}) {
  return (
    <>
      <div
        data-slot="command-header"
        className={cn("flex h-11 shrink-0 items-center gap-1 pl-1.5", children ? "pr-1.5" : aside ? "pr-3" : "pr-2")}
      >
        <button
          aria-label="Back"
          className="flex size-8 shrink-0 items-center justify-center rounded-[0.5rem] text-foreground/80 transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          disabled={backDisabled}
          onClick={onBack}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.preventDefault()
            onBack()
          }}
          type="button"
        >
          <ChevronLeftIcon aria-hidden="true" className="size-4" />
        </button>
        {children ?? (
          <p className="m-0 flex min-w-0 flex-1 items-center gap-1">
            {parent ? <>
              <span className="shrink-0 text-muted-foreground">{parent}</span>
              <span aria-hidden="true" className="text-muted-foreground/40">/</span>
            </> : null}
            <span className="truncate font-medium">{title}</span>
          </p>
        )}
        {aside ? <div className="flex shrink-0 items-center text-xs leading-4 text-muted-foreground">{aside}</div> : null}
      </div>
      {divider === true ? <div aria-hidden="true" className="h-px shrink-0 bg-border" /> : divider || null}
    </>
  )
}

/**
 * The bottom band of every screen: status or hints on the left, hints or the main action on the
 * right. With an action it grows to 48px so the 32px button has room.
 */
function CommandFooter({
  action = false,
  children,
  end,
}: {
  /** The right side holds buttons, so the band grows to 48px to give them room. */
  action?: boolean
  children?: React.ReactNode
  end?: React.ReactNode
}) {
  return (
    <div
      data-slot="command-footer"
      className={cn(
        "flex shrink-0 items-center gap-3 border-t bg-muted/50 text-xs leading-4 text-muted-foreground",
        action ? "h-12 pr-2 pl-3" : "h-10 px-3",
        children ? "justify-between" : "justify-end",
      )}
    >
      {children ? <div className="flex min-w-0 items-center gap-3">{children}</div> : null}
      {end ? <div className={cn("flex shrink-0 items-center", action ? "gap-1" : "gap-3")}>{end}</div> : null}
    </div>
  )
}

export {
  Command,
  CommandCheckbox,
  CommandFooter,
  CommandHeader,
  CommandHint,
  CommandKbd,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
