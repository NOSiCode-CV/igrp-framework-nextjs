import { type Row } from '@tanstack/react-table';
import { format } from 'date-fns';
import { IGRPBadge, type IGRPBadgeProps } from '@/components/igrp/badge';
import { Button } from '@/components/horizon/button';
import { Checkbox } from '@/components/horizon/checkbox';
import { IGRPIcon } from '@/components/igrp/icon';

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
      aria-label='Select row'
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
        <IGRPIcon
          iconName='ChevronDown'
          className='opacity-60'
          size={16}
          strokeWidth={2}
        />
      ) : (
        <IGRPIcon
          iconName='ChevronUp'
          className='opacity-60'
          size={16}
          strokeWidth={2}
        />
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
  // if (date instanceof Date) return <span>{format(new Date(date), dateFormat)}</span>
  // if (typeof date === 'string') {
  //   const dateParse = parse(date, dateFormat, new Date())
  //   return <span>{format(dateParse, dateFormat)}</span>
  // }

  return <span>{format(new Date(date), dateFormat)}</span>;
}

export {
  IGRPDataTableCellCheckbox,
  IGRPDataTableCellExpander,
  IGRPDataTableCellAmount,
  IGRPDataTableCellBadge,
  IGRPDataTableCellDate,
  type IGRPDataTableCellExpanderProps,
  type IGRPDataTableCellAmountProps,
  type IGRPDataTableCellBadgeProps,
  type IGRPDataTableCellDateProps,
};
