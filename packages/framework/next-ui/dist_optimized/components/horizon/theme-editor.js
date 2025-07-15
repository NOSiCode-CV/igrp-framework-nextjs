"use client";

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Sliders } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../primitives/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../primitives/tabs";
import { useEditorStore } from "@/store/editor-store";
import { ActionBar } from "./action-bar";
import ThemeControlPanel from "./theme-control-panel";
// const isThemeStyles = (styles: unknown): styles is ThemeStyles => {
//   return (
//     !!styles &&
//     typeof styles === "object" &&
//     styles !== null &&
//     "light" in styles &&
//     "dark" in styles
//   );
// };
const Editor = () => {
  const themeState = useEditorStore(state => state.themeState);
  const setThemeState = useEditorStore(state => state.setThemeState);
  // const initialTheme = themePromise ? use(themePromise) : null;
  const handleStyleChange = React.useCallback(newStyles => {
    const prev = useEditorStore.getState().themeState;
    setThemeState({
      ...prev,
      styles: newStyles
    });
  }, [setThemeState]);
  // useEffect(() => {
  //   if (initialTheme && isThemeStyles(initialTheme.styles)) {
  //     const prev = useEditorStore.getState().themeState;
  //     setThemeState({
  //       ...prev,
  //       styles: initialTheme.styles,
  //       preset: initialTheme.id,
  //     });
  //   }
  // }, [initialTheme, setThemeState]);
  // if (initialTheme && !isThemeStyles(initialTheme.styles)) {
  //   return (
  //     <div className="text-destructive flex h-full items-center justify-center">
  //       Fetched theme data is invalid.
  //     </div>
  //   );
  // }
  const styles = themeState.styles;
  return /*#__PURE__*/_jsxs("div", {
    className: "relative isolate flex flex-1 overflow-hidden",
    children: [/*#__PURE__*/_jsx("div", {
      className: "hidden size-full md:block",
      children: /*#__PURE__*/_jsxs(ResizablePanelGroup, {
        direction: "horizontal",
        className: "isolate",
        children: [/*#__PURE__*/_jsx(ResizablePanel, {
          defaultSize: 30,
          minSize: 20,
          maxSize: 40,
          className: "z-1 min-w-[max(20%,22rem)]",
          children: /*#__PURE__*/_jsx("div", {
            className: "relative isolate flex h-full flex-1 flex-col",
            children: /*#__PURE__*/_jsx(ThemeControlPanel, {
              styles: styles,
              onChange: handleStyleChange,
              currentMode: themeState.currentMode
            })
          })
        }), /*#__PURE__*/_jsx(ResizableHandle, {}), /*#__PURE__*/_jsx(ResizablePanel, {
          defaultSize: 70,
          children: /*#__PURE__*/_jsx("div", {
            className: "flex h-full flex-col",
            children: /*#__PURE__*/_jsx("div", {
              className: "flex min-h-0 flex-1 flex-col",
              children: /*#__PURE__*/_jsx(ActionBar, {})
            })
          })
        })]
      })
    }), /*#__PURE__*/_jsx("div", {
      className: "h-full w-full flex-1 overflow-hidden md:hidden",
      children: /*#__PURE__*/_jsxs(Tabs, {
        defaultValue: "controls",
        className: "h-full",
        children: [/*#__PURE__*/_jsxs(TabsList, {
          className: "w-full rounded-none",
          children: [/*#__PURE__*/_jsxs(TabsTrigger, {
            value: "controls",
            className: "flex-1",
            children: [/*#__PURE__*/_jsx(Sliders, {
              className: "mr-2 h-4 w-4"
            }), "Controls"]
          }), /*#__PURE__*/_jsx(TabsTrigger, {
            value: "preview",
            className: "flex-1",
            children: "Preview"
          })]
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "controls",
          className: "mt-0 h-[calc(100%-2.5rem)]",
          children: /*#__PURE__*/_jsx("div", {
            className: "flex h-full flex-col",
            children: /*#__PURE__*/_jsx(ThemeControlPanel, {
              styles: styles,
              onChange: handleStyleChange,
              currentMode: themeState.currentMode
            })
          })
        }), /*#__PURE__*/_jsx(TabsContent, {
          value: "preview",
          className: "mt-0 h-[calc(100%-2.5rem)]",
          children: /*#__PURE__*/_jsx("div", {
            className: "flex h-full flex-col",
            children: /*#__PURE__*/_jsx(ActionBar, {})
          })
        })]
      })
    })]
  });
};
export default Editor;
//# sourceMappingURL=theme-editor.js.map