import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { SliderWithInput } from "./slider-with-input";
import ColorPicker from "./color-picker";
const ShadowControl = ({
  shadowColor,
  shadowOpacity,
  shadowBlur,
  shadowSpread,
  shadowOffsetX,
  shadowOffsetY,
  onChange
}) => {
  return /*#__PURE__*/_jsxs("div", {
    className: "space-y-4",
    children: [/*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(ColorPicker, {
        color: shadowColor,
        onChange: color => onChange("shadow-color", color),
        label: "Shadow Color"
      })
    }), /*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(SliderWithInput, {
        value: shadowOpacity,
        onChange: value => onChange("shadow-opacity", value),
        min: 0,
        max: 1,
        step: 0.01,
        unit: "",
        label: "Shadow Opacity"
      })
    }), /*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(SliderWithInput, {
        value: shadowBlur,
        onChange: value => onChange("shadow-blur", value),
        min: 0,
        max: 50,
        step: 0.5,
        unit: "px",
        label: "Blur Radius"
      })
    }), /*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(SliderWithInput, {
        value: shadowSpread,
        onChange: value => onChange("shadow-spread", value),
        min: -50,
        max: 50,
        step: 0.5,
        unit: "px",
        label: "Spread"
      })
    }), /*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(SliderWithInput, {
        value: shadowOffsetX,
        onChange: value => onChange("shadow-offset-x", value),
        min: -50,
        max: 50,
        step: 0.5,
        unit: "px",
        label: "Offset X"
      })
    }), /*#__PURE__*/_jsx("div", {
      children: /*#__PURE__*/_jsx(SliderWithInput, {
        value: shadowOffsetY,
        onChange: value => onChange("shadow-offset-y", value),
        min: -50,
        max: 50,
        step: 0.5,
        unit: "px",
        label: "Offset Y"
      })
    })]
  });
};
export default ShadowControl;
//# sourceMappingURL=shadow-control.js.map