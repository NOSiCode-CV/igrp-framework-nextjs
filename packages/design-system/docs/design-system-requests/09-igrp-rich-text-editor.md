# §9. `IGRPRichTextEditor` — a form-bound WYSIWYG field

> Part of the SIGOVP design-system request bundle — see [README.md](README.md). Cite as `§9`.

**Local workaround.** `src/app/(myapp)/_components/rich-text-editor.tsx`
(`SimpleRichTextEditor`, ~1130 lines), over the shared TipTap schema in
`src/app/(myapp)/_lib/rich-text-extensions.ts`.
Read it together with §10 (`IGRPRichTextView`) — they share one schema by
design, and splitting them upstream would reintroduce the bug the shared schema
prevents.

**Why it exists.** The DS has no rich-text input of any kind — we checked rather
than assumed: nothing in the published `dist` references `tiptap`,
`ProseMirror`, `contentEditable` or `execCommand`, and no export name suggests
an editor. SIGOVP needs two: e-mail notification bodies and document templates,
both with `{{variavel}}` tokens.

**This is the largest and most opinionated request in this folder.** Read
§9.5 (dependency footprint) before deciding — it is the part that determines
whether this belongs in the DS core at all.

---

## §9.1 Who uses it

Two template editors:

- `src/app/(myapp)/_features/notificacao/components/notificacao-form.tsx` — `preset="email"`
- `src/app/(myapp)/_features/modelos-documento/components/modelo-documento-form.tsx` — `preset="documento"`

```tsx
<SimpleRichTextEditor
  name="corpo"
  label="Corpo de email"
  required
  editable={!isView}
  className="sm:col-span-2"
  placeholder="Corpo do email com variáveis {{…}}"
  preset="email"
  variables={NOTIFICACAO_TEMPLATE_VARIABLES}
/>
```

---

## §9.2 Current props

```ts
interface SimpleRichTextEditorProps {
  name?: string;          // falls back to id, then a useId()
  id?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  labelClassName?: string;
  error?: string;         // manual error, outside the form
  content?: string;       // uncontrolled-mode value
  onChange?: (content: string) => void;
  placeholder?: string;   // default "Começe a escrever aqui..."
  className?: string;
  editorClassName?: string;
  editable?: boolean;     // default true; false = read-only, toolbar hidden
  preset?: "email" | "documento";
  variables?: { value: string; label?: string }[];
}
```

**Dual mode.** Inside a `useFormContext()` it renders through `IGRPFormField`
and binds to `name`; outside one it falls back to `content` + `onChange`. Both
paths are used and both should survive the lift.

---

## §9.3 The five non-obvious behaviours

Each of these was a bug once. They are the real content of this request — the
toolbar is the easy part.

1. **Accessibility cannot be delegated to the form wrapper.** `<label for>` only
   labels form controls, and the `id`/`aria-*` a wrapper stamps onto the
   container `div` are never announced for the inner `role="textbox"`. So the
   component mirrors `id`, `aria-label`, `aria-describedby`, `aria-invalid` and
   `aria-required` onto the contenteditable node through TipTap's
   `editorProps.attributes`. Skip this and the field is an unnamed textbox with
   no error association.
2. **TipTap binds `onUpdate`/`onBlur` once.** They are read at construction and
   never re-read, so a callback captured on first render sticks for the
   editor's life. Both are routed through refs.
3. **`editable` does not propagate as a prop.** `useEditor` re-applies its
   options with `editable` pinned to the editor's *current* value, so toggling
   read-only needs an explicit `editor.setEditable(editable, false)`. The
   `false` matters: flipping read-only is not a content change, and emitting one
   pushes an identical value back and dirties the form.
4. **Toolbar state needs an explicit subscription.** TipTap v3 does not
   re-render React on every transaction (v2 did) and only emits `update` when
   the *document* changes. Without `useEditorState`, toggles miss every
   selection-only change — clicking Bold on an empty selection applied the mark
   but left the button unpressed, and moving the caret out of bold text left it
   pressed.
5. **The toolbar must not steal the caret.** Every popover button carries
   `onMouseDown={(e) => e.preventDefault()}`, or insert-at-cursor inserts
   nowhere. Disabled toggles are wrapped in a `<span className="inline-flex
   cursor-not-allowed">` so their tooltip still opens — the same Radix rule as
   §3 and §6, hit for the third time.

Also worth encoding: the `Placeholder` extension reads its text once at schema
build time, so the component remounts the surface with `key={placeholder}` when
it changes.

---

## §9.4 Toolbar presets

`preset` is not cosmetic — it reflects what each of our two backends keeps. We
measured it rather than guessed: every control was round-tripped through the two
`POST …/preview` endpoints our API exposes, on 2026-09-10. The notification
renderer runs a strict allow-list and strips **every** `style` and `class`
attribute, so text alignment, colour and font size never reach the reader, along
with `<s>`, `<mark>` and `<hr>`. The document renderer does not sanitise at all —
it echoes its input verbatim, which is what makes §10 load-bearing.

