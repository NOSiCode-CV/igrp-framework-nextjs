// 'use client';

// import { CalendarIcon, XIcon } from 'lucide-react';
// import { useId, useState, useEffect } from 'react';
// import { useFormContext } from 'react-hook-form';
// import type { DateRange } from 'react-day-picker';

// import { 
//   formatDateRange, 
//   getDisabledDays, 
//   isValidDate, 
//   parseStringToRange
// } from '../../../../lib/calendar-utils';
// import { DD_MM_YYYY } from '../../../../lib/constants';
// import { cn } from '../../../../lib/utils';
// import { type IGRPDatePickerBaseProps } from '../../../../types';
// import { Button } from '../../../primitives/button';
// import {
//   FormControl,
//   FormDescription,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '../../../primitives/form';
// import { Input } from '../../../primitives/input';
// import { Popover, PopoverContent, PopoverTrigger } from '../../../primitives/popover';
// import { type IGRPCalendarRangeProps } from '../../calendar/range';
// import { IGRPLabel } from '../../label';
// import { Calendar } from '../../../primitives/calendar';

// type IGRPDatePickerInputRangeProps = IGRPCalendarRangeProps & IGRPDatePickerBaseProps;

// function IGRPDatePickerInputRange({
//   name,
//   date,
//   onDateChange,
//   label,
//   labelClassName,
//   helperText,
//   className,
//   required = false,
//   disabledPicker = false,
//   dateFormat = DD_MM_YYYY,
//   disableBefore,
//   disableAfter,
//   disableDayOfWeek,
//   ...calendarProps
// }: IGRPDatePickerInputRangeProps) {
//   const id = useId();
//   const fieldName = name ?? id;

//   const formContext = useFormContext();

//   const [localDate, setLocalDate] = useState<DateRange | undefined>(date);
//   const [month, setMonth] = useState<Date | undefined>(localDate?.from)
//   const [value, setValue] = useState(formatDateRange(date, dateFormat));
//   const [open, setOpen] = useState(false)

//   useEffect(() => {
//     if (!formContext) {
//       setLocalDate(date);
//       setValue(formatDateRange(date, dateFormat));
//     }
//   }, [date, formContext]);

//   useEffect(() => {
//     if (!formContext && typeof onDateChange !== 'function') {
//       console.warn('DatePicker in standalone mode requires `onDateChange`');
//     }
//   }, [formContext, onDateChange]);

//   const disabled = getDisabledDays({ disableBefore, disableAfter, disableDayOfWeek });

//   const renderPicker = (onChange: (date: DateRange | undefined) => void) => (
//     <div className="relative flex gap-2">
//       <Input
//         id={fieldName}
//         name={fieldName}
//         value={value}
//         placeholder={`${dateFormat} / ${dateFormat}`}
//         className="bg-background pr-10"
//         disabled={disabledPicker}
//         onChange={(e) => {
//           const parsedDate = parseStringToRange(e.target.value, dateFormat)          
//           setValue(e.target.value)
//           if (isValidDate(parsedDate.from)) {
//             setLocalDate(parsedDate);
//             setMonth(parsedDate.from)
//             onChange?.(parsedDate);
//             onDateChange?.(parsedDate);
//           }
//         }}
//         onKeyDown={(e) => {
//           if (e.key === "ArrowDown" && !disabledPicker) {
//             e.preventDefault()
//             setOpen(true)
//           }
//         }}
//       />

//       {localDate && (
//         <Button
//           id={`${fieldName}-clean`}
//           variant="ghost"
//           className="absolute top-1/2 right-8 size-6 -translate-y-1/2"
//           disabled={disabledPicker}
//           aria-label="Open Calendar"
//           onClick={() => {
//             setLocalDate(undefined)
//             setMonth(undefined)
//             setValue('')
//             onDateChange?.(undefined)
//             onChange?.(undefined);
//           }}
//         >
//           <XIcon className="size-3.5" />
//           <span className="sr-only">Remover Data</span>
//         </Button>
//       )}

//       <Popover open={open} onOpenChange={(v) => !disabledPicker && setOpen(v)}>
//         <PopoverTrigger asChild>
          
//             <Button
//               id={`date-picker-btn-${fieldName}`}
//               variant="ghost"
//               className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
//             >
//               <CalendarIcon className="size-3.5" />
//               <span className="sr-only">Selecionar Data</span>
//             </Button>
          
//         </PopoverTrigger>
//         <PopoverContent
//           className="p-0 w-auto shadow-none"
//           align="start"
//           alignOffset={-8}
//           sideOffset={10}
//         >
//           <Calendar
//             mode="range"
//             id={name || id}
//             selected={localDate}
//             captionLayout="dropdown"
//             month={month}
//             onMonthChange={setMonth}
//             onSelect={(range) => {
//               if (range?.from && range?.to) {
//                 setLocalDate(range);
//                 setValue(formatDateRange(range, dateFormat));
//                 onDateChange?.(range);              
//                 setOpen(false)
//               }              
//             }}
//             disabled={disabled}
//             className={cn("rounded-lg border shadow-sm", className)}
//             {...calendarProps}
//           />
//         </PopoverContent>
//       </Popover>
//     </div>
//   );

//   if (formContext) {
//     return (
//       <div className={cn('*:not-first:mt-2', className)}>
//         <FormField
//           control={formContext.control}
//           name={fieldName}
//           render={({ field, fieldState }) => (
//             <FormItem>
//               {label && (
//                 <FormLabel
//                   className={cn(
//                     labelClassName,
//                     required && 'after:content-["*"] after:text-destructive',
//                   )}
//                 >
//                   {label}
//                 </FormLabel>
//               )}
//               <FormControl>
//                 {renderPicker((val) => {
//                   field.onChange(val);
//                   onDateChange?.(val);
//                 })}
//               </FormControl>

//               {helperText && !fieldState.error && <FormDescription>{helperText}</FormDescription>}
//               <FormMessage className="text-xs" />
//             </FormItem>
//           )}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className={cn('*:not-first:mt-2', className)}>
//       {label && (
//         <IGRPLabel label={label} className={labelClassName} required={required} id={name} />
//       )}
//       <div className="relative">
//         {renderPicker((val) => {
//           setLocalDate(val);
//           onDateChange?.(val);
//         })}
//       </div>

//       {helperText && (
//         <p
//           id={`${fieldName}-helper`}
//           className="text-muted-foreground mt-2 text-xs"
//           role="region"
//           aria-live="polite"
//         >
//           {helperText}
//         </p>
//       )}
//     </div>
//   );
// }

// export { IGRPDatePickerInputRange, type IGRPDatePickerInputRangeProps };
