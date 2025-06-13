import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/primitives/dropdown-menu';

function IGRPDropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu {...props} />;
}

function IGRPDropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPortal>) {
  return <DropdownMenuPortal {...props} />;
}

function IGRPDropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return <DropdownMenuTrigger {...props} />;
}

function IGRPDropdownMenuContent({ ...props }: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuPortal>
      <DropdownMenuContent {...props} />
    </DropdownMenuPortal>
  );
}

function IGRPDropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup {...props} />;
}

function IGRPDropdownMenuItem({ ...props }: React.ComponentProps<typeof DropdownMenuItem>) {
  return <DropdownMenuItem {...props} />;
}

function IGRPDropdownMenuCheckboxItem({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItem>) {
  return <DropdownMenuCheckboxItem {...props}>{children}</DropdownMenuCheckboxItem>;
}

function IGRPDropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup {...props} />;
}

function IGRPDropdownMenuRadioItem({
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioItem>) {
  return <DropdownMenuRadioItem {...props}>{children}</DropdownMenuRadioItem>;
}

function IGRPDropdownMenuLabel({
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel>) {
  return (
    <DropdownMenuLabel
      inset={inset}
      {...props}
    />
  );
}

function IGRPDropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      className={className}
      {...props}
    />
  );
}

function IGRPDropdownMenuShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <DropdownMenuShortcut
      className={className}
      {...props}
    />
  );
}

function IGRPDropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub {...props} />;
}

function IGRPDropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger>) {
  return (
    <DropdownMenuSubTrigger
      inset={inset}
      className={className}
      {...props}
    >
      {children}
    </DropdownMenuSubTrigger>
  );
}

function IGRPDropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return (
    <DropdownMenuSubContent
      className={className}
      {...props}
    />
  );
}

export {
  IGRPDropdownMenu,
  IGRPDropdownMenuPortal,
  IGRPDropdownMenuTrigger,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuGroup,
  IGRPDropdownMenuLabel,
  IGRPDropdownMenuItem,
  IGRPDropdownMenuCheckboxItem,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuSeparator,
  IGRPDropdownMenuShortcut,
  IGRPDropdownMenuSub,
  IGRPDropdownMenuSubTrigger,
  IGRPDropdownMenuSubContent,
};