(Our source comments cite this as `BACKEND-REQUESTS.md §13`, an internal
document of ours. The measured results are reproduced in full in the
`RICH_TEXT_BACKEND_SUPPORT` comment in §9.8, so you do not need it.)

| Control group | `documento` | `email` |
|---|---|---|
| Undo/redo, bold, italic, underline, sub/superscript, clear formatting | yes | yes |
| Headings 1–3, bullet/ordered list, blockquote, indent/outdent | yes | yes |
| Link, table, special characters | yes | yes |
| Strikethrough, highlight, horizontal rule | yes | **no** |
| Text alignment, colour, font size | yes | **no** |

Offering a control whose output the backend discards is worse than not offering
it, which is why this is a preset and not a `toolbar={[...]}` free-for-all. A DS
version should keep a preset concept (`"minimal" | "email" | "full"`) **and**
allow an explicit control list for apps whose backends differ.

The other toolbar pieces worth lifting as they are: the link popover (seeds from
the link under the caret; an empty field is a no-op, never a delete — removal is
an explicit button; nothing selected inserts the URL as its own linked text),
the 3×3 table popover, the `Ω` special-character grid, and the colour and
font-size pickers.

---

## §9.5 Dependency footprint — decide this first

The component pulls in **eleven** packages: `@tiptap/core`, `@tiptap/react`,
`@tiptap/pm`, `@tiptap/starter-kit`, plus `extension-highlight`,
`-placeholder`, `-subscript`, `-superscript`, `-table`, `-text-align`,
`-text-style` (all 3.31.3 here).

That should not land in the main `@igrp/igrp-framework-react-design-system`
entry point, where every app would pay for it. Options, in preference order:

1. A separate package — `@igrp/igrp-framework-react-rich-text`.
2. A subpath export (`@igrp/igrp-framework-react-design-system/rich-text`) with
   TipTap as an optional peer dependency.
3. A headless split: the DS ships `IGRPRichTextToolbar` + the field chrome
   against an injected editor instance, and the app owns TipTap.

Whichever is chosen, `createRichTextExtensions()` must be **exported**, because
§10 depends on using the exact same schema.

---

## §9.6 Proposed API

```ts
export interface IGRPRichTextEditorProps {
  name?: string;
  id?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  error?: string;
  value?: string;                    // rename of `content`
  onChange?: (html: string) => void;
  placeholder?: string;              // locale-neutral default
  editable?: boolean;
  preset?: "minimal" | "email" | "full";
  controls?: IGRPRichTextControl[];  // explicit list, overrides preset
  variables?: { value: string; label?: string }[];
  variablesLabel?: string;           // the hint above the chips, for i18n
  maxLength?: number;                // new: character budget on the text
  className?: string;
  editorClassName?: string;
  labelClassName?: string;
}
```

Gaps to close while lifting:

1. **Hard-coded Portuguese.** Every tooltip, the placeholder, the variables hint
   and the link popover copy. Needs a `labels` override or the DS i18n mechanism.
2. **No `maxLength`.** Template bodies go into sized columns; there is no
   counter and no cap (contrast §5).
3. **No image support, deliberately.** Keep it that way, and document why:
   `/api/v1/documentos/*` is bearer-authenticated so an `<img src>` renders
   nothing in a mail client, and a `data:` URI is stripped by the notification
   backend after inlining megabytes. If the DS adds images, it must be opt-in
   per app and widen §10's allow-list knowingly.
4. **No raw-HTML/source view, deliberately.** See §10 — one backend echoes its
   input unsanitised, so the schema is the only guard.
5. **Toolbar overflow.** `flex-wrap` at narrow widths gives a three-row toolbar.
   A DS version should collapse into an overflow menu.

---

## §9.7 Acceptance criteria

- [ ] Inside `IGRPForm`, the editor binds to `name`, marks the form dirty on
      edit, blurs into `onBlur`, and renders its Zod error under the field.
- [ ] Outside a form, `value` + `onChange` work and no form context is required.
- [ ] The contenteditable node itself carries `role="textbox"`,
      `aria-multiline`, the label as accessible name, `aria-describedby` to
      helper **and** error, `aria-invalid` and `aria-required`.
- [ ] Toggling `editable` at runtime flips the surface read-only, hides the
      toolbar and the variable chips, and does **not** dirty the form.
- [ ] Toolbar pressed-states track caret movement, not just document changes.
- [ ] Inserting a variable or a special character lands at the caret, and the
      selection is not lost to the toolbar.
- [ ] The link popover opens seeded with the current href; saving an empty
      field does not delete the link; "Remover" does.
- [ ] Changing `placeholder` at runtime updates the shown placeholder.
- [ ] `preset="email"` does not render strike, highlight, rule, alignment,
      colour or font-size controls.
- [ ] Server-rendered pages do not warn about immediate rendering (the editor is
      client-only by design).

---

## §9.8 Reference implementation

Two files. The schema module is the one §10 also imports — keeping a single
definition is what makes the read-only viewer a safe allow-list rather than a
second, drifting parser.

