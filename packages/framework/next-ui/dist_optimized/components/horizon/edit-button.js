import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "../horizon/tooltip-wrapper";
import { Button } from "../primitives/button";
import { cn } from "@/lib/utils";
import { PenLine } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
export function EditButton({
  themeId,
  disabled,
  className,
  ...props
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEditing = pathname.includes(themeId);
  // Keep the current search params for tab persistence
  const href = `/editor/theme/${themeId}?${searchParams}`;
  return /*#__PURE__*/_jsx(TooltipWrapper, {
    label: "Edit theme",
    asChild: true,
    children: /*#__PURE__*/_jsx(Link, {
      href: href,
      children: /*#__PURE__*/_jsxs(Button, {
        variant: "ghost",
        size: "sm",
        className: cn(className),
        disabled: disabled || isEditing,
        ...props,
        children: [/*#__PURE__*/_jsx(PenLine, {
          className: "size-3.5"
        }), /*#__PURE__*/_jsx("span", {
          className: "hidden text-sm md:block",
          children: "Edit"
        })]
      })
    })
  });
}
//# sourceMappingURL=edit-button.js.map