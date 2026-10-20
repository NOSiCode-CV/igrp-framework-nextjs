---
"@igrp/igrp-framework-react-design-system": patch
---

fix(form-list): stop `IGRPFormList` from seeding two rows instead of one

`IGRPFormList` in form mode seeds one row when the array is empty and `allowEmpty` is
off. The guard read the `fields` snapshot closed over by its own render, and `fields` is
React state that lags the underlying array — so any second invocation of the effect
against that same snapshot (React StrictMode's dev double-invoke, or a re-run before the
field-array state flushed) still saw an empty list and appended a duplicate. Consumers
saw two rows where exactly one was expected. The guard now reads the live form value,
which reflects the append immediately.

`IGRPForm` also no longer re-applies `defaultValues` that `useForm` already consumed on
the first render. That mount-time `reset()` ran after child effects and wiped the row
`IGRPFormList` had just seeded, leaving a list that rendered zero rows and never
re-seeded. `isDirty` is now read during render so its subscription is registered on every
run, not only on the runs that reach the guard.