### `src/app/(myapp)/_lib/rich-text-extensions.ts`

```ts
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";

/**
 * Which toolbar controls a rich-text field offers.
 *
 * The *schema* below is deliberately one superset for every field — the
 * read-only `RichTextView` re-parses stored HTML through it as an allow-list,
 * and a viewer narrower than the editor would silently eat saved content. Only
 * the toolbar varies, because the two backends keep different things (see
 * `RICH_TEXT_BACKEND_SUPPORT`).
 */
export type RichTextPreset = "email" | "documento";

/**
 * What each backend actually preserves, measured against the two preview
 * endpoints on 2026-09-10 (`BACKEND-REQUESTS.md §13`). Not guesswork — every row
 * was round-tripped through `POST …/preview`.
 *
 * `notification-templates/preview` runs a strict allow-list:
 *   kept     — p, br, div, strong, em, u, sub, sup, h1-h3, ul, ol, blockquote,
 *              pre/code, table/tbody/tr/th/td, a[href], img[src][alt]
 *   stripped — EVERY `style` and `class` attribute (so text-align, colour and
 *              font-size never survive), `align`, `<s>`, `<mark>`, `<hr>`,
 *              a[target|rel], and `data:` image sources
 *
 * `document-templates/preview` does NOT sanitise at all — it echoes its input
 * verbatim, `<script>`/`<iframe>`/`onerror` included. Two consequences:
 *   1. rich formatting survives there, so the fuller toolbar is honest; and
 *   2. `RichTextView` is the ONLY thing standing between that response and the
 *      DOM, which is why the schema below stays tight and why there is no
 *      "source"/raw-HTML control anywhere in this editor.
 */
export const RICH_TEXT_BACKEND_SUPPORT = {
  /** Controls whose output `notification-templates` discards on render. */
  strippedByEmailBackend: [
    "strike",
    "highlight",
    "horizontalRule",
    "textAlign",
    "color",
    "fontSize",
  ],
} as const;

/**
 * The single TipTap schema used both by the editor (`_components/rich-text-editor`)
 * and by the read-only viewer (`_components/rich-text-view`).
 *
 * Keeping one list matters for more than tidiness: the viewer relies on this
 * schema as an allow-list. Stored HTML is re-parsed through it, so elements
 * with no matching node/mark rule (`<script>`, `<iframe>`, `<img>`) and any
 * attribute the schema does not declare (`onerror`, `onclick`) are dropped
 * instead of reaching the DOM. Anything added here widens what a stored
 * template body is allowed to render.
 *
 * Deliberately NOT here:
 *   • `image` — there is nowhere to host the bytes. `/api/v1/documentos/*` is
 *     bearer-authenticated, so an `<img src>` pointing at it renders nothing in
 *     a mail client, and the only alternative, a `data:` URI, is stripped
 *     outright by the notification backend and would inline megabytes into a
 *     column with no `maxLength`.
 *   • `iframe`, form controls, raw-HTML source — each widens the allow-list
 *     above against content the document backend hands back unsanitised.
 *
 * StarterKit v3 already bundles `link` and `underline`, so they are configured
 * through it rather than added again — registering them twice makes which copy
 * wins depend on resolution order (TipTap logs "Duplicate extension names
 * found").
 */
export function createRichTextExtensions(placeholder = "") {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      /**
       * The toolbar offers neither inline code nor code blocks, so keeping them
       * in the schema only creates a trap: the ``` input rule drops the author
       * into a block with no button to leave it. Off here also narrows the
       * viewer's allow-list, which is the safer direction.
       */
      code: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      },
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    Highlight.configure({
      multicolor: false,
    }),
    Subscript,
    Superscript,
    // `TextStyle` is the carrier mark both `Color` and `FontSize` write onto.
    TextStyle,
    Color,
    FontSize,
    TableKit.configure({
      table: { resizable: true, HTMLAttributes: { class: "w-full" } },
    }),
    Placeholder.configure({
      placeholder,
    }),
  ];
}

/** Prose classes shared by the editor surface and the read-only viewer. */
export const RICH_TEXT_PROSE_CLASS =
  "prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-semibold prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-blockquote:my-2 prose-blockquote:border-l-2 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-4 prose-blockquote:italic focus:outline-none max-w-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:ps-6 [&_ol]:ps-6 [&_ul_ul]:mt-2 [&_ol_ol]:mt-2";

/** Table styling — TipTap ships behaviour, not looks. */
export const RICH_TEXT_TABLE_CLASS =
  "[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-start [&_td]:border [&_td]:border-border [&_td]:p-2 [&_.selectedCell]:bg-primary/10 [&_.column-resize-handle]:bg-primary [&_.column-resize-handle]:w-0.5";

