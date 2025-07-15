import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
export function ResetButton({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Reset to preset defaults",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      variant: "ghost",
      size: "sm",
      className: cn(className),
      ...props,
      children: [/*#__PURE__*/_jsx(RefreshCw, {
        className: "size-3.5"
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-sm md:block",
        children: "Reset"
      })]
    })
  });
}
//# sourceMappingURL=reset-button.js.map