import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';
export function IGRPUserAvatar({
  image,
  alt,
  fallbackContent,
  className,
  fallbackClass
}) {
  return /*#__PURE__*/_jsxs(Avatar, {
    className: className,
    children: [/*#__PURE__*/_jsx(AvatarImage, {
      src: image || undefined,
      alt: alt || 'Current User'
    }), /*#__PURE__*/_jsx(AvatarFallback, {
      className: fallbackClass,
      children: fallbackContent
    })]
  });
}
//# sourceMappingURL=user-avatar.js.map