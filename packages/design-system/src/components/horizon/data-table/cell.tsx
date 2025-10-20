import { type Row } from '@tanstack/react-table';
import { format } from 'date-fns';

import { Button } from '../../primitives/button';
import { Checkbox } from '../../primitives/checkbox';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../primitives/tooltip';

import { IGRPBadge, type IGRPBadgeProps } from '../badge';
import { IGRPIcon } from '../icon';
import { IGRPLink, type IGRPLinkProps } from '../typography/link';

interface IGRPDataTableCellCheckboxProps<TData> extends React.ComponentProps<typeof Checkbox> {
  row: Row<TData>;
}

function IGRPDataTableCellCheckbox<TData>({
  row,
  className,
  ...props
}: IGRPDataTableCellCheckboxProps<TData>) {
  return (
    <Checkbox
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
      className={className}
      {...props}
    />
  );
}

interface IGRPDataTableCellExpanderProps<TData> {
  row: Row<TData>;
  field: string;
}

function IGRPDataTableCellExpander<TData>({ row, field }: IGRPDataTableCellExpanderProps<TData>) {
  return row.getCanExpand() ? (
    <Button
      {...{
        className: 'size-7 shadow-none text-muted-foreground',
        onClick: row.getToggleExpandedHandler(),
        'aria-expanded': row.getIsExpanded(),
        'aria-label': row.getIsExpanded()
          ? `Collapse details for ${field}`
          : `Expand details for ${field}`,
        size: 'icon',
        variant: 'ghost',
      }}
    >
      {row.getIsExpanded() ? (
        <IGRPIcon iconName="ChevronUp" className="opacity-60" />
      ) : (
        <IGRPIcon iconName="ChevronDown" className="opacity-60" />
      )}
    </Button>
  ) : undefined;
}

interface IGRPDataTableCellAmountProps {
  field: string;
  currency?: string;
  language?: string;
  formatStyle?: 'currency' | 'decimal' | 'percent' | 'unit';
}

function IGRPDataTableCellAmount({
  field,
  currency = 'USD',
  language = 'en-US',
  formatStyle = 'currency',
}: IGRPDataTableCellAmountProps) {
  const amount = Number.parseFloat(field);
  const formatted = new Intl.NumberFormat(language, {
    style: formatStyle,
    currency: currency,
  }).format(amount);
  return formatted;
}

interface IGRPDataTableCellBadgeProps extends IGRPBadgeProps {
  label: string;
}

function IGRPDataTableCellBadge({
  label,
  variant,
  color,
  size,
  badgeClassName,
  ...props
}: IGRPDataTableCellBadgeProps) {
  return (
    <IGRPBadge
      variant={variant}
      color={color}
      size={size}
      badgeClassName={badgeClassName}
      {...props}
    >
      {label}
    </IGRPBadge>
  );
}

interface IGRPDataTableCellDateProps {
  date: string | Date;
  dateFormat?: string;
}

function IGRPDataTableCellDate({ date, dateFormat = 'dd/MM/yyyy' }: IGRPDataTableCellDateProps) {
  if (!date) return null;
  return <span>{format(new Date(date), dateFormat)}</span>;
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
  );
}

type IGRPDataTableCellTooltipProps = {
  text: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
};

function IGRPDataTableCellTooltip({
  text,
  side = 'top',
  align = 'start',
}: IGRPDataTableCellTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help">
            <span>{text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side={side} align={align} sideOffset={4} className="max-w-sm">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// TDOD row expander

export {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  IGRPDataTableCellLink,
  IGRPDataTableCellTooltip,
  type IGRPDataTableCellExpanderProps,
  type IGRPDataTableCellAmountProps,
  type IGRPDataTableCellBadgeProps,
  type IGRPDataTableCellDateProps,
  type IGRPDataTableCellTooltipProps,
};
