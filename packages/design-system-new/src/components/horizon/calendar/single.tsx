'use client';

import { useId, useState } from 'react';

import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../ui/calendar';

/**
 * Props for the IGRPCalendarSingle component.
 * @see IGRPCalendarSingle
 */
type IGRPCalendarSingleProps = {
  /** Selected date. */
  date?: Date;
  /** Called when the selected date changes. */
  onDateChange?: (date: Date | undefined) => void;
} & Omit<IGRPCalendarProps, 'mode'>;

/**
 * Single-date calendar picker.
 */
function IGRPCalendarSingle({
  name,
  id,
  date,
  onDateChange,
  className,
  disableBefore,
  disableAfter,
  disableDayOfWeek,
  ...props
}: IGRPCalendarSingleProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const [ownDate, setOwnDate] = useState<Date | undefined>(undefined);
  const selected = date ?? ownDate;
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  return (
    <Calendar
      mode="single"
      id={ref}
      selected={selected}
      onSelect={(selectedDate) => {
        setOwnDate(selectedDate);
        onDateChange?.(selectedDate);
      }}
      disabled={disabled}
      className={cn('rounded-lg border shadow-sm', className)}
      {...props}
    />
  );
}

export { IGRPCalendarSingle, type IGRPCalendarSingleProps };
