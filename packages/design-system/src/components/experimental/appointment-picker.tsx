// 'use client';

// import { useState } from 'react';
// import { format } from 'date-fns';

// import { Button } from '../primitives/button';
// import { Calendar } from '../primitives/calendar';
// import { ScrollArea } from '../primitives/scroll-area';
// import { cn } from '../../lib/utils';

// // TODO: create this compnent
// // see: https://v0.app/chat/open-in-v0-UHnalf55ucu
// // see: https://ui.shadcn.com/blocks/calendar

// export function Component() {
//   const today = new Date();
//   const [date, setDate] = useState<Date>(today);
//   const [time, setTime] = useState<string | null>(null);

//   // Mock time slots data
//   const timeSlots = [
//     { time: '09:00', available: false },
//     { time: '09:30', available: false },
//     { time: '10:00', available: true },
//     { time: '10:30', available: true },
//     { time: '11:00', available: true },
//     { time: '11:30', available: true },
//     { time: '12:00', available: false },
//     { time: '12:30', available: true },
//     { time: '13:00', available: true },
//     { time: '13:30', available: true },
//     { time: '14:00', available: true },
//     { time: '14:30', available: false },
//     { time: '15:00', available: false },
//     { time: '15:30', available: true },
//     { time: '16:00', available: true },
//     { time: '16:30', available: true },
//     { time: '17:00', available: true },
//     { time: '17:30', available: true },
//   ];

//   return (
//     <div>
//       <div className={cn('rounded-md border')}>
//         <div className={cn('flex max-sm:flex-col')}>
//           <Calendar
//             mode="single"
//             selected={date}
//             onSelect={(newDate) => {
//               if (newDate) {
//                 setDate(newDate);
//                 setTime(null);
//               }
//             }}
//             className={cn('p-2 sm:pe-5')}
//             disabled={[
//               { before: today }, // Dates before today
//             ]}
//           />
//           <div className={cn('relative w-full max-sm:h-48 sm:w-40')}>
//             <div className={cn('absolute inset-0 py-4 max-sm:border-t')}>
//               <ScrollArea className={cn('h-full sm:border-s')}>
//                 <div className={cn('space-y-3')}>
//                   <div className={cn('flex h-5 shrink-0 items-center px-5')}>
//                     <p className={cn('text-sm font-medium')}>{format(date, 'EEEE, d')}</p>
//                   </div>
//                   <div className={cn('grid gap-1.5 px-5 max-sm:grid-cols-2')}>
//                     {timeSlots.map(({ time: timeSlot, available }) => (
//                       <Button
//                         key={timeSlot}
//                         variant={time === timeSlot ? 'default' : 'outline'}
//                         size="sm"
//                         className={cn('w-full')}
//                         onClick={() => setTime(timeSlot)}
//                         disabled={!available}
//                       >
//                         {timeSlot}
//                       </Button>
//                     ))}
//                   </div>
//                 </div>
//               </ScrollArea>
//             </div>
//           </div>
//         </div>
//       </div>
//       <p
//         className={cn('mt-4 text-center text-xs text-muted-foreground')}
//         role="region"
//         aria-live="polite"
//       >
//         Appointment picker -{' '}
//         <a
//           className={cn('underline hover:text-foreground')}
//           href="https://daypicker.dev/"
//           target="_blank"
//           rel="noopener nofollow"
//         >
//           React DayPicker
//         </a>
//       </p>
//     </div>
//   );
// }
