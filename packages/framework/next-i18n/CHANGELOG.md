# @igrp/framework-next-i18n

## 0.2.0-beta.5

### Patch Changes

- 9880ce4: `@igrp/framework-next` now depends on `next-intl` 4.16.1, and pins `@igrp/platform-access-management-client-ts` and `server-only` to exact versions. `@igrp/framework-next-i18n` now depends on `@formatjs/icu-messageformat-parser` 3.5.23.
- c5939b7: `check-literals` no longer flags an HTML entity in a quoted prop (`title="&mdash;"`), which JSX decodes as it does in JSX text. Inside `{"…"}` the entity stays visible and is still flagged.

## 0.2.0-beta.4

### Patch Changes

- 6271fe4: The build writes `dist/cli.js` and `dist/index.js` again, the files `bin`, `main` and `exports` point at. Since the switch to tsdown it wrote `.mjs`, so the `igrp-i18n` command, the template's `lint:i18n` (and with it `build`), and the root `lint:i18n:framework` failed with "Cannot find module".

## 0.2.0-beta.3

### Minor Changes

- 1c9b4a1: check-catalogs fails on keys missing from a non-default locale; pass --allow-missing to keep the old coverage-only behaviour.

## 0.2.0-beta.2

### Patch Changes

- c777ad9: `igrp-i18n` flags literals inside ternaries, `&&`, `||` and `??`, the `text`, `message` and `emptyText` props, and hardcoded `Intl` and `toLocale*` locales, and it scans `.ts` files. It rejects unknown flags, accepts `--name=value`, and reports unreadable catalogs as errors. Catalogs now flag empty translations and plural categories the locale never selects.
- e9bcc9f: `check-literals` skips a literal when a comment containing `igrp-i18n-ignore` sits on its line or the line above, for text that is not language (brand names, keyboard shortcuts, units).

## 0.2.0-beta.1

### Patch Changes

- 7b5f04d: New dev-only package: the `igrp-i18n` CLI with `check-catalogs` (orphan keys, invalid ICU, argument parity, camelCase segments, coverage, framework-namespace shadowing as info) and `check-literals` (hardcoded user-facing strings in `.tsx`, next-intl formatter imports).
