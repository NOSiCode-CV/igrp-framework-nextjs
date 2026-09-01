# UI rules (design system consumers + templates)

- All UI comes from `@igrp/igrp-framework-react-design-system`. Horizon (`IGRP*`) first; Primitives only when Horizon doesn't fit; never other UI libraries.
- Forms are **always** `IGRPForm` + Zod. Never raw `<form>` or direct `react-hook-form`.
- Only **semantic tokens** (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, …). Never raw Tailwind colors (`bg-blue-500`).
- No manual `dark:` overrides — tokens handle dark mode.
- `cn()` for class merging (imported from the DS).
- `size-*` when width equals height (`size-10`, not `w-10 h-10`).
- `flex gap-*` for spacing, not `space-x-*` / `space-y-*`.
- Every file importing from the DS needs `'use client'`.
