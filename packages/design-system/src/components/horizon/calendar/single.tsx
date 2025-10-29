import { useEffect, useState } from 'react';
import { getDisabledDays } from '../../../lib/calendar-utils';
import { cn } from '../../../lib/utils';
import type { IGRPCalendarProps } from '../../../types';
import { Calendar } from '../../primitives/calendar';

type IGRPCalendarSingleProps = {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
} & Omit<IGRPCalendarProps, 'mode'>

function IGRPCalendarSingle({
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
}: IGRPCalendarSingleProps) {
  const [ownDate, setOwnDate] = useState<Date | undefined>(date)
  const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

  useEffect(() => {
    setOwnDate(date);
  }, [date]);

  return (
    <Calendar      
      mode="single"
      id={name || id}
      selected={ownDate}
      onSelect={(date) => {
        setOwnDate(date); 
        onDateChange?.(date);
      }} 
      disabled={disabled}
      className={cn("rounded-lg border shadow-sm", className)}
      {...props}
    />
  );
}

export { IGRPCalendarSingle, type IGRPCalendarSingleProps };
