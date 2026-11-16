"use client"

import { isValidElement, useCallback, useState, type ReactNode } from "react"
import Link from "next/link"

import { cn } from "../cn.js"
import { type IGRPPlacementProps } from "../../../types.js"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../primitives/dropdown-menu.js"
import { buttonVariants } from "../../primitives/button.js"
import { Dialog, DialogTrigger } from "../../primitives/dialog.js"
import { IGRPAlertDialog } from "../alert-dialog.js"
import { IGRPDataTableModalContent } from "./action-button-icon.js"
import { IGRPIcon, type IGRPIconName } from "../icon/index.js"
import { type IGRPDataTableDialogProps, type IGRPDataTableLinkProps } from "./row-actions.js"
import { useIGRPi18n } from "../../../i18n/index.js"

/**
 * Base props for dropdown menu items.
 * @see IGRPDataTableDropdownMenuDialogProps
 * @see IGRPDataTableDropdownMenuLinkProps
 */
interface IGRPDataTableDropdownProps {
  /** Show icon in menu item. */
  showIcon?: boolean
  /** Icon position. */
  iconPlacement?: IGRPPlacementProps
  /** Menu item variant. */
  variant?: React.ComponentProps<typeof DropdownMenuItem>["variant"]
}

/** @internal */
interface IGRPDataTableDropdownMenuDialogProps
  extends Omit<IGRPDataTableDialogProps, "variant">, IGRPDataTableDropdownProps {}

/** @internal */
interface IGRPDataTableDropdownMenuLinkProps
  extends Omit<IGRPDataTableLinkProps, "variant">, IGRPDataTableDropdownProps {}

/** Dropdown menu item that opens an alert dialog. */
function IGRPDataTableDropdownMenuAlert({
  labelTrigger,
  className,
  icon = "AlertCircle",
  iconClassName,
  children,
  modalTitle,
  showCancel = true,
  labelCancel,
  classNameCancel,
  variantCancel = "outline",
  showConfirm = true,
  labelConfirm,
  classNameConfirm,
  variantConfirm = "default",
  onClickConfirm,
  showIcon = true,
  iconPlacement = "start",
  classNameItem,
  disabled,
}: IGRPDataTableDropdownMenuDialogProps) {
  return (
    <IGRPAlertDialog
      trigger={
        <IGRPDataTableDropdownMenuItem
          showIcon={showIcon}
          iconPlacement={iconPlacement}
          iconClassName={iconClassName}
          icon={icon}
          labelTrigger={labelTrigger}
          classNameItem={classNameItem}
          disabled={disabled}
        />
      }
      className={cn("max-w-md", className)}
      showIcon={false}
      title={modalTitle}
      description={children}
      // A dialog with neither button could only be dismissed with Escape, so cancel always stays.
      showCancel={showCancel || !showConfirm}
      cancelLabel={labelCancel}
      cancelProps={{ className: cn(buttonVariants({ variant: variantCancel }), classNameCancel) }}
      showAction={showConfirm}
      actionLabel={labelConfirm}
      // Fire-and-forget keeps today's close-on-click, even for an async onClickConfirm.
      onAction={() => {
        onClickConfirm?.()
      }}
      actionProps={{ className: cn(buttonVariants({ variant: variantConfirm }), classNameConfirm) }}
    />
  )
}

/** Dropdown menu item that navigates or triggers an action. */
function IGRPDataTableDropdownMenuLink({
  labelTrigger,
  action,
  icon = "ArrowRight",
  href,
  iconPlacement = "start",
  iconClassName,
  showIcon = false,
  classNameItem,
  variant = "default",
  disabled,
}: IGRPDataTableDropdownMenuLinkProps) {
  const iconClass = iconPlacement === "end" ? "flex-row-reverse" : ""
  const customClss = cn("flex w-full items-center gap-2", iconClass, classNameItem)

  const RenderContent = (
    <>
      {showIcon && <IGRPIcon iconName={icon} className={cn("text-muted-foreground", iconClassName)} />}
      <span>{labelTrigger}</span>
    </>
  )

  // A disabled item renders without the anchor: Radix blocks select, not the link's own navigation.
  if (href && !disabled) {
    return (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} asChild variant={variant}>
        <Link href={href} className={customClss}>
          {RenderContent}
        </Link>
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuItem
      className={customClss}
      variant={variant}
      disabled={disabled}
      onSelect={() => {
        if (!action) return
        action()
      }}
    >
      {RenderContent}
    </DropdownMenuItem>
  )
}

type IGRPDataTableDropdownMenuCustomProps = Omit<IGRPDataTableDropdownMenuLinkProps, "href">

function IGRPDataTableDropdownMenuCustom({
  labelTrigger,
  action,
  icon = "ArrowRight",
  iconPlacement = "start",
  iconClassName,
  showIcon = false,
  classNameItem,
  variant,
  disabled,
}: IGRPDataTableDropdownMenuCustomProps) {
  const iconClass = iconPlacement === "end" ? "flex-row-reverse" : ""

  const handlerAction = () => {
    if (typeof action === "function") {
      action()
    } else {
      console.warn("No action function provided")
    }
  }

  return (
    <DropdownMenuItem
      className={cn("flex w-full items-center gap-2", iconClass, classNameItem)}
      onSelect={handlerAction}
      variant={variant}
      disabled={disabled}
    >
      {showIcon && <IGRPIcon iconName={icon} className={cn("text-muted-foreground", iconClassName)} />}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  )
}