/** Characters the "Ω" picker offers. Plain text, so every backend keeps them. */
export const RICH_TEXT_SPECIAL_CHARS = [
  "€",
  "$",
  "£",
  "%",
  "‰",
  "°",
  "º",
  "ª",
  "№",
  "§",
  "¶",
  "–",
  "—",
  "…",
  "«",
  "»",
  "“",
  "”",
  "‘",
  "’",
  "†",
  "•",
  "±",
  "×",
  "÷",
  "≤",
  "≥",
  "≠",
  "≈",
  "½",
  "¼",
  "¾",
  "¹",
  "²",
  "³",
  "→",
  "←",
  "↑",
  "↓",
  "✓",
  "✗",
  "★",
  "☎",
  "✉",
  "⚠",
  "á",
  "à",
  "â",
  "ã",
  "é",
  "ê",
  "í",
  "ó",
  "ô",
  "õ",
  "ú",
  "ç",
  "Á",
  "À",
  "Â",
  "Ã",
  "É",
  "Ê",
  "Í",
  "Ó",
  "Ô",
  "Õ",
  "Ú",
  "Ç",
] as const;
```

### `src/app/(myapp)/_components/rich-text-editor.tsx`

```tsx
"use client";

import {
  Button,
  IGRPFormField,
  IGRPIcon,
  IGRPLabel,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  useFormField,
} from "@igrp/igrp-framework-react-design-system";
import {
  createRichTextExtensions,
  RICH_TEXT_PROSE_CLASS,
  RICH_TEXT_SPECIAL_CHARS,
  RICH_TEXT_TABLE_CLASS,
  type RichTextPreset,
} from "@myapp/_lib/rich-text-extensions";
import {
  type Editor,
  EditorContent,
  useEditor,
  useEditorState,
} from "@tiptap/react";
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ControllerRenderProps } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { cn } from "@/lib/utils";

/** The shared prose classes plus the editable surface's own box metrics. */
const editorProseClass = cn(
  RICH_TEXT_PROSE_CLASS,
  RICH_TEXT_TABLE_CLASS,
  "min-h-[200px] p-4",
);

/** Content colours offered by the "A" swatch. Document data, not UI chrome. */
const TEXT_COLOURS: { label: string; value: string }[] = [
  { label: "Predefinida", value: "" },
  { label: "Preto", value: "#111827" },
  { label: "Cinzento", value: "#6b7280" },
  { label: "Vermelho", value: "#b91c1c" },
  { label: "Laranja", value: "#c2410c" },
  { label: "Verde", value: "#15803d" },
  { label: "Azul", value: "#1d4ed8" },
  { label: "Roxo", value: "#6d28d9" },
];

const FONT_SIZES = ["12px", "14px", "16px", "18px", "24px", "32px"];

interface SimpleRichTextEditorProps {
  name?: string;
  id?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  labelClassName?: string;
  error?: string;
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  editable?: boolean;
  /**
   * Which toolbar the field shows. `"email"` hides the controls the
   * notification backend strips on render (see `RICH_TEXT_BACKEND_SUPPORT`);
   * `"documento"` is the full set.
   */
  preset?: RichTextPreset;
  /** Clickable tokens inserted at the caret (e.g. `{{nome_titular}}`). */
  variables?: { value: string; label?: string }[];
}

/**
 * Accessibility wiring for the contenteditable node itself.
 *
 * These cannot be left to the surrounding form: `<label for>` only labels form
 * controls, and the id/`aria-*` a form wrapper stamps onto the container `div`
 * are never announced for the inner `role="textbox"`.
 */
type EditorAriaProps = {
  editorId?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaRequired?: boolean;
};

type SimpleRichTextEditorSurfaceProps = {
  value: string;
  onHtmlChange: (html: string) => void;
  onBlur?: () => void;
  placeholder: string;
  editable: boolean;
  className?: string;
  hasError?: boolean;
  preset: RichTextPreset;
  variables?: { value: string; label?: string }[];
} & EditorAriaProps &
  // `onBlur` is declared above as the editor's own `() => void`; keeping the
  // div's `FocusEventHandler` would intersect the two into an uncallable type.
  Omit<ComponentPropsWithoutRef<"div">, "children" | "onBlur">;

const RichTextEditorSurface = forwardRef<
  HTMLDivElement,
  SimpleRichTextEditorSurfaceProps
