import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { Loader2, Share2 } from "lucide-react";
export function ShareButton({
  onClick,
  isSharing,
  disabled,
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Share theme",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      variant: "ghost",
      size: "sm",
      className: cn(className),
      onClick: onClick,
      disabled: isSharing || disabled,
      ...props,
      children: [isSharing ? /*#__PURE__*/_jsx(Loader2, {
        className: "size-3.5 animate-spin"
      }) : /*#__PURE__*/_jsx(Share2, {
        className: "size-3.5"
      }), /*#__PURE__*/_jsx("span", {
        className: "hidden text-sm md:block",
        children: "Share"
      })]
    })
  });
}
//# sourceMappingURL=share-button.js.map