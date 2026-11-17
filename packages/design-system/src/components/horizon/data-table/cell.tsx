"use client"
// `row` keeps its identity across renders, so compiler memoization would freeze selection and expansion state.
"use no memo"

import { type Row } from "@tanstack/react-table"
import { TZDate } from "@date-fns/tz"
import { format } from "date-fns"

import { cn } from "../cn.js"
import { Button } from "../../primitives/button.js"
import { Checkbox } from "../../primitives/checkbox.js"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../primitives/tooltip.js"
import { Switch } from "../../primitives/switch.js"
import { IGRPBadge, type IGRPBadgeProps } from "../badge.js"
import { IGRPIcon } from "../icon/index.js"
import { IGRPLink, type IGRPLinkProps } from "../typography/link.js"
import { useIGRPi18n, useIGRPLocale, useIGRPTimeZone } from "../../../i18n/index.js"
import { igrpDateFnsLocale } from "../../../i18n/date-fns-locale.js"
import { igrpIsDateOnly, parseLocalDate } from "../../../lib/utilities.js"
import { igrpDateTimeFormat, igrpNumberFormat } from "../../../lib/intl.js"

/**
 * Props for the IGRPDataTableCellCheckbox component.
 * @see IGRPDataTableCellCheckbox
 */
interface IGRPDataTableCellCheckboxProps<TData> extends React.ComponentProps<typeof Checkbox> {
  /** Table row. */
  row: Row<TData>
  /** Accessible name, e.g. "Selecionar Maria Silva", so rows are told apart. Default: "Selecionar linha". */
  label?: string
}

/** Checkbox for row selection. */
function IGRPDataTableCellCheckbox<TData>({ row, label, className, ...props }: IGRPDataTableCellCheckboxProps<TData>) {
  const i18n = useIGRPi18n()

  return (
    <Checkbox
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={label ?? i18n.dataTable.selectRow}
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
  /** Accessible name, e.g. "Selecionar Maria Silva", so rows are told apart. Default: "Alternar linha". */
  label?: string
}

/** Switch for row selection. */
function IGRPDataTableCellSwitch<TData>({ row, label, className, ...props }: IGRPDataTableCellSwitchProps<TData>) {
  const i18n = useIGRPi18n()

  return (
    <Switch
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label={label ?? i18n.dataTable.toggleRow}
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
  const i18n = useIGRPi18n()
  if (!row.getCanExpand()) return null

  return (
    <Button
      type="button"
      className="shadow-none"
      onClick={row.getToggleExpandedHandler()}
      aria-expanded={row.getIsExpanded()}
      // A visible label is the name (aria-expanded carries the state); only an unlabelled expander needs one.
      aria-label={label ? undefined : row.getIsExpanded() ? i18n.dataTable.collapseRow : i18n.dataTable.expandRow}
      size="sm"
      variant="ghost"
    >
      <span>{label}</span>
      {row.getIsExpanded() ? <IGRPIcon iconName="ChevronDown" /> : <IGRPIcon iconName="ChevronRight" />}
    </Button>
  )
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
  /** Locale for formatting. Defaults to the `IGRPI18nProvider` locale (`pt-PT`). */
  language?: string
  /** Intl.format style. */
  formatStyle?: "currency" | "decimal" | "percent"
}

/** Formatted amount/number cell. */
function IGRPDataTableCellAmount({
  field,
  currency,
  language,
  formatStyle = "currency",
}: IGRPDataTableCellAmountProps) {
  const locale = useIGRPLocale()
  const amount = Number.parseFloat(field)
  if (Number.isNaN(amount)) return null
  const formatted = igrpNumberFormat(language ?? locale, {
    // Intl throws on style "currency" without a currency; no currency means a plain number.
    style: formatStyle === "currency" && !currency ? "decimal" : formatStyle,
    currency,
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
  /** Locale for formatting. Defaults to the `IGRPI18nProvider` locale (`pt-PT`). */
  language?: string
  /** Intl.DateTimeFormat options. */
  dateOptions?: Intl.DateTimeFormatOptions
  /**
   * @deprecated Use `language` / `dateOptions`. A date-fns pattern (e.g. `"dd/MM/yyyy"`); when set it
   * takes precedence and formats with date-fns as before. Will be removed in the next release.
   */
  dateFormat?: string
}

function IGRPDataTableCellDate({ date, language, dateOptions, dateFormat }: IGRPDataTableCellDateProps) {
  const locale = useIGRPLocale()
  const tz = useIGRPTimeZone()
  if (!date) return null
  const dateOnly = igrpIsDateOnly(date)
  // A date-only string is a calendar day: parse it as UTC midnight and format in UTC so no zone shifts it.
  const d = date instanceof Date ? date : dateOnly ? new Date(`${date}T00:00:00Z`) : new Date(date)
  if (Number.isNaN(d.getTime())) return null
  // V8 rolls "2026-02-31" over to March instead of rejecting it.
  if (dateOnly && d.toISOString().slice(0, 10) !== date) return null
  const timeZone = dateOnly ? "UTC" : (dateOptions?.timeZone ?? tz)
  if (dateFormat) {
    // date-fns formats in the runtime zone; a TZDate makes it format in the provider's zone like Intl does.
    const value = dateOnly ? parseLocalDate(date) : timeZone ? new TZDate(d, timeZone) : d
    return <span>{format(value, dateFormat, { locale: igrpDateFnsLocale(locale) })}</span>
  }
  return <span>{igrpDateTimeFormat(language ?? locale, { ...dateOptions, timeZone }).format(d)}</span>
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
          <div className={cn("cursor-help truncate whitespace-nowrap")}>
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
