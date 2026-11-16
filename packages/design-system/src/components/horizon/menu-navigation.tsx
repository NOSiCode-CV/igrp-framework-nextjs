"use client"

import { useRef, useState, useCallback, createContext, use, useId } from "react"

import type { IGRPColorRole, IGRPColorVariants } from "../../lib/colors.js"
import { cn } from "cn"
import { Card, CardContent, CardHeader, CardTitle } from "../primitives/card.js"
import { IGRPBadge } from "./badge.js"
import { IGRPIcon } from "./icon/index.js"
import { useIGRPi18n } from "../../i18n/index.js"

function getScrollBehavior(): ScrollBehavior {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "auto"
  }
  return "smooth"
}

/**
 * Single menu navigation item.
 * @see IGRPMenuNavigation
 */
interface IGRPMenuNavigationItem {
  /** Unique section id. */
  id: string
  /** Display label. */
  label: React.ReactNode
  /** Icon name. */
  icon: string
  /** Whether the item is disabled. */
  disabled?: boolean
  /** Badge shown at the end of the item, e.g. `<IGRPBadge>3</IGRPBadge>`. */
  badge?: React.ReactNode
}

/**
 * Props for the IGRPMenuNavigation component.
 * @see IGRPMenuNavigation
 */
interface IGRPMenuNavigationProps {
  /** Navigation sections. */
  sections: IGRPMenuNavigationItem[]
  /** Controlled active section id. */
  activeSection?: string
  /** Called when the active section changes. */
  onSectionChange?: (sectionId: string) => void
  /** Navigation title. */
  title?: string
  /**
   * Badge beside the title, e.g. `<IGRPBadge color="info">Novo</IGRPBadge>`.
   * When set (`null` included, which hides it) it wins over `badgeContent` and friends.
   */
  badge?: React.ReactNode
  /**
   * Badge content.
   * @deprecated Use `badge`.
   */
  badgeContent?: string
  /**
   * Badge variant.
   * @deprecated Use `badge`.
   */
  badgeVariant?: IGRPColorRole
  /**
   * Badge color.
   * @deprecated Use `badge`.
   */
  badgeColor?: IGRPColorVariants
  /**
   * CSS classes for the badge.
   * @deprecated Use `badge`.
   */
  badgeClassName?: string
  /** Additional CSS classes. */
  className?: string
  /** Stick to top when scrolling. */
  isStickyTop?: boolean
  /** Show chevron on each item. */
  showChevron?: boolean
  /** HTML id attribute. */
  id?: string
}

/**
 * Value of the menu-navigation context, shared by `IGRPMenuNavigationProvider`,
 * `IGRPMenuNavigation` and `useIGRPMenuNavigation`.
 */
interface IGRPMenuNavigationContextValue {
  state: {
    /** Section the navigation shows as active; `undefined` until one is chosen (the nav then shows its first section). */
    activeSection: string | undefined
  }
  actions: {
    /** Marks a section active (does not scroll). */
    setActive: (sectionId: string) => void
    /** Scrolls a registered section into view. */
    scrollTo: (sectionId: string) => void
    /** Callback ref that registers a section element: `<div ref={registerSection("dados")}>`. */
    registerSection: (sectionId: string) => (el: HTMLDivElement | null) => void
  }
  /** @deprecated Use `actions.registerSection` / `actions.scrollTo`. */
  sectionRefs: React.RefObject<Record<string, HTMLDivElement | null>>
  /** @deprecated Use `actions.scrollTo`. */
  scrollToSection: (sectionId: string) => void
  /** @deprecated Use `actions.registerSection`. */
  getSectionRef: (sectionId: string) => (el: HTMLDivElement | null) => void
}

const NavigationContext = createContext<IGRPMenuNavigationContextValue | null>(null)

/**
 * Props for IGRPMenuNavigationProvider.
 * @see IGRPMenuNavigationProvider
 */
interface IGRPMenuNavigationProviderProps {
  children: React.ReactNode
  /** Controlled active section id. */
  activeSection?: string
  /** Initial active section id when uncontrolled. */
  defaultSection?: string
  /** Called when a section becomes active. */
  onSectionChange?: (sectionId: string) => void
}

/** Owns the active section and the section elements for `IGRPMenuNavigation` and `useIGRPMenuNavigation`. */
function IGRPMenuNavigationProvider({
  children,
  activeSection: controlledActiveSection,
  defaultSection,
  onSectionChange,
}: IGRPMenuNavigationProviderProps) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [internalActiveSection, setInternalActiveSection] = useState(defaultSection)
  const activeSection = controlledActiveSection ?? internalActiveSection

  const scrollToSection = useCallback((sectionId: string) => {
    const sectionRef = sectionRefs.current[sectionId]
    if (sectionRef) {
      sectionRef.scrollIntoView({
        behavior: getScrollBehavior(),
        block: "start",
        inline: "nearest",
      })
    }
  }, [])

  const getSectionRef = useCallback(
    (sectionId: string) => (el: HTMLDivElement | null) => {
      sectionRefs.current[sectionId] = el
    },
    []
  )

  const setActive = useCallback(
    (sectionId: string) => {
      if (controlledActiveSection === undefined) setInternalActiveSection(sectionId)
      onSectionChange?.(sectionId)
    },
    [controlledActiveSection, onSectionChange]
  )

  return (
    <NavigationContext
      value={{
        state: { activeSection },
        actions: { setActive, scrollTo: scrollToSection, registerSection: getSectionRef },
        sectionRefs,
        scrollToSection,
        getSectionRef,
      }}
    >
      {children}
    </NavigationContext>
  )
}

