"use client"

import { type Row } from "@tanstack/react-table"
import { format } from "date-fns"

import { DD_MM_YYYY } from "../../../lib/constants"
import { cn } from "../../../lib/utils"
import { Button } from "../../primitives/button"
import { Checkbox } from "../../primitives/checkbox"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../primitives/tooltip"
import { Switch } from "../../primitives/switch"
import { IGRPBadge, type IGRPBadgeProps } from "../badge"
import { IGRPIcon } from "../icon"
import { IGRPLink, type IGRPLinkProps } from "../typography/link"

/**
 * Props for the IGRPDataTableCellCheckbox component.
 * @see IGRPDataTableCellCheckbox
 */
interface IGRPDataTableCellCheckboxProps<TData> extends React.ComponentProps<typeof Checkbox> {
  /** Table row. */
  row: Row<TData>
}

/** Checkbox for row selection. */
function IGRPDataTableCellCheckbox<TData>({ row, className, ...props }: IGRPDataTableCellCheckboxProps<TData>) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className={className}
      {...props}
    />
  )
}

/**
 * Props for the IGRPDataTableCellSwitch component.
 * @see IGRPDataTableCellSwitch
 */
interface IGRPDataTableCellSwitchProps<TData> extends React.ComponentProps<typeof Switch> {
  row: Row<TData>
}

/** Switch for row selection. */
function IGRPDataTableCellSwitch<TData>({ row, className, ...props }: IGRPDataTableCellSwitchProps<TData>) {
  return (
    <Switch
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Toggle row"
      className={className}
      {...props}
    />
  )
}

/**
 * Props for the IGRPDataTableCellExpander component.
 * @see IGRPDataTableCellExpander
 */
interface IGRPDataTableCellExpanderProps<TData> extends React.ComponentProps<typeof Button> {
  /** Table row. */
  row: Row<TData>
  /** Field name for aria-label. */
  /** @deprecated */
  field?: string
  label?: string
}

/** Button to expand/collapse row details. */
function IGRPDataTableCellExpander<TData>({ row, label }: IGRPDataTableCellExpanderProps<TData>) {
  if (!row.getCanExpand()) return null
  ;<Button
    {...{
      className: "shadow-none ",
      onClick: row.getToggleExpandedHandler(),
      "aria-expanded": row.getIsExpanded(),
      "aria-label": row.getIsExpanded() ? `Collapse details` : `Expand for details`,
      size: "sm",
      variant: "ghost",
    }}
  >
    <span>{label}</span>
    {row.getIsExpanded() ? <IGRPIcon iconName="ChevronDown" /> : <IGRPIcon iconName="ChevronRight" />}
  </Button>
}

/**
 * Props for the IGRPDataTableCellAmount component.
 * @see IGRPDataTableCellAmount
 */
interface IGRPDataTableCellAmountProps {
  /** Numeric value to format. */
  field: string
  /** Currency code. */
  currency?: string
  /** Locale for formatting. */
  language?: string
  /** Intl.format style. */
  formatStyle?: "currency" | "decimal" | "percent" | "unit"
}

/** Formatted amount/number cell. */
function IGRPDataTableCellAmount({
  field,
  currency = "USD",
  language = "en-US",
  formatStyle = "currency",
}: IGRPDataTableCellAmountProps) {
  const amount = Number.parseFloat(field)
  const formatted = new Intl.NumberFormat(language, {
    style: formatStyle,
    currency: currency,
  }).format(amount)
  return formatted
}

/**
 * Props for the IGRPDataTableCellBadge component.
 * @see IGRPDataTableCellBadge
 */
interface IGRPDataTableCellBadgeProps extends IGRPBadgeProps {
  /** Badge text. */
  label: string
}

/** Badge cell. */
function IGRPDataTableCellBadge({
  label,
  variant,
  color,
  size,
  badgeClassName = "",
  ...props
}: IGRPDataTableCellBadgeProps) {
  return (
    <IGRPBadge variant={variant} color={color} size={size} badgeClassName={badgeClassName} {...props}>
      {label}
    </IGRPBadge>
  )
}

interface IGRPDataTableCellDateProps {
  date: string | Date
  dateFormat?: string
}

function IGRPDataTableCellDate({ date, dateFormat = DD_MM_YYYY }: IGRPDataTableCellDateProps) {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  return <span>{format(d, dateFormat)}</span>
}

function IGRPDataTableCellLink({
  href,
  children,
  target,
  showIcon,
  rel,
  className,
  iconName,
  iconClassName,
  iconPlacement,
  ...props
}: IGRPLinkProps) {
  return (
    <IGRPLink
      href={href}
      target={target}
      showIcon={showIcon}
      rel={rel}
      className={className}
      iconName={iconName}
      iconClassName={iconClassName}
      iconPlacement={iconPlacement}
      {...props}
    >
      {children}
    </IGRPLink>
  )
}

/**
 * Props for the IGRPDataTableCellTooltip component.
 * @see IGRPDataTableCellTooltip
 */
type IGRPDataTableCellTooltipProps = {
  /** Text to show in tooltip. */
  text: string
  /** Tooltip side. */
  side?: "top" | "bottom" | "left" | "right"
  /** Tooltip alignment. */
  align?: "start" | "center" | "end"
}

/** Cell with tooltip on truncated text. */
function IGRPDataTableCellTooltip({ text, side = "top", align = "start" }: IGRPDataTableCellTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("cursor-help whitespace-nowrap truncate")}>
            <span>{text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} sideOffset={4} className={cn("max-w-sm")}>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellSwitch,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableCellLink,
  IGRPDataTableCellTooltip,
  type IGRPDataTableCellExpanderProps,
  type IGRPDataTableCellSwitchProps,
  type IGRPDataTableCellAmountProps,
  type IGRPDataTableCellBadgeProps,
  type IGRPDataTableCellDateProps,
  type IGRPDataTableCellTooltipProps,
}
