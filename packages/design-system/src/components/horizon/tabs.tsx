"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { useCallback, useEffect, useId, useRef, useState } from "react"

import { useIGRPi18n } from "../../i18n/index.js"
import { type IGRPColorRole, type IGRPColorVariants } from "../../lib/colors.js"

import { Button } from "../primitives/button.js"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../primitives/tabs.js"
import { IGRPBadge } from "./badge.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"

/** Sub-pixel slack when comparing scroll offsets. */
const SCROLL_EPSILON = 1
/** Gap kept between the active tab and the container edge when scrolling it into view. */
const SCROLL_PADDING = 16
/** Fraction of the visible width moved by one scroll-button press. */
const SCROLL_STEP = 0.7

function getScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return "auto"
  }
  return "smooth"
}

const tabListVariants = cva("gap-1.5", {
  variants: {
    variant: {
      default: "",
      outline: "bg-transparent",
      pills: "gap-1.5 bg-transparent",
      underline: "h-auto gap-2 rounded-none border-b bg-transparent text-foreground",
      cards:
        "relative h-auto gap-0.5 bg-transparent p-0 before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-border",
    },
    fullWidth: {
      true: "w-full",
      false: "w-fit",
    },
  },
  defaultVariants: {
    variant: "default",
    fullWidth: false,
  },
})