/**
 * Side navigation menu with sections, active state, and scroll-to-section.
 * Inside IGRPMenuNavigationProvider it reads and writes the provider's active
 * section (unless `activeSection` is passed here) and scrolls registered sections.
 */
function IGRPMenuNavigation({
  sections,
  activeSection: controlledActiveSection,
  onSectionChange,
  title: titleProp,
  badge,
  badgeContent,
  badgeVariant,
  badgeColor,
  badgeClassName,
  className,
  showChevron = true,
  isStickyTop = false,
  id,
}: IGRPMenuNavigationProps) {
  const i18n = useIGRPi18n()
  const title = titleProp ?? i18n.menuNavigation.title
  const [internalActiveSection, setInternalActiveSection] = useState(sections[0]?.id || "")
  const navigationContext = use(NavigationContext)

  const _id = useId()
  const ref = id ?? _id

  // When uncontrolled: use internalActiveSection if still valid in sections, else first section
  const uncontrolledSection = navigationContext?.state.activeSection ?? internalActiveSection
  const activeSection =
    controlledActiveSection ??
    (sections.some((s) => s.id === uncontrolledSection)
      ? uncontrolledSection
      : (sections[0]?.id ?? uncontrolledSection))

  const handleSectionClick = useCallback(
    (sectionId: string) => {
      const section = sections.find((s) => s.id === sectionId)
      if (section?.disabled) return

      if (controlledActiveSection === undefined) {
        setInternalActiveSection(sectionId)
      }

      navigationContext?.actions.setActive(sectionId)
      onSectionChange?.(sectionId)

      if (navigationContext) {
        navigationContext.actions.scrollTo(sectionId)
      } else {
        const element = document.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`)
        if (element) {
          element.scrollIntoView({
            behavior: getScrollBehavior(),
            block: "start",
            inline: "nearest",
          })
        }
      }
    },
    [controlledActiveSection, onSectionChange, sections, navigationContext]
  )

  if (sections.length === 0) {
    return null
  }

  return (
    <nav className={cn(isStickyTop && "sticky top-20", className)} id={ref} aria-label={title}>
      <Card className={cn("gap-0 shadow-sm")}>
        <CardHeader className={cn("gap-0 border-b px-4 py-3")}>
          <div className={cn("flex items-center justify-between")}>
            <CardTitle className={cn("text-sm font-medium")}>{title}</CardTitle>
            {badge !== undefined
              ? badge
              : badgeContent && (
                  <IGRPBadge variant={badgeVariant} color={badgeColor} badgeClassName={cn(badgeClassName)}>
                    {badgeContent}
                  </IGRPBadge>
                )}
          </div>
        </CardHeader>
        <CardContent className={cn("p-0")}>
          <div className={cn("divide-y")} role="list">
            {sections.map((section) => (
              // The listitem role belongs to the row, not the control: putting it on the
              // button would replace the button role and the item stops announcing as
              // clickable.
              <div key={section.id} role="listitem">
                <button
                  type="button"
                  onClick={() => handleSectionClick(section.id)}
                  disabled={section.disabled}
                  aria-current={activeSection === section.id ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center justify-between text-left transition-colors",
                    "px-4 py-2.5 text-sm",
                    section.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                    activeSection === section.id
                      ? "bg-primary/5 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  <div className={cn("flex items-center gap-2")}>
                    <IGRPIcon iconName={section.icon} className={cn("size-4 shrink-0")} aria-hidden="true" />
                    <span className={cn("truncate")}>{section.label}</span>
                  </div>
                  {section.badge}
                  {showChevron && (
                    <IGRPIcon
                      iconName="ChevronRight"
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        activeSection === section.id ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </nav>
  )
}

function useIGRPMenuNavigation() {
  const navigationContext = use(NavigationContext)

  const getSectionRef = useCallback(
    (sectionId: string) => (el: HTMLDivElement | null) => {
      if (navigationContext) {
        navigationContext.getSectionRef(sectionId)(el)
      }
    },
    [navigationContext]
  )

  const scrollToSection = useCallback(
    (sectionId: string) => {
      if (navigationContext) {
        navigationContext.scrollToSection(sectionId)
      }
    },
    [navigationContext]
  )

  return {
    getSectionRef,
    scrollToSection,
    /** Active section from the provider (`undefined` outside one). */
    activeSection: navigationContext?.state.activeSection,
    /** Marks a section active; no-op outside a provider. */
    setActive: navigationContext?.actions.setActive ?? noop,
  }
}

const noop = () => {}

export {
  IGRPMenuNavigationProvider,
  IGRPMenuNavigation,
  type IGRPMenuNavigationItem,
  type IGRPMenuNavigationProps,
  type IGRPMenuNavigationProviderProps,
  type IGRPMenuNavigationContextValue,
  // eslint-disable-next-line react-refresh/only-export-components
  useIGRPMenuNavigation,
}
