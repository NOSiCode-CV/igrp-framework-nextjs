import { useId, useState } from 'react';
import type { DropdownNavProps, DropdownProps, PropsBase, PropsSingle } from 'react-day-picker';

import { Calendar as DropdownCalendar } from '../../primitives/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../primitives/select';
import { cn } from '../../../lib/utils';

type IGRPCalendarProps = {
  id?: string;
  name?: string;
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  startDate?: Date;
  endDate?: Date;
  className?: string;
  dayButtonClassName?: string;
} & PropsBase &
  (
    | Omit<PropsSingle, 'required'>
    | {
        mode?: undefined;
        required?: boolean;
      }
  );

/**
 * @deprecated This component will be deprecated in the next release.
 * Please migrate to the standard IGRPCalendarSIngle component from `@igrp/igrp-framework-react-design-system`.
 *
 * @example
 * // Instead of:
 * // <IGRPCalendar id="my-calendar" date={date} onDateChange={setDate} />
 *
 * // Use:
 * // <IGRPCalendarSingle id="my-calendar" date={date} onDateChange={setDate} {..props} />
 */
function IGRPCalendar({
  id,
  name,
  date = new Date(),
  onDateChange,
  startDate,
  endDate,
  dayButtonClassName,
  ...props
}: IGRPCalendarProps) {
  const _id = useId();
  const ref = name ?? id ?? _id;

  const today = new Date();
  const [month, setMonth] = useState(date || today);

  const handleCalendarChange = (
    _value: string | number,
    _e: React.ChangeEventHandler<HTMLSelectElement>,
  ) => {
    const _event = {
      target: {
        value: String(_value),
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    _e(_event);
  };

  return (
    <DropdownCalendar
      {...props}
      mode="single"
      id={ref}
      selected={date}
      onSelect={onDateChange}
      className={cn('p-1')}
      classNames={{
        month_caption: 'mx-0',
        day_button: dayButtonClassName,
      }}
      captionLayout="dropdown"
      month={month}
      onMonthChange={setMonth}
      defaultMonth={date || today}
      startMonth={startDate}
      endMonth={endDate}
      components={{
        DropdownNav: (props: DropdownNavProps) => {
          return <div className={cn('flex w-full items-center gap-2')}>{props.children}</div>;
        },
        Dropdown: (props: DropdownProps) => {
          return (
            <Select
              value={String(props.value)}
              onValueChange={(value) => {
                if (props.onChange) {
                  handleCalendarChange(value, props.onChange);
                }
              }}
            >
              <SelectTrigger className={cn('h-8 w-fit font-medium first:grow')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {props.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={String(option.value)}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        },
      }}
    />
  );
}

export { IGRPCalendar, type IGRPCalendarProps };
