"use client";

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { memo, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { SquarePen } from "lucide-react";
import { useColorControlFocus } from "../../store/color-control-focus-store";
import { segmentClassName } from "../../lib/inspector/segment-classname";
import { useEditorStore } from "../../store/editor-store";
const InspectorClassItem = /*#__PURE__*/memo(({
  className
}) => {
  const {
    focusColor
  } = useColorControlFocus();
  const {
    themeState
  } = useEditorStore();
  const styles = themeState.styles[themeState.currentMode];
  const segments = useMemo(() => segmentClassName(className), [className]);
  const handleClick = useCallback(e => {
    e.stopPropagation();
    e.preventDefault();
    const color = segments.value;
    if (color) {
      focusColor(color);
    }
  }, [segments.value, focusColor]);
  const renderSegmentedClassName = useCallback(() => {
    const parts = [];
    if (segments.selector) {
      parts.push(/*#__PURE__*/_jsxs("span", {
        className: "text-foreground/60",
        children: [segments.selector, ":"]
      }, "selector"));
    }
    if (segments.prefix) {
      parts.push(/*#__PURE__*/_jsx("span", {
        className: "text-foreground",
        children: segments.prefix
      }, "prefix"));
    }
    if (segments.value) {
      parts.push(/*#__PURE__*/_jsx("span", {
        className: "text-foreground/80",
        children: "-"
      }, "dash"), /*#__PURE__*/_jsx("span", {
        className: "text-foreground font-bold",
        children: segments.value
      }, "value"));
    }
    if (segments.opacity) {
      parts.push(/*#__PURE__*/_jsx("span", {
        className: "text-foreground/60",
        children: "/"
      }, "slash"), /*#__PURE__*/_jsx("span", {
        className: "text-foreground/60",
        children: segments.opacity
      }, "opacity"));
    }
    return /*#__PURE__*/_jsx(_Fragment, {
      children: parts
    });
  }, [segments]);
  return /*#__PURE__*/_jsxs("div", {
    className: "group hover:bg-foreground/10 flex cursor-pointer items-center justify-between gap-2 rounded-md p-1.5 transition-colors",
    onClick: handleClick,
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center gap-1.5",
      children: [/*#__PURE__*/_jsx("span", {
        style: {
          backgroundColor: styles[segments.value]
        },
        className: cn("border-foreground ring-border block size-4 shrink-0 rounded-md border-1 ring-1")
      }), /*#__PURE__*/_jsx("span", {
        className: "font-mono text-xs",
        children: renderSegmentedClassName()
      })]
    }), /*#__PURE__*/_jsx(SquarePen, {
      className: "text-muted-foreground size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
    })]
  });
});
InspectorClassItem.displayName = "InspectorClassItem";
export default InspectorClassItem;
//# sourceMappingURL=inspector-class-item.js.map