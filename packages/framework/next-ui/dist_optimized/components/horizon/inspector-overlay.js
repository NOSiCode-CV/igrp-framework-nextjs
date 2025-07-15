"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../primitives/hover-card";
import { Separator } from "../primitives/separator";
import { useClassNames } from "@/hooks/use-theme-inspector-classnames";
import { cn } from "@/lib/utils";
import { Inspect } from "lucide-react";
import React from "react";
import { createPortal } from "react-dom";
import InspectorClassItem from "./inspector-class-item";
const InspectorOverlay = ({
  inspector,
  enabled,
  rootRef
}) => {
  const classNames = useClassNames(inspector.className);
  if (!enabled || !inspector.rect || typeof window === "undefined" || !rootRef.current) {
    return null;
  }
  // Get the container's bounding rect to convert from viewport coordinates to container-relative coordinates
  const containerRect = rootRef.current.getBoundingClientRect();
  const relativeRect = {
    top: inspector.rect.top - containerRect.top,
    left: inspector.rect.left - containerRect.left,
    width: inspector.rect.width,
    height: inspector.rect.height
  };
  return /*#__PURE__*/createPortal(/*#__PURE__*/_jsxs(HoverCard, {
    open: true,
    defaultOpen: false,
    children: [/*#__PURE__*/_jsx(HoverCardTrigger, {
      asChild: true,
      children: /*#__PURE__*/_jsx("div", {
        "data-inspector-overlay": true,
        className: cn("ring-primary ring-offset-background/90 pointer-events-none absolute z-50 ring-3 ring-offset-2", "transition-all duration-100 ease-in-out"),
        style: {
          top: relativeRect.top,
          left: relativeRect.left,
          width: relativeRect.width,
          height: relativeRect.height
        }
      })
    }), /*#__PURE__*/_jsxs(HoverCardContent, {
      "data-inspector-overlay": true,
      side: "top",
      align: "start",
      className: cn("bg-popover/85 text-popover-foreground pointer-events-auto relative w-auto max-w-[50vw] rounded-lg border p-0 shadow-xl backdrop-blur-lg"),
      sideOffset: 8,
      children: [/*#__PURE__*/_jsxs("div", {
        className: "text-muted-foreground flex items-center gap-1.5 px-2 pt-2 text-sm",
        children: [/*#__PURE__*/_jsx(Inspect, {
          className: "size-4"
        }), "Inspector"]
      }), /*#__PURE__*/_jsx(Separator, {
        className: "my-1"
      }), /*#__PURE__*/_jsx("div", {
        className: "flex flex-col gap-1 px-1 pb-2",
        children: classNames.map(cls => /*#__PURE__*/_jsx(InspectorClassItem, {
          className: cls
        }, cls))
      })]
    })]
  }), rootRef.current);
};
const arePropsEqual = (prevProps, nextProps) => {
  if (prevProps.enabled !== nextProps.enabled) return false;
  if (prevProps.rootRef !== nextProps.rootRef) return false;
  const prevRect = prevProps.inspector.rect;
  const nextRect = nextProps.inspector.rect;
  if (!prevRect && !nextRect) return prevProps.inspector.className === nextProps.inspector.className;
  if (!prevRect || !nextRect) return false;
  return prevRect.top === nextRect.top && prevRect.left === nextRect.left && prevRect.width === nextRect.width && prevRect.height === nextRect.height && prevProps.inspector.className === nextProps.inspector.className;
};
export default /*#__PURE__*/React.memo(InspectorOverlay, arePropsEqual);
//# sourceMappingURL=inspector-overlay.js.map