>(function RichTextEditorSurface(
  {
    value,
    onHtmlChange,
    onBlur,
    placeholder,
    editable,
    className,
    hasError,
    editorId,
    ariaLabel,
    ariaDescribedBy,
    ariaInvalid,
    ariaRequired,
    preset,
    variables,
    ...divProps
  },
  ref,
) {
  // Shared with the read-only `RichTextView`, which leans on this same schema
  // as its allow-list — keep the two on one definition.
  const extensions = useMemo(
    () => createRichTextExtensions(placeholder),
    [placeholder],
  );

  /**
   * TipTap binds the `onUpdate`/`onBlur` it was constructed with once and never
   * re-reads them, so a callback captured on the first render would stick for
   * the editor's whole life. Route both through refs.
   */
  const onHtmlChangeRef = useRef(onHtmlChange);
  onHtmlChangeRef.current = onHtmlChange;
  const onBlurRef = useRef(onBlur);
  onBlurRef.current = onBlur;

  const editorAttributes = useMemo(
    () => ({
      ...(editorId ? { id: editorId } : {}),
      role: "textbox" as const,
      "aria-multiline": "true" as const,
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
      ...(ariaInvalid ? { "aria-invalid": "true" as const } : {}),
      ...(ariaRequired ? { "aria-required": "true" as const } : {}),
      class: editorProseClass,
    }),
    [editorId, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired],
  );

  const editor = useEditor({
    extensions,
    content: value,
    editable,
    // Next.js would infer this anyway, but only after logging a warning on
    // every mount. The editor is client-only by design.
    immediatelyRender: false,
    editorProps: {
      attributes: editorAttributes,
    },
    onUpdate: ({ editor: ed }) => {
      onHtmlChangeRef.current(ed.getHTML());
    },
    onBlur: () => {
      onBlurRef.current?.();
    },
  });

  useEffect(() => {
    if (!editor) return;
    const next = value ?? "";
    const current = editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  /**
   * `useEditor` deliberately re-applies its options with `editable` pinned to
   * the editor's *current* value, so the prop alone never reaches a mounted
   * editor. `emitUpdate: false` because flipping read-only is not a content
   * change — emitting would push an identical value back and dirty the form.
   */
  useEffect(() => {
    if (!editor || editor.isEditable === editable) return;
    editor.setEditable(editable, false);
  }, [editor, editable]);

  const insertVariable = useCallback(
    (token: string) => {
      if (!editor || !editable) return;
      editor.chain().focus().insertContent(token).run();
    },
    [editor, editable],
  );

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-background shadow-sm",
        hasError &&
          "border-destructive focus-within:ring-destructive/20 focus-within:ring-2",
        className,
      )}
      {...divProps}
    >
      {/* Em leitura (mode="view" dos formulários) a barra de formatação não
          tem sobre o que agir — esconde-se, como a paleta de variáveis. */}
      {editable ? <EditorToolbar editor={editor} preset={preset} /> : null}
      <EditorContent editor={editor} />
      {editable && variables && variables.length > 0 ? (
        <div className="flex flex-col gap-2 border-t border-border bg-muted/20 p-2">
          <p className="text-xs text-muted-foreground">
            Clique numa variável para a inserir na posição do cursor.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {variables.map((variable) => (
              <Button
                key={variable.value}
                type="button"
                size="sm"
                variant="outline"
                className="h-7 px-2 font-mono text-xs"
                // Keep selection: avoid blur before insert.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertVariable(variable.value)}
              >
                {variable.label ?? variable.value}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
});

function ToolbarButton({
  pressed,
  onPressedChange,
  disabled,
  children,
  tooltip,
}: {
  pressed?: boolean;
  onPressedChange?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip?: string;
}) {
  const toggle = (
    <Toggle
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      disabled={disabled}
      aria-label={tooltip}
      className="h-8 w-8 p-0"
    >
      {children}
    </Toggle>
  );

  if (!tooltip) {
    return toggle;
  }

  // Disabled controls often don't receive pointer events, so the tooltip never opens.
  // A wrapping span receives hover while the inner toggle stays disabled.
  const triggerChild = disabled ? (
    <span className="inline-flex cursor-not-allowed">{toggle}</span>
  ) : (
    toggle
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{triggerChild}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkPopover({ editor }: { editor: Editor }) {
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState(false);

  const { isActive, href } = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      isActive: ed.isActive("link"),
      href: (ed.getAttributes("link").href as string | undefined) ?? "",
    }),
  });

  const handleOpenChange = useCallback(
    (next: boolean) => {
      // Seed from the link under the caret. Opening on an existing link used to
      // show an empty box, which made "Guardar" look like a no-op while it
      // actually deleted the link.
      if (next) setUrl(href);
      setOpen(next);
    },
    [href],
  );

  const setLink = useCallback(() => {
    const nextHref = url.trim();
    // An empty field is a no-op, never a delete — removal is the explicit
    // "Remover" button below.
    if (!nextHref) {
      setOpen(false);
      return;
    }
    if (editor.state.selection.empty && !isActive) {
      // Nothing selected and no link to extend: inserting the URL as its own
      // linked text beats the silent no-op this used to be.
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: nextHref,
          marks: [{ type: "link", attrs: { href: nextHref } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: nextHref })
        .run();
    }
    setOpen(false);
  }, [editor, url, isActive]);

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setOpen(false);
    setUrl("");
  }, [editor]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={isActive}
              className="h-8 w-8 p-0"
              aria-label="Inserir hiperligação"
            >
              <IGRPIcon iconName="Link" />
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          Inserir hiperligação
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Inserir Enlace</h4>
            <p className="text-sm text-muted-foreground">
              Inserir URL do enlace
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setLink();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={setLink}>
              Aplicar
            </Button>
            {isActive && (
              <Button size="sm" variant="outline" onClick={removeLink}>
                <IGRPIcon iconName="Unlink" className="mr-1" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Shared shell for the icon-plus-popover controls in the toolbar. */
function ToolbarPopover({
  iconName,
  glyph,
  tooltip,
  pressed,
  children,
  className,
}: {
  iconName?: string;
  glyph?: string;
  tooltip: string;
  pressed?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Toggle
              size="sm"
              pressed={pressed}
              className="h-8 w-8 p-0"
              aria-label={tooltip}
            >
              {iconName ? (
                <IGRPIcon iconName={iconName} />
              ) : (
                <span aria-hidden className="text-sm font-medium">
                  {glyph}
                </span>
              )}
            </Toggle>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
      <PopoverContent className={cn("w-64", className)} align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

function TablePopover({
  editor,
  inTable,
}: {
  editor: Editor;
  inTable: boolean;
}) {
  const run = (fn: () => void) => () => fn();
  const actions: { label: string; onClick: () => void; disabled?: boolean }[] =
    [
      {
        label: "Inserir tabela 3×3",
        onClick: run(() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
        ),
      },
      {
        label: "Coluna antes",
        onClick: run(() => editor.chain().focus().addColumnBefore().run()),
        disabled: !inTable,
      },
      {
        label: "Coluna depois",
        onClick: run(() => editor.chain().focus().addColumnAfter().run()),
        disabled: !inTable,
      },
      {
        label: "Eliminar coluna",
        onClick: run(() => editor.chain().focus().deleteColumn().run()),
        disabled: !inTable,
      },
      {
        label: "Linha antes",
        onClick: run(() => editor.chain().focus().addRowBefore().run()),
        disabled: !inTable,
      },
      {
        label: "Linha depois",
        onClick: run(() => editor.chain().focus().addRowAfter().run()),
        disabled: !inTable,
      },
      {
        label: "Eliminar linha",
        onClick: run(() => editor.chain().focus().deleteRow().run()),
        disabled: !inTable,
      },
      {
        label: "Unir / dividir células",
        onClick: run(() => editor.chain().focus().mergeOrSplit().run()),
        disabled: !inTable,
      },
      {
        label: "Eliminar tabela",
        onClick: run(() => editor.chain().focus().deleteTable().run()),
        disabled: !inTable,
      },
    ];

  return (
    <ToolbarPopover iconName="Table" tooltip="Tabela" pressed={inTable}>
      <div className="flex flex-col gap-1">
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            size="sm"
            variant="ghost"
            className="justify-start"
            disabled={action.disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </ToolbarPopover>
  );
}

function SpecialCharPopover({ editor }: { editor: Editor }) {
  return (
    <ToolbarPopover glyph="Ω" tooltip="Carácter especial" className="w-72">
      <div className="grid grid-cols-10 gap-1">
        {RICH_TEXT_SPECIAL_CHARS.map((char) => (
          <Button
            key={char}
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 font-mono text-sm"
            aria-label={char}
            // Keep the caret: the toolbar must not steal focus before insert.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().insertContent(char).run()}
          >
            {char}
          </Button>
        ))}
      </div>
    </ToolbarPopover>
  );
}

function ColourPopover({ editor }: { editor: Editor }) {
  return (
    <ToolbarPopover iconName="Palette" tooltip="Cor do texto">
      <div className="flex flex-col gap-1">
        {TEXT_COLOURS.map((colour) => (
          <Button
            key={colour.label}
            type="button"
            size="sm"
            variant="ghost"
            className="justify-start gap-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() =>
              colour.value
                ? editor.chain().focus().setColor(colour.value).run()
                : editor.chain().focus().unsetColor().run()
            }
          >
            <span
              aria-hidden
              className="size-4 rounded-sm border border-border"
              style={
                colour.value ? { backgroundColor: colour.value } : undefined
              }
            />
            {colour.label}
          </Button>
        ))}
      </div>
    </ToolbarPopover>
  );
}

function FontSizePopover({ editor }: { editor: Editor }) {
  return (
    <ToolbarPopover iconName="Baseline" tooltip="Tamanho do texto">
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="justify-start"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().unsetFontSize().run()}
        >
          Predefinido
        </Button>
        {FONT_SIZES.map((size) => (
          <Button
            key={size}
            type="button"
            size="sm"
            variant="ghost"
            className="justify-start"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setFontSize(size).run()}
          >
            <span style={{ fontSize: size }}>{size}</span>
          </Button>
        ))}
      </div>
    </ToolbarPopover>
  );
}

function EditorToolbar({
  editor,
  preset,
}: {
  editor: Editor | null;
  preset: RichTextPreset;
}) {
  if (!editor) {
    return null;
  }

  // Split so the state hook below only ever sees a live editor; the toolbar
  // mounts and unmounts as a unit with it.
  return <EditorToolbarControls editor={editor} preset={preset} />;
}

function EditorToolbarControls({
  editor,
  preset,
}: {
  editor: Editor;
  preset: RichTextPreset;
}) {
  // Everything the notification backend drops on render. Offering these on an
  // e-mail body would let an author format text that never reaches the reader.
  const rich = preset === "documento";
  /**
   * TipTap v3 does not re-render React on every transaction (v2 did), and it
   * only emits `update` when the *document* changes. Without this subscription
   * the toggles miss every selection-only change — clicking Negrito on an empty
   * selection applied the mark but left the button unpressed, and moving the
   * caret out of bold text left it pressed.
   */
  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      canUndo: ed.can().undo(),
      canRedo: ed.can().redo(),
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      strike: ed.isActive("strike"),
      highlight: ed.isActive("highlight"),
      subscript: ed.isActive("subscript"),
      superscript: ed.isActive("superscript"),
      inTable: ed.isActive("table"),
      canSink: ed.can().sinkListItem("listItem"),
      canLift: ed.can().liftListItem("listItem"),
      h1: ed.isActive("heading", { level: 1 }),
      h2: ed.isActive("heading", { level: 2 }),
      h3: ed.isActive("heading", { level: 3 }),
      bulletList: ed.isActive("bulletList"),
      orderedList: ed.isActive("orderedList"),
      blockquote: ed.isActive("blockquote"),
      alignLeft: ed.isActive({ textAlign: "left" }),
      alignCenter: ed.isActive({ textAlign: "center" }),
      alignRight: ed.isActive({ textAlign: "right" }),
      alignJustify: ed.isActive({ textAlign: "justify" }),
    }),
  });

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
        {/* Undo/Redo */}
        <ToolbarButton
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!state.canUndo}
          tooltip="Desfazer"
        >
          <IGRPIcon iconName="Undo" />
        </ToolbarButton>
        <ToolbarButton
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!state.canRedo}
          tooltip="Refazer"
        >
          <IGRPIcon iconName="Redo" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <ToolbarButton
          pressed={state.bold}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          tooltip="Negrito"
        >
          <IGRPIcon iconName="Bold" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.italic}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          tooltip="Itálico"
        >
          <IGRPIcon iconName="Italic" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.underline}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          tooltip="Sublinhado"
        >
          <IGRPIcon iconName="Underline" />
        </ToolbarButton>
        {rich ? (
          <ToolbarButton
            pressed={state.strike}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            tooltip="Riscado"
          >
            <IGRPIcon iconName="Strikethrough" />
          </ToolbarButton>
        ) : null}
        {rich ? (
          <ToolbarButton
            pressed={state.highlight}
            onPressedChange={() =>
              editor.chain().focus().toggleHighlight().run()
            }
            tooltip="Realce"
          >
            <IGRPIcon iconName="Highlighter" />
          </ToolbarButton>
        ) : null}
        <ToolbarButton
          pressed={state.subscript}
          onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
          tooltip="Subscrito"
        >
          <IGRPIcon iconName="Subscript" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.superscript}
          onPressedChange={() =>
            editor.chain().focus().toggleSuperscript().run()
          }
          tooltip="Sobrescrito"
        >
          <IGRPIcon iconName="Superscript" />
        </ToolbarButton>
        <ToolbarButton
          onPressedChange={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          tooltip="Remover formatação"
        >
          <IGRPIcon iconName="RemoveFormatting" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <ToolbarButton
          pressed={state.h1}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          tooltip="Título 1"
        >
          <IGRPIcon iconName="Heading1" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.h2}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          tooltip="Título 2"
        >
          <IGRPIcon iconName="Heading2" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.h3}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          tooltip="Título 3"
        >
          <IGRPIcon iconName="Heading3" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton
          pressed={state.bulletList}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          tooltip="Lista com marcas"
        >
          <IGRPIcon iconName="List" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.orderedList}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          tooltip="Lista numerada"
        >
          <IGRPIcon iconName="ListOrdered" />
        </ToolbarButton>
        <ToolbarButton
          pressed={state.blockquote}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          tooltip="Citação"
        >
          <IGRPIcon iconName="Quote" />
        </ToolbarButton>
        <ToolbarButton
          onPressedChange={() =>
            editor.chain().focus().sinkListItem("listItem").run()
          }
          disabled={!state.canSink}
          tooltip="Aumentar avanço"
        >
          <IGRPIcon iconName="ListIndentIncrease" />
        </ToolbarButton>
        <ToolbarButton
          onPressedChange={() =>
            editor.chain().focus().liftListItem("listItem").run()
          }
          disabled={!state.canLift}
          tooltip="Diminuir avanço"
        >
          <IGRPIcon iconName="ListIndentDecrease" />
        </ToolbarButton>
        {rich ? (
          <ToolbarButton
            onPressedChange={() =>
              editor.chain().focus().setHorizontalRule().run()
            }
            tooltip="Linha horizontal"
          >
            <IGRPIcon iconName="Minus" />
          </ToolbarButton>
        ) : null}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text alignment — style-based, so the e-mail backend drops it */}
        {rich ? (
          <>
            <ToolbarButton
              pressed={state.alignLeft}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("left").run()
              }
              tooltip="Alinhar à esquerda"
            >
              <IGRPIcon iconName="TextAlignStart" />
            </ToolbarButton>
            <ToolbarButton
              pressed={state.alignCenter}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              tooltip="Alinhar ao centro"
            >
              <IGRPIcon iconName="TextAlignCenter" />
            </ToolbarButton>
            <ToolbarButton
              pressed={state.alignRight}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("right").run()
              }
              tooltip="Alinhar à direita"
            >
              <IGRPIcon iconName="TextAlignEnd" />
            </ToolbarButton>
            <ToolbarButton
              pressed={state.alignJustify}
              onPressedChange={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              tooltip="Justificar"
            >
              <IGRPIcon iconName="TextAlignJustify" />
            </ToolbarButton>
            <Separator orientation="vertical" className="mx-1 h-6" />
          </>
        ) : null}

        {/* Link, table, symbols */}
        <LinkPopover editor={editor} />
        <TablePopover editor={editor} inTable={state.inTable} />
        <SpecialCharPopover editor={editor} />
        {rich ? <ColourPopover editor={editor} /> : null}
        {rich ? <FontSizePopover editor={editor} /> : null}
      </div>
    </TooltipProvider>
  );
}

