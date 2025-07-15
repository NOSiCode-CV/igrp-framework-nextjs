import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionContext } from "./section-context";
const ControlSection = ({
  title,
  children,
  expanded = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  return /*#__PURE__*/_jsx(SectionContext.Provider, {
    value: {
      isExpanded,
      setIsExpanded,
      toggleExpanded: () => setIsExpanded(prev => !prev)
    },
    children: /*#__PURE__*/_jsxs("div", {
      className: cn("mb-4 overflow-hidden rounded-lg border", className),
      children: [/*#__PURE__*/_jsxs("div", {
        className: "bg-background hover:bg-muted flex cursor-pointer items-center justify-between p-3",
        onClick: () => setIsExpanded(!isExpanded),
        children: [/*#__PURE__*/_jsx("h3", {
          className: "text-sm font-medium",
          children: title
        }), /*#__PURE__*/_jsx("button", {
          type: "button",
          className: "text-muted-foreground hover:text-foreground transition-colors",
          "aria-label": isExpanded ? "Collapse section" : "Expand section",
          children: isExpanded ? /*#__PURE__*/_jsx(ChevronUp, {
            className: "h-4 w-4"
          }) : /*#__PURE__*/_jsx(ChevronDown, {
            className: "h-4 w-4"
          })
        })]
      }), /*#__PURE__*/_jsx("div", {
        className: cn("overflow-hidden transition-all duration-200", isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"),
        children: /*#__PURE__*/_jsx("div", {
          className: "bg-background border-t p-3",
          children: children
        })
      })]
    })
  });
};
export default ControlSection;
//# sourceMappingURL=control-section.js.map