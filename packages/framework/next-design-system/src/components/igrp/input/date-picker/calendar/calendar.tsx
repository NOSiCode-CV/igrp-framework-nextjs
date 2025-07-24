import { useState } from 'react';
import type { DropdownNavProps, DropdownProps, PropsBase, PropsSingle } from 'react-day-picker';
import { Calendar as DropdownCalendar } from '@/components/horizon/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';

type IGRPCalendarProps = {
  id: string;
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

function IGRPCalendar({
  id,
  date = new Date(),
  onDateChange,
  startDate,
  endDate,
  dayButtonClassName,
  ...props
}: IGRPCalendarProps) {
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
      mode='single'
      id={id}
      selected={date}
      onSelect={onDateChange}
      className='p-1'
      classNames={{
        month_caption: 'mx-0',
        day_button: dayButtonClassName,
      }}
      captionLayout='dropdown'
      month={month}
      onMonthChange={setMonth}
      defaultMonth={date || today}
      startMonth={startDate}
      endMonth={endDate}
      components={{
        DropdownNav: (props: DropdownNavProps) => {
          return <div className='flex w-full items-center gap-2'>{props.children}</div>;
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
              <SelectTrigger className='h-8 w-fit font-medium first:grow'>
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
