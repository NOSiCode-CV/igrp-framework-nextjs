import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../primitives/dialog";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { useCopyToClipboard } from "../../hooks/use-copy-to-clipboard";
import { Check, Copy } from "lucide-react";
export function ShareDialog({
  open,
  onOpenChange,
  url
}) {
  const {
    isCopying,
    hasCopied,
    copyToClipboard
  } = useCopyToClipboard();
  const handleCopy = async () => {
    await copyToClipboard(url, {
      title: "Theme URL copied to clipboard!"
    });
  };
  return /*#__PURE__*/_jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: /*#__PURE__*/_jsxs(DialogContent, {
      className: "sm:max-w-[550px] p-0 py-6 overflow-hidden rounded-lg border shadow-lg gap-6",
      children: [/*#__PURE__*/_jsxs(DialogHeader, {
        className: "px-6",
        children: [/*#__PURE__*/_jsx(DialogTitle, {
          children: "Share Theme"
        }), /*#__PURE__*/_jsx(DialogDescription, {
          children: "Anyone with this URL will be able to view this theme."
        })]
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center space-x-2 px-6",
        children: [/*#__PURE__*/_jsx(Input, {
          readOnly: true,
          value: url,
          className: "flex-1",
          onClick: e => e.currentTarget.select()
        }), /*#__PURE__*/_jsx(Button, {
          size: "icon",
          disabled: isCopying,
          onClick: handleCopy,
          variant: "outline",
          children: hasCopied ? /*#__PURE__*/_jsx(Check, {
            className: "h-4 w-4"
          }) : /*#__PURE__*/_jsx(Copy, {
            className: "h-4 w-4"
          })
        })]
      })]
    })
  });
}
//# sourceMappingURL=share-dialog.js.map