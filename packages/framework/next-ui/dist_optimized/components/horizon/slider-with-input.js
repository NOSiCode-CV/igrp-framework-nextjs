import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Label } from "../primitives/label";
import { Input } from "../primitives/input";
import { Slider } from "../primitives/slider";
export const SliderWithInput = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  unit = "px"
}) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  return /*#__PURE__*/_jsxs("div", {
    className: "mb-3",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "flex items-center justify-between mb-1.5",
      children: [/*#__PURE__*/_jsx(Label, {
        htmlFor: `slider-${label.replace(/\s+/g, "-").toLowerCase()}`,
        className: "text-xs font-medium",
        children: label
      }), /*#__PURE__*/_jsxs("div", {
        className: "flex items-center gap-1",
        children: [/*#__PURE__*/_jsx(Input, {
          id: `input-${label.replace(/\s+/g, "-").toLowerCase()}`,
          type: "number",
          value: localValue,
          onChange: e => {
            const newValue = Number(e.target.value);
            setLocalValue(newValue);
            onChange(newValue);
          },
          min: min,
          max: max,
          step: step,
          className: "h-6 w-18 text-xs px-2"
        }), /*#__PURE__*/_jsx("span", {
          className: "text-xs text-muted-foreground",
          children: unit
        })]
      })]
    }), /*#__PURE__*/_jsx(Slider, {
      id: `slider-${label.replace(/\s+/g, "-").toLowerCase()}`,
      value: [localValue],
      min: min,
      max: max,
      step: step,
      onValueChange: values => {
        setLocalValue(values[0]);
        onChange(values[0]);
      },
      className: "py-1"
    })]
  });
};
//# sourceMappingURL=slider-with-input.js.map