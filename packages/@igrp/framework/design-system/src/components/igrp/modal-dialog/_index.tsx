// 'use client'

// import { type ReactNode } from 'react'
// import type { VariantProps } from 'class-variance-authority'
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/horizon/dialog'
// import { ScrollArea } from '@/components/primitives/scroll-area'
// import type { buttonVariants } from '@/components/horizon/button'
// import { IGRPButton } from '@/components/igrp/button'
// import { cn } from '@/lib/utils'

// type IGRPModalDialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

// interface IGRPModalDialogProps extends React.ComponentProps<typeof Dialog> {
//   title?: string,
//   description?: string,
//   children?: ReactNode,
//   size?: IGRPModalDialogSize,
//   className?: string,
//   headerClassName?: string,
//   showTrigger?: boolean,
//   triggerText?: string,
//   triggerVariant?: VariantProps<typeof buttonVariants>['variant'],
//   triggerButton?: ReactNode,
//   stickyHeader?: boolean,
//   showFooter?: boolean,
//   stickyFooter?: boolean,
//   renderFooter?: ReactNode,
//   footerClassName?: string,
// }

// function IGRPModalDialog({
//   title,
//   description,
//   children,
//   size = 'md',
//   className,
//   headerClassName,
//   showTrigger = true,
//   triggerText = 'Open Dialog',
//   triggerVariant = 'outline',
//   triggerButton,
//   open,
//   onOpenChange,
//   modal,
//   stickyHeader = true,
//   stickyFooter = false,
//   showFooter = true,
//   renderFooter,
//   footerClassName
// }: IGRPModalDialogProps) {
//   return (
//     <Dialog
//       open={open}
//       onOpenChange={onOpenChange}
//       modal={modal}
//     >
//       {showTrigger && (
//         <DialogTrigger asChild>
//           {triggerButton || <IGRPButton variant={triggerVariant}>{triggerText}</IGRPButton>}
//         </DialogTrigger>
//       )}
//       <DialogContent
//         className={cn(
//           'w-full flex flex-col gap-0 p-4 pr-0 sm:max-w-lg max-h-[80vh]',
//           {
//             '!max-w-md': size === 'sm',
//             '!max-w-lg': size === 'md',
//             '!max-w-2xl': size === 'lg',
//             '!max-w-4xl': size === 'xl',
//             '!max-w-[95vw] !h-[95vh] overflow-auto': size === 'full',
//           },
//           showFooter && 'pb-0',
//         )}
//       >
//         <ScrollArea className='flex max-h-full flex-col gap-4 overflow-hidden'>
//           <DialogHeader
//             className={cn(
//               'pl-4',
//               stickyHeader && (title || description) && 'sticky top-0 z-5 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border-b pb-2',
//               headerClassName
//             )}
//           >
//             <DialogTitle className='text-xl'>
//               {title}
//             </DialogTitle>

//             <DialogDescription>
//               {description}
//             </DialogDescription>

//           </DialogHeader>

//           <div className={cn('my-2 flex-1 overflow-y-auto', className )}>
//             {children}
//           </div>

//           {showFooter && renderFooter && (
//             <DialogFooter
//               className={cn(
//                 'pl-4 py-3 flex-col sm:justify-start',
//                 stickyFooter && 'sticky bottom-0 z-10 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border-t',
//                 footerClassName
//               )}
//             >
//               {renderFooter}
//             </DialogFooter>
//           )}
//         </ScrollArea>
//       </DialogContent>

//     </Dialog>
//   )
// }

// export {
//   IGRPModalDialog,
//   type IGRPModalDialogProps,
//   type IGRPModalDialogSize
// }
