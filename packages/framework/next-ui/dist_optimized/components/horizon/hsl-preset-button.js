"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Button } from "../primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/tooltip";
export const HslPresetButton = ({
  label,
  hueShift,
  saturationScale,
  lightnessScale,
  baseBg,
  basePrimary,
  baseSecondary = "#888888",
  onClick,
  selected,
  adjustColorByHsl
}) => {
  const previewBg = adjustColorByHsl(baseBg, hueShift, saturationScale, lightnessScale);
  const previewPrimary = adjustColorByHsl(basePrimary, hueShift, saturationScale, lightnessScale);
  const previewSecondary = adjustColorByHsl(baseSecondary, hueShift, saturationScale, lightnessScale);
  return /*#__PURE__*/_jsx(TooltipProvider, {
    children: /*#__PURE__*/_jsxs(Tooltip, {
      children: [/*#__PURE__*/_jsx(TooltipTrigger, {
        asChild: true,
        children: /*#__PURE__*/_jsxs(Button, {
          type: "button",
          onClick: onClick,
          size: "sm",
          variant: "outline",
          className: cn("relative h-8 w-full overflow-hidden rounded-md p-0 shadow-sm transition-all duration-200", "hover:scale-105 hover:shadow-md", selected ? "ring-primary ring-1 ring-offset-1" : "border-border border"),
          style: {
            background: previewBg
          },
          children: [/*#__PURE__*/_jsx("div", {
            className: "absolute inset-0 flex items-center justify-center",
            children: /*#__PURE__*/_jsxs("div", {
              className: "flex h-full w-full",
              children: [/*#__PURE__*/_jsx("div", {
                className: "h-full w-1/2 rounded-l-md",
                style: {
                  background: previewPrimary
                }
              }), /*#__PURE__*/_jsx("div", {
                className: "h-full w-1/2 rounded-r-md",
                style: {
                  background: previewSecondary
                }
              })]
            })
          }), selected && /*#__PURE__*/_jsx("div", {
            className: "bg-primary absolute right-0.5 bottom-0.5 h-2 w-2 rounded-full"
          })]
        })
      }), /*#__PURE__*/_jsx(TooltipContent, {
        side: "bottom",
        className: "text-xs font-medium",
        children: label
      })]
    })
  });
};
//# sourceMappingURL=hsl-preset-button.js.map