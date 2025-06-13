'use client';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/primitives/command';

function IGRPCommand({ className, ...props }: React.ComponentProps<typeof Command>) {
  return (
    <Command
      className={className}
      {...props}
    />
  );
}

function IGRPCommandDialog({
  title,
  description,
  children,
  ...props
}: React.ComponentProps<typeof CommandDialog>) {
  return (
    <CommandDialog
      {...props}
      title={title}
      description={description}
    >
      {children}
    </CommandDialog>
  );
}

function IGRPCommandInput({ className, ...props }: React.ComponentProps<typeof CommandInput>) {
  return (
    <CommandInput
      className={className}
      {...props}
    />
  );
}

function IGRPCommandList({ className, ...props }: React.ComponentProps<typeof CommandList>) {
  return (
    <CommandList
      className={className}
      {...props}
    />
  );
}

function IGRPCommandEmpty({ ...props }: React.ComponentProps<typeof CommandEmpty>) {
  return <CommandEmpty {...props} />;
}

function IGRPCommandGroup({ className, ...props }: React.ComponentProps<typeof CommandGroup>) {
  return (
    <CommandGroup
      className={className}
      {...props}
    />
  );
}

function IGRPCommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandSeparator>) {
  return (
    <CommandSeparator
      className={className}
      {...props}
    />
  );
}

function IGRPCommandItem({ className, ...props }: React.ComponentProps<typeof CommandItem>) {
  return (
    <CommandItem
      className={className}
      {...props}
    />
  );
}

function IGRPCommandShortcut({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <CommandShortcut
      className={className}
      {...props}
    />
  );
}

export {
  IGRPCommand,
  IGRPCommandDialog,
  IGRPCommandInput,
  IGRPCommandList,
  IGRPCommandEmpty,
  IGRPCommandGroup,
  IGRPCommandItem,
  IGRPCommandShortcut,
  IGRPCommandSeparator,
};
