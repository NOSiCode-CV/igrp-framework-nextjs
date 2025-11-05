import { useId, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../primitives/calendar';

type IGRPCalendarRangeProps = {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
} & Omit<IGRPCalendarProps, 'mode'>;

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

  const [range, setRange] = useState<DateRange | undefined>(date);
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  return (
    <Calendar
      {...props}
      mode="range"
      id={ref}
      defaultMonth={defaultMonth || range?.from}
      selected={date}
      onSelect={(date) => {
        setRange(date);
        onDateChange?.(date);
      }}
      disabled={disabled}
      className={cn('rounded-lg border shadow-sm', className)}
    />
  );
}

export { IGRPCalendarRange, type IGRPCalendarRangeProps };
