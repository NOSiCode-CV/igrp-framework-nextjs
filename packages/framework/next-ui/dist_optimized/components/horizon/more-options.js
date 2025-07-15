import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import ContrastChecker from "../horizon/contrast-checker";
import { Button } from "../primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../primitives/dropdown-menu";
import { useEditorStore } from "@/store/editor-store";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { MCPDialog } from "./mcp-dialog";
export function MoreOptions({
  ...props
}) {
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);
  const {
    themeState
  } = useEditorStore();
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsxs(DropdownMenu, {
      children: [/*#__PURE__*/_jsx(DropdownMenuTrigger, {
        asChild: true,
        ...props,
        children: /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "icon",
          children: /*#__PURE__*/_jsx(MoreVertical, {
            className: "h-4 w-4"
          })
        })
      }), /*#__PURE__*/_jsxs(DropdownMenuContent, {
        align: "end",
        className: "text-foreground",
        children: [/*#__PURE__*/_jsx(DropdownMenuItem, {
          onClick: () => setMcpDialogOpen(true),
          asChild: true,
          children: /*#__PURE__*/_jsx(Button, {
            variant: "ghost",
            size: "sm",
            className: "w-full justify-start",
            children: /*#__PURE__*/_jsx("span", {
              className: "text-sm",
              children: "MCP"
            })
          })
        }), /*#__PURE__*/_jsx(DropdownMenuItem, {
          onSelect: e => e.preventDefault(),
          asChild: true,
          children: /*#__PURE__*/_jsx(ContrastChecker, {
            currentStyles: themeState.styles[themeState.currentMode]
          })
        })]
      })]
    }), /*#__PURE__*/_jsx(MCPDialog, {
      open: mcpDialogOpen,
      onOpenChange: setMcpDialogOpen
    })]
  });
}
//# sourceMappingURL=more-options.js.map