---
'@igrp/igrp-framework-react-design-system': patch
---

Accessibility fixes (WCAG 2.1 AA):

- `IGRPMenubarTrigger` now shows a focus-visible ring.
- Rich-text toolbar: one-shot actions (undo, redo, clear formatting, indent, outdent, horizontal rule) and the text colour, font size and special character popover triggers are plain buttons, so they no longer announce a pressed state. Bold, italic, link, table and the other formatting controls stay toggles.
- `IGRPServerDataTable` keeps its loading status region mounted, so the loading text is announced, and puts `aria-busy` on the table.
- `IGRPPdfViewer`: load errors are alerts, loading uses an always-mounted status region, the modal description no longer nests `div`s in a `p`, and a new `headingLevel` prop (default `h3`) sets the inline title's heading element. The title looks the same as before.
