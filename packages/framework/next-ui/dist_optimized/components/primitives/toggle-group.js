'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { cn } from '@/lib/utils';
import { toggleVariants } from '@/components/primitives/toggle';
const ToggleGroupContext = /*#__PURE__*/React.createContext({
  size: 'default',
  variant: 'default'
});
function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}) {
  return /*#__PURE__*/_jsx(ToggleGroupPrimitive.Root, {
    "data-slot": "toggle-group",
    "data-variant": variant,
    "data-size": size,
    className: cn('group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs', className),
    ...props,
    children: /*#__PURE__*/_jsx(ToggleGroupContext.Provider, {
      value: {
        variant,
        size
      },
      children: children
    })
  });
}
function ToggleGroupItem(t0) {
  const $ = _c(14);
  let children;
  let className;
  let props;
  let size;
  let variant;
  if ($[0] !== t0) {
    ({
      className,
      children,
      variant,
      size,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = children;
    $[2] = className;
    $[3] = props;
    $[4] = size;
    $[5] = variant;
  } else {
    children = $[1];
    className = $[2];
    props = $[3];
    size = $[4];
    variant = $[5];
  }
  const context = React.useContext(ToggleGroupContext);
  const t1 = context.variant || variant;
  const t2 = context.size || size;
  const t3 = context.variant || variant;
  const t4 = context.size || size;
  let t5;
  if ($[6] !== children || $[7] !== className || $[8] !== props || $[9] !== t1 || $[10] !== t2 || $[11] !== t3 || $[12] !== t4) {
    t5 = _jsx(ToggleGroupPrimitive.Item, {
      "data-slot": "toggle-group-item",
      "data-variant": t1,
      "data-size": t2,
      className: cn(toggleVariants({
        variant: t3,
        size: t4
      }), "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l", className),
      ...props,
      children
    });
    $[6] = children;
    $[7] = className;
    $[8] = props;
    $[9] = t1;
    $[10] = t2;
    $[11] = t3;
    $[12] = t4;
    $[13] = t5;
  } else {
    t5 = $[13];
  }
  return t5;
}
export { ToggleGroup, ToggleGroupItem };
//# sourceMappingURL=toggle-group.js.map