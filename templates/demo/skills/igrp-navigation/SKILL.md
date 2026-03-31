---
name: igrp-navigation
description: >-
  Create navigation with IGRP Design System using IGRPMenuNavigation,
  IGRPDropdownMenu, IGRPTabs. Use when the user asks for menus, dropdowns,
  tabs, or navigation. Always prefer IGRP navigation components when working
  in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Navigation Skill

Build navigation with the IGRP Design System.

## Quick Start

```tsx
import {
  IGRPMenuNavigation,
  IGRPMenuNavigationProvider,
  IGRPDropdownMenu,
  IGRPDropdownMenuTrigger,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuItem,
  IGRPTabs,
} from '@igrp/igrp-framework-react-design-system';

// Tabs
<IGRPTabs tabs={[{ id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> }]} />

// Dropdown
<IGRPDropdownMenu>
  <IGRPDropdownMenuTrigger asChild>
    <IGRPButton>Menu</IGRPButton>
  </IGRPDropdownMenuTrigger>
  <IGRPDropdownMenuContent>
    <IGRPDropdownMenuItem>Item 1</IGRPDropdownMenuItem>
    <IGRPDropdownMenuItem>Item 2</IGRPDropdownMenuItem>
  </IGRPDropdownMenuContent>
</IGRPDropdownMenu>
```

## References

- [menu-navigation.md](references/menu-navigation.md) – IGRPMenuNavigation
- [dropdown-menu.md](references/dropdown-menu.md) – IGRPDropdownMenu
- [tabs.md](references/tabs.md) – IGRPTabs
