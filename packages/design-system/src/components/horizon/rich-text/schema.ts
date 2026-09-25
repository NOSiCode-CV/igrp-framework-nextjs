import type { Extensions } from "@tiptap/core"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { TableKit } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style"
import StarterKit from "@tiptap/starter-kit"

/**
 * The single rich-text schema shared by `IGRPRichTextEditor` and
 * `IGRPRichTextView` (ADR 0003). Deliberately not exported from the package.
 *
 * The view re-parses stored HTML through it, so it IS the allow-list: an element
 * with no node/mark rule (`<script>`, `<iframe>`, `<img>`) and an attribute no
 * extension declares (`onerror`, `onclick`) never reach the DOM. Anything added
 * here widens what every stored body may render — review it as a security change.
 *
 * Deliberately absent:
 *   • images — no public place to host the bytes, and a `data:` URI inlines
 *     megabytes that e-mail allow-lists strip anyway;
 *   • iframes, form controls, raw-HTML source — each widens the allow-list
 *     against backends that echo stored HTML unsanitised;
 *   • inline code and code blocks — the toolbar offers neither, and the ```
 *     input rule would trap the author in a block with no way out.
 *
 * StarterKit v3 already bundles `link` and `underline`; they are configured
 * through it, never registered twice (TipTap warns on duplicate names and which
 * copy wins becomes resolution-order dependent).
 */
function createRichTextSchema(placeholder = ""): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      code: false,
      codeBlock: false,
      link: { openOnClick: false },
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Highlight.configure({ multicolor: false }),
    Subscript,
    Superscript,
    // `TextStyle` is the carrier mark both `Color` and `FontSize` write onto.
    TextStyle,
    Color,
    FontSize,
    TableKit.configure({ table: { resizable: true } }),
    Placeholder.configure({ placeholder }),
  ]
}

/**
 * True when stored HTML has nothing to show: no text, and no block that is
 * content on its own (a rule or a table). Lets the view skip ProseMirror.
 */
function isBlankRichText(html: string | null | undefined): boolean {
  if (!html) return true
  if (/<(hr|table)\b/i.test(html)) return false
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim() === ""
  )
}

export { createRichTextSchema, isBlankRichText }
