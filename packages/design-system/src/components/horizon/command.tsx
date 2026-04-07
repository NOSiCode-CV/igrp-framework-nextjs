'use client';

/**
 * Re-exports of command primitives for command palette, search, and keyboard navigation.
 * @module
 */
import {
  Command as IGRPCommand,
  CommandDialog as IGRPCommandDialog,
  CommandEmpty as IGRPCommandEmpty,
  CommandGroup as IGRPCommandGroup,
  CommandInput as IGRPCommandInput,
  CommandItem as IGRPCommandItem,
  CommandList as IGRPCommandList,
  CommandSeparator as IGRPCommandSeparator,
  CommandShortcut as IGRPCommandShortcut,
} from '../primitives/command';

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
