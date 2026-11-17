# Known issues — @igrp/framework-next-ui

Each entry has a matching `it.fails` test. When the fix lands that test starts failing: flip it to `it` and delete the entry.

## Sidebar never highlights some menu items

`matchesPathname` in `src/templates/menus/utils.ts` compares `usePathname()` against the item's resolved href as is:

- **Query string in `url`.** An item with `url: '/users?tab=1'` is never active on `/users`, because `usePathname()` never carries a query.
- **Trailing slash in `pageSlug`.** An item with `pageSlug: 'users/'` resolves to `/users/` and is never active on `/users`.

Fix: strip the query and hash and any trailing slash from the href before comparing. Tests: `src/templates/menus/__tests__/menu-utils.test.ts`.

## Branding validators throw on non-strings

`isSafeCssValue` and `isSafeLogoUrl` (`src/branding/validate.ts`, exported from the package root) call `.trim()` / `.length` on their argument, so `null` or a number throws a `TypeError` instead of returning `false`. `igrpParseBranding` checks types first, so only JavaScript callers using the validators directly are affected.

Fix: `if (typeof value !== 'string') return false;` at the top of each. Tests: `src/branding/__tests__/branding-validate.test.ts`.
