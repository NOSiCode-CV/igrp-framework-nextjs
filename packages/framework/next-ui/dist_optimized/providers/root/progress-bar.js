import { jsx as _jsx } from "react/jsx-runtime";
import { AppProgressProvider } from '@bprogress/next';
export function IGRPProgressBar({
  children,
  height = '4px',
  color = 'primary',
  ...args
}) {
  return /*#__PURE__*/_jsx(AppProgressProvider, {
    height: height,
    color: color,
    options: {
      showSpinner: false
    },
    shallowRouting: true,
    ...args,
    children: children
  });
}
//# sourceMappingURL=progress-bar.js.map