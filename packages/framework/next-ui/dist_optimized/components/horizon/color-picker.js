import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from "../primitives/label";
import { DEBOUNCE_DELAY } from "../../lib/constants";
import { cn } from "../../lib/utils";
import { useColorControlFocus } from "../../store/color-control-focus-store";
import { debounce } from "../../utils/debounce";
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ColorSelectorPopover } from "./color-selector-popover";
import { SectionContext } from "./section-context";
const ColorPicker = ({
  color,
  onChange,
  label,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const rootRef = useRef(null);
  const textInputRef = useRef(null);
  const animationTimerRef = useRef(null);
  const sectionCtx = useContext(SectionContext);
  const {
    registerColor,
    unregisterColor,
    highlightTarget
  } = useColorControlFocus();
  useEffect(() => {
    if (!name) return;
    registerColor(name, rootRef.current);
    return () => unregisterColor(name);
  }, [name, registerColor, unregisterColor]);
  useEffect(() => {
    // Update the text input value using ref when color prop changes
    if (textInputRef.current) {
      textInputRef.current.value = color;
    }
  }, [color]);
  const debouncedOnChange = useMemo(() => debounce(value => {
    onChange(value);
  }, DEBOUNCE_DELAY), [onChange]);
  const handleColorChange = useCallback(e => {
    const newColor = e.target.value;
    debouncedOnChange(newColor);
  }, [debouncedOnChange]);
  const handleTextInputChange = useCallback(e => {
    const colorString = e.target.value;
    debouncedOnChange(colorString);
  }, [debouncedOnChange]);
  useEffect(() => {
    return () => debouncedOnChange.cancel();
  }, [debouncedOnChange]);
  const isHighlighted = name && highlightTarget === name;
  useEffect(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    if (isHighlighted) {
      setShouldAnimate(true);
      sectionCtx?.setIsExpanded(true);
      setTimeout(() => {
        rootRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, sectionCtx?.isExpanded ? 0 : 100);
      animationTimerRef.current = setTimeout(() => {
        setShouldAnimate(false);
        animationTimerRef.current = null;
      }, 1500);
    } else {
      setShouldAnimate(false);
    }
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, [isHighlighted, sectionCtx]);
  return /*#__PURE__*/_jsxs("div", {
    ref: rootRef,
    className: cn("mb-3 transition-all duration-300", shouldAnimate && "bg-border/50 ring-primary -m-1.5 mb-1.5 rounded-sm p-1.5 ring-2"),
    children: [/*#__PURE__*/_jsx("div", {
      className: "mb-1.5 flex items-center justify-between",
      children: /*#__PURE__*/_jsx(Label, {
        htmlFor: `color-${label.replace(/\s+/g, "-").toLowerCase()}`,
        className: "text-xs font-medium",
        children: label
      })
    }), /*#__PURE__*/_jsxs("div", {
      className: "relative flex items-center gap-1",
      children: [/*#__PURE__*/_jsx("div", {
        className: "relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded border",
        style: {
          backgroundColor: color
        },
        onClick: () => setIsOpen(!isOpen),
        children: /*#__PURE__*/_jsx("input", {
          type: "color",
          id: `color-${label.replace(/\s+/g, "-").toLowerCase()}`,
          value: color,
          onChange: handleColorChange,
          className: "absolute inset-0 h-full w-full cursor-pointer opacity-0"
        })
      }), /*#__PURE__*/_jsx("input", {
        ref: textInputRef,
        type: "text",
        defaultValue: color,
        onChange: handleTextInputChange,
        className: "bg-input/25 border-border/20 h-8 flex-1 rounded border px-2 text-sm",
        placeholder: "Enter color (hex or tailwind class)"
      }), /*#__PURE__*/_jsx(ColorSelectorPopover, {
        currentColor: color,
        onChange: onChange
      })]
    })]
  });
};
export default ColorPicker;
//# sourceMappingURL=color-picker.js.map