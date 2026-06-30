"use client"

import { Children, isValidElement } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Dialog as IGRPModalDialog,
  DialogClose as IGRPModalDialogClose,
  DialogTrigger as IGRPModalDialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../primitives/dialog"
import { cn } from "../../lib/utils"

const igrpModalDialogContentVariants = cva("w-full max-h-[90vh] overflow-auto", {
  variants: {
    size: {
      sm: "sm:max-w-md",
      md: "sm:max-w-lg",
      lg: "sm:max-w-2xl",
      xl: "sm:max-w-4xl",
      full: "sm:max-w-[95vw] h-[95vh] max-h-[95vh]",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

interface IGRPModalDialogContentProps
  extends React.ComponentProps<typeof DialogContent>, VariantProps<typeof igrpModalDialogContentVariants> {
  contentClassName?: string
}

/**
 * Modal dialog content with size variants and optional sticky header/footer.
 */
function IGRPModalDialogContent({
  className,
  size,
  children,
  contentClassName,
  ...props
}: IGRPModalDialogContentProps) {
  // A sticky header/footer must sit flush against the dialog edge. `DialogContent`'s
  // `p-6` would otherwise clamp `sticky top-0`/`bottom-0` to the padded content box
  // (sticky is constrained by its containing block), so we drop the matching padding
  // when a sticky section is present. Reference equality is intentional — it survives
  // minification, unlike a displayName string compare.
  const hasStickyHeader = Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      child.type === IGRPModalDialogHeader &&
      (child.props as IGRPModalDialogHeaderProps).stickyHeader === true,
  )

  const hasStickyFooter = Children.toArray(children).some(
    (child) =>
      isValidElement(child) &&
      child.type === IGRPModalDialogFooter &&
      (child.props as IGRPModalDialogFooterProps).stickyFooter === true,
  )

  return (
    <DialogContent
      className={cn(
        igrpModalDialogContentVariants({ size }),
        hasStickyHeader && "pt-0",
        hasStickyFooter && "pb-0",
        className,
      )}
      {...props}
    >
      <div className={cn("flex flex-col gap-4", contentClassName)}>{children}</div>
    </DialogContent>
  )
}

interface IGRPModalDialogHeaderProps extends React.ComponentProps<typeof DialogHeader> {
  /** Pin header to top when scrolling. */
  stickyHeader?: boolean
}

/**
 * Modal dialog header with optional sticky positioning.
 *
 * `IGRPModalDialogContent` drops its top padding when this is sticky, so `top-0` pins
 * flush to the dialog edge. The horizontal `-mx-6 px-6` lets the frosted bar span the
 * full width while keeping its text aligned with the body.
 */
function IGRPModalDialogHeader({ className, stickyHeader, ...props }: IGRPModalDialogHeaderProps) {
  return (
    <DialogHeader
      data-igrp-slot="modal-dialog-header"
      className={cn(
        stickyHeader && "sticky top-0 z-10 -mx-6 border-b bg-background/80 px-6 py-3 backdrop-blur-2xl",
        className,
      )}
      {...props}
    />
  )
}

interface IGRPModalDialogFooterProps extends React.ComponentProps<typeof DialogFooter> {
  stickyFooter?: boolean
}

function IGRPModalDialogFooter({ className, stickyFooter, ...props }: IGRPModalDialogFooterProps) {
  return (
    <DialogFooter
      data-igrp-slot="modal-dialog-footer"
      className={cn(
        "flex-col",
        stickyFooter && "sticky bottom-0 z-10 -mx-6 bg-background/80 px-6 py-3 backdrop-blur-2xl",
        className,
      )}
      {...props}
    />
  )
}

/**
 * Modal dialog title.
 */
function IGRPModalDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={className} {...props} />
}

/**
 * Modal dialog description.
 */
function IGRPModalDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={className} {...props} />
}

export {
  IGRPModalDialog,
  IGRPModalDialogClose,
  IGRPModalDialogContent,
  type IGRPModalDialogContentProps,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  type IGRPModalDialogFooterProps,
  IGRPModalDialogHeader,
  type IGRPModalDialogHeaderProps,
  IGRPModalDialogTitle,
  IGRPModalDialogTrigger,
  // eslint-disable-next-line react-refresh/only-export-components
  igrpModalDialogContentVariants,
}
