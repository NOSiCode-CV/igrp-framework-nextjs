# §10. `IGRPRichTextView` — render stored HTML without `dangerouslySetInnerHTML`

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§10`.

**Local workaround.** `src/app/(myapp)/_components/rich-text-view.tsx`
(`RichTextView`), over the same schema as §9
(`src/app/(myapp)/_lib/rich-text-extensions.ts`).

**Why it exists — and why it is the security-relevant half of the pair.** The DS
has no way to render stored HTML. We checked the published `dist` for both
halves of that claim: there is no HTML-rendering component, and — to your credit
— no `dangerouslySetInnerHTML` anywhere in the package either. So the DS neither
solves this nor currently has the hole; it simply leaves every app to solve it,
and the default solution is the unsafe one. The obvious alternative,
`dangerouslySetInnerHTML`, is an XSS sink, and in SIGOVP it is a _live_ one:
`document-templates/preview` does **not** sanitise — it echoes its input
verbatim, `<script>`, `<iframe>` and `onerror` included. Whatever renders that
response is the only thing between it and the DOM.

`RichTextView` re-parses the HTML through the editor's own TipTap schema, which
therefore acts as an allow-list: elements with no matching node or mark rule are
dropped, and attributes the schema does not declare (`onerror`, `onclick`) never
reach the DOM. This is why §9 and §10 must share one schema and be lifted
together — a viewer narrower than the editor silently eats saved content, and a
viewer _wider_ than the editor is a hole.

Sixty lines including the empty-state guard. Low cost, high value.

---

## §10.1 Who uses it

- `src/app/(myapp)/_features/notificacao/components/notificacao-form.tsx` — the e-mail preview panel.
- `src/app/(myapp)/_features/modelos-documento/components/modelo-documento-form.tsx` — the document preview panel.

```tsx
<RichTextView html={previewCorpo} className="text-sm" />
```

---

## §10.2 Current props

| Prop         | Type                      | Notes                                           |
| ------------ | ------------------------- | ----------------------------------------------- |
| `html`       | `string`                  | Stored template body, from the API.             |
| `className`  | `string?`                 | Merged after the prose/table classes.           |
| `emptyLabel` | `string?` (default `"—"`) | Rendered as a plain `<p>` when `html` is blank. |

---

## §10.3 Behaviour to reproduce

1. **The empty case never constructs an editor.** Blank or whitespace-only
   `html` renders a plain paragraph and returns before the ProseMirror
   instance exists. The resumo screens render several of these per page, so
   this is not a micro-optimisation.
2. **Re-parse, don't inject.** `useEditor({ extensions, content: html, editable:
false, immediatelyRender: false })`. `immediatelyRender: false` is required
   under Next.js app router or TipTap warns on every mount.
3. **Updates re-set content** with `emitUpdate: false`, and only when the HTML
   actually differs from `editor.getHTML()`.
4. **Styling comes from the same two class constants as the editor** —
   `RICH_TEXT_PROSE_CLASS` (typography, list markers, blockquote) and
   `RICH_TEXT_TABLE_CLASS` (TipTap ships table behaviour, not looks) — plus
   `text-foreground`.

---

## §10.4 Gaps to close while lifting

1. **It is not a sanitiser, and must not be sold as one.** It is a _renderer
   with an allow-list_. Two consequences worth stating in the DS docs:
   - it protects the **DOM**, not the database — the unsanitised HTML is still
     stored and still reaches any other consumer (a PDF renderer, a mail
     client, another app);
   - anything added to the shared schema widens what a stored body may render.
2. **No `maxHeight` / collapse.** A long template body pushes the rest of the
   preview panel off-screen. `maxHeight?: number | string` with a "ver mais"
   affordance would be used immediately by both call sites.
3. **Client-only.** It renders nothing on the server, so a static summary page
   flashes empty. If the DS wants an SSR-safe variant, it needs an HTML
   sanitiser that runs the same allow-list without ProseMirror — worth doing
   once, upstream, rather than in every app.
4. **`emptyLabel` default.** `"—"` is fine and locale-neutral; keep it.

---

## §10.5 Proposed API

```ts
export interface IGRPRichTextViewProps {
  html: string
  /** Must be the schema the matching editor writes with. Defaults to the DS
   *  default schema; pass the same value you passed the editor when you
   *  customised it. */
  preset?: "minimal" | "email" | "full"
  emptyLabel?: React.ReactNode // default "—"
  maxHeight?: number | string // new, see §10.4.2
  className?: string
}
```

Ship `createIGRPRichTextExtensions()` as a public export next to it, so an app
that customises the editor's schema can hand the identical instance to the
viewer. A `preset` mismatch between editor and viewer is the failure mode to
design against — ideally the DS makes it impossible to pass one without the
other.

---

## §10.6 Acceptance criteria

- [ ] `html=""`, `"   "` and whitespace-only markup render `emptyLabel` and
      construct no editor instance.
- [ ] `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`,
      `<iframe src=…>` and `<a href="javascript:…">` in the input render
      nothing executable; no inline handler survives into the DOM.
- [ ] Every node and mark the matching editor can produce — headings, lists,
      blockquote, tables, links, sub/superscript, highlight, colour, font size,
      alignment — round-trips intact.
- [ ] Changing `html` updates the rendering without emitting an update event.
- [ ] Tables render with borders and header shading identical to the editor.
- [ ] Light and dark both legible, from semantic tokens, with no `dark:`
      overrides in the component.
- [ ] `maxHeight` clips with a working expand affordance and does not trap
      keyboard focus.

---

## §10.7 Reference implementation

Verbatim. `createRichTextExtensions()` is quoted in full in §9.8 — it is the
same function the editor uses, and that sharing is the whole point (see §10).

### `src/app/(myapp)/_components/rich-text-view.tsx`

```tsx
"use client"

import { cn } from "@igrp/igrp-framework-react-design-system"
import {
  createRichTextExtensions,
  RICH_TEXT_PROSE_CLASS,
  RICH_TEXT_TABLE_CLASS,
} from "@myapp/_lib/rich-text-extensions"
import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useMemo } from "react"

/**
 * Read-only renderer for stored rich text (e-mail bodies, preview output).
 *
 * Use this instead of `dangerouslySetInnerHTML`. The HTML is re-parsed through
 * the same TipTap schema the editor writes with, so only nodes and marks that
 * schema declares survive — a `<script>`, an `<img onerror=…>` or a
 * `javascript:` link stored through the API (by any client, not just this UI)
 * is discarded rather than rendered.
 */
export function RichTextView({
  html,
  className,
  emptyLabel = "—",
}: {
  html: string
  className?: string
  emptyLabel?: string
}) {
  // Split so the empty case never pays for a ProseMirror instance — these
  // render several to a page on the resumo screens.
  if (!html?.trim()) {
    return <p className={cn("text-sm text-foreground", className)}>{emptyLabel}</p>
  }

  return <RichTextDocument html={html} className={className} />
}

function RichTextDocument({ html, className }: { html: string; className?: string }) {
  const extensions = useMemo(() => createRichTextExtensions(), [])
  const editor = useEditor({
    extensions,
    content: html,
    editable: false,
    // Client-only by design; without this TipTap logs a Next.js warning on
    // every mount.
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor) return
    const next = html ?? ""
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false })
    }
  }, [html, editor])

  return (
    <EditorContent
      editor={editor}
      className={cn(RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS, "text-foreground", className)}
    />
  )
}
```
