# IGRP Template — Copilot Instructions

This is a Next.js 15 app using `@igrp/igrp-framework-react-design-system` as the **only UI library**.

## Primary Rule: Design System First

**Always use `@igrp/igrp-framework-react-design-system` for all UI.** Never use raw HTML elements, Tailwind-only divs, or other UI libraries (shadcn, MUI, Radix directly, etc.) for UI components.

## Before writing any UI

Read `skills/igrp-design-system/SKILL.md`. It is the single source of truth for:

- Which component to use for each UI need (full selection table)
- Critical rules for forms, styling, and composition
- Key code patterns
- Links to per-component deep-dive docs in `skills/igrp-design-system/components/`

Follow the links in `SKILL.md` to load only the component docs relevant to your task.

## Component Priority

1. **Horizon components** first: `IGRPButton`, `IGRPInputText`, `IGRPCard`, `IGRPForm`, `IGRPDataTable`, `IGRPModalDialog`, etc.
2. **UI** only for custom composition: `Button`, `Card`, `Input`, etc. (no IGRP prefix)
3. **Custom domain**: `IGRPStatsCard`, `IGRPUserAvatar`, `IGRPStatusBanner`, etc.

## Critical Rules

### Forms — always IGRPForm + Zod

```tsx
import { z } from 'zod';
import { useRef } from 'react';
import { IGRPForm, IGRPInputText, IGRPButton, type IGRPFormHandle } from '@igrp/igrp-framework-react-design-system';

const schema = z.object({ name: z.string().min(1) });
const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null);

<IGRPForm schema={schema} formRef={formRef} onSubmit={async (v) => {}}>
  <IGRPInputText name="name" label="Name" required />
  <IGRPButton type="submit">Save</IGRPButton>
</IGRPForm>
```

### Styling

- Use `cn()` from `@igrp/igrp-framework-react-design-system` for class merging.
- **Semantic tokens only**: `bg-background`, `text-foreground`, `text-muted-foreground` — not `bg-white`, `text-gray-900`.
- **`flex gap-*`** for spacing — not `space-x-*` or `space-y-*`.
- No manual `dark:` overrides — tokens handle dark mode automatically.

### Client components

All design system components are client-side. Add `'use client'` to any file that imports them.

## Skills folder

```
skills/igrp-design-system/
├── SKILL.md          ← read this first
├── rules/            ← forms, styling, composition
├── references/       ← overview, theming, types, utilities
└── components/       ← per-area deep API docs (load on demand)
```
