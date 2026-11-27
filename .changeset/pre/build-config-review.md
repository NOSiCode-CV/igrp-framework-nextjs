---
"@igrp/framework-next": patch
"@igrp/framework-next-ui": patch
"@igrp/framework-next-auth": patch
"@igrp/igrp-framework-react-design-system": patch
"@igrp/template-migrator": patch
---

Package and build fixes from a review of each package's build:

- `@igrp/framework-next`: `next-intl` is now a peer dependency (`^4.16.1`), not a pinned dependency. The root layout mounts next-intl's provider and the app calls its hooks, so both must use one copy; a version mismatch used to install two and lose the context. Apps already depend on `next-intl`.
- `@igrp/framework-next-ui`: `lucide-react` is now a peer dependency, as in the design system. The unused `clsx` and `class-variance-authority` dependencies are removed.
- `@igrp/framework-next-auth`: every `exports` entry has a `default` condition, so resolvers without the `import` condition (`require()` of ESM, CommonJS test runners) find it.
- `@igrp/igrp-framework-react-design-system`, `@igrp/framework-next-ui`, `@igrp/framework-next`: no `.d.ts.map` files in the package. They pointed at `src/`, which is not published.
- `@igrp/template-migrator`: the build clears `dist/` first, so files from older builds are no longer published. `yaml` moves to `devDependencies`: only the build scripts use it.