type FormBoundSurfaceProps = {
  field: ControllerRenderProps;
  label?: string;
  required?: boolean;
  placeholder: string;
  editable: boolean;
  className?: string;
  hasError: boolean;
  preset: RichTextPreset;
  variables?: { value: string; label?: string }[];
} & Omit<ComponentPropsWithoutRef<"div">, "children" | "onBlur">;

/**
 * The `IGRPFormField` branch. Split into its own component so it can call
 * `useFormField()` — only valid inside the field's own context — and so the
 * `id`/`aria-*` that `FormControl` clones onto its child still land on the
 * container `div`, which is what `IGRPFormField`'s `<label for>` targets.
 */
const FormBoundRichTextEditorSurface = forwardRef<
  HTMLDivElement,
  FormBoundSurfaceProps
>(function FormBoundRichTextEditorSurface(
  {
    field,
    label,
    required,
    placeholder,
    editable,
    className,
    hasError,
    preset,
    variables,
    ...divProps
  },
  ref,
) {
  const { formDescriptionId, formMessageId, error } = useFormField();

  return (
    <RichTextEditorSurface
      ref={ref}
      // The Placeholder extension reads its text once, at schema build time, so
      // a changed placeholder only takes effect on a fresh editor.
      key={placeholder}
      value={field.value ?? ""}
      onHtmlChange={field.onChange}
      onBlur={field.onBlur}
      placeholder={placeholder}
      editable={editable}
      className={className}
      hasError={hasError}
      // `<label for>` cannot name a contenteditable and the wrapper div's
      // `aria-*` are not announced for the inner textbox — mirror both here or
      // the field is an unnamed textbox with no error association.
      ariaLabel={label}
      ariaDescribedBy={
        error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId
      }
      ariaInvalid={hasError}
      ariaRequired={required}
      preset={preset}
      variables={variables}
      {...divProps}
    />
  );
});

