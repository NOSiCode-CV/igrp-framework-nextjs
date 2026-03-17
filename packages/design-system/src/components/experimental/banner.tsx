// import { cn } from '../../lib/utils';
// import { Button } from '../primitives/button';

// // TODO: create this component
// // see: https://coss.com/origin/banner

// export function IGRPBanner() {
//   return (
//     // To make the notification fixed, add classes like `fixed bottom-4 inset-x-4` to the container element.
//     <div className={cn('z-50 rounded-md border bg-background px-4 py-3 shadow-lg')}>
//       <div className={cn('flex flex-col justify-between gap-3 md:flex-row md:items-center')}>
//         <p className={cn('text-sm')}>
//           We use cookies to improve your experience, analyze site usage, and show personalized
//           content.
//         </p>
//         <div className={cn('flex gap-2 max-md:flex-wrap')}>
//           <Button size="sm">Accept</Button>
//           <Button variant="outline" size="sm">
//             Decline
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { ArrowRightIcon, Eclipse } from 'lucide-react';

// interface IGRPBanner2Props {
//   /** URL for the "Learn more" link. Omit to render as non-interactive text. */
//   learnMoreHref?: string;
// }

// export function IGRPBanner2({ learnMoreHref }: IGRPBanner2Props = {}) {
//   const linkContent = (
//     <>
//       Learn more
//       <ArrowRightIcon
//         className={cn(
//           'ms-1 -mt-0.5 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5',
//         )}
//         size={16}
//         aria-hidden="true"
//       />
//     </>
//   );

//   return (
//     <div className={cn('dark bg-muted px-4 py-3 text-foreground')}>
//       <div className={cn('flex flex-col justify-between gap-2 md:flex-row')}>
//         <div className={cn('flex grow gap-3')}>
//           <Eclipse className={cn('mt-0.5 shrink-0 opacity-60')} size={16} aria-hidden="true" />
//           <div
//             className={cn('flex grow flex-col justify-between gap-2 md:flex-row md:items-center')}
//           >
//             <p className={cn('text-sm')}>
//               We just added something awesome to make your experience even better.
//             </p>
//             {learnMoreHref ? (
//               <a href={learnMoreHref} className={cn('group text-sm font-medium whitespace-nowrap')}>
//                 {linkContent}
//               </a>
//             ) : (
//               <span className={cn('group text-sm font-medium whitespace-nowrap')}>{linkContent}</span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
