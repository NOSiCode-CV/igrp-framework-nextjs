import { THEME_CLASS_REGEX } from "../../hooks/use-theme-inspector-regex";
import { getClassString } from "./class-utils";
export const findThemeClasses = (target, rootElement) => {
  let current = target;
  while (current && current !== rootElement) {
    const cls = getClassString(current);
    const classNames = cls.split(/\s+/).filter(Boolean);
    const matches = Array.from(new Set(classNames.filter(className => THEME_CLASS_REGEX.test(className))));
    if (matches.length > 0) {
      return {
        element: current,
        matches
      };
    }
    current = current.parentElement;
  }
  return null;
};
//# sourceMappingURL=theme-class-finder.js.map