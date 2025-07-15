import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { FileCode } from "lucide-react";
export function ImportButton({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Import CSS variables",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      variant: "ghost",
      size: "sm",
      className: cn(className),
      ...props,
      children: [/*#__PURE__*/_jsx(FileCode, {
        className: "size-3.5"
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-sm md:block",
        children: "Import"
      })]
    })
  });
}
//# sourceMappingURL=import-button.js.map