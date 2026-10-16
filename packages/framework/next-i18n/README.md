# @igrp/framework-next-i18n

Catalog and literal-string checks for IGRP Next.js apps, as the `igrp-i18n` CLI and as functions.

## Requirements

- **Node.js** ≥ 22

## Installation

```bash
pnpm add -D @igrp/framework-next-i18n
```

```
igrp-i18n <command>

  check-catalogs <dir> --default <locale> [--framework-namespaces common,i18n,errors]
      Orphan keys, non-string values, invalid ICU, argument mismatches, camelCase segments.
  check-literals <path...>
      Hardcoded user-facing strings in non-test .tsx files; next-intl formatter imports.
```

Run from an app as `pnpm igrp-i18n check-catalogs src/i18n/messages --default pt && pnpm igrp-i18n check-literals src/components src/i18n` (`templates/demo-v1`'s `lint:i18n` also checks `src/app/(igrp)/page.tsx`); add folders as they are migrated. Framework catalogs are TypeScript modules in `@igrp/framework-next/i18n/messages` and are not checked here.

`<dir>` holds one `<locale>.json` per locale; `<locale>.json` for `--default` is the complete catalog the others are checked against. Keys under `--framework-namespaces` (default `common,i18n,errors`) are reported as info, not errors.

| Exit code | Meaning                                           |
| --------- | ------------------------------------------------- |
| `0`       | No errors                                         |
| `1`       | Errors / hardcoded strings found                  |
| `2`       | Unknown command or missing arguments (prints usage) |

Both commands are also exported for programmatic use in Vitest:

| Function                                                  | Returns                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `checkCatalogs({ dir, defaultLocale, frameworkNamespaces? })` | `CatalogReport` — `{ errors, info, coverage }`; `coverage` is the % of default-catalog keys present per locale |
| `checkLiterals(paths, cwd?)`                              | One `file:line: finding` string per hardcoded string                          |
| `findLiteralStrings(source, fileName?)`                   | The same findings for a single source string                                  |

## License

MIT © IGRP Labs
