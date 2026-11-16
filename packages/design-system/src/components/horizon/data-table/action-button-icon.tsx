"use client"

import { useCallback, useState, type ReactElement } from "react"
import Link from "next/link"

import { cn } from "../cn.js"
import { Button, buttonVariants } from "../../primitives/button.js"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../primitives/dialog.js"
import { IGRPAlertDialog } from "../alert-dialog.js"
import { IGRPButton } from "../button.js"
import { IGRPIcon } from "../icon/index.js"
import { igrpModalDialogContentVariants } from "../modal-dialog.js"
import { IGRPTooltip } from "../tooltip.js"
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from "./row-actions.js"
import { useIGRPi18n } from "../../../i18n/index.js"

/**
 * @internal Wraps action button with tooltip when label is provided. Extra props
 * (from an `asChild` dialog trigger) are forwarded to the button.
 */
function IGRPDataTableActionTooltip({
  label,
  children,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipClassName,
  tooltipSideOffset = 6,
  tooltipDelayDuration = 0,
  disabled,
  ...slotProps
}: {
  label?: string
  disabled?: boolean
  children: ReactElement
  tooltipSide?: "top" | "right" | "bottom" | "left"
  tooltipAlign?: "center" | "start" | "end"
  tooltipClassName?: string
  tooltipSideOffset?: number
  tooltipDelayDuration?: number
}) {
  return (
    <IGRPTooltip
      label={label}
      side={tooltipSide}
      align={tooltipAlign}
      className={tooltipClassName}
      sideOffset={tooltipSideOffset}
      delayDuration={tooltipDelayDuration}
      disabled={disabled}
      {...slotProps}
    >
      {children}
    </IGRPTooltip>
  )
}

/** Icon button that opens an alert dialog. */
function IGRPDataTableButtonAlert({
  labelTrigger,
  classNameTrigger,
  className,
  icon = "ArrowRight",
  iconClassName,
  children,
  variant = "default",
  disabled,
  modalTitle,
  showCancel = true,
  labelCancel,
  classNameCancel,
  variantCancel,
  showConfirm = true,
  labelConfirm,
  classNameConfirm,
  variantConfirm,
  onClickConfirm,
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableDialogProps) {
  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
    disabled,
  }

  return (
    <IGRPAlertDialog
      trigger={
        <IGRPDataTableActionTooltip {...tooltipProps}>
          <IGRPButton
            variant={variant}
            size="icon-sm"
            className={cn("size-7", classNameTrigger)}
            iconName={icon}
            iconClassName={iconClassName}
            aria-label={labelTrigger}
            disabled={disabled}
          />
        </IGRPDataTableActionTooltip>
      }
      className={className}
      showIcon={false}
      title={modalTitle}
      description={children}
      // A dialog with neither button could only be dismissed with Escape, so cancel always stays.
      showCancel={showCancel || !showConfirm}
      cancelLabel={labelCancel}
      cancelProps={{ className: cn(buttonVariants({ variant: variantCancel }), "cursor-pointer", classNameCancel) }}
      showAction={showConfirm}
      actionLabel={labelConfirm}
      // Fire-and-forget keeps today's close-on-click, even for an async onClickConfirm.
      onAction={() => {
        onClickConfirm?.()
      }}
      actionProps={{ className: cn(buttonVariants({ variant: variantConfirm }), "cursor-pointer", classNameConfirm) }}
    />
  )
}

/** Icon button that navigates (link) or triggers an action. */
function IGRPDataTableButtonLink({
  labelTrigger,
  action,
  icon = "ArrowRight",
  variant = "default",
  href,
  className,
  disabled,
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableLinkProps) {
  if (!href && !action) return null

  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
    disabled,
  }

  return href && !disabled ? (
    <IGRPDataTableActionTooltip {...tooltipProps}>
      <Button variant={variant} size="icon-sm" className={cn("size-8", className)} asChild>
        <Link href={href} className={cn("flex items-center")} aria-label={labelTrigger}>
          <IGRPIcon iconName={icon} />
          <span className={cn("sr-only")}>{labelTrigger}</span>
        </Link>
      </Button>
    </IGRPDataTableActionTooltip>
  ) : (
    <IGRPDataTableActionTooltip {...tooltipProps}>
      <IGRPButton
        variant={variant}
        size="icon-sm"
        className={className}
        onClick={action}
        iconName={icon}
        iconClassName="size-4"
        aria-label={labelTrigger}
        disabled={disabled}
      />
    </IGRPDataTableActionTooltip>
  )
}

