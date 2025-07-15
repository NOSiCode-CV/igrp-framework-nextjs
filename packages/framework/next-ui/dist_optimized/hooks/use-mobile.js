'use client';

import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
  const $ = _c(2);
  const [isMobile, setIsMobile] = React.useState(undefined);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      const onChange = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };
      mql.addEventListener("change", onChange);
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      return () => mql.removeEventListener("change", onChange);
    };
    t1 = [];
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  React.useEffect(t0, t1);
  return !!isMobile;
}
//# sourceMappingURL=use-mobile.js.map