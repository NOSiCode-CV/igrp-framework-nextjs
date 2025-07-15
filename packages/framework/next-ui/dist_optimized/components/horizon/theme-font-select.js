import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../primitives/select";
const ThemeFontSelect = ({
  fonts,
  defaultValue,
  currentFont,
  onFontChange
}) => {
  const fontNames = useMemo(() => ["System", ...Object.keys(fonts)], [fonts]);
  const value = currentFont ? fonts[currentFont] ?? defaultValue : defaultValue;
  return /*#__PURE__*/_jsxs(Select, {
    value: value || "",
    onValueChange: onFontChange,
    children: [/*#__PURE__*/_jsx("div", {
      className: "flex gap-1 items-center w-full",
      children: /*#__PURE__*/_jsx(SelectTrigger, {
        className: "w-full bg-secondary text-secondary-foreground",
        children: /*#__PURE__*/_jsx(SelectValue, {
          placeholder: "Select theme font"
        })
      })
    }), /*#__PURE__*/_jsx(SelectContent, {
      className: "max-h-[400px]",
      children: /*#__PURE__*/_jsx(SelectGroup, {
        children: fontNames.map(fontName => /*#__PURE__*/_jsx(SelectItem, {
          value: fonts[fontName] ?? defaultValue,
          children: /*#__PURE__*/_jsx("span", {
            style: {
              fontFamily: fonts[fontName] ?? defaultValue
            },
            children: fontName
          })
        }, fontName))
      })
    })]
  });
};
export default ThemeFontSelect;
//# sourceMappingURL=theme-font-select.js.map