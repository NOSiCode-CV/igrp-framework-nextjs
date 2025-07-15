"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../primitives/tooltip";
export function TooltipWrapper({
  label,
  command,
  className,
  children,
  ...props
}) {
  return /*#__PURE__*/_jsxs(Tooltip, {
    children: [/*#__PURE__*/_jsx(TooltipTrigger, {
      className: cn(className),
      ...props,
      children: children
    }), /*#__PURE__*/_jsx(TooltipContent, {
      children: /*#__PURE__*/_jsxs("span", {
        className: "flex items-center gap-[1ch]",
        children: [label, command && /*#__PURE__*/_jsx("kbd", {
          className: "bg-muted text-muted-foreground flex items-center gap-[0.5ch] rounded px-1.5 py-0.5 font-mono text-xs [&>svg]:size-3",
          children: command
        })]
      })
    })]
  }, label);
}
//# sourceMappingURL=tooltip-wrapper.js.map