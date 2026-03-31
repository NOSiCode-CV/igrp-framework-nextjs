# IGRP Template — Copilot Instructions

This is a Next.js 15 app using `@igrp/igrp-framework-react-design-system` as the **only UI library**.

## Primary Rule: Design System First

**Always use `@igrp/igrp-framework-react-design-system` for all UI.** Never use raw HTML elements, Tailwind-only divs, or other UI libraries (shadcn, MUI, Radix directly, etc.) for UI components.

### Component Priority

1. **Horizon components** first: `IGRPButton`, `IGRPInputText`, `IGRPCard`, `IGRPForm`, `IGRPDataTable`, `IGRPModalDialog`, etc.
2. **UI** only for custom composition: `Button`, `Card`, `Input`, etc. (no IGRP prefix)
3. **Custom domain**: `IGRPStatsCard`, `IGRPUserAvatar`, `IGRPStatusBanner`, etc.

### Component Selection Quick Reference

| Need | Component |
| ------ | ----------- |
| Button | `IGRPButton` |
| Text input | `IGRPInputText` |
| Select | `IGRPSelect` |
| Checkbox | `IGRPCheckbox` |
| Switch | `IGRPSwitch` |
| Date picker | `IGRPDatePickerSingle` / `IGRPDatePickerRange` |
| Textarea | `IGRPTextarea` |
| Form | `IGRPForm` + Zod schema + `IGRPFormField` |
| Table | `IGRPDataTable` (TanStack columns) |
| Card | `IGRPCard` + `IGRPCardHeader` + `IGRPCardContent` |
| Modal | `IGRPModalDialog` |
| Alert/confirm | `IGRPAlertDialog` |
| Tabs | `IGRPTabs` |
| Charts | `IGRPAreaChart`, `IGRPLineChart`, `IGRPVerticalBarChart`, `IGRPPieChart` |
| Toast | `IGRPToaster` + `useIGRPToast` |
| Alert | `IGRPAlert` |
| Badge | `IGRPBadge` |
| Avatar | `IGRPAvatar` |
| Icon | `IGRPIcon` (Lucide names) |
| Stats | `IGRPStatsCard`, `IGRPStatsCardMini` |
| Page layout | `IGRPPageHeader` + `IGRPContainer` + `IGRPPageFooter` |
| Sidebar | `IGRPSidebarProvider` + `IGRPSidebar` |

## Critical Rules

### Forms — always use IGRPForm + Zod

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

## Reference Files

- `DESIGN_SYSTEM.md` — full component catalog
- `skills/igrp-design-system/SKILL.md` — master skill with patterns and rules
- `skills/igrp-design-system/references/` — deep API docs per category
- `skills/igrp-design-system/rules/` — styling, forms, composition rules
