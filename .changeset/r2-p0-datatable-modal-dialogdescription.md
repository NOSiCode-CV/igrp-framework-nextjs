---
"@igrp/igrp-framework-react-design-system": patch
---

`IGRPDataTableButtonModal` no longer hosts its body inside
`<DialogDescription asChild>`. That cloned arbitrary content (typically a whole
form) onto Radix's `Slot`, which announced the entire subtree as the dialog's
`aria-describedby` description and threw `React.Children.only` for any
multi-root `render()`. The body now renders in a plain `<div>`, with a separate
short visually-hidden `DialogDescription` satisfying the `aria-describedby`
contract. `DialogTitle` is unchanged.
