import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Separator } from "../primitives/separator";
// import { useAIThemeGeneration } from "@/hooks/use-ai-theme-generation";
// import { useEditorStore } from "../../store/editor-store";
// import { useThemePresetStore } from "../../store/theme-preset-store";
// import { CodeButton } from "./code-button";
// import { EditButton } from "./edit-button";
// import { ImportButton } from "./import-button";
// import { MoreOptions } from "./more-options";
// import { ResetButton } from "./reset-button";
// import { SaveButton } from "./save-button";
// import { ShareButton } from "./share-button";
import { ThemeToggle } from "./theme-toggle";
// import { UndoRedoButtons } from "./undo-redo-buttons";
// import { useAIChatStore } from "@/store/ai-chat-store";
// interface ActionBarButtonsProps {
//   onImportClick: () => void;
//   onCodeClick: () => void;
//   onSaveClick: () => void;
//   onShareClick: (id?: string) => void;
//   isSaving: boolean;
// }
export function ActionBarButtons() {
  // const { themeState, resetToCurrentPreset, hasUnsavedChanges } = useEditorStore();
  // const { loading: aiGenerationLoading } = useAIThemeGeneration();
  // const { getPreset } = useThemePresetStore();
  // const currentPreset = themeState?.preset ? getPreset(themeState?.preset) : undefined;
  // const isSavedPreset = !!currentPreset && currentPreset.source === "SAVED";
  // const { clearMessages } = useAIChatStore();
  // const handleReset = () => {
  //   resetToCurrentPreset();
  //   clearMessages();
  // };
  return /*#__PURE__*/_jsxs("div", {
    className: "flex items-center gap-1",
    children: [/*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "mx-1 h-8"
    }), /*#__PURE__*/_jsx(ThemeToggle, {}), /*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "mx-1 h-8"
    }), /*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "mx-1 h-8"
    }), /*#__PURE__*/_jsx("div", {
      className: "hidden items-center gap-1 md:flex"
    }), /*#__PURE__*/_jsx(Separator, {
      orientation: "vertical",
      className: "mx-1 h-8"
    })]
  });
}
//# sourceMappingURL=action-bar-buttons.js.map