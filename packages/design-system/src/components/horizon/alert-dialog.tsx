"use client"

import { useId, useState } from "react"
import { Slot } from "radix-ui"

import { IGRPColors, type IGRPColorVariants } from "../../lib/colors.js"
import { igrpAlertIconMappings } from "../../lib/utilities.js"
import { cn } from "cn"
import { type IGRPBaseAttributes } from "../../types.js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../primitives/alert-dialog.js"
import { IGRPButton } from "./button.js"
import { IGRPIcon, type IGRPIconName } from "./icon/index.js"
import { useIGRPi18n } from "../../i18n/index.js"

/**
 * Props for the IGRPAlertDialog component.
 * @see IGRPAlertDialog
 */
interface IGRPAlertDialogProps extends Omit<IGRPBaseAttributes, "ref" | "iconPlacement"> {
  /**
   * Icon position: beside the text (`"start"`, default) or above it (`"center"`).
   * `"end"` is deprecated and renders as `"start"`.
   */
  iconPlacement?: "start" | "center" | "end"
  /** Element that opens the dialog (rendered through `AlertDialogTrigger asChild`), e.g. an `IGRPButton`. */
  trigger?: React.ReactNode
  /** Whether the dialog is open (controlled). Leave unset with `trigger` to let the dialog manage itself. */
  open?: boolean
  /** Called when open state changes. */
  onOpenChange?: (open: boolean) => void
  /** Color theme (e.g. 'primary', 'destructive'). */
  variant?: IGRPColorVariants
  /** Additional CSS classes. */
  className?: string
  /** Dialog title. */
  title?: string
  /** CSS classes for the title. */
  titleClassName?: string
  /** Dialog description (announced as the dialog's accessible description). */
  description?: React.ReactNode
  /** CSS classes for the description. */
  descriptionClassName?: string
  /** Additional content. */
  children?: React.ReactNode
  /** CSS classes for the footer. */
  footerClassName?: string
  /** Label for the confirm/action button. */
  actionLabel?: string
  /** Label for the cancel button. */
  cancelLabel?: string
  /**
   * Called when the action button is clicked. Return a Promise to keep the dialog
   * open with the action button loading until it settles: it closes on resolve and
   * stays open on reject (report the error from `onAction`).
   */
  onAction?: () => void | Promise<unknown>
  /** Called when the cancel button is clicked. */
  onCancel?: () => void
  /** Whether to show the cancel button. */
  showCancel?: boolean
  /** Whether to show the action button. Default `true`. */
  showAction?: boolean
  /** Props passed to the action button. */
  actionProps?: Partial<React.ComponentProps<typeof AlertDialogAction>>
  /** Props passed to the cancel button. */
  cancelProps?: Partial<React.ComponentProps<typeof AlertDialogCancel>>
  /** HTML id attribute. */
  id?: string
}

/**
 * Alert dialog for confirmations and destructive actions.
 * Supports icon, title, description, and action/cancel buttons.
 */
function IGRPAlertDialog({
  open,
  onOpenChange,
  variant = "primary",
  className,
  showIcon = true,
  iconName,
  iconPlacement: iconPlacementProp = "start",
  trigger,
  title,
  titleClassName,
  description,
  descriptionClassName,
  children,
  footerClassName,
  actionLabel,
  cancelLabel,
  onAction,
  onCancel,
  showCancel = true,
  showAction = true,
  actionProps,
  cancelProps,
  name,
  id,
}: IGRPAlertDialogProps) {
  const i18n = useIGRPi18n()
  const _id = useId()
  const ref = name ?? id ?? _id

  const iconDefault = igrpAlertIconMappings[variant]
  const softColors = IGRPColors.soft[variant]
  const strongColors = IGRPColors.solid[variant]
  const actionClassName = actionProps ? actionProps.className : `${strongColors.bg} hover:${strongColors.bg}`

  const iconPlacement = iconPlacementProp === "center" ? "center" : "start"
  const [internalOpen, setInternalOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const isOpen = open ?? internalOpen

  const commitOpen = (next: boolean) => {
    if (open === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  // Escape, overlay and cancel can't close the dialog while an async action runs.
  const handleOpenChange = (next: boolean) => {
    if (!next && pending) return
    commitOpen(next)
  }

  const handleAction = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      event.preventDefault()
      return
    }
    const result = onAction?.()
    if (!result || typeof (result as Promise<unknown>).then !== "function") return
    // AlertDialogAction closes on click unless the default is prevented.
    event.preventDefault()
    setPending(true)
    ;(result as Promise<unknown>).then(
      () => {
        setPending(false)
        commitOpen(false)
      },
      (error: unknown) => {
        setPending(false)
        // Rethrow so the rejection still reaches global error reporting.
        throw error
      }
    )
  }

  const handleCancel = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      event.preventDefault()
      return
    }
    if (onCancel) onCancel()
  }

  // While pending, cancel stays focusable (aria-disabled, not native `disabled`) so
  // keyboard focus isn't dropped to <body>; `IGRPButton loading` does the same for the action.
  const pendingClassName = pending && "cursor-wait opacity-50"

  return (
    <Slot.Root id={ref}>
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
        <AlertDialogContent className={className}>
          {showIcon && iconPlacement === "center" && (
            <div className="-mt-2 flex justify-center">
              <AlertIcon
                iconName={iconName || iconDefault}
                bgClass={softColors.bg}
                textClass={softColors.text}
                iconPlacement={iconPlacement}
              />
            </div>
          )}
          <div className={cn("flex", iconPlacement === "start" && showIcon ? "items-start gap-2" : "flex-col")}>
            {showIcon && iconPlacement === "start" && (
              <AlertIcon
                iconName={iconName || iconDefault}
                bgClass={softColors.bg}
                textClass={softColors.text}
                iconPlacement={iconPlacement}
              />
            )}
            <div className="flex-1">
              <AlertDialogHeader className={cn(iconPlacement === "center" && "items-center")}>
                {/* Always rendered: Radix requires a title for screen readers, even an empty one. */}
                <AlertDialogTitle className={cn(!title && "sr-only", titleClassName)}>{title}</AlertDialogTitle>
                {description && (
                  <AlertDialogDescription className={descriptionClassName}>{description}</AlertDialogDescription>
                )}
              </AlertDialogHeader>
              {children && <div className={cn("my-4", iconPlacement === "center" && "text-center")}>{children}</div>}

              <AlertDialogFooter
                className={cn("mt-3", iconPlacement === "center" && "flex-col sm:flex-row", footerClassName)}
              >
                {showCancel && (
                  <AlertDialogCancel
                    onClick={handleCancel}
                    aria-disabled={pending || undefined}
                    {...cancelProps}
                    className={cn(cancelProps?.className, pendingClassName)}
                  >
                    {cancelLabel ?? i18n.alertDialog.cancel}
                  </AlertDialogCancel>
                )}
                {showAction && (
                  <AlertDialogAction asChild onClick={handleAction} {...actionProps} className={actionClassName}>
                    <IGRPButton loading={pending}>{actionLabel ?? i18n.alertDialog.action}</IGRPButton>
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Slot.Root>
  )
}

interface AlertIconProps {
  bgClass: string
  textClass: string
  iconPlacement: "start" | "center"
  iconName: IGRPIconName | string
}

function AlertIcon({ bgClass, iconPlacement, iconName, textClass }: AlertIconProps) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full p-1",
        bgClass,
        iconPlacement === "center" && "mx-auto"
      )}
    >
      <IGRPIcon iconName={iconName} className={cn("size-6", textClass)} />
    </div>
  )
}

export { IGRPAlertDialog, type IGRPAlertDialogProps }
