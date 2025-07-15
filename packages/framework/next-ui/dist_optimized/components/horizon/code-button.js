import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { Braces } from "lucide-react";
export function CodeButton({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "View theme code",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      variant: "ghost",
      size: "sm",
      className: cn(className),
      ...props,
      children: [/*#__PURE__*/_jsx(Braces, {
        className: "size-3.5"
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-sm md:block",
        children: "Code"
      })]
    })
  });
}
//# sourceMappingURL=code-button.js.map