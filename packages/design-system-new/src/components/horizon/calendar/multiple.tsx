'use client';

import { useId, useMemo, useState } from 'react';
import { addDays } from 'date-fns';

import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../ui/calendar';

function getDefaultMultipleDates(): Date[] {
  return [new Date(), addDays(new Date(), 5)];
}

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
  date,
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

  const [ownDate, setOwnDate] = useState<Date[] | undefined>(undefined);
  const defaultDates = useMemo(() => getDefaultMultipleDates(), []);
  const selected = date ?? ownDate ?? defaultDates;
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  return (
    <Calendar
      {...props}
      mode="multiple"
      id={ref}
      defaultMonth={defaultMonth || selected?.[0] || new Date()}
      selected={selected}
      onSelect={(selectedDates) => {
        setOwnDate(selectedDates);
        onDateChange?.(selectedDates);
      }}
      disabled={disabled}
      className={cn('rounded-lg border shadow-sm', className)}
    />
  );
}

export { IGRPCalendarMultiple, type IGRPCalendarMultipleProps };
