'use client';

import { c as _c } from "react/compiler-runtime";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { MinusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
function InputOTP({
  className,
  containerClassName,
  ...props
}) {
  return /*#__PURE__*/_jsx(OTPInput, {
    "data-slot": "input-otp",
    containerClassName: cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName),
    className: cn('disabled:cursor-not-allowed', className),
    ...props
  });
}
function InputOTPGroup({
  className,
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "input-otp-group",
    className: cn('flex items-center', className),
    ...props
  });
}
function InputOTPSlot(t0) {
  const $ = _c(15);
  let className;
  let index;
  let props;
  if ($[0] !== t0) {
    ({
      index,
      className,
      ...props
    } = t0);
    $[0] = t0;
    $[1] = className;
    $[2] = index;
    $[3] = props;
  } else {
    className = $[1];
    index = $[2];
    props = $[3];
  }
  const inputOTPContext = React.useContext(OTPInputContext);
  let t1;
  if ($[4] !== index || $[5] !== inputOTPContext?.slots) {
    t1 = inputOTPContext?.slots[index] ?? {};
    $[4] = index;
    $[5] = inputOTPContext?.slots;
    $[6] = t1;
  } else {
    t1 = $[6];
  }
  const {
    char,
    hasFakeCaret,
    isActive
  } = t1;
  let t2;
  if ($[7] !== char || $[8] !== className || $[9] !== hasFakeCaret || $[10] !== isActive || $[11] !== props) {
    let t3;
    if ($[13] !== hasFakeCaret) {
      t3 = hasFakeCaret && _jsx("div", {
        className: "pointer-events-none absolute inset-0 flex items-center justify-center",
        children: _jsx("div", {
          className: "animate-caret-blink bg-foreground h-4 w-px duration-1000"
        })
      });
      $[13] = hasFakeCaret;
      $[14] = t3;
    } else {
      t3 = $[14];
    }
    t2 = _jsxs("div", {
      "data-slot": "input-otp-slot",
      "data-active": isActive,
      className: cn("data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]", className),
      ...props,
      children: [char, t3]
    });
    $[7] = char;
    $[8] = className;
    $[9] = hasFakeCaret;
    $[10] = isActive;
    $[11] = props;
    $[12] = t2;
  } else {
    t2 = $[12];
  }
  return t2;
}
function InputOTPSeparator({
  ...props
}) {
  return /*#__PURE__*/_jsx("div", {
    "data-slot": "input-otp-separator",
    role: "separator",
    ...props,
    children: /*#__PURE__*/_jsx(MinusIcon, {})
  });
}
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
//# sourceMappingURL=input-otp.js.map