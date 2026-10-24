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
import { Kbd as CommandKbd, KeyHint as CommandHint, PanelFooter as CommandFooter } from "@/components/panel"

const SURFACE_HEIGHT_DURATION_MS = 200
const SURFACE_HEIGHT_EASING = "cubic-bezier(0.16, 1, 0.3, 1)"
/** In rem, so the slide matches the design on pages that shrink the root font (Seller Central). */
const SURFACE_SHIFT_REM = 0.75
/** Rows fade up one after another when a screen opens; only the first few, so long lists don't drag. */
const ROW_STAGGER_LIMIT = 8
const ROW_STAGGER_STEP_MS = 12
const ROW_ENTER_DURATION_MS = 150
const HIGHLIGHT_DURATION_MS = 110

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

  // A new screen's height isn't final in its first commit: cmdk registers rows a render later
  // (until then CommandEmpty shows), and some screens fill in after mount. So the height
  // animation follows the screen's natural height, retargeting from wherever it is mid-flight
  // instead of gliding to a stale height and snapping at the end.
  React.useLayoutEffect(() => {
    const command = commandRef.current
    // On first mount the dialog's ref isn't attached yet (parents attach after child effects).
    const el = contentRef.current ?? command?.parentElement
    if (!el || !command) return

    const fromHeight = previousHeightRef.current
    const targetWindow = el.ownerDocument.defaultView
    const canAnimate =
      fromHeight != null && !prefersReducedMotion(targetWindow) && typeof el.animate === "function"
    let swapEndsAt = canAnimate ? performance.now() + SURFACE_HEIGHT_DURATION_MS : 0
    let target = fromHeight

    const animateTo = (nextHeight: number) => {
      if (nextHeight === target) return
      // Start from the height on screen right now, which mid-animation is the animated height.
      const current = heightAnimationRef.current ? el.offsetHeight : (target ?? nextHeight)
      heightAnimationRef.current?.cancel()
      heightAnimationRef.current = null
      target = nextHeight
      previousHeightRef.current = nextHeight
      if (current === nextHeight) return
      const animation = el.animate(
        [{ height: `${current}px` }, { height: `${nextHeight}px` }],
        { duration: SURFACE_HEIGHT_DURATION_MS, easing: SURFACE_HEIGHT_EASING },
      )
      heightAnimationRef.current = animation
      const settle = () => {
        if (heightAnimationRef.current === animation) heightAnimationRef.current = null
      }
      animation.onfinish = settle
      animation.oncancel = settle
    }

    const follow = () => {
      const nextHeight = command.offsetHeight
      if (heightAnimationRef.current || performance.now() < swapEndsAt) {
        animateTo(nextHeight)
      } else {
        swapEndsAt = 0
        target = nextHeight
        previousHeightRef.current = nextHeight
      }
    }

    if (canAnimate) animateTo(command.offsetHeight)
    else previousHeightRef.current = command.offsetHeight

    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(follow)
    observer?.observe(command)
    return () => {
      observer?.disconnect()
      // Switching again mid-flight: the next screen starts from the height on screen now.
      if (heightAnimationRef.current) previousHeightRef.current = el.offsetHeight
      heightAnimationRef.current?.cancel()
      heightAnimationRef.current = null
    }
  }, [commandRef, contentKey, contentRef])

  return (
    <Command
      key={contentKey}
      ref={commandRef}
      className={animateSwap ? "animate-surface-in motion-reduce:animate-none!" : undefined}
      // Natural height, not the dialog's: the dialog's height animates toward it and clips the rest.
      style={{ "--surface-shift": `${shiftRef.current}rem`, height: "auto", alignSelf: "start" } as React.CSSProperties}
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
        "overflow-x-clip text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pt-2 **:[[cmdk-group-heading]]:pb-1 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:leading-4 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
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
    <CommandKbd aria-hidden="true" className="opacity-0 transition-opacity duration-100 group-data-selected/command-item:opacity-100">{selectedHint}</CommandKbd>
  ) : (
    <CheckIcon className="opacity-0 group-has-data-[slot=command-checkbox]/command-item:hidden group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
  )

  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-8 scroll-my-1 cursor-default items-center gap-2 rounded-[0.375rem] px-2 text-sm text-foreground/80 outline-hidden transition-colors duration-100 select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted in-data-[glide=on]:data-selected:bg-transparent! data-selected:font-medium data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[svg]:text-muted-foreground data-selected:*:[svg]:text-foreground",
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
