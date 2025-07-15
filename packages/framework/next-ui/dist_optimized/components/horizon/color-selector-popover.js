"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import TailwindCSS from "../icons/tailwind-css";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { ScrollArea } from "../primitives/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../primitives/tabs";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "../../store/preferences-store";
import { TAILWIND_PALETTE } from "../../utils/registry/tailwind-colors";
import { Check, LayoutGrid, List } from "lucide-react";
import { useCallback } from "react";
import { Separator } from "../primitives/separator";
export function ColorSelectorPopover({
  currentColor,
  onChange
}) {
  const handleColorSelect = useCallback(color => {
    onChange(color);
  }, [onChange]);
  const {
    setColorSelectorTab,
    colorSelectorTab
  } = usePreferencesStore();
  const handleTabChange = useCallback(value => {
    setColorSelectorTab(value);
  }, [setColorSelectorTab]);
  const isColorSelected = useCallback(color => {
    return currentColor === color;
  }, [currentColor]);
  return /*#__PURE__*/_jsxs(Popover, {
    children: [/*#__PURE__*/_jsx(PopoverTrigger, {
      asChild: true,
      children: /*#__PURE__*/_jsx(TooltipWrapper, {
        asChild: true,
        label: "Tailwind Colors",
        children: /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "sm",
          className: "group bg-input/25 size-8 rounded border shadow-none",
          children: /*#__PURE__*/_jsx(TailwindCSS, {
            className: "text-foreground group-hover:text-accent-foreground size-4 transition-colors"
          })
        })
      })
    }), /*#__PURE__*/_jsx(PopoverContent, {
      className: "size-auto gap-0 overflow-hidden p-0",
      align: "end",
      children: /*#__PURE__*/_jsxs(Tabs, {
        defaultValue: colorSelectorTab,
        onValueChange: handleTabChange,
        children: [/*#__PURE__*/_jsxs("div", {
          className: "flex items-center justify-between gap-4",
          children: [/*#__PURE__*/_jsxs("div", {
            className: "ml-2 flex items-center gap-1.5",
            children: [/*#__PURE__*/_jsx(TailwindCSS, {
              className: "size-4"
            }), /*#__PURE__*/_jsx("span", {
              className: "text-muted-foreground text-sm tabular-nums",
              children: "Tailwind v4"
            })]
          }), /*#__PURE__*/_jsxs(TabsList, {
            className: "bg-transparent",
            children: [/*#__PURE__*/_jsx(TabsTrigger, {
              value: "list",
              className: "data-[state=active]:bg-input/25 size-8 p-0 data-[state=active]:shadow-none",
              children: /*#__PURE__*/_jsx(List, {
                className: "size-4"
              })
            }), /*#__PURE__*/_jsx(TabsTrigger, {
              value: "palette",
              className: "data-[state=active]:bg-input/25 size-8 p-0 data-[state=active]:shadow-none",
              children: /*#__PURE__*/_jsx(LayoutGrid, {
                className: "size-4"
              })
            })]
          })]
        }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsx(TabsContent, {
          value: "list",
          className: "my-0 min-w-[300px]",
          children: /*#__PURE__*/_jsxs(Command, {
            className: "flex h-84 flex-col",
            children: [/*#__PURE__*/_jsx(CommandInput, {
              className: "h-10",
              placeholder: "Search Tailwind colors..."
            }), /*#__PURE__*/_jsxs(ScrollArea, {
              className: "flex-1 overflow-hidden",
              children: [/*#__PURE__*/_jsx(CommandEmpty, {
                className: "text-muted-foreground p-4 text-center",
                children: "No Tailwind color found."
              }), Object.entries(TAILWIND_PALETTE).map(([key, colors]) => {
                const colorName = key.charAt(0).toUpperCase() + key.slice(1);
                return /*#__PURE__*/_jsx(CommandGroup, {
                  heading: colorName,
                  children: Object.entries(colors).map(([shade, color]) => {
                    const isSelected = isColorSelected(color);
                    return /*#__PURE__*/_jsxs(CommandItem, {
                      onSelect: () => handleColorSelect(color),
                      className: "flex items-center gap-2",
                      children: [/*#__PURE__*/_jsx(ColorSwatch, {
                        color: color,
                        name: `${key}-${shade}`,
                        isSelected: isSelected,
                        size: "md"
                      }), /*#__PURE__*/_jsx("span", {
                        children: `${key}-${shade}`
                      }), isSelected && /*#__PURE__*/_jsx(Check, {
                        className: "ml-auto size-4 opacity-70"
                      })]
                    }, color);
                  })
                }, key);
              })]
            })]
          })
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "palette",
          className: "my-0 w-full",
          children: /*#__PURE__*/_jsx(ScrollArea, {
            className: "h-84 w-full",
            children: /*#__PURE__*/_jsx("div", {
              className: "flex flex-col gap-0.5 p-1",
              children: Object.entries(TAILWIND_PALETTE).map(([key, colors]) => {
                return /*#__PURE__*/_jsx("div", {
                  className: "flex gap-0.5",
                  children: Object.entries(colors).map(([shade, color]) => {
                    return /*#__PURE__*/_jsx(ColorSwatch, {
                      name: `${key}-${shade}`,
                      color: color,
                      isSelected: isColorSelected(color),
                      onClick: () => handleColorSelect(color),
                      className: "rounded-none",
                      size: "md"
                    }, `${key}-${shade}`);
                  })
                }, key);
              })
            })
          })
        })]
      })
    })]
  });
}
function ColorSwatch({
  color,
  name,
  className,
  isSelected,
  size = "sm",
  ...props
}) {
  const sizeClasses = {
    sm: "size-5",
    md: "size-6",
    lg: "size-8"
  };
  return /*#__PURE__*/_jsx("button", {
    "aria-label": `Select color ${name}`,
    title: name,
    className: cn("group relative cursor-pointer rounded-md border bg-(--color) transition-all hover:z-10 hover:scale-110 hover:shadow-lg", sizeClasses[size], isSelected && "ring-2 ring-(--color)", className),
    style: {
      "--color": color
    },
    ...props,
    children: /*#__PURE__*/_jsx("div", {
      className: "group-hover:ring-foreground/50 absolute inset-0 rounded-[inherit] ring-2 ring-transparent transition-all duration-200"
    })
  });
}
//# sourceMappingURL=color-selector-popover.js.map