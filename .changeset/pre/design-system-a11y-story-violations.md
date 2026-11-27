---
"@igrp/igrp-framework-react-design-system": patch
---

Accessibility fixes found by the Storybook a11y checks:

- `IGRPInputColor`: the format menu button's name includes the visible format ("Formato da cor: HEX"), so speech users can say what they see.
- `IGRPRadioGroup` with `variant="card"`: each radio is named by its option title and described by its description. The wrapping label did not name the `role="radio"` button. On the selected card the description is darker: muted text on the selected tint was 4.48:1, under the 4.5:1 minimum.
- `IGRPRichTextView`: the read-only body has `role="document"` instead of TipTap's default `role="textbox"`, which announced it as an unnamed text field.
