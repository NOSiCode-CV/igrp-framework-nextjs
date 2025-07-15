'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from '../primitives/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../primitives/select';
import { useIGRPThemeConfig } from '../../providers/root/active-theme';
const DEFAULT_THEMES = [{
  name: 'Default',
  value: 'default'
}, {
  name: 'Blue',
  value: 'blue'
}, {
  name: 'Green',
  value: 'green'
}, {
  name: 'Amber',
  value: 'amber'
}];
const SCALED_THEMES = [{
  name: 'Default',
  value: 'default-scaled'
}, {
  name: 'Blue',
  value: 'blue-scaled'
}, {
  name: 'Green',
  value: 'green-scaled'
}, {
  name: 'Amber',
  value: 'amber-scaled'
}];
// TODO: add messages
export function IGRPThemeSelector() {
  const $ = _c(3);
  const {
    activeTheme,
    setActiveTheme
  } = useIGRPThemeConfig();
  let t0;
  if ($[0] !== activeTheme || $[1] !== setActiveTheme) {
    t0 = _jsxs("div", {
      className: "flex items-center gap-2",
      children: [_jsx(Label, {
        htmlFor: "theme-selector",
        className: "sr-only",
        children: "Theme"
      }), _jsxs(Select, {
        value: activeTheme,
        onValueChange: setActiveTheme,
        children: [_jsxs(SelectTrigger, {
          id: "theme-selector",
          size: "sm",
          className: "justify-start *:data-[slot=select-value]:w-12",
          children: [_jsx("span", {
            className: "text-muted-foreground hidden sm:block",
            children: "Select a theme:"
          }), _jsx("span", {
            className: "text-muted-foreground block sm:hidden",
            children: "Theme"
          }), _jsx(SelectValue, {
            placeholder: "Select a theme"
          })]
        }), _jsxs(SelectContent, {
          align: "end",
          children: [_jsxs(SelectGroup, {
            children: [_jsx(SelectLabel, {
              children: "Default"
            }), DEFAULT_THEMES.map(_temp)]
          }), _jsx(SelectSeparator, {}), _jsxs(SelectGroup, {
            children: [_jsx(SelectLabel, {
              children: "Scaled"
            }), SCALED_THEMES.map(_temp2)]
          })]
        })]
      })]
    });
    $[0] = activeTheme;
    $[1] = setActiveTheme;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}
function _temp2(theme_0) {
  return _jsx(SelectItem, {
    value: theme_0.value,
    children: theme_0.name
  }, theme_0.name);
}
function _temp(theme) {
  return _jsx(SelectItem, {
    value: theme.value,
    children: theme.name
  }, theme.name);
}
//# sourceMappingURL=theme-selector.js.map