/** Icon button that opens a modal dialog. */
function IGRPDataTableButtonModal({
  labelTrigger,
  className,
  classNameTrigger,
  icon = "ArrowRight",
  children,
  render,
  variant = "default",
  disabled,
  modalTitle = "",
  showCancel = true,
  labelCancel,
  classNameCancel,
  variantCancel,
  showConfirm = true,
  labelConfirm,
  classNameConfirm,
  variantConfirm,
  onClickConfirm,
  size = "lg",
  tooltipSide,
  tooltipAlign,
  tooltipClassName,
  tooltipSideOffset,
  tooltipDelayDuration,
}: IGRPDataTableDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  const tooltipProps = {
    label: labelTrigger,
    tooltipSide,
    tooltipAlign,
    tooltipClassName,
    tooltipSideOffset,
    tooltipDelayDuration,
    disabled,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <IGRPDataTableActionTooltip {...tooltipProps}>
        <DialogTrigger asChild>
          <IGRPButton
            variant={variant}
            size="icon-sm"
            className={cn("size-7", classNameTrigger)}
            iconName={icon}
            aria-label={labelTrigger}
            disabled={disabled}
          />
        </DialogTrigger>
      </IGRPDataTableActionTooltip>
      <IGRPDataTableModalContent
        modalTitle={modalTitle}
        size={size}
        className={className}
        close={close}
        render={render}
        showCancel={showCancel}
        labelCancel={labelCancel}
        classNameCancel={classNameCancel}
        variantCancel={variantCancel}
        showConfirm={showConfirm}
        labelConfirm={labelConfirm}
        classNameConfirm={classNameConfirm}
        variantConfirm={variantConfirm}
        onClickConfirm={onClickConfirm}
      >
        {children}
      </IGRPDataTableModalContent>
    </Dialog>
  )
}

/**
 * @internal Dialog body shared by the inline modal button and the dropdown modal item.
 * Must sit inside a `<Dialog>`; `close` is that dialog's real close callback.
 */
function IGRPDataTableModalContent({
  modalTitle = "",
  size = "lg",
  className,
  close,
  render,
  children,
  showCancel = true,
  labelCancel,
  classNameCancel,
  variantCancel,
  showConfirm = true,
  labelConfirm,
  classNameConfirm,
  variantConfirm,
  onClickConfirm,
}: Omit<IGRPDataTableDialogProps, "labelTrigger" | "icon" | "variant" | "disabled"> & { close: () => void }) {
  const i18n = useIGRPi18n()
  return (
    <DialogContent
      className={cn(
        "flex flex-col gap-0 p-0 sm:max-h-[min(640px,90vh)] [&>button:last-child]:top-3.5",
        igrpModalDialogContentVariants({ size }),
        className
      )}
    >
      <DialogHeader className={cn("contents space-y-0 text-left")}>
        <DialogTitle className={cn(modalTitle && "border-b px-6 py-4 text-base")}>{modalTitle}</DialogTitle>

        {/*
        Short, visually-hidden description satisfies Radix's aria-describedby
        contract WITHOUT announcing the whole body subtree. The body below is
        a plain <div>, not <DialogDescription asChild> — asChild cloned via
        Slot.React.Children.only, which (a) announced the entire form as the
        dialog description and (b) threw for any multi-root render().
      */}
        <DialogDescription className={cn("sr-only")}>
          {modalTitle || i18n.modalDialog.contentDescription}
        </DialogDescription>

        <div data-slot="dialog-body" className={cn("overflow-y-auto", !modalTitle && "mt-4")}>
          {render ? render(close) : children}

          {(showCancel || showConfirm) && (
            <DialogFooter className={cn("mt-4 px-6 pb-6 sm:justify-start")}>
              <DialogClose
                className={cn(buttonVariants({ variant: variantCancel }), "cursor-pointer", classNameCancel)}
              >
                {labelCancel ?? i18n.alertDialog.cancel}
              </DialogClose>

              <IGRPButton variant={variantConfirm} className={classNameConfirm} onClick={onClickConfirm}>
                {labelConfirm ?? i18n.alertDialog.action}
              </IGRPButton>
            </DialogFooter>
          )}
        </div>
      </DialogHeader>
    </DialogContent>
  )
}

export { IGRPDataTableButtonAlert, IGRPDataTableButtonLink, IGRPDataTableButtonModal, IGRPDataTableModalContent }
