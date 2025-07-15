'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IGRPIcon } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@/lib/utils';
// TODO: use breadcrumbs from shadcn-ui
export function IGRPBreadcrumbs(t0) {
  const $ = _c(3);
  const {
    className
  } = t0;
  const pathname = usePathname();
  if (pathname === "/") {
    return null;
  }
  let t1;
  if ($[0] !== className || $[1] !== pathname) {
    const breadcrumbItems = pathname.split("/").filter(Boolean).map(_temp2);
    t1 = _jsx("nav", {
      "aria-label": "Breadcrumb",
      className: cn("flex items-center text-xs", className),
      children: _jsxs("ol", {
        className: "flex items-center flex-wrap gap-1.5",
        children: [_jsx("li", {
          className: "flex items-center",
          children: _jsxs(Link, {
            href: "/",
            className: "text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors",
            children: [_jsx(IGRPIcon, {
              iconName: "House",
              className: "h-3 w-3",
              strokeWidth: 2
            }), _jsx("span", {
              className: "sr-only",
              children: "Home"
            })]
          })
        }), breadcrumbItems.map((item, index_0) => _jsxs("li", {
          className: "flex items-center",
          children: [_jsx(IGRPIcon, {
            iconName: "ChevronRight",
            className: "h-3 w-3 text-muted-foreground",
            "aria-hidden": "true",
            strokeWidth: 2
          }), index_0 === breadcrumbItems.length - 1 || !item.href ? _jsx("span", {
            className: "ml-1.5 font-medium",
            "aria-current": "page",
            children: item.label
          }) : _jsx(Link, {
            href: item.href,
            className: "ml-1.5 text-muted-foreground hover:text-foreground transition-colors",
            children: item.label
          })]
        }, index_0))]
      })
    });
    $[0] = className;
    $[1] = pathname;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}
function _temp2(segment, index, segments) {
  const href = `/${segments.slice(0, index + 1).join("/")}`;
  const label = segment.split("-").map(_temp).join(" ");
  return {
    label,
    href
  };
}
function _temp(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
//# sourceMappingURL=breadcrumbs.js.map