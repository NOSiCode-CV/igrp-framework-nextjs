// 'use client';

// import { useEffect, useState } from 'react';
// import Image from 'next/image';
// import { useTheme } from 'next-themes';
// import { GalleryVerticalEnd } from 'lucide-react';
// //import { type MenuConfig } from '@/config/menu';
// import { DropdownMenu, DropdownMenuTrigger } from '@/components/primitives/dropdown-menu';
// import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/primitives/sidebar';

// type MenuTeam = MenuConfig['teams'];

// export function IGRPAppSwitcher({ app }: { app: MenuTeam }) {
//   const [mounted, setMounted] = useState(false);
//   const { theme, resolvedTheme } = useTheme();

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   const activeTeam = app;

//   if (!activeTeam) {
//     return null;
//   }

//   const imgSrc = mounted
//     ? theme === 'dark' || resolvedTheme === 'dark'
//       ? activeTeam.logo.srcDark
//       : activeTeam.logo.src
//     : activeTeam.logo.src;

//   return (
//     <SidebarMenu>
//       <SidebarMenuItem>
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <SidebarMenuButton
//               size='lg'
//               className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
//             >
//               <div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
//                 {imgSrc ? (
//                   <Image
//                     src={imgSrc}
//                     alt={activeTeam.name}
//                     width={20}
//                     height={20}
//                     className='h-auto w-auto'
//                     style={{ height: 'auto', width: 'auto' }}
//                     priority
//                   />
//                 ) : (
//                   <GalleryVerticalEnd className='size-5' />
//                 )}
//               </div>
//               <div className='grid flex-1 text-left text-sm leading-tight'>
//                 <span className='truncate font-medium'>{activeTeam.name}</span>
//                 <span className='truncate text-xs'>{activeTeam.description}</span>
//               </div>
//             </SidebarMenuButton>
//           </DropdownMenuTrigger>
//         </DropdownMenu>
//       </SidebarMenuItem>
//     </SidebarMenu>
//   );
// }
