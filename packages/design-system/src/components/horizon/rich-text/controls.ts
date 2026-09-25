/**
 * One toolbar affordance of `IGRPRichTextEditor`. Some name a group rendered as
 * several buttons: `history` (undo, redo), `heading` (H1–H3), `indent`
 * (indent, outdent) and `textAlign` (left, centre, right, justify).
 */
type IGRPRichTextControl =
  | "history"
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "highlight"
  | "subscript"
  | "superscript"
  | "clearFormatting"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "indent"
  | "horizontalRule"
  | "textAlign"
  | "link"
  | "table"
  | "specialCharacter"
  | "color"
  | "fontSize"

/**
 * A named set of controls. It narrows what an author is offered, never what the
 * schema stores or renders (ADR 0003).
 *
 * - `full` — every control.
 * - `email` — only email-safe formatting: drops everything a strict HTML
 *   allow-list strips (any `style`/`class` attribute, `<s>`, `<mark>`, `<hr>`),
 *   measured against a real notification backend. Offering a control whose
 *   output never reaches the reader is worse than not offering it.
 */
type IGRPRichTextPreset = "email" | "full"

const FULL_CONTROLS: readonly IGRPRichTextControl[] = [
  "history",
  "bold",
  "italic",
  "underline",
  "strike",
  "highlight",
  "subscript",
  "superscript",
  "clearFormatting",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "indent",
  "horizontalRule",
  "textAlign",
  "link",
  "table",
  "specialCharacter",
  "color",
  "fontSize",
]

/** Controls whose output a strict e-mail allow-list discards on render. */
const NOT_EMAIL_SAFE: ReadonlySet<IGRPRichTextControl> = new Set([
  "strike",
  "highlight",
  "horizontalRule",
  "textAlign",
  "color",
  "fontSize",
])

const RICH_TEXT_PRESETS: Record<IGRPRichTextPreset, readonly IGRPRichTextControl[]> = {
  full: FULL_CONTROLS,
  email: FULL_CONTROLS.filter((c) => !NOT_EMAIL_SAFE.has(c)),
}

/** Characters the "Ω" picker offers. Plain text, so every backend keeps them. */
const RICH_TEXT_SPECIAL_CHARS = [
  ..."€$£%‰°ºª№§¶–—…«»“”‘’†•±×÷≤≥≠≈½¼¾¹²³→←↑↓✓✗★☎✉⚠",
  ..."áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ",
] as const

const RICH_TEXT_FONT_SIZES = ["12px", "14px", "16px", "18px", "24px", "32px"]

export {
  RICH_TEXT_FONT_SIZES,
  RICH_TEXT_PRESETS,
  RICH_TEXT_SPECIAL_CHARS,
  type IGRPRichTextControl,
  type IGRPRichTextPreset,
}
