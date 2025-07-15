import { jsx as _jsx } from "react/jsx-runtime";
import { TabsTrigger } from "../primitives/tabs";
import { cn } from "@/lib/utils";
const TabsTriggerPill = ({
  children,
  className,
  ...props
}) => {
  return /*#__PURE__*/_jsx(TabsTrigger, {
    className: cn("ring-offset-background focus-visible:ring-ring data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground hover:text-muted-foreground/70 inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50", className),
    ...props,
    children: children
  });
};
export default TabsTriggerPill;
//# sourceMappingURL=tabs-trigger-pill.js.map