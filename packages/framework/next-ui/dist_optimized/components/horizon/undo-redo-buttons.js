import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TooltipWrapper } from "./tooltip-wrapper";
import { Button } from "../primitives/button";
import { useEditorStore } from "@/store/editor-store";
import { Redo, Undo } from "lucide-react";
export function UndoRedoButtons({
  disabled,
  ...props
}) {
  const {
    undo,
    redo,
    canUndo,
    canRedo
  } = useEditorStore();
  return /*#__PURE__*/_jsxs("div", {
    className: "flex items-center gap-1",
    children: [/*#__PURE__*/_jsx(TooltipWrapper, {
      label: "Undo",
      asChild: true,
      children: /*#__PURE__*/_jsx(Button, {
        variant: "ghost",
        size: "icon",
        disabled: disabled || !canUndo(),
        ...props,
        onClick: undo,
        children: /*#__PURE__*/_jsx(Undo, {
          className: "h-4 w-4"
        })
      })
    }), /*#__PURE__*/_jsx(TooltipWrapper, {
      label: "Redo",
      asChild: true,
      children: /*#__PURE__*/_jsx(Button, {
        variant: "ghost",
        size: "icon",
        disabled: disabled || !canRedo(),
        ...props,
        onClick: redo,
        children: /*#__PURE__*/_jsx(Redo, {
          className: "h-4 w-4"
        })
      })
    })]
  });
}
//# sourceMappingURL=undo-redo-buttons.js.map