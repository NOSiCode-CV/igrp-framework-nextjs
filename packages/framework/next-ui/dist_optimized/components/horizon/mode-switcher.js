'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../primitives/button';
import { META_THEME_COLORS, useMetaColor } from '../../hooks/use-meta-color';
export function IGRPModeSwitcher() {
  const $ = _c(6);
  const {
    setTheme,
    resolvedTheme
  } = useTheme();
  const {
    setMetaColor
  } = useMetaColor();
  let t0;
  if ($[0] !== resolvedTheme || $[1] !== setMetaColor || $[2] !== setTheme) {
    t0 = () => {
      console.log("theme toogle");
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      setMetaColor(resolvedTheme === "dark" ? META_THEME_COLORS.light : META_THEME_COLORS.dark);
    };
    $[0] = resolvedTheme;
    $[1] = setMetaColor;
    $[2] = setTheme;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  const toggleTheme = t0;
  let t1;
  if ($[4] !== toggleTheme) {
    t1 = _jsxs(Button, {
      variant: "ghost",
      size: "icon",
      className: "group/toggle size-6",
      onClick: toggleTheme,
      children: [_jsx(SunIcon, {
        className: "hidden [html.dark_&]:block",
        strokeWidth: 2
      }), _jsx(MoonIcon, {
        className: "hidden [html.light_&]:block",
        strokeWidth: 2
      }), _jsx("span", {
        className: "sr-only",
        children: "Toggle theme"
      })]
    });
    $[4] = toggleTheme;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  return t1;
}
//# sourceMappingURL=mode-switcher.js.map