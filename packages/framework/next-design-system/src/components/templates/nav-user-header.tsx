'use client';

import Link from 'next/link';
import { Bell, LogOut, User as UserIcon } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../horizon/sidebar';
import { IGRPUserAvatar } from '../custom/user-avatar';
import { igrpGetnitials } from '../../lib/initials';
import { IGRPTemplateNavUserProps } from './nav-user';

function IGRPTemplateNavUserHeader({ user }: IGRPTemplateNavUserProps) {
  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="p-0 hover:p-0 hover:bg-transparent h-auto"
              tooltip={user.username}
              size="lg"
            >
              <IGRPUserAvatar
                image={user.image}
                alt={user.username}
                fallbackContent={user && igrpGetnitials(user.username)}
                fallbackClass="text-xs"
                className="shadow-md"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.fullname}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="hover:bg-primary! hover:text-primary-foreground!">
              <Link href="/users/profile">
                <UserIcon
                  className="mr-1 size-3.5 hover:text-primary-foreground!"
                  strokeWidth={2}
                />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="hover:bg-primary! hover:text-primary-foreground!">
              <Link href="/users/notifications">
                <Bell className="mr-1 size-3.5 hover:text-primary-foreground!" strokeWidth={2} />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild className="hover:bg-primary! hover:text-primary-foreground!">
              <Link href="/logout">
                <LogOut className="mr-1 size-3.5 hover:text-primary-foreground!" strokeWidth={2} />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export { IGRPTemplateNavUserHeader };
