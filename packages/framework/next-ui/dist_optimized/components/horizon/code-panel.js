import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Button } from "../primitives/button";
import { Copy, Check, Heart } from "lucide-react";
import { ScrollArea, ScrollBar } from "../primitives/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../primitives/tabs";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "../primitives/select";
import { usePostHog } from "posthog-js/react";
import { useEditorStore } from "../../store/editor-store";
import { usePreferencesStore } from "../../store/preferences-store";
import { generateThemeCode } from "../../utils/theme-style-generator";
import { useThemePresetStore } from "@/store/theme-preset-store";
const CodePanel = ({
  themeEditorState
}) => {
  const [registryCopied, setRegistryCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const posthog = usePostHog();
  // const { handleSaveClick } = useDialogActions();
  const preset = useEditorStore(state => state.themeState.preset);
  const colorFormat = usePreferencesStore(state => state.colorFormat);
  const tailwindVersion = usePreferencesStore(state => state.tailwindVersion);
  const packageManager = usePreferencesStore(state => state.packageManager);
  const setColorFormat = usePreferencesStore(state => state.setColorFormat);
  const setTailwindVersion = usePreferencesStore(state => state.setTailwindVersion);
  const setPackageManager = usePreferencesStore(state => state.setPackageManager);
  const hasUnsavedChanges = useEditorStore(state => state.hasUnsavedChanges);
  const isSavedPreset = useThemePresetStore(state => preset && state.getPreset(preset)?.source === "SAVED");
  const getAvailableColorFormats = usePreferencesStore(state => state.getAvailableColorFormats);
  const code = generateThemeCode(themeEditorState, colorFormat, tailwindVersion);
  const getRegistryCommand = preset => {
    const url = isSavedPreset ? `https://tweakcn.com/r/themes/${preset}` : `https://tweakcn.com/r/themes/${preset}.json`;
    switch (packageManager) {
      case "pnpm":
        return `pnpm dlx shadcn@latest add ${url}`;
      case "npm":
        return `npx shadcn@latest add ${url}`;
      case "yarn":
        return `yarn dlx shadcn@latest add ${url}`;
      case "bun":
        return `bunx shadcn@latest add ${url}`;
    }
  };
  const copyRegistryCommand = async () => {
    try {
      await navigator.clipboard.writeText(getRegistryCommand(preset ?? "default"));
      setRegistryCopied(true);
      setTimeout(() => setRegistryCopied(false), 2000);
      captureCopyEvent("COPY_REGISTRY_COMMAND");
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  const captureCopyEvent = event => {
    posthog.capture(event, {
      editorType: "theme",
      preset,
      colorFormat,
      tailwindVersion
    });
  };
  const copyToClipboard = async text => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      captureCopyEvent("COPY_CODE");
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };
  const showRegistryCommand = useMemo(() => {
    return preset && preset !== "default" && !hasUnsavedChanges();
  }, [preset, hasUnsavedChanges]);
  const PackageManagerHeader = ({
    actionButton
  }) => /*#__PURE__*/_jsxs("div", {
    className: "flex border-b",
    children: [["pnpm", "npm", "yarn", "bun"].map(pm => /*#__PURE__*/_jsx("button", {
      onClick: () => setPackageManager(pm),
      className: `px-3 py-1.5 text-sm font-medium ${packageManager === pm ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`,
      children: pm
    }, pm)), actionButton]
  });
  return /*#__PURE__*/_jsxs("div", {
    className: "flex h-full flex-col",
    children: [/*#__PURE__*/_jsxs("div", {
      className: "mb-4 flex-none",
      children: [/*#__PURE__*/_jsx("div", {
        className: "flex items-center justify-between gap-2",
        children: /*#__PURE__*/_jsx("h2", {
          className: "text-lg font-semibold",
          children: "Theme Code"
        })
      }), /*#__PURE__*/_jsxs("div", {
        className: "mt-4 overflow-hidden rounded-md border",
        children: [/*#__PURE__*/_jsx(PackageManagerHeader, {
          actionButton: showRegistryCommand ? /*#__PURE__*/_jsx(Button, {
            variant: "ghost",
            size: "sm",
            onClick: copyRegistryCommand,
            className: "ml-auto h-8",
            "aria-label": registryCopied ? "Copied to clipboard" : "Copy to clipboard",
            children: registryCopied ? /*#__PURE__*/_jsx(Check, {
              className: "size-4"
            }) : /*#__PURE__*/_jsx(Copy, {
              className: "size-4"
            })
          }) : /*#__PURE__*/_jsxs(Button, {
            variant: "ghost",
            size: "sm",
            // onClick={() => handleSaveClick()}
            className: "ml-auto h-8 gap-1",
            "aria-label": "Save theme",
            children: [/*#__PURE__*/_jsx(Heart, {
              className: "size-4"
            }), /*#__PURE__*/_jsx("span", {
              className: "sr-only sm:not-sr-only",
              children: "Save"
            })]
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "bg-muted/50 flex items-center justify-between p-2",
          children: showRegistryCommand ? /*#__PURE__*/_jsxs(ScrollArea, {
            className: "w-full",
            children: [/*#__PURE__*/_jsx("div", {
              className: "overflow-y-hidden pb-2 whitespace-nowrap",
              children: /*#__PURE__*/_jsx("code", {
                className: "font-mono text-sm",
                children: getRegistryCommand(preset)
              })
            }), /*#__PURE__*/_jsx(ScrollBar, {
              orientation: "horizontal"
            })]
          }) : /*#__PURE__*/_jsx("div", {
            className: "text-muted-foreground text-sm",
            children: "Save your theme to get the registry command"
          })
        })]
      })]
    }), /*#__PURE__*/_jsxs("div", {
      className: "mb-4 flex items-center gap-2",
      children: [/*#__PURE__*/_jsxs(Select, {
        value: tailwindVersion,
        onValueChange: value => {
          setTailwindVersion(value);
          if (value === "4" && colorFormat === "hsl") {
            setColorFormat("oklch");
          }
        },
        children: [/*#__PURE__*/_jsx(SelectTrigger, {
          className: "bg-muted/50 w-fit gap-1 border-none outline-hidden focus:border-none focus:ring-transparent",
          children: /*#__PURE__*/_jsx(SelectValue, {
            className: "focus:ring-transparent"
          })
        }), /*#__PURE__*/_jsxs(SelectContent, {
          children: [/*#__PURE__*/_jsx(SelectItem, {
            value: "3",
            children: "Tailwind v3"
          }), /*#__PURE__*/_jsx(SelectItem, {
            value: "4",
            children: "Tailwind v4"
          })]
        })]
      }), /*#__PURE__*/_jsxs(Select, {
        value: colorFormat,
        onValueChange: value => setColorFormat(value),
        children: [/*#__PURE__*/_jsx(SelectTrigger, {
          className: "bg-muted/50 w-fit gap-1 border-none outline-hidden focus:border-none focus:ring-transparent",
          children: /*#__PURE__*/_jsx(SelectValue, {
            className: "focus:ring-transparent"
          })
        }), /*#__PURE__*/_jsx(SelectContent, {
          children: getAvailableColorFormats().map(colorFormat => /*#__PURE__*/_jsx(SelectItem, {
            value: colorFormat,
            children: colorFormat
          }, colorFormat))
        })]
      })]
    }), /*#__PURE__*/_jsxs(Tabs, {
      defaultValue: "index.css",
      className: "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border",
      children: [/*#__PURE__*/_jsxs("div", {
        className: "bg-muted/50 flex flex-none items-center justify-between border-b px-4 py-2",
        children: [/*#__PURE__*/_jsx(TabsList, {
          className: "h-8 bg-transparent p-0",
          children: /*#__PURE__*/_jsx(TabsTrigger, {
            value: "index.css",
            className: "h-7 px-3 text-sm font-medium",
            children: "index.css"
          })
        }), /*#__PURE__*/_jsx("div", {
          className: "flex items-center gap-2",
          children: /*#__PURE__*/_jsx(Button, {
            variant: "outline",
            size: "sm",
            onClick: () => copyToClipboard(code),
            className: "h-8",
            "aria-label": copied ? "Copied to clipboard" : "Copy to clipboard",
            children: copied ? /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Check, {
                className: "size-4"
              }), /*#__PURE__*/_jsx("span", {
                className: "sr-only md:not-sr-only",
                children: "Copied"
              })]
            }) : /*#__PURE__*/_jsxs(_Fragment, {
              children: [/*#__PURE__*/_jsx(Copy, {
                className: "size-4"
              }), /*#__PURE__*/_jsx("span", {
                className: "sr-only md:not-sr-only",
                children: "Copy"
              })]
            })
          })
        })]
      }), /*#__PURE__*/_jsx(TabsContent, {
        value: "index.css",
        className: "overflow-hidden",
        children: /*#__PURE__*/_jsxs(ScrollArea, {
          className: "relative h-full",
          children: [/*#__PURE__*/_jsx("pre", {
            className: "h-full p-4 text-sm",
            children: /*#__PURE__*/_jsx("code", {
              children: code
            })
          }), /*#__PURE__*/_jsx(ScrollBar, {})]
        })
      })]
    })]
  });
};
export default CodePanel;
//# sourceMappingURL=code-panel.js.map