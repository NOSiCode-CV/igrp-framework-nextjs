'use client';

import Link from 'next/link';
import { Bell, ChevronsUpDown, LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../primitives/sidebar';
import { IGRPUserAvatar } from './user-avatar';
import { getInitials } from '../../lib/getInitials';
import type { User } from '../../../types/globals';

interface NavUserProps {
  user?: User;
}

// TODO: see when user is null or undefiened

export function IGRPNavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className='group data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer group-data-[collapsible=icon]:pl-0! py-2!'
              tooltip={user.username}
              size='lg'
            >
              <IGRPUserAvatar
                image={user.image}
                alt={user.username}
                fallbackContent={user && getInitials(user.username)}
                fallbackClass='text-xs'
                className='shadow-md'
              />
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{user.username || 'N/A'}</span>
                <span className='truncate text-xs'>{user.email}</span>
              </div>
              <ChevronsUpDown
                className='ml-auto size-3.5'
                strokeWidth={2}
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='min-w-56 rounded-lg'
            side={isMobile ? 'bottom' : 'right'}
            align='end'
            sideOffset={4}
          >
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col space-y-1'>
                <p className='text-sm font-medium leading-none'>{user.fullname}</p>
                <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className='cursor-pointer hover:bg-primary! hover:text-primary-foreground!'
            >
              <Link href='/users/profile'>
                <UserIcon
                  className='mr-1 size-3.5 hover:text-primary-foreground!'
                  strokeWidth={2}
                />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className='cursor-pointer hover:bg-primary! hover:text-primary-foreground!'
            >
              <Link href='/users/notifications'>
                <Bell
                  className='mr-1 size-3.5 hover:text-primary-foreground!'
                  strokeWidth={2}
                />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              asChild
              className='cursor-pointer hover:bg-primary! hover:text-primary-foreground!'
            >
              <Link href='/logout'>
                <LogOut
                  className='mr-1 size-3.5 hover:text-primary-foreground!'
                  strokeWidth={2}
                />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
