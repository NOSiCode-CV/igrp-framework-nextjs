"use client";

import { useMemo } from "react";
export const useClassNames = className => {
  return useMemo(() => {
    const seen = new Set();
    return className.split(/\s+/).filter(cls => cls && !seen.has(cls) && seen.add(cls));
  }, [className]);
};
//# sourceMappingURL=use-theme-inspector-classnames.js.map