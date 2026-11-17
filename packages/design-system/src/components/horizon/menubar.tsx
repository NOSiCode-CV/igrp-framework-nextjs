"use client"

import type * as React from "react"

import { cn } from "cn"
import {
  Menubar as IGRPMenubar,
  MenubarPortal as IGRPMenubarPortal,
  MenubarMenu as IGRPMenubarMenu,
  MenubarTrigger,
  MenubarContent as IGRPMenubarContent,
  MenubarGroup as IGRPMenubarGroup,
  MenubarSeparator as IGRPMenubarSeparator,
  MenubarLabel as IGRPMenubarLabel,
  MenubarItem as IGRPMenubarItem,
  MenubarShortcut as IGRPMenubarShortcut,
  MenubarCheckboxItem as IGRPMenubarCheckboxItem,
  MenubarRadioGroup as IGRPMenubarRadioGroup,
  MenubarRadioItem as IGRPMenubarRadioItem,
  MenubarSub as IGRPMenubarSub,
  MenubarSubTrigger as IGRPMenubarSubTrigger,
  MenubarSubContent as IGRPMenubarSubContent,
} from "../primitives/menubar.js"

/** The upstream trigger hides its outline with no replacement; restore a visible focus ring. */
function IGRPMenubarTrigger({ className, ...props }: React.ComponentProps<typeof MenubarTrigger>) {
  return (
    <MenubarTrigger
      className={cn("focus-visible:ring-[3px] focus-visible:ring-ring/50", className)}
      {...props}
    />
  )
}

export {
  IGRPMenubar,
  IGRPMenubarPortal,
  IGRPMenubarMenu,
  IGRPMenubarTrigger,
  IGRPMenubarContent,
  IGRPMenubarGroup,
  IGRPMenubarSeparator,
  IGRPMenubarLabel,
  IGRPMenubarItem,
  IGRPMenubarShortcut,
  IGRPMenubarCheckboxItem,
  IGRPMenubarRadioGroup,
  IGRPMenubarRadioItem,
  IGRPMenubarSub,
  IGRPMenubarSubTrigger,
  IGRPMenubarSubContent,
}
