---
"@igrp/igrp-framework-react-design-system": patch
---

Rich text: stored or pasted links can no longer set their own `class`, `rel` or `target`. `IGRPRichTextView` and `IGRPRichTextEditor` now always render links with `target="_blank"` and `rel="noopener noreferrer nofollow"` and drop any `class`, so stored HTML can't lay an invisible full-page link over the app. Links made with the editor are unchanged. `IGRPRichTextView`'s empty check also no longer freezes on a body made of many unclosed `<` characters.
