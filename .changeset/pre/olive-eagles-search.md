---
"@igrp/igrp-framework-react-design-system": patch
---

Unblock the Storybook snapshot runner and refresh the baselines.

`@storybook/test-runner` (0.24.5, the latest release, whose peer range claims `^10.6.0-0`) could not run against `storybook@10.6.0`: `getTestRunnerConfig()` loads `.storybook/test-runner.ts` through Storybook's `serverRequire` → `importModule`, which unconditionally calls `module.register()` to install a TypeScript loader hook. Jest 30 rejects that, so all 78 suites failed during setup and **zero** tests executed — the visual suite had been silently dead.

`patches/storybook@10.6.0.patch` wraps that single `register()` call in a try/catch. The dynamic import immediately below is then transformed by the host runtime (Jest's own pipeline) instead, which handles the TypeScript config fine. Pinned via `patchedDependencies` in `pnpm-workspace.yaml`. Remove the patch once the incompatibility is fixed upstream.

With the runner working, 483 tests now execute (481 pass) and the 402 snapshots have been regenerated against the current design system. Also removed the orphaned `NumberInput.stories.tsx.snap` (its story was renamed to `number-input.stories.tsx`, so the baseline had been stranded and its replacement never captured).

Two failures remain, both pre-existing and unrelated to the design system — verified by rebuilding the affected component from `HEAD` and reproducing them:

- `Components/Icons › IconGallery › smoke-test` — exceeds the runner's 15s per-test timeout while rendering the full lucide gallery (~23s).
- `Components/Input/DatePicker/Single › DatePickerErrorA11y › play-test` — queries the trigger by `name: /pick a date/i`, but `FormLabel htmlFor` + `FormControl id` make the accessible name the field label ("Date of Birth"). A `<button>` is a labelable element, so the label wins over the contents in the accname algorithm. Either the query or the labelling needs to change.
