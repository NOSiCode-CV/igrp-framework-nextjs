import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Heart, Moon, Search, Settings, Shuffle, Sun } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Command, CommandEmpty, CommandGroup, CommandItem } from "../primitives/command";
import { Input } from "../primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "../primitives/popover";
import { ScrollArea } from "../primitives/scroll-area";
import { Separator } from "../primitives/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../primitives/tooltip";
// import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/editor-store";
import { useThemePresetStore } from "@/store/theme-preset-store";
import { getPresetThemeStyles } from "../../utils/theme-preset-helper";
import Link from "next/link";
const ColorBox = ({
  color
}) => /*#__PURE__*/_jsx("div", {
  className: "border-muted h-3 w-3 rounded-sm border",
  style: {
    backgroundColor: color
  }
});
const ThemeColors = ({
  presetName,
  mode
}) => {
  const styles = getPresetThemeStyles(presetName)[mode];
  return /*#__PURE__*/_jsxs("div", {
    className: "flex gap-0.5",
    children: [/*#__PURE__*/_jsx(ColorBox, {
      color: styles.primary
    }), /*#__PURE__*/_jsx(ColorBox, {
      color: styles.accent
    }), /*#__PURE__*/_jsx(ColorBox, {
      color: styles.secondary
    }), /*#__PURE__*/_jsx(ColorBox, {
      color: styles.border
    })]
  });
};
const isThemeNew = preset => {
  if (!preset.createdAt) return false;
  const createdAt = new Date(preset.createdAt);
  const timePeriod = new Date();
  timePeriod.setDate(timePeriod.getDate() - 5);
  return createdAt > timePeriod;
};
const ThemeControls = () => {
  const applyThemePreset = useEditorStore(store => store.applyThemePreset);
  const presets = useThemePresetStore(store => store.getAllPresets());
  const presetNames = useMemo(() => ["default", ...Object.keys(presets)], [presets]);
  const randomize = useCallback(() => {
    const random = Math.floor(Math.random() * presetNames.length);
    applyThemePreset(presetNames[random]);
  }, [presetNames, applyThemePreset]);
  const {
    theme
  } = useTheme();
  const handleThemeToggle = event => {
    console.log({
      event
    });
    // const { clientX: x, clientY: y } = event;
    // toggleTheme({ x, y });
  };
  return /*#__PURE__*/_jsxs("div", {
    className: "flex gap-1",
    children: [/*#__PURE__*/_jsxs(Tooltip, {
      children: [/*#__PURE__*/_jsx(TooltipTrigger, {
        asChild: true,
        children: /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onClick: handleThemeToggle,
          children: theme === "light" ? /*#__PURE__*/_jsx(Sun, {
            className: "h-3.5 w-3.5"
          }) : /*#__PURE__*/_jsx(Moon, {
            className: "h-3.5 w-3.5"
          })
        })
      }), /*#__PURE__*/_jsx(TooltipContent, {
        side: "bottom",
        children: /*#__PURE__*/_jsx("p", {
          className: "text-xs",
          children: "Toggle theme"
        })
      })]
    }), /*#__PURE__*/_jsxs(Tooltip, {
      children: [/*#__PURE__*/_jsx(TooltipTrigger, {
        asChild: true,
        children: /*#__PURE__*/_jsx(Button, {
          variant: "ghost",
          size: "sm",
          className: "h-7 w-7 p-0",
          onClick: randomize,
          children: /*#__PURE__*/_jsx(Shuffle, {
            className: "h-3.5 w-3.5"
          })
        })
      }), /*#__PURE__*/_jsx(TooltipContent, {
        side: "bottom",
        children: /*#__PURE__*/_jsx("p", {
          className: "text-xs",
          children: "Random theme"
        })
      })]
    })]
  });
};
const ThemeCycleButton = ({
  direction,
  onClick,
  className,
  ...props
}) => /*#__PURE__*/_jsxs(Tooltip, {
  children: [/*#__PURE__*/_jsx(TooltipTrigger, {
    asChild: true,
    children: /*#__PURE__*/_jsx(Button, {
      variant: "ghost",
      size: "icon",
      className: cn("aspect-square h-full shrink-0", className),
      onClick: onClick,
      ...props,
      children: direction === "prev" ? /*#__PURE__*/_jsx(ArrowLeft, {
        className: "h-4 w-4"
      }) : /*#__PURE__*/_jsx(ArrowRight, {
        className: "h-4 w-4"
      })
    })
  }), /*#__PURE__*/_jsx(TooltipContent, {
    children: direction === "prev" ? "Previous theme" : "Next theme"
  })]
});
const ThemePresetCycleControls = ({
  filteredPresets,
  currentPresetName,
  className,
  ...props
}) => {
  const applyThemePreset = useEditorStore(store => store.applyThemePreset);
  const currentIndex = useMemo(() => filteredPresets.indexOf(currentPresetName || "default"), [filteredPresets, currentPresetName]) ?? 0;
  const cycleTheme = useCallback(direction => {
    const newIndex = direction === "next" ? (currentIndex + 1) % filteredPresets.length : (currentIndex - 1 + filteredPresets.length) % filteredPresets.length;
    applyThemePreset(filteredPresets[newIndex]);
  }, [currentIndex, filteredPresets, applyThemePreset]);
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "min-h-8"
    }), /*#__PURE__*/_jsx(ThemeCycleButton, {
      direction: "prev",
      size: "icon",
      className: cn("aspect-square min-h-8 w-auto", className),
      onClick: () => cycleTheme("prev"),
      ...props
    }), /*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "min-h-8"
    }), /*#__PURE__*/_jsx(ThemeCycleButton, {
      direction: "next",
      size: "icon",
      className: cn("aspect-square min-h-8 w-auto", className),
      onClick: () => cycleTheme("next"),
      ...props
    })]
  });
};
const ThemePresetSelect = ({
  withCycleThemes = true,
  className,
  ...props
}) => {
  const themeState = useEditorStore(store => store.themeState);
  const applyThemePreset = useEditorStore(store => store.applyThemePreset);
  const hasUnsavedChanges = useEditorStore(store => store.hasUnsavedChanges);
  const currentPreset = themeState.preset;
  const mode = themeState.currentMode;
  const presets = useThemePresetStore(store => store.getAllPresets());
  // const loadSavedPresets = useThemePresetStore((store) => store.loadSavedPresets);
  // const unloadSavedPresets = useThemePresetStore((store) => store.unloadSavedPresets);
  const [search, setSearch] = useState("");
  // const { data: session } = authClient.useSession();
  // useEffect(() => {
  //   if (session?.user) {
  //     loadSavedPresets();
  //   } else {
  //     unloadSavedPresets();
  //   }
  // }, [loadSavedPresets, unloadSavedPresets, session?.user]);
  const isSavedTheme = useCallback(presetId => {
    return presets[presetId]?.source === "SAVED";
  }, [presets]);
  const presetNames = useMemo(() => ["default", ...Object.keys(presets)], [presets]);
  const currentPresetName = presetNames?.find(name => name === currentPreset);
  const filteredPresets = useMemo(() => {
    const filteredList = search.trim() === "" ? presetNames : Object.entries(presets).filter(([_, preset]) => preset.label?.toLowerCase().includes(search.toLowerCase())).map(([name]) => name);
    // Separate saved and default themes
    const savedThemesList = filteredList.filter(name => name !== "default" && isSavedTheme(name));
    const defaultThemesList = filteredList.filter(name => !savedThemesList.includes(name));
    // Sort each list
    const sortThemes = list => list.sort((a, b) => {
      const labelA = presets[a]?.label || a;
      const labelB = presets[b]?.label || b;
      return labelA.localeCompare(labelB);
    });
    // Combine saved themes first, then default themes
    return [...sortThemes(savedThemesList), ...sortThemes(defaultThemesList)];
  }, [presetNames, search, presets, isSavedTheme]);
  const filteredSavedThemes = useMemo(() => {
    return filteredPresets.filter(name => name !== "default" && isSavedTheme(name));
  }, [filteredPresets, isSavedTheme]);
  const filteredDefaultThemes = useMemo(() => {
    return filteredPresets.filter(name => name === "default" || !isSavedTheme(name));
  }, [filteredPresets, isSavedTheme]);
  return /*#__PURE__*/_jsxs("div", {
    className: "flex w-full items-center",
    children: [/*#__PURE__*/_jsxs(Popover, {
      children: [/*#__PURE__*/_jsx(PopoverTrigger, {
        asChild: true,
        children: /*#__PURE__*/_jsxs(Button, {
          variant: "ghost",
          className: cn("group relative w-full justify-between md:min-w-56", className),
          ...props,
          children: [/*#__PURE__*/_jsxs("div", {
            className: "flex w-full items-center gap-3 overflow-hidden",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "flex gap-0.5",
              children: [/*#__PURE__*/_jsx(ColorBox, {
                color: themeState.styles[mode].primary
              }), /*#__PURE__*/_jsx(ColorBox, {
                color: themeState.styles[mode].accent
              }), /*#__PURE__*/_jsx(ColorBox, {
                color: themeState.styles[mode].secondary
              }), /*#__PURE__*/_jsx(ColorBox, {
                color: themeState.styles[mode].border
              })]
            }), currentPresetName !== "default" && currentPresetName && isSavedTheme(currentPresetName) && !hasUnsavedChanges() && /*#__PURE__*/_jsx("div", {
              className: "bg-muted rounded-full p-1",
              children: /*#__PURE__*/_jsx(Heart, {
                className: "size-1",
                stroke: "var(--muted)",
                fill: "var(--muted-foreground)"
              })
            }), /*#__PURE__*/_jsx("span", {
              className: "truncate text-left font-medium capitalize",
              children: hasUnsavedChanges() ? /*#__PURE__*/_jsx(_Fragment, {
                children: "Custom (Unsaved)"
              }) : presets[currentPresetName || "default"]?.label || "default"
            })]
          }), /*#__PURE__*/_jsx(ChevronDown, {
            className: "size-4 shrink-0"
          })]
        })
      }), /*#__PURE__*/_jsx(PopoverContent, {
        className: "w-[300px] p-0",
        align: "center",
        children: /*#__PURE__*/_jsxs(Command, {
          className: "h-100 w-full rounded-lg border shadow-md",
          children: [/*#__PURE__*/_jsx("div", {
            className: "flex w-full items-center",
            children: /*#__PURE__*/_jsxs("div", {
              className: "flex w-full items-center border-b px-3 py-1",
              children: [/*#__PURE__*/_jsx(Search, {
                className: "size-4 shrink-0 opacity-50"
              }), /*#__PURE__*/_jsx(Input, {
                placeholder: "Search themes...",
                className: "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                value: search,
                onChange: e => setSearch(e.target.value)
              })]
            })
          }), /*#__PURE__*/_jsxs("div", {
            className: "flex items-center justify-between px-4 py-2",
            children: [/*#__PURE__*/_jsxs("div", {
              className: "text-muted-foreground text-xs",
              children: [filteredPresets.length, " theme", filteredPresets.length !== 1 ? "s" : ""]
            }), /*#__PURE__*/_jsx(ThemeControls, {})]
          }), /*#__PURE__*/_jsx(Separator, {}), /*#__PURE__*/_jsxs(ScrollArea, {
            className: "h-[500px] max-h-[70vh]",
            children: [/*#__PURE__*/_jsx(CommandEmpty, {
              children: "No themes found."
            }), filteredSavedThemes.length > 0 && /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(CommandGroup, {
                heading: /*#__PURE__*/_jsxs("div", {
                  className: "flex w-full items-center justify-between",
                  children: [/*#__PURE__*/_jsx("span", {
                    children: "Saved Themes"
                  }), /*#__PURE__*/_jsx(Link, {
                    href: "/dashboard",
                    children: /*#__PURE__*/_jsxs(Button, {
                      variant: "link",
                      size: "sm",
                      className: "text-muted-foreground hover:text-foreground flex h-6 items-center gap-1.5 p-0 text-xs",
                      children: [/*#__PURE__*/_jsx(Settings, {}), /*#__PURE__*/_jsx("span", {
                        children: "Manage"
                      })]
                    })
                  })]
                }),
                children: filteredSavedThemes.filter(name => name !== "default" && isSavedTheme(name)).map((presetName, index) => /*#__PURE__*/_jsxs(CommandItem, {
                  value: `${presetName}-${index}`,
                  onSelect: () => {
                    applyThemePreset(presetName);
                    setSearch("");
                  },
                  className: "data-[highlighted]:bg-secondary/50 flex items-center gap-2 py-2",
                  children: [/*#__PURE__*/_jsx(ThemeColors, {
                    presetName: presetName,
                    mode: mode
                  }), /*#__PURE__*/_jsxs("div", {
                    className: "flex flex-1 items-center gap-2",
                    children: [/*#__PURE__*/_jsx("span", {
                      className: "line-clamp-1 text-sm font-medium capitalize",
                      children: presets[presetName]?.label || presetName
                    }), presets[presetName] && isThemeNew(presets[presetName]) && /*#__PURE__*/_jsx(Badge, {
                      variant: "secondary",
                      className: "rounded-full text-xs",
                      children: "New"
                    })]
                  }), presetName === currentPresetName && /*#__PURE__*/_jsx(Check, {
                    className: "h-4 w-4 shrink-0 opacity-70"
                  })]
                }, `${presetName}-${index}`))
              }), /*#__PURE__*/_jsx(Separator, {
                className: "my-2"
              })]
            }), filteredSavedThemes.length === 0 && search.trim() === "" && /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsxs("div", {
                className: "text-muted-foreground flex items-center gap-1.5 px-2 pt-2 text-xs",
                children: [/*#__PURE__*/_jsxs("div", {
                  className: "flex items-center gap-1 rounded-md border px-2 py-1",
                  children: [/*#__PURE__*/_jsx(Heart, {
                    className: "size-3"
                  }), /*#__PURE__*/_jsx("span", {
                    children: "Save"
                  })]
                }), /*#__PURE__*/_jsx("span", {
                  children: "a theme to find it here."
                })]
              }), /*#__PURE__*/_jsx(Separator, {
                className: "my-2"
              })]
            }), filteredDefaultThemes.length > 0 && /*#__PURE__*/_jsx(CommandGroup, {
              heading: "Built-in Themes",
              children: filteredDefaultThemes.map((presetName, index) => /*#__PURE__*/_jsxs(CommandItem, {
                value: `${presetName}-${index}`,
                onSelect: () => {
                  applyThemePreset(presetName);
                  setSearch("");
                },
                className: "data-[highlighted]:bg-secondary/50 flex items-center gap-2 py-2",
                children: [/*#__PURE__*/_jsx(ThemeColors, {
                  presetName: presetName,
                  mode: mode
                }), /*#__PURE__*/_jsxs("div", {
                  className: "flex flex-1 items-center gap-2",
                  children: [/*#__PURE__*/_jsx("span", {
                    className: "text-sm font-medium capitalize",
                    children: presets[presetName]?.label || presetName
                  }), presets[presetName] && isThemeNew(presets[presetName]) && /*#__PURE__*/_jsx(Badge, {
                    variant: "secondary",
                    className: "rounded-full text-xs",
                    children: "New"
                  })]
                }), presetName === currentPresetName && /*#__PURE__*/_jsx(Check, {
                  className: "h-4 w-4 shrink-0 opacity-70"
                })]
              }, `${presetName}-${index}`))
            })]
          })]
        })
      })]
    }), withCycleThemes && /*#__PURE__*/_jsx(ThemePresetCycleControls, {
      filteredPresets: filteredPresets,
      currentPresetName: currentPresetName || "default",
      className: className,
      disabled: props.disabled
    })]
  });
};
export default ThemePresetSelect;
//# sourceMappingURL=theme-preset-select.js.map