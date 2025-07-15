import { jsx as _jsx } from "react/jsx-runtime";
import { ThemeProvider } from 'next-themes';
export function IGRPThemeProvider({
  children,
  ...props
}) {
  return /*#__PURE__*/_jsx(ThemeProvider, {
    ...props,
    children: children
  });
}
//# sourceMappingURL=theme-provider.js.map