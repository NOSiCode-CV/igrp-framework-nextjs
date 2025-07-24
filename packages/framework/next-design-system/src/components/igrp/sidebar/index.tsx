import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar as useIGRPSidebar,
} from '@/components/horizon/sidebar';

function IGRPSidebarProvider({ ...props }: React.ComponentProps<typeof SidebarProvider>) {
  return <SidebarProvider {...props} />;
}

function IGRPSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return <Sidebar {...props} />;
}

function IGRPSidebarTrigger({ ...props }: React.ComponentProps<typeof SidebarTrigger>) {
  return <SidebarTrigger {...props} />;
}

function IGRPSidebarRail({ ...props }: React.ComponentProps<typeof SidebarRail>) {
  return <SidebarRail {...props} />;
}

function IGRPSidebarInset({ ...props }: React.ComponentProps<typeof SidebarInset>) {
  return <SidebarInset {...props} />;
}

function IGRPSidebarInput({ ...props }: React.ComponentProps<typeof SidebarInput>) {
  return <SidebarInput {...props} />;
}

function IGRPSidebarHeader({ ...props }: React.ComponentProps<typeof SidebarHeader>) {
  return <SidebarHeader {...props} />;
}

function IGRPSidebarFooter({ ...props }: React.ComponentProps<typeof SidebarFooter>) {
  return <SidebarFooter {...props} />;
}

function IGRPSidebarSeparator({ ...props }: React.ComponentProps<typeof SidebarSeparator>) {
  return <SidebarSeparator {...props} />;
}

function IGRPSidebarContent({ ...props }: React.ComponentProps<typeof SidebarContent>) {
  return <SidebarContent {...props} />;
}

function IGRPSidebarGroup({ ...props }: React.ComponentProps<typeof SidebarGroup>) {
  return <SidebarGroup {...props} />;
}

function IGRPSidebarGroupLabel({ ...props }: React.ComponentProps<typeof SidebarGroupLabel>) {
  return <SidebarGroupLabel {...props} />;
}

function IGRPSidebarGroupAction({ ...props }: React.ComponentProps<typeof SidebarGroupAction>) {
  return <SidebarGroupAction {...props} />;
}

function IGRPSidebarGroupContent({ ...props }: React.ComponentProps<typeof SidebarGroupContent>) {
  return <SidebarGroupContent {...props} />;
}

function IGRPSidebarMenu({ ...props }: React.ComponentProps<typeof SidebarMenu>) {
  return <SidebarMenu {...props} />;
}

function IGRPSidebarMenuItem({ ...props }: React.ComponentProps<typeof SidebarMenuItem>) {
  return <SidebarMenuItem {...props} />;
}

function IGRPSidebarMenuButton({ ...props }: React.ComponentProps<typeof SidebarMenuButton>) {
  return <SidebarMenuButton {...props} />;
}

function IGRPSidebarMenuAction({ ...props }: React.ComponentProps<typeof SidebarMenuAction>) {
  return <SidebarMenuAction {...props} />;
}

function IGRPSidebarMenuBadge({ ...props }: React.ComponentProps<typeof SidebarMenuBadge>) {
  return <SidebarMenuBadge {...props} />;
}

function IGRPSidebarMenuSkeleton({ ...props }: React.ComponentProps<typeof SidebarMenuSkeleton>) {
  return <SidebarMenuSkeleton {...props} />;
}

function IGRPSidebarMenuSub({ ...props }: React.ComponentProps<typeof SidebarMenuSub>) {
  return <SidebarMenuSub {...props} />;
}

function IGRPSidebarMenuSubItem({ ...props }: React.ComponentProps<typeof SidebarMenuSubItem>) {
  return <SidebarMenuSubItem {...props} />;
}

function IGRPSidebarMenuSubButton({ ...props }: React.ComponentProps<typeof SidebarMenuSubButton>) {
  return <SidebarMenuSubButton {...props} />;
}
export {
  IGRPSidebarProvider,
  IGRPSidebar,
  IGRPSidebarTrigger,
  IGRPSidebarRail,
  IGRPSidebarInset,
  IGRPSidebarInput,
  IGRPSidebarHeader,
  IGRPSidebarFooter,
  IGRPSidebarSeparator,
  IGRPSidebarContent,
  IGRPSidebarGroup,
  IGRPSidebarGroupLabel,
  IGRPSidebarGroupAction,
  IGRPSidebarGroupContent,
  IGRPSidebarMenu,
  IGRPSidebarMenuItem,
  IGRPSidebarMenuButton,
  IGRPSidebarMenuAction,
  IGRPSidebarMenuBadge,
  IGRPSidebarMenuSkeleton,
  IGRPSidebarMenuSub,
  IGRPSidebarMenuSubItem,
  IGRPSidebarMenuSubButton,
  // eslint-disable-next-line react-refresh/only-export-components
  useIGRPSidebar,
};
