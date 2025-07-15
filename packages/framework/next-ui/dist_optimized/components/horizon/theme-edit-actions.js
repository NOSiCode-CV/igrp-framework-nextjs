import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from "../primitives/button";
import { Separator } from "../primitives/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../primitives/tooltip";
import { useEditorStore } from "@/store/editor-store";
// import type { Theme } from "../../types/theme";
import { Check, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ThemeSaveDialog } from "./theme-save-dialog";
const ThemeEditActions = ({
  disabled = false
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    themeState,
    applyThemePreset
  } = useEditorStore();
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const mainEditorUrl = `/editor/theme?${searchParams}`;
  const handleThemeEditCancel = () => {
    // Keep the current search params for tab persistence
    router.push(mainEditorUrl);
    applyThemePreset(themeState?.preset || "default");
  };
  const handleSaveTheme = async () => {
    // const dataToUpdate: {
    //   id: string;
    //   name?: string;
    //   styles?: Theme["styles"];
    // } = {
    //   id: theme.id,
    // };
    // if (newName !== theme.name) {
    //   dataToUpdate.name = newName;
    // } else {
    //   dataToUpdate.name = theme.name;
    // }
    // if (themeState.styles) {
    //   dataToUpdate.styles = themeState.styles;
    // }
    // if (!dataToUpdate.name && !dataToUpdate.styles) {
    //   setIsNameDialogOpen(false);
    //   return;
    // }
    // try {
    //   const result = await updateThemeMutation.mutateAsync(dataToUpdate);
    //   if (result) {
    //     setIsNameDialogOpen(false);
    //     router.push(mainEditorUrl);
    //     applyThemePreset(result?.id || themeState?.preset || "default");
    //   }
    // } catch (error) {
    //   console.error("Failed to update theme:", error);
    // }
  };
  const handleThemeEditSave = () => {
    setIsNameDialogOpen(true);
  };
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [/*#__PURE__*/_jsxs("div", {
      className: "bg-card/80 text-card-foreground flex items-center",
      children: [/*#__PURE__*/_jsx("div", {
        className: "flex min-h-14 flex-1 items-center gap-2 px-4",
        children: /*#__PURE__*/_jsxs("div", {
          className: "flex animate-pulse items-center gap-2",
          children: [/*#__PURE__*/_jsx("div", {
            className: "h-2 w-2 rounded-full bg-blue-500"
          }), /*#__PURE__*/_jsx("span", {
            className: "text-card-foreground/60 text-sm font-medium",
            children: "Editing"
          })]
        })
      }), /*#__PURE__*/_jsx(Separator, {
        orientation: "vertical",
        className: "bg-border h-8"
      }), /*#__PURE__*/_jsx(TooltipProvider, {
        children: /*#__PURE__*/_jsxs(Tooltip, {
          children: [/*#__PURE__*/_jsx(TooltipTrigger, {
            asChild: true,
            children: /*#__PURE__*/_jsx(Button, {
              variant: "ghost",
              size: "icon",
              className: "size-14 shrink-0 rounded-none",
              onClick: handleThemeEditCancel,
              disabled: disabled,
              children: /*#__PURE__*/_jsx(X, {
                className: "h-4 w-4"
              })
            })
          }), /*#__PURE__*/_jsx(TooltipContent, {
            children: "Cancel changes"
          })]
        })
      }), /*#__PURE__*/_jsx(Separator, {
        orientation: "vertical",
        className: "bg-border h-8"
      }), /*#__PURE__*/_jsx(TooltipProvider, {
        children: /*#__PURE__*/_jsxs(Tooltip, {
          children: [/*#__PURE__*/_jsx(TooltipTrigger, {
            asChild: true,
            children: /*#__PURE__*/_jsx(Button, {
              variant: "ghost",
              size: "icon",
              className: "size-14 shrink-0 rounded-none",
              onClick: handleThemeEditSave,
              disabled: disabled,
              children: /*#__PURE__*/_jsx(Check, {
                className: "h-4 w-4"
              })
            })
          }), /*#__PURE__*/_jsx(TooltipContent, {
            children: "Save changes"
          })]
        })
      })]
    }), /*#__PURE__*/_jsx(ThemeSaveDialog, {
      open: isNameDialogOpen,
      onOpenChange: setIsNameDialogOpen,
      onSave: handleSaveTheme,
      isSaving: false,
      // initialThemeName={theme.name}
      title: "Save Theme Changes",
      description: "Confirm or update the theme name before saving.",
      ctaLabel: "Save Changes"
    })]
  });
};
export default ThemeEditActions;
//# sourceMappingURL=theme-edit-actions.js.map