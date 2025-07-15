'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';
function Slider(t0) {
  const $ = _c(20);
  let className;
  let defaultValue;
  let props;
  let t1;
  let t2;
  let value;
  if ($[0] !== t0) {
    ({
      className,
      defaultValue,
      value,
      min: t1,
      max: t2,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = defaultValue;
    $[3] = props;
    $[4] = t1;
    $[5] = t2;
    $[6] = value;
  } else {
    className = $[1];
    defaultValue = $[2];
    props = $[3];
    t1 = $[4];
    t2 = $[5];
    value = $[6];
  }
  const min = t1 === undefined ? 0 : t1;
  const max = t2 === undefined ? 100 : t2;
  let t3;
  let t4;
  if ($[7] !== defaultValue || $[8] !== max || $[9] !== min || $[10] !== value) {
    t4 = Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min, max];
    $[7] = defaultValue;
    $[8] = max;
    $[9] = min;
    $[10] = value;
    $[11] = t4;
  } else {
    t4 = $[11];
  }
  t3 = t4;
  const _values = t3;
  let t5;
  if ($[12] !== _values.length || $[13] !== className || $[14] !== defaultValue || $[15] !== max || $[16] !== min || $[17] !== props || $[18] !== value) {
    t5 = _jsxs(SliderPrimitive.Root, {
      "data-slot": "slider",
      defaultValue,
      value,
      min,
      max,
      className: cn("relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col", className),
      ...props,
      children: [_jsx(SliderPrimitive.Track, {
        "data-slot": "slider-track",
        className: cn("bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"),
        children: _jsx(SliderPrimitive.Range, {
          "data-slot": "slider-range",
          className: cn("bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full")
        })
      }), Array.from({
        length: _values.length
      }, _temp)]
    });
    $[12] = _values.length;
    $[13] = className;
    $[14] = defaultValue;
    $[15] = max;
    $[16] = min;
    $[17] = props;
    $[18] = value;
    $[19] = t5;
  } else {
    t5 = $[19];
  }
  return t5;
}
function _temp(_, index) {
  return _jsx(SliderPrimitive.Thumb, {
    "data-slot": "slider-thumb",
    className: "border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
  }, index);
}
export { Slider };
//# sourceMappingURL=slider.js.map