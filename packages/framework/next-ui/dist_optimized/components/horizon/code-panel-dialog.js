import { jsx as _jsx } from "react/jsx-runtime";
import { Dialog, DialogContent } from "../primitives/dialog";
import CodePanel from "./code-panel";
export function CodePanelDialog({
  open,
  onOpenChange,
  themeEditorState
}) {
  return /*#__PURE__*/_jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: /*#__PURE__*/_jsx(DialogContent, {
      className: "max-w-4xl h-[80vh] p-0 py-6 overflow-hidden rounded-lg border shadow-lg gap-6",
      children: /*#__PURE__*/_jsx("div", {
        className: "h-full overflow-auto px-6",
        children: /*#__PURE__*/_jsx(CodePanel, {
          themeEditorState: themeEditorState
        })
      })
    })
  });
}
//# sourceMappingURL=code-panel-dialog.js.map