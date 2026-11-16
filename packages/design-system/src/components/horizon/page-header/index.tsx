"use client"

import { type VariantProps } from "class-variance-authority"
import { useId } from "react"

import { IGRPPageHeaderBackButton } from "./back-button.js"
import type { IGRPIconName } from "../icon/index.js"
import { IGRPHeadline, igrpHeadlineVariants } from "../typography/headline.js"
import { cn } from "../cn.js"
import { type IGRPBaseAttributes } from "../../../types.js"

/**
 * Props for the IGRPPageHeader component.
 * @see IGRPPageHeader
 */
interface IGRPPageHeaderProps extends Pick<IGRPBaseAttributes, "name"> {
  /** Page title. */
  title: string
  /** Optional description. */
  description?: string
  /** Headline variant. */
  variant?: VariantProps<typeof igrpHeadlineVariants>["variant"]
  /** Additional CSS classes. */
  className?: string
  /** CSS classes for the headline. */
  headlineClassName?: string
  /** Right-side content (e.g. actions). */
  children?: React.ReactNode
  /** Stick to top when scrolling. */
  isSticky?: boolean
  /**
   * Back button node, e.g. `<IGRPPageHeaderBackButton url="/x" />`. When set
   * (`null` included, which hides it) it wins over `showBackButton` and the other `backButton*` props.
   */
  backButton?: React.ReactNode
  /**
   * Show back button.
   * @deprecated Use `backButton`.
   */
  showBackButton?: boolean
  /**
   * URL for back button (link mode).
   * @deprecated Use `backButton`.
   */
  urlBackButton?: string
  /**
   * Back button icon.
   * @deprecated Use `backButton`.
   */
  iconBackButton?: IGRPIconName | string
  /**
   * Back button variant.
   * @deprecated Use `backButton`.
   */
  backButtonVariant?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["variant"]
  /**
   * Back button size.
   * @deprecated Use `backButton`.
   */
  backButtonSize?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["size"]
  /**
   * Back button aria-label.
   * @deprecated Use `backButton`.
   */
  backButtonAriaLabel?: string
  /**
   * Show text on back button.
   * @deprecated Use `backButton`.
   */
  backButtonShowText?: boolean
  /**
   * Back button text.
   * @deprecated Use `backButton`.
   */
  backButtonText?: string
  /**
   * CSS classes for back button.
   * @deprecated Use `backButton`.
   */
  backButtonClassName?: string
  /**
   * Use browser history back.
   * @deprecated Use `backButton`.
   */
  backButtonUseBrowserBack?: boolean
  /**
   * Custom back button click handler.
   * @deprecated Use `backButton`.
   */
  backButtonOnClick?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["onClick"]
  /** HTML id attribute. */
  id?: string
  headlineContentClassName?: string
  pageHeaderContentClassName?: string
}

/** @internal */
type BackButtonProps = {
  iconBackButton?: IGRPIconName | string
  backButtonVariant?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["variant"]
  backButtonSize?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["size"]
  backButtonAriaLabel?: string
  backButtonShowText?: boolean
  backButtonText?: string
  backButtonClassName?: string
  urlBackButton?: string
  backButtonUseBrowserBack?: boolean
  backButtonOnClick?: React.ComponentProps<typeof IGRPPageHeaderBackButton>["onClick"]
}

function renderBackButton({
  iconBackButton,
  backButtonVariant,
  backButtonSize,
  backButtonAriaLabel,
  backButtonShowText,
  backButtonText,
  backButtonClassName,
  urlBackButton,
  backButtonUseBrowserBack,
  backButtonOnClick,
}: BackButtonProps) {
  const baseProps = {
    iconName: iconBackButton,
    variant: backButtonVariant,
    size: backButtonSize,
    ariaLabel: backButtonAriaLabel,
    showText: backButtonShowText,
    text: backButtonText,
    className: backButtonClassName,
  }

  // Browser back mode - url must not be passed
  if (backButtonUseBrowserBack) {
    return <IGRPPageHeaderBackButton {...baseProps} useBrowserBack={true} onClick={backButtonOnClick} />
  }

  // Custom onClick handler mode - url must not be passed
  if (backButtonOnClick) {
    return <IGRPPageHeaderBackButton {...baseProps} onClick={backButtonOnClick} />
  }

  // Link navigation mode (default) - onClick must not be passed
  return <IGRPPageHeaderBackButton {...baseProps} url={urlBackButton} />
}

/**
 * Page header with title, description, optional back button, and action slot.
 */
function IGRPPageHeader({
  title,
  description,
  variant,
  className,
  headlineClassName,
  headlineContentClassName,
  children,
  name,
  id,
  isSticky,
  backButton,
  showBackButton,
  urlBackButton,
  iconBackButton,
  backButtonVariant,
  backButtonSize,
  backButtonAriaLabel,
  backButtonShowText,
  backButtonText,
  backButtonClassName,
  backButtonUseBrowserBack,
  backButtonOnClick,
  pageHeaderContentClassName,
}: IGRPPageHeaderProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  return (
    <div
      className={cn(
        "flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center",
        isSticky && "sticky top-0 z-10 bg-background pt-6 pb-4",
        className
      )}
      id={ref}
    >
      <div className={cn("flex items-center gap-2", pageHeaderContentClassName)}>
        {backButton !== undefined
          ? backButton
          : showBackButton &&
            renderBackButton({
              iconBackButton,
              backButtonVariant,
              backButtonSize,
              backButtonAriaLabel,
              backButtonShowText,
              backButtonText,
              backButtonClassName,
              urlBackButton,
              backButtonUseBrowserBack,
              backButtonOnClick,
            })}

        <IGRPHeadline
          title={title}
          description={description}
          className={headlineClassName}
          variant={variant}
          name={`h-${ref}`}
          headlineContentClassName={headlineContentClassName}
        />
      </div>

      {children}
    </div>
  )
}

export { IGRPPageHeader, type IGRPPageHeaderProps }
