import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
export function SaveButton({
  isSaving,
  disabled,
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Save theme",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      variant: "ghost",
      size: "sm",
      className: cn(className),
      disabled: isSaving || disabled,
      ...props,
      children: [isSaving ? /*#__PURE__*/_jsx(Loader2, {
        className: "size-3.5 animate-spin"
      }) : /*#__PURE__*/_jsx(Heart, {
        className: "size-3.5"
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-sm md:block",
        children: "Save"
      })]
    })
  });
}
//# sourceMappingURL=save-button.js.map