"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";
import { Copy, CopyCheck } from "lucide-react";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "../primitives/button";
export function CopyButton({
  textToCopy,
  successMessage,
  className,
  ...props
}) {
  const {
    copyToClipboard,
    hasCopied
  } = useCopyToClipboard();
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Copy",
    asChild: true,
    children: /*#__PURE__*/_jsxs(Button, {
      size: "icon",
      variant: "ghost",
      className: cn("size-6 [&>svg]:size-3.5", className),
      onClick: () => copyToClipboard(textToCopy, successMessage),
      ...props,
      children: [hasCopied ? /*#__PURE__*/_jsx(CopyCheck, {}) : /*#__PURE__*/_jsx(Copy, {}), /*#__PURE__*/_jsx("span", {
        className: "sr-only",
        children: "Copy"
      })]
    })
  });
}
//# sourceMappingURL=copy-button.js.map