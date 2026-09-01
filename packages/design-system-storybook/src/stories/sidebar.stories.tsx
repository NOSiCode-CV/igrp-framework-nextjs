import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  IGRPSidebarProvider,
  IGRPSidebar,
  IGRPSidebarHeader,
  IGRPSidebarContent,
  IGRPSidebarFooter,
  IGRPSidebarGroup,
  IGRPSidebarGroupLabel,
  IGRPSidebarGroupContent,
  IGRPSidebarMenu,
  IGRPSidebarMenuItem,
  IGRPSidebarMenuButton,
  IGRPSidebarMenuBadge,
  IGRPSidebarInset,
  IGRPSidebarTrigger,
  IGRPIcon,
} from '@igrp/igrp-framework-react-design-system';

const meta = {
  title: 'Components/Sidebar',
  component: IGRPSidebar,
} satisfies Meta<typeof IGRPSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** App shell with a collapsible sidebar. Use the trigger in the header to collapse / expand it. */
export const Default: Story = {
  render: () => (
    <IGRPSidebarProvider>
      <IGRPSidebar>
        <IGRPSidebarHeader>
          <div className='flex items-center gap-2 px-2 py-1'>
            <IGRPIcon iconName='LayoutDashboard' className='size-5 text-primary' />
            <span className='font-semibold'>IGRP App</span>
          </div>
        </IGRPSidebarHeader>
        <IGRPSidebarContent>
          <IGRPSidebarGroup>
            <IGRPSidebarGroupLabel>Platform</IGRPSidebarGroupLabel>
            <IGRPSidebarGroupContent>
              <IGRPSidebarMenu>
                <IGRPSidebarMenuItem>
                  <IGRPSidebarMenuButton isActive>
                    <IGRPIcon iconName='Home' />
                    <span>Dashboard</span>
                  </IGRPSidebarMenuButton>
                </IGRPSidebarMenuItem>
                <IGRPSidebarMenuItem>
                  <IGRPSidebarMenuButton>
                    <IGRPIcon iconName='Inbox' />
                    <span>Inbox</span>
                  </IGRPSidebarMenuButton>
                  <IGRPSidebarMenuBadge>12</IGRPSidebarMenuBadge>
                </IGRPSidebarMenuItem>
                <IGRPSidebarMenuItem>
                  <IGRPSidebarMenuButton>
                    <IGRPIcon iconName='Calendar' />
                    <span>Calendar</span>
                  </IGRPSidebarMenuButton>
                </IGRPSidebarMenuItem>
              </IGRPSidebarMenu>
            </IGRPSidebarGroupContent>
          </IGRPSidebarGroup>
          <IGRPSidebarGroup>
            <IGRPSidebarGroupLabel>Settings</IGRPSidebarGroupLabel>
            <IGRPSidebarGroupContent>
              <IGRPSidebarMenu>
                <IGRPSidebarMenuItem>
                  <IGRPSidebarMenuButton>
                    <IGRPIcon iconName='Settings' />
                    <span>General</span>
                  </IGRPSidebarMenuButton>
                </IGRPSidebarMenuItem>
                <IGRPSidebarMenuItem>
                  <IGRPSidebarMenuButton>
                    <IGRPIcon iconName='Users' />
                    <span>Team</span>
                  </IGRPSidebarMenuButton>
                </IGRPSidebarMenuItem>
              </IGRPSidebarMenu>
            </IGRPSidebarGroupContent>
          </IGRPSidebarGroup>
        </IGRPSidebarContent>
        <IGRPSidebarFooter>
          <div className='px-2 py-1 text-xs text-muted-foreground'>v0.1.0-beta</div>
        </IGRPSidebarFooter>
      </IGRPSidebar>
      <IGRPSidebarInset>
        <header className='flex h-14 items-center gap-2 border-b px-4'>
          <IGRPSidebarTrigger />
          <span className='font-medium'>Dashboard</span>
        </header>
        <main className='p-6'>
          <p className='text-sm text-muted-foreground'>
            Main content area. The sidebar collapses with the trigger on the left.
          </p>
        </main>
      </IGRPSidebarInset>
    </IGRPSidebarProvider>
  ),
};