function SimpleRichTextEditor({
  name,
  id,
  label,
  helperText,
  required,
  labelClassName,
  error,
  content = "",
  onChange,
  placeholder = "Começe a escrever aqui...",
  className,
  editorClassName,
  editable = true,
  preset = "documento",
  variables,
}: SimpleRichTextEditorProps) {
  const _id = useId();
  const fieldName = name ?? id ?? _id;
  const formContext = useFormContext();

  if (formContext) {
    return (
      <IGRPFormField
        name={fieldName}
        label={label}
        helperText={helperText}
        className={className}
        required={required}
        control={
          formContext.control as unknown as ComponentProps<
            typeof IGRPFormField
          >["control"]
        }
      >
        {(field, fieldState) => (
          <FormBoundRichTextEditorSurface
            field={field}
            label={label}
            required={required}
            placeholder={placeholder}
            editable={editable}
            className={editorClassName}
            hasError={!!fieldState.error || !!error}
            preset={preset}
            variables={variables}
          />
        )}
      </IGRPFormField>
    );
  }

  const ariaDescribedBy =
    [
      helperText ? `${fieldName}-helper` : null,
      error ? `${fieldName}-error` : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="*:not-first:mt-2">
      {label ? (
        <IGRPLabel
          label={label}
          className={labelClassName}
          required={required}
          id={fieldName}
        />
      ) : null}

      <RichTextEditorSurface
        key={placeholder}
        value={content}
        onHtmlChange={(html) => onChange?.(html)}
        placeholder={placeholder}
        editable={editable}
        className={className}
        hasError={!!error}
        editorId={fieldName}
        ariaLabel={label}
        ariaDescribedBy={ariaDescribedBy}
        ariaInvalid={!!error}
        ariaRequired={required}
        preset={preset}
        variables={variables}
      />

      {helperText && !error ? (
        <p
          id={`${fieldName}-helper`}
          className={cn("text-muted-foreground mt-2 text-xs")}
          aria-live="polite"
        >
          {helperText}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${fieldName}-error`}
          className={cn("text-destructive mt-2 text-xs")}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

export {
  type Editor,
  SimpleRichTextEditor,
  type SimpleRichTextEditorProps,
  useEditor,
};
```
