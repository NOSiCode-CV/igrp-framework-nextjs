'use client';

import { useId, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../ui/calendar';

/**
 * Props for the IGRPCalendarRange component.
 * @see IGRPCalendarRange
 */
type IGRPCalendarRangeProps = {
  /** Selected date range (from/to). */
  date?: DateRange;
  /** Called when the selected range changes. */
  onDateChange?: (date: DateRange | undefined) => void;
} & Omit<IGRPCalendarProps, 'mode'>;

/**
 * Date range calendar picker.
 */
function IGRPCalendarRange({
  name,
  id,
  date,
  onDateChange,
  className,
  defaultMonth,
  disableBefore,
  disableAfter,
  disableDayOfWeek,
  ...props
}: IGRPCalendarRangeProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const selected = date ?? range;
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  return (
    <Calendar
      {...props}
      mode="range"
      id={ref}
      defaultMonth={defaultMonth || selected?.from}
      selected={selected}
      onSelect={(selectedRange) => {
        setRange(selectedRange);
        onDateChange?.(selectedRange);
      }}
      disabled={disabled}
      className={cn('rounded-lg border shadow-sm', className)}
    />
  );
}

export { IGRPCalendarRange, type IGRPCalendarRangeProps };
