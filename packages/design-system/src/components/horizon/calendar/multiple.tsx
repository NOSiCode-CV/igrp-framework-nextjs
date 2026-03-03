"use client"

import { useId, useState } from 'react';
import { addDays } from 'date-fns';

import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../primitives/calendar';

/**
 * Props for the IGRPCalendarMultiple component.
 * @see IGRPCalendarMultiple
 */
type IGRPCalendarMultipleProps = {
  /** Selected dates. */
  date?: Date[];
  /** Called when the selected dates change. */
  onDateChange?: (date: Date[] | undefined) => void;
} & Omit<IGRPCalendarProps, 'mode'>;

/**
 * Multi-date calendar picker.
 */
function IGRPCalendarMultiple({
  name,
  id,
  date = [new Date(), addDays(new Date(), 5)],
  onDateChange,
  className,
  defaultMonth,
  disableBefore,
  disableAfter,
  disableDayOfWeek,
  ...props
}: IGRPCalendarMultipleProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const [ownDate, setOwnDate] = useState<Date[] | undefined>(date);
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  return (
    <Calendar
      {...props}
      mode="multiple"
      id={ref}
      defaultMonth={defaultMonth || ownDate?.[0] || new Date()}
      selected={date}
      onSelect={(date) => {
        setOwnDate(date);
        onDateChange?.(date);
      }}
      disabled={disabled}
      className={cn('rounded-lg border shadow-sm', className)}
    />
  );
}

export { IGRPCalendarMultiple, type IGRPCalendarMultipleProps };