// The primitive styles the selected trigger with `data-active:*` (widened to Radix's
// `data-state="active"` in tokens.css, ADR 0005), including `dark:data-active:*` surface
// classes. Horizon may not use `dark:`, so variants that replace the active surface use the
// important modifier to win in both themes. `underline` needs none of this: it renders the
// primitive's `line` variant, which already has a transparent active surface and the indicator.
const tabTriggerVariants = cva("px-4 py-1.5", {
  variants: {
    variant: {
      default: "",
      outline: "data-active:border-transparent! data-active:bg-muted! data-active:shadow-none!",
      pills:
        "rounded-full data-active:border-transparent! data-active:bg-primary! data-active:text-primary-foreground! data-active:shadow-none!",
      underline: "hover:bg-accent hover:text-foreground data-active:after:bg-primary data-active:hover:bg-accent",
      cards:
        "overflow-hidden rounded-b-none border-x border-t border-b-0 border-border bg-muted py-2 data-active:z-10 data-active:border-border! data-active:bg-background! data-active:shadow-none!",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

/**
 * Single tab item.
 * @see IGRPTabs
 */
interface IGRPTabItem {
  /** Tab value (unique id). */
  value: string
  /** Tab label. May be empty for icon-only tabs, which then need `ariaLabel`. */
  label: string
  /** Accessible name for the tab. Required when `label` is empty; it replaces the visible content (icon, label, badge) in the accessible name. */
  ariaLabel?: string
  /** Tab icon. */
  icon?: IGRPIconName
  /** Tab panel content. */
  content: React.ReactNode
  /** Whether the tab is disabled. */
  disabled?: boolean
  /** Keep the panel mounted (hidden) while inactive, preserving form and component state across tab switches. */
  keepMounted?: boolean
  /** Badge content. */
  badgeContent?: string | number
  /** Badge variant. */
  badgeVariant?: IGRPColorRole
  /** Badge color. */
  badgeColor?: IGRPColorVariants
  /** CSS classes for the badge. */
  badgeClassName?: string
  /** Additional CSS classes for this tab's trigger. */
  className?: string
}

/**
 * Props for the IGRPTabs component.
 * @see IGRPTabs
 */
interface IGRPTabsProps extends Omit<React.ComponentProps<typeof Tabs>, "children" | "asChild"> {
  /** Tab items. */
  items: IGRPTabItem[]
  /** CSS classes for the tab list. */
  tabListClassName?: string
  /** CSS classes for the tab content. */
  tabContentClassName?: string
  /** CSS classes for tab triggers. */
  tabTriggerClassName?: string
  /** Show icon on tabs. */
  showIcon?: boolean
  /** Icon position. */
  iconPlacement?: "start" | "end" | "top"
  /** Show badge on tabs. */
  showBadge?: boolean
  /** Badge position. */
  badgePlacement?: "start" | "end"
  /** Show border around content. */
  contentBorder?: boolean
  /** Tab list variant (default, outline, pills, underline, cards). */
  variant?: VariantProps<typeof tabListVariants>["variant"]
  /** Full-width tab list. */
  fullWidth?: boolean
  /** HTML id attribute of the root element. Takes precedence over `name`. */
  id?: string
  /** Identifier used as the root element's id when `id` is not given. */
  name?: string
  /** Show scroll indicators when tabs overflow. */
  showScrollIndicators?: boolean
  /** CSS classes for scroll buttons. */
  scrollButtonClassName?: string
}

interface ScrollState {
  /** Content is hidden past the start edge (left in LTR, right in RTL). */
  start: boolean
  /** Content is hidden past the end edge. */
  end: boolean
  rtl: boolean
}

const NO_SCROLL: ScrollState = { start: false, end: false, rtl: false }

function TabsScrollButton({
  label,
  iconName,
  disabled,
  className,
  onClick,
}: {
  label: string
  iconName: "ChevronLeft" | "ChevronRight"
  disabled: boolean
  className?: string
  onClick: () => void
}) {
  // aria-disabled, not `disabled`: the button that reaches the end of the list stays
  // focusable, so a keyboard user does not lose their place when it becomes inert.
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn("shrink-0 aria-disabled:opacity-50", className)}
      onClick={() => {
        if (!disabled) onClick()
      }}
      aria-label={label}
      aria-disabled={disabled}
      type="button"
    >
      <IGRPIcon iconName={iconName} size={12} />
    </Button>
  )
}

/**
 * Tabs with icon, badge, and multiple style variants.
 */
function IGRPTabs({
  items,
  className: tabClassName,
  tabListClassName,
  tabContentClassName,
  tabTriggerClassName,
  showIcon = false,
  iconPlacement = "start",
  showBadge = false,
  badgePlacement = "end",
  orientation = "horizontal",
  contentBorder = false,
  defaultValue,
  value: controlledValue,
  onValueChange,
  variant,
  fullWidth,
  id,
  name,
  showScrollIndicators = true,
  scrollButtonClassName,
  ...restProps
}: IGRPTabsProps) {
  const i18n = useIGRPi18n()
  const tabItems = items ?? []
  const isControlled = controlledValue !== undefined

  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [scrollState, setScrollState] = useState<ScrollState>(NO_SCROLL)

  const tabsListRef = useRef<HTMLDivElement>(null)

  // Radix always receives a controlled value, so a default that arrives late, or an active tab that
  // is removed from `items`, resolves to the first enabled tab instead of leaving none selected.
  const fallbackValue = (tabItems.find((item) => !item.disabled) ?? tabItems[0])?.value ?? ""
  const currentValue = isControlled
    ? controlledValue
    : (tabItems.find((item) => item.value === uncontrolledValue)?.value ?? fallbackValue)

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }

  const generatedId = useId()
  const rootId = id ?? name ?? generatedId

  const isHorizontal = orientation === "horizontal"

  const checkScrollability = useCallback(() => {
    const container = tabsListRef.current
    if (!container || !isHorizontal) {
      setScrollState((prev) => (prev === NO_SCROLL ? prev : NO_SCROLL))
      return
    }

    // scrollLeft is 0 at the start edge in both directions but goes negative in RTL, so measure
    // the distance from the start edge with Math.abs instead of assuming LTR.
    const rtl = getComputedStyle(container).direction === "rtl"
    const offset = Math.abs(container.scrollLeft)
    const next: ScrollState = {
      rtl,
      start: offset > SCROLL_EPSILON,
      end: offset + container.clientWidth < container.scrollWidth - SCROLL_EPSILON,
    }
    setScrollState((prev) =>
      prev.start === next.start && prev.end === next.end && prev.rtl === next.rtl ? prev : next
    )
  }, [isHorizontal])

  const scrollTabs = useCallback((edge: "start" | "end") => {
    const container = tabsListRef.current
    if (!container) return

    const rtl = getComputedStyle(container).direction === "rtl"
    // Logical -> physical: "end" is rightwards in LTR and leftwards in RTL.
    const sign = (edge === "end" ? 1 : -1) * (rtl ? -1 : 1)
    container.scrollBy({ left: sign * container.clientWidth * SCROLL_STEP, behavior: getScrollBehavior() })
  }, [])

  const scrollToActiveTab = useCallback(() => {
    const container = tabsListRef.current
    if (!container || !isHorizontal) return

    const activeTabElement = container.querySelector<HTMLElement>('[role="tab"][data-state="active"]')
    if (!activeTabElement) return

    const containerRect = container.getBoundingClientRect()
    const tabRect = activeTabElement.getBoundingClientRect()
    const behavior = getScrollBehavior()

    // Rect deltas are physical and direction-agnostic; scrollBy clamps to the scrollable range.
    if (tabRect.left < containerRect.left) {
      container.scrollBy({ left: tabRect.left - containerRect.left - SCROLL_PADDING, behavior })
    } else if (tabRect.right > containerRect.right) {
      container.scrollBy({ left: tabRect.right - containerRect.right + SCROLL_PADDING, behavior })
    }
  }, [isHorizontal])

  useEffect(() => {
    const container = tabsListRef.current
    if (!container) return

    const scrollOptions: AddEventListenerOptions = { passive: true }
    container.addEventListener("scroll", checkScrollability, scrollOptions)
    checkScrollability()
    // The container's own box is fixed by the layout, so also observe the list inside it:
    // a label, badge or font change resizes the list without resizing the container.
    const resizeObserver = new ResizeObserver(checkScrollability)
    resizeObserver.observe(container)
    if (container.firstElementChild) resizeObserver.observe(container.firstElementChild)

    return () => {
      container.removeEventListener("scroll", checkScrollability, scrollOptions)
      resizeObserver.disconnect()
    }
  }, [checkScrollability, tabItems.length])

  useEffect(() => {
    scrollToActiveTab()
  }, [currentValue, scrollToActiveTab])

  if (tabItems.length === 0) {
    return null
  }

  const showIndicators = showScrollIndicators && isHorizontal && (scrollState.start || scrollState.end)
  const startLabel = scrollState.rtl ? i18n.tabs.scrollRight : i18n.tabs.scrollLeft
  const endLabel = scrollState.rtl ? i18n.tabs.scrollLeft : i18n.tabs.scrollRight

  const renderBadge = (item: IGRPTabItem, placement: "start" | "end") =>
    showBadge && item.badgeContent !== undefined && badgePlacement === placement ? (
      <IGRPBadge variant={item.badgeVariant} color={item.badgeColor} badgeClassName={item.badgeClassName}>
        {item.badgeContent}
      </IGRPBadge>
    ) : null

  return (
    <Tabs
      className={cn("w-full", orientation === "vertical" && "flex-row items-start", tabClassName)}
      orientation={orientation}
      {...restProps}
      id={rootId}
      value={currentValue}
      onValueChange={handleValueChange}
    >
      <div
        className={cn(
          "relative flex gap-1.5",
          isHorizontal ? "w-full items-center" : "flex-col items-start self-start"
        )}
      >
        {showIndicators && (
          <TabsScrollButton
            label={startLabel}
            iconName={scrollState.rtl ? "ChevronRight" : "ChevronLeft"}
            disabled={!scrollState.start}
            className={scrollButtonClassName}
            onClick={() => scrollTabs("start")}
          />
        )}
        <div
          ref={tabsListRef}
          className={cn(
            isHorizontal &&
              "flex-1 [scrollbar-width:none] overflow-x-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            !isHorizontal && "w-full"
          )}
        >
          <TabsList
            variant={variant === "underline" ? "line" : "default"}
            className={cn(
              // The primitive's upstream `group-data-horizontal/tabs:h-9` is sized for
              // shadcn's `py-1` triggers; ours are `py-1.5` and the underline/cards
              // variants rely on content height. Same modifier, so cn() drops the h-9.
              isHorizontal && "group-data-horizontal/tabs:h-auto",
              tabListVariants({ variant, fullWidth }),
              // `w-max`, applied after the variant's `w-fit`, lets the list grow past the container
              // so the tabs scroll inside it; a full-width list fills the container but never
              // shrinks below its content.
              isHorizontal && (fullWidth === true ? "min-w-max" : "w-max"),
              fullWidth === true && orientation === "vertical" && "w-fit",
              tabListClassName
            )}
          >
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                aria-label={item.ariaLabel}
                className={cn(
                  tabTriggerVariants({ variant }),
                  iconPlacement === "top" && "flex-col",
                  tabTriggerClassName,
                  item.className
                )}
              >
                {renderBadge(item, "start")}

                {showIcon && item.icon && iconPlacement !== "end" && <IGRPIcon iconName={item.icon} />}

                {item.label && <span>{item.label}</span>}

                {showIcon && item.icon && iconPlacement === "end" && <IGRPIcon iconName={item.icon} />}

                {renderBadge(item, "end")}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {showIndicators && (
          <TabsScrollButton
            label={endLabel}
            iconName={scrollState.rtl ? "ChevronLeft" : "ChevronRight"}
            disabled={!scrollState.end}
            className={scrollButtonClassName}
            onClick={() => scrollTabs("end")}
          />
        )}
      </div>

      {tabItems.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          forceMount={item.keepMounted ? true : undefined}
          className={cn(
            "w-full rounded-md border border-transparent p-4 focus-visible:ring-[3px] focus-visible:ring-ring/50",
            item.keepMounted && "data-[state=inactive]:hidden",
            contentBorder === true && "border-border",
            tabContentClassName
          )}
        >
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export { IGRPTabs, type IGRPTabsProps, type IGRPTabItem }
