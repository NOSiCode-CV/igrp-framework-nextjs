import type {
  DateRange,
  DropdownNavProps,
  DropdownProps,
  PropsBase,
  PropsRange,
} from 'react-day-picker';
import { Calendar as DropdownCalendar } from '@/components/horizon/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/primitives/select';

type IGRPCalendarRangeProps = {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  startDate?: Date;
  endDate?: Date;
  className?: string;
  dayButtonClassName?: string;
} & PropsBase &
  (
    | Omit<PropsRange, 'required'>
    | {
        mode?: undefined;
        required?: boolean;
      }
  );

function IGRPCalendarRange({
  id,
  date,
  onDateChange,
  startDate = new Date(2020, 0, 1),
  endDate = new Date(2030, 11, 31),
  dayButtonClassName,
  required,
  ...props
}: IGRPCalendarRangeProps) {
  const today = new Date();

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
      mode='range'
      id={id}
      selected={date}
      onSelect={onDateChange}
      numberOfMonths={2}
      required={required}
      className='p-2'
      classNames={{
        day_button: dayButtonClassName,
        months: 'sm:flex-col md:flex-row gap-8',
        month:
          'relative first-of-type:before:hidden before:absolute max-md:before:inset-x-2 max-md:before:h-px max-md:before:-top-4 md:before:inset-y-2 md:before:w-px before:bg-border md:before:-left-4',
      }}
      captionLayout='dropdown'
      defaultMonth={date?.from ?? startDate ?? today}
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

export { IGRPCalendarRange, type IGRPCalendarRangeProps };
