"use client";

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { AlertCircle, Sparkles } from "lucide-react";
import React from "react";
import { Label } from "../primitives/label";
import { ScrollArea } from "../primitives/scroll-area";
import { Separator } from "../primitives/separator";
import { Tabs, TabsContent, TabsList } from "../primitives/tabs";
import { COMMON_STYLES, DEFAULT_FONT_MONO, DEFAULT_FONT_SANS, DEFAULT_FONT_SERIF, defaultThemeState } from "@/config/theme";
import { useControlsTabFromUrl } from "../../hooks/use-controls-tab-from-url";
import { useEditorStore } from "@/store/editor-store";
import { getAppliedThemeFont, monoFonts, sansSerifFonts, serifFonts } from "../../utils/theme-fonts";
import { HorizontalScrollArea } from "./horizontal-scroll-area";
import ColorPicker from "./color-picker";
import ControlSection from "./control-section";
import HslAdjustmentControls from "./hsl-adjustment-controls";
import ShadowControl from "./shadow-control";
import { SliderWithInput } from "./slider-with-input";
// import ThemeEditActions from "./theme-edit-actions";
import ThemeFontSelect from "./theme-font-select";
//  import ThemePresetSelect from "./theme-preset-select";
import TabsTriggerPill from "./tabs-trigger-pill";
const ThemeControlPanel = ({
  styles,
  currentMode,
  onChange
}) => {
  const {
    themeState
  } = useEditorStore();
  const {
    tab,
    handleSetTab
  } = useControlsTabFromUrl();
  // const { loading: aiGenerationLoading } = useAIThemeGeneration();
  const currentStyles = React.useMemo(() => ({
    ...defaultThemeState.styles[currentMode],
    ...styles?.[currentMode]
  }), [currentMode, styles]);
  const updateStyle = React.useCallback((key, value) => {
    // apply common styles to both light and dark modes
    if (COMMON_STYLES.includes(key)) {
      onChange({
        ...styles,
        light: {
          ...styles.light,
          [key]: value
        },
        dark: {
          ...styles.dark,
          [key]: value
        }
      });
      return;
    }
    onChange({
      ...styles,
      [currentMode]: {
        ...currentStyles,
        [key]: value
      }
    });
  }, [onChange, styles, currentMode, currentStyles]);
  // Ensure we have valid styles for the current mode
  if (!currentStyles) {
    return null; // Or some fallback UI
  }
  const radius = parseFloat(currentStyles.radius.replace("rem", ""));
  // const theme = use(themePromise);
  return /*#__PURE__*/_jsx(_Fragment, {
    children: /*#__PURE__*/_jsx("div", {
      className: "flex min-h-0 flex-1 flex-col space-y-4",
      children: /*#__PURE__*/_jsxs(Tabs, {
        value: tab,
        onValueChange: v => handleSetTab(v),
        className: "flex min-h-0 w-full flex-1 flex-col",
        children: [/*#__PURE__*/_jsx(HorizontalScrollArea, {
          className: "mt-2 mb-1 px-4",
          children: /*#__PURE__*/_jsxs(TabsList, {
            className: "bg-background text-muted-foreground inline-flex w-fit items-center justify-center rounded-full px-0",
            children: [/*#__PURE__*/_jsx(TabsTriggerPill, {
              value: "colors",
              children: "Colors"
            }), /*#__PURE__*/_jsx(TabsTriggerPill, {
              value: "typography",
              children: "Typography"
            }), /*#__PURE__*/_jsx(TabsTriggerPill, {
              value: "other",
              children: "Other"
            }), /*#__PURE__*/_jsxs(TabsTriggerPill, {
              value: "ai",
              className: "data-[state=active]:[--effect:var(--secondary-foreground)] data-[state=active]:[--foreground:var(--muted-foreground)] data-[state=active]:[--muted-foreground:var(--effect)]",
              children: [/*#__PURE__*/_jsx(Sparkles, {
                className: "mr-1 size-3.5 text-current"
              }), /*#__PURE__*/_jsx("span", {
                className: "animate-text via-foreground from-muted-foreground to-muted-foreground flex items-center gap-1 bg-gradient-to-r from-50% via-60% to-100% bg-[200%_auto] bg-clip-text text-sm text-transparent",
                children: "Generate"
              })]
            })]
          })
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "colors",
          className: "mt-1 size-full overflow-hidden",
          children: /*#__PURE__*/_jsxs(ScrollArea, {
            className: "h-full px-4",
            children: [/*#__PURE__*/_jsxs(ControlSection, {
              title: "Primary Colors",
              expanded: true,
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "primary",
                color: currentStyles.primary,
                onChange: color => updateStyle("primary", color),
                label: "Primary"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "primary-foreground",
                color: currentStyles["primary-foreground"],
                onChange: color => updateStyle("primary-foreground", color),
                label: "Primary Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Secondary Colors",
              expanded: true,
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "secondary",
                color: currentStyles.secondary,
                onChange: color => updateStyle("secondary", color),
                label: "Secondary"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "secondary-foreground",
                color: currentStyles["secondary-foreground"],
                onChange: color => updateStyle("secondary-foreground", color),
                label: "Secondary Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Accent Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "accent",
                color: currentStyles.accent,
                onChange: color => updateStyle("accent", color),
                label: "Accent"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "accent-foreground",
                color: currentStyles["accent-foreground"],
                onChange: color => updateStyle("accent-foreground", color),
                label: "Accent Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Base Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "background",
                color: currentStyles.background,
                onChange: color => updateStyle("background", color),
                label: "Background"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "foreground",
                color: currentStyles.foreground,
                onChange: color => updateStyle("foreground", color),
                label: "Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Card Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "card",
                color: currentStyles.card,
                onChange: color => updateStyle("card", color),
                label: "Card Background"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "card-foreground",
                color: currentStyles["card-foreground"],
                onChange: color => updateStyle("card-foreground", color),
                label: "Card Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Popover Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "popover",
                color: currentStyles.popover,
                onChange: color => updateStyle("popover", color),
                label: "Popover Background"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "popover-foreground",
                color: currentStyles["popover-foreground"],
                onChange: color => updateStyle("popover-foreground", color),
                label: "Popover Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Muted Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "muted",
                color: currentStyles.muted,
                onChange: color => updateStyle("muted", color),
                label: "Muted"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "muted-foreground",
                color: currentStyles["muted-foreground"],
                onChange: color => updateStyle("muted-foreground", color),
                label: "Muted Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Destructive Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "destructive",
                color: currentStyles.destructive,
                onChange: color => updateStyle("destructive", color),
                label: "Destructive"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "destructive-foreground",
                color: currentStyles["destructive-foreground"],
                onChange: color => updateStyle("destructive-foreground", color),
                label: "Destructive Foreground"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Border & Input Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "border",
                color: currentStyles.border,
                onChange: color => updateStyle("border", color),
                label: "Border"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "input",
                color: currentStyles.input,
                onChange: color => updateStyle("input", color),
                label: "Input"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "ring",
                color: currentStyles.ring,
                onChange: color => updateStyle("ring", color),
                label: "Ring"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Chart Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "chart-1",
                color: currentStyles["chart-1"],
                onChange: color => updateStyle("chart-1", color),
                label: "Chart 1"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "chart-2",
                color: currentStyles["chart-2"],
                onChange: color => updateStyle("chart-2", color),
                label: "Chart 2"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "chart-3",
                color: currentStyles["chart-3"],
                onChange: color => updateStyle("chart-3", color),
                label: "Chart 3"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "chart-4",
                color: currentStyles["chart-4"],
                onChange: color => updateStyle("chart-4", color),
                label: "Chart 4"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "chart-5",
                color: currentStyles["chart-5"],
                onChange: color => updateStyle("chart-5", color),
                label: "Chart 5"
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Sidebar Colors",
              children: [/*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar",
                color: currentStyles.sidebar,
                onChange: color => updateStyle("sidebar", color),
                label: "Sidebar Background"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-foreground",
                color: currentStyles["sidebar-foreground"],
                onChange: color => updateStyle("sidebar-foreground", color),
                label: "Sidebar Foreground"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-primary",
                color: currentStyles["sidebar-primary"],
                onChange: color => updateStyle("sidebar-primary", color),
                label: "Sidebar Primary"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-primary-foreground",
                color: currentStyles["sidebar-primary-foreground"],
                onChange: color => updateStyle("sidebar-primary-foreground", color),
                label: "Sidebar Primary Foreground"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-accent",
                color: currentStyles["sidebar-accent"],
                onChange: color => updateStyle("sidebar-accent", color),
                label: "Sidebar Accent"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-accent-foreground",
                color: currentStyles["sidebar-accent-foreground"],
                onChange: color => updateStyle("sidebar-accent-foreground", color),
                label: "Sidebar Accent Foreground"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-border",
                color: currentStyles["sidebar-border"],
                onChange: color => updateStyle("sidebar-border", color),
                label: "Sidebar Border"
              }), /*#__PURE__*/_jsx(ColorPicker, {
                name: "sidebar-ring",
                color: currentStyles["sidebar-ring"],
                onChange: color => updateStyle("sidebar-ring", color),
                label: "Sidebar Ring"
              })]
            })]
          })
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "typography",
          className: "mt-1 size-full overflow-hidden",
          children: /*#__PURE__*/_jsxs(ScrollArea, {
            className: "h-full px-4",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "bg-muted/50 mb-4 flex items-start gap-2.5 rounded-md border p-3",
              children: [/*#__PURE__*/_jsx(AlertCircle, {
                className: "text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
              }), /*#__PURE__*/_jsx("div", {
                className: "text-muted-foreground text-sm",
                children: /*#__PURE__*/_jsxs("p", {
                  children: ["To use custom fonts, embed them in your project. ", /*#__PURE__*/_jsx("br", {}), "See", " ", /*#__PURE__*/_jsx("a", {
                    href: "https://tailwindcss.com/docs/font-family",
                    target: "_blank",
                    className: "hover:text-muted-foreground/90 underline underline-offset-2",
                    children: "Tailwind docs"
                  }), " ", "for details."]
                })
              })]
            }), /*#__PURE__*/_jsxs(ControlSection, {
              title: "Font Family",
              expanded: true,
              children: [/*#__PURE__*/_jsxs("div", {
                className: "mb-4",
                children: [/*#__PURE__*/_jsx(Label, {
                  htmlFor: "font-sans",
                  className: "mb-1.5 block text-xs",
                  children: "Sans-Serif Font"
                }), /*#__PURE__*/_jsx(ThemeFontSelect, {
                  fonts: {
                    ...sansSerifFonts,
                    ...serifFonts,
                    ...monoFonts
                  },
                  defaultValue: DEFAULT_FONT_SANS,
                  currentFont: getAppliedThemeFont(themeState, "font-sans"),
                  onFontChange: value => updateStyle("font-sans", value)
                })]
              }), /*#__PURE__*/_jsx(Separator, {
                className: "my-4"
              }), /*#__PURE__*/_jsxs("div", {
                className: "mb-4",
                children: [/*#__PURE__*/_jsx(Label, {
                  htmlFor: "font-serif",
                  className: "mb-1.5 block text-xs",
                  children: "Serif Font"
                }), /*#__PURE__*/_jsx(ThemeFontSelect, {
                  fonts: {
                    ...serifFonts,
                    ...sansSerifFonts,
                    ...monoFonts
                  },
                  defaultValue: DEFAULT_FONT_SERIF,
                  currentFont: getAppliedThemeFont(themeState, "font-serif"),
                  onFontChange: value => updateStyle("font-serif", value)
                })]
              }), /*#__PURE__*/_jsx(Separator, {
                className: "my-4"
              }), /*#__PURE__*/_jsxs("div", {
                children: [/*#__PURE__*/_jsx(Label, {
                  htmlFor: "font-mono",
                  className: "mb-1.5 block text-xs",
                  children: "Monospace Font"
                }), /*#__PURE__*/_jsx(ThemeFontSelect, {
                  fonts: {
                    ...monoFonts,
                    ...sansSerifFonts,
                    ...serifFonts
                  },
                  defaultValue: DEFAULT_FONT_MONO,
                  currentFont: getAppliedThemeFont(themeState, "font-mono"),
                  onFontChange: value => updateStyle("font-mono", value)
                })]
              })]
            }), /*#__PURE__*/_jsx(ControlSection, {
              title: "Letter Spacing",
              expanded: true,
              children: /*#__PURE__*/_jsx(SliderWithInput, {
                value: parseFloat(currentStyles["letter-spacing"]?.replace("em", "")),
                onChange: value => updateStyle("letter-spacing", `${value}em`),
                min: -0.5,
                max: 0.5,
                step: 0.025,
                unit: "em",
                label: "Letter Spacing"
              })
            })]
          })
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "other",
          className: "mt-1 size-full overflow-hidden",
          children: /*#__PURE__*/_jsxs(ScrollArea, {
            className: "h-full px-4",
            children: [/*#__PURE__*/_jsx(ControlSection, {
              title: "HSL Adjustments",
              expanded: true,
              children: /*#__PURE__*/_jsx(HslAdjustmentControls, {})
            }), /*#__PURE__*/_jsx(ControlSection, {
              title: "Radius",
              expanded: true,
              children: /*#__PURE__*/_jsx(SliderWithInput, {
                value: radius,
                onChange: value => updateStyle("radius", `${value}rem`),
                min: 0,
                max: 5,
                step: 0.025,
                unit: "rem",
                label: "Radius"
              })
            }), /*#__PURE__*/_jsx(ControlSection, {
              title: "Spacing",
              children: /*#__PURE__*/_jsx(SliderWithInput, {
                value: parseFloat(currentStyles.spacing?.replace("rem", "")),
                onChange: value => updateStyle("spacing", `${value}rem`),
                min: 0.15,
                max: 0.35,
                step: 0.01,
                unit: "rem",
                label: "Spacing"
              })
            }), /*#__PURE__*/_jsx(ControlSection, {
              title: "Shadow",
              children: /*#__PURE__*/_jsx(ShadowControl, {
                shadowColor: currentStyles["shadow-color"],
                shadowOpacity: parseFloat(currentStyles["shadow-opacity"]),
                shadowBlur: parseFloat(currentStyles["shadow-blur"]?.replace("px", "")),
                shadowSpread: parseFloat(currentStyles["shadow-spread"]?.replace("px", "")),
                shadowOffsetX: parseFloat(currentStyles["shadow-offset-x"]?.replace("px", "")),
                shadowOffsetY: parseFloat(currentStyles["shadow-offset-y"]?.replace("px", "")),
                onChange: (key, value) => {
                  if (key === "shadow-color") {
                    updateStyle(key, value);
                  } else if (key === "shadow-opacity") {
                    updateStyle(key, value.toString());
                  } else {
                    updateStyle(key, `${value}px`);
                  }
                }
              })
            })]
          })
        })]
      })
    })
  });
};
export default ThemeControlPanel;
//# sourceMappingURL=theme-control-panel.js.map