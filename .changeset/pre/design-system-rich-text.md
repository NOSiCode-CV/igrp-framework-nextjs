---
'@igrp/igrp-framework-react-design-system': patch
---

Add `IGRPRichTextEditor` and `IGRPRichTextView`, exported from a new
`@igrp/igrp-framework-react-design-system/rich-text` entry (consumer requests
§9 and §10). They are not in the root entry, so an app that never imports
`/rich-text` never bundles TipTap. See
`packages/design-system/docs/adr/0003-rich-text-subpath-single-schema.md`.

- **One schema for both.** The editor writes, and the view renders, only what
  a single DS-owned TipTap schema declares, so the two cannot disagree. The
  view re-parses stored HTML through that schema instead of using
  `dangerouslySetInnerHTML`: `<script>`, `<iframe>`, `<img onerror>`, inline
  handlers and `javascript:` links never reach the DOM. It protects the DOM
  only. It is not a sanitiser, and the stored HTML is unchanged.
- **Editor.** Form-bound inside `IGRPForm` by `name` (dirty on edit, touched
  on blur, Zod error under the field), or controlled with `value` /
  `onChange`. An empty body is `""`, so `required` rules fail. The
  contenteditable itself carries `role="textbox"`, the label,
  `aria-describedby`, `aria-invalid` and `aria-required`. `readOnly` and
  `disabled` hide the toolbar and template variables without dirtying the
  form. Pick the toolbar with `preset` (`"full"` default, or `"email"`, which
  drops every control a strict e-mail allow-list strips: strike, highlight,
  rule, alignment, colour, font size) or an explicit `controls` list, never
  both. Template `variables` insert `{{…}}` tokens at the caret. `colors` and
  `fontSizes` override the pickers. Deliberately no images and no raw-HTML
  view.
- **View.** Blank HTML renders `emptyLabel` (default `"—"`) without mounting
  an editor. `maxHeight` clips a long body with a "Ver mais" / "Ver menos"
  toggle, which also expands when keyboard focus moves into the clipped part.
- All strings come from a new `richText` i18n group with pt-PT defaults.
- Typography (headings, lists, blockquote, links, tables, highlight) is
  built from the DS's own token classes. It needs no Tailwind plugin and no
  app setup beyond the existing `@source` over the package's `dist`, and dark
  mode follows `.dark`.
- TipTap 3.31.3 is pinned as a regular dependency.
