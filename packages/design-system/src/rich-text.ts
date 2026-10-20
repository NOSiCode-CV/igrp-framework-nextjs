// `@igrp/igrp-framework-react-design-system/rich-text` — the rich-text editor and
// its read-only view. Kept out of the root barrel so an app that never imports
// this entry never bundles TipTap (ADR 0003). No directive here: the leaves carry
// their own "use client".
export {
  IGRPRichTextEditor,
  type IGRPRichTextEditorProps,
  type IGRPRichTextVariable,
} from "./components/horizon/rich-text/editor.js"
export { IGRPRichTextView, type IGRPRichTextViewProps } from "./components/horizon/rich-text/view.js"
export { type IGRPRichTextControl, type IGRPRichTextPreset } from "./components/horizon/rich-text/controls.js"
export { type IGRPRichTextColor } from "./components/horizon/rich-text/toolbar.js"
