"use client"

import { cva, type VariantProps } from "class-variance-authority"
import { useCallback, useEffect, useId, useRef, useState } from "react"

import { type IGRPColorRole, type IGRPColorVariants } from "../../lib/colors.js"
import { cn } from "cn"

function getScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto"
  }
  return "smooth"
}
import { Button } from "../primitives/button.js"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../primitives/tabs.js"
import { IGRPBadge } from "./badge.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"
import { useIGRPi18n } from "../../i18n/index.js"

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

const tabTriggerVariants = cva("px-4 py-1.5", {
  variants: {
    variant: {
      default: "",
      outline: "data-[state=active]:bg-muted data-[state=active]:shadow-none",
      pills:
        "rounded-full data-[state=active]:bg-primary data-[state=active]:text-muted-foreground data-[state=active]:shadow-none",
      underline:
        "relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 hover:bg-accent hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent",
      cards:
        "overflow-hidden rounded-b-none border-x border-t bg-muted py-2 data-[state=active]:z-10 data-[state=active]:shadow-none",
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
  /** Tab label. */
  label: string
  /** Tab icon. */
  icon?: IGRPIconName
  /** Tab panel content. */
  content: React.ReactNode
  /** Whether the tab is disabled. */
  disabled?: boolean
  /** Badge content. */
  badgeContent?: string | number
  /** Badge variant. */
  badgeVariant?: IGRPColorRole
  /** Badge color. */
  badgeColor?: IGRPColorVariants
  /** CSS classes for the badge. */
  badgeClassName?: string
  /** Additional CSS classes. */
  className?: string
}

/**
 * Props for the IGRPTabs component.
 * @see IGRPTabs
 */
interface IGRPTabsProps extends React.ComponentProps<typeof Tabs> {
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
  /** HTML id attribute. */
  id?: string
  /** HTML name attribute. */
  name?: string
  /** Show scroll indicators when tabs overflow. */
  showScrollIndicators?: boolean
  /** CSS classes for scroll buttons. */
  scrollButtonClassName?: string
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
  const isControlled = controlledValue !== undefined

  const initialValue = defaultValue ?? items[0]?.value ?? ""
  const [activeTab, setActiveTab] = useState(initialValue)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const tabsListRef = useRef<HTMLDivElement>(null)

  const currentValue = isControlled ? controlledValue : activeTab
  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setActiveTab(newValue)
    }
    onValueChange?.(newValue)
  }

  const _id = useId()
  const ref = name ?? id ?? _id

  const checkScrollability = useCallback(() => {
    if (!tabsListRef.current || orientation === "vertical") {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const { scrollLeft, scrollWidth, clientWidth } = tabsListRef.current
    const epsilon = 1
    setCanScrollLeft(scrollLeft > epsilon)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - epsilon)
  }, [orientation])

  const scrollToTab = useCallback((direction: "left" | "right" | "start" | "end") => {
    if (!tabsListRef.current) return

    const container = tabsListRef.current
    const scrollAmount = container.clientWidth * 0.7
    const behavior = getScrollBehavior()

    switch (direction) {
      case "left":
        container.scrollBy({ left: -scrollAmount, behavior })
        break
      case "right":
        container.scrollBy({ left: scrollAmount, behavior })
        break
      case "start":
        container.scrollTo({ left: 0, behavior })
        break
      case "end":
        container.scrollTo({ left: container.scrollWidth, behavior })
        break
    }
  }, [])

  const scrollToActiveTab = useCallback(() => {
    if (!tabsListRef.current || orientation === "vertical") return

    const container = tabsListRef.current
    const activeTabElement = container.querySelector(`[data-state="active"]`) as HTMLElement

    if (!activeTabElement) return

    const containerRect = container.getBoundingClientRect()
    const tabRect = activeTabElement.getBoundingClientRect()

    const scrollLeft = container.scrollLeft
    const tabLeft = tabRect.left - containerRect.left + scrollLeft
    const tabRight = tabLeft + tabRect.width
    const containerScrollLeft = scrollLeft
    const containerScrollRight = scrollLeft + containerRect.width
    const padding = 16

    const behavior = getScrollBehavior()

    if (tabLeft < containerScrollLeft) {
      container.scrollTo({ left: tabLeft - padding, behavior })
    } else if (tabRight > containerScrollRight) {
      container.scrollTo({ left: tabRight - containerRect.width + padding, behavior })
    }
  }, [orientation])

  const handleTouchStart = useCallback(() => {}, [])

  const handleTouchMove = useCallback(() => {}, [])

  const handleTouchEnd = useCallback(() => {}, [])

  useEffect(() => {
    requestAnimationFrame(() => checkScrollability())

    const container = tabsListRef.current
    if (!container) return

    const scrollOptions: AddEventListenerOptions = { passive: true }
    container.addEventListener("scroll", checkScrollability, scrollOptions)
    const resizeObserver = new ResizeObserver(checkScrollability)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener("scroll", checkScrollability, scrollOptions)
      resizeObserver.disconnect()
    }
  }, [checkScrollability, items.length])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToActiveTab()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [currentValue, scrollToActiveTab])

  const tabsProps = isControlled
    ? {
        value: currentValue,
        onValueChange: handleValueChange,
      }
    : {
        defaultValue: defaultValue ?? initialValue,
        onValueChange: handleValueChange,
      }

  const isHorizontal = orientation === "horizontal"
  const showIndicators = showScrollIndicators && isHorizontal && (canScrollLeft || canScrollRight)

  if (!items || items.length === 0) {
    return null
  }

  return (
    <Tabs
      {...tabsProps}
      className={cn("w-full", orientation === "vertical" && "flex-row items-start", tabClassName)}
      orientation={orientation}
      id={ref}
      {...restProps}
    >
      <div
        className={cn(
          "relative flex gap-1.5",
          isHorizontal ? "w-full items-center" : "flex-col items-start self-start"
        )}
      >
        {showIndicators && canScrollLeft && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "z-10 shrink-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background",
              scrollButtonClassName
            )}
            onClick={() => scrollToTab("left")}
            aria-label={i18n.tabs.scrollLeft}
            type="button"
          >
            <IGRPIcon iconName="ChevronLeft" size={12} />
          </Button>
        )}
        <div
          ref={tabsListRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={cn(
            isHorizontal &&
              "scrollbar-hide [scrollbar-width:none] overflow-x-auto scroll-smooth [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
            isHorizontal && "flex-1",
            !isHorizontal && "w-full"
          )}
        >
          <TabsList
            className={cn(
              orientation === "vertical" && "h-fit flex-col",
              isHorizontal && "w-max",
              // The primitive's upstream `group-data-horizontal/tabs:h-9` is sized for
              // shadcn's `py-1` triggers; ours are `py-1.5` and the underline/cards
              // variants rely on content height. Same modifier, so cn() drops the h-9.
              isHorizontal && "group-data-horizontal/tabs:h-auto",
              tabListVariants({ variant, fullWidth }),
              fullWidth === true && orientation === "vertical" && "w-fit",
              tabListClassName
            )}
          >
            {items.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                disabled={item.disabled}
                className={cn(
                  tabTriggerVariants({ variant }),
                  orientation === "vertical" && "w-full justify-start",
                  orientation === "vertical" &&
                    variant === "underline" &&
                    "relative after:absolute after:inset-y-0 after:right-0 after:-mr-1 after:h-auto after:w-0.5",
                  iconPlacement === "top" && "flex-col",
                  tabTriggerClassName
                )}
              >
                {showBadge && item.badgeContent !== undefined && badgePlacement === "start" && (
                  <IGRPBadge
                    variant={item.badgeVariant}
                    color={item.badgeColor}
                    badgeClassName={cn(item.badgeClassName)}
                  >
                    {item.badgeContent}
                  </IGRPBadge>
                )}

                {showIcon && item.icon && iconPlacement === "start" && <IGRPIcon iconName={item.icon} />}

                {showIcon && item.icon && iconPlacement === "top" && <IGRPIcon iconName={item.icon} />}

                {item.label && <span>{item.label}</span>}

                {showIcon && item.icon && iconPlacement === "end" && <IGRPIcon iconName={item.icon} />}

                {showBadge && item.badgeContent !== undefined && badgePlacement === "end" && (
                  <IGRPBadge
                    variant={item.badgeVariant}
                    color={item.badgeColor}
                    badgeClassName={cn(item.badgeClassName)}
                  >
                    {item.badgeContent}
                  </IGRPBadge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {showIndicators && canScrollRight && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={cn(
              "z-10 shrink-0 bg-background/80 shadow-md backdrop-blur-sm hover:bg-background",
              scrollButtonClassName
            )}
            onClick={() => scrollToTab("right")}
            aria-label={i18n.tabs.scrollRight}
            type="button"
          >
            <IGRPIcon iconName="ChevronRight" size={12} />
          </Button>
        )}
      </div>

      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value}
          className={cn(
            "w-full rounded-md border border-transparent p-4",
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
