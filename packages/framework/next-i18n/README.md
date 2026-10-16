# @igrp/framework-next-i18n

Catalog and literal-string checks for IGRP Next.js apps, as the `igrp-i18n` CLI and as functions.

```
igrp-i18n <command>

  check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors]
      Orphan keys, non-string values, invalid ICU, argument mismatches, camelCase segments.
  check-literals <path...>
      Hardcoded user-facing strings in non-test .tsx files; next-intl formatter imports.
```

Run from an app as `pnpm igrp-i18n check-catalogs src/i18n/messages --default pt && pnpm igrp-i18n check-literals src/components src/i18n` (`templates/demo-v1`'s `lint:i18n` also checks `src/app/(igrp)/page.tsx`); add folders as they are migrated. Framework catalogs are TypeScript modules in `@igrp/framework-next/i18n/messages` and are not checked here.

Both commands are also exported for programmatic use in Vitest: `checkCatalogs(options)` returns `{ errors, info, coverage }`, `checkLiterals(paths)` returns one `file:line: finding` string per hardcoded string, and `findLiteralStrings(source)` checks a single source string.