interface IGRPDataTableDropdownMenuItemProps
  extends
    IGRPDataTableDropdownProps,
    Pick<IGRPDataTableDropdownMenuDialogProps, "icon" | "labelTrigger" | "iconClassName"> {
  onClick?: () => void
  classNameItem?: string
  disabled?: boolean
}

function IGRPDataTableDropdownMenuItem({
  showIcon = true,
  iconPlacement = "start",
  iconClassName,
  icon = "ArrowRight",
  labelTrigger,
  onClick,
  classNameItem,
  variant,
  disabled,
}: IGRPDataTableDropdownMenuItemProps) {
  const iconClass = iconPlacement === "end" ? "flex-row-reverse" : ""

  return (
    <DropdownMenuItem
      // The dialog trigger's onClick reaches here through Slot; disabled must not open it.
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn("flex w-full items-center gap-2", iconClass, classNameItem)}
      onSelect={(e) => {
        e.preventDefault()
      }}
      variant={variant}
    >
      {showIcon && <IGRPIcon iconName={icon} className={cn("text-muted-foreground", iconClassName)} />}
      <span>{labelTrigger}</span>
    </DropdownMenuItem>
  )
}

/** Dropdown menu item that opens a modal dialog; `render` receives the dialog's real `close`. */
function IGRPDataTableDropdownMenuModal({
  labelTrigger,
  icon = "Edit",
  iconClassName,
  showIcon = true,
  iconPlacement = "start",
  classNameItem,
  children,
  disabled,
  ...dialogProps
}: IGRPDataTableDropdownMenuDialogProps) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IGRPDataTableDropdownMenuItem
          showIcon={showIcon}
          iconPlacement={iconPlacement}
          iconClassName={iconClassName}
          icon={icon}
          labelTrigger={labelTrigger}
          classNameItem={classNameItem}
          disabled={disabled}
        />
      </DialogTrigger>
      <IGRPDataTableModalContent {...dialogProps} close={close}>
        {children}
      </IGRPDataTableModalContent>
    </Dialog>
  )
}

/**
 * Dropdown menu item for a `custom` row action: the node itself becomes the menu item
 * (its own `onClick` runs on select). Text or fragments are wrapped in a plain item.
 */
function IGRPDataTableDropdownMenuNode({
  node,
  disabled,
}: {
  node?: ReactNode
  labelTrigger?: string
  disabled?: boolean
}) {
  if (isValidElement(node)) {
    return (
      <DropdownMenuItem asChild disabled={disabled}>
        {node}
      </DropdownMenuItem>
    )
  }
  return <DropdownMenuItem disabled={disabled}>{node}</DropdownMenuItem>
}

type IGRPDataTableActionDropdown =
  | {
      /** Stable key for list rendering; use when items may be reordered or filtered. */
      id?: string
      component: typeof IGRPDataTableDropdownMenuLink
      props: IGRPDataTableDropdownMenuLinkProps
    }
  | {
      id?: string
      component: typeof IGRPDataTableDropdownMenuAlert
      props: IGRPDataTableDropdownMenuDialogProps
    }
  | {
      id?: string
      component: typeof IGRPDataTableDropdownMenuCustom
      props: IGRPDataTableDropdownMenuDialogProps
    }
  | {
      id?: string
      component: typeof IGRPDataTableDropdownMenuModal
      props: IGRPDataTableDropdownMenuDialogProps
    }
  | {
      id?: string
      component: typeof IGRPDataTableDropdownMenuNode
      props: { node?: ReactNode; labelTrigger?: string; disabled?: boolean }
    }

type IGRPDataTableDropdownMenuProps = {
  items: IGRPDataTableActionDropdown[]
  iconName?: IGRPIconName | string
}

function IGRPDataTableDropdownMenu({ items, iconName = "Ellipsis" }: IGRPDataTableDropdownMenuProps) {
  const i18n = useIGRPi18n()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center justify-center")} aria-label={i18n.dataTable.openActions}>
        <IGRPIcon iconName={iconName} className={cn("shadow-none")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => {
          const { component: Component, props } = item
          const key =
            item.id ??
            props.labelTrigger ??
            ("href" in props ? props.href : undefined) ??
            ("modalTitle" in props ? props.modalTitle : undefined) ??
            `action-${index}`
          return <Component key={key} {...props} />
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export {
  type IGRPDataTableDropdownProps,
  type IGRPDataTableActionDropdown,
  type IGRPDataTableDropdownMenuDialogProps,
  type IGRPDataTableDropdownMenuLinkProps,
  type IGRPDataTableDropdownMenuProps,
  type IGRPDataTableDropdownMenuCustomProps,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuCustom,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenuModal,
  IGRPDataTableDropdownMenuNode,
  IGRPDataTableDropdownMenu,
}
