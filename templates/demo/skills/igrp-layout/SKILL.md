---
name: igrp-layout
description: >-
  Create page layouts with IGRP Design System using IGRPContainer, IGRPPageHeader,
  IGRPPageFooter, IGRPSidebar. Use when the user asks for page layout, header,
  footer, sidebar, or container. Always prefer IGRP layout components when
  working in templates/demo or with @igrp/igrp-framework-react-design-system.
---

# IGRP Layout Skill

Build page layouts with the IGRP Design System.

## Quick Start

```tsx
import {
  IGRPContainer,
  IGRPPageHeader,
  IGRPPageHeaderBackButton,
  IGRPPageFooter,
  IGRPSidebarProvider,
  IGRPSidebar,
  IGRPSidebarContent,
  IGRPSidebarInset,
} from '@igrp/igrp-framework-react-design-system';

// Simple page
<IGRPContainer>
  <IGRPPageHeader title="Page Title" description="Description" />
  <main>Content</main>
  <IGRPPageFooter />
</IGRPContainer>

// With sidebar
<IGRPSidebarProvider>
  <IGRPSidebar>...</IGRPSidebar>
  <IGRPSidebarInset>
    <IGRPPageHeader title="Title" />
    <main>Content</main>
  </IGRPSidebarInset>
</IGRPSidebarProvider>
```

## References

- [container.md](references/container.md) – IGRPContainer
- [page-header.md](references/page-header.md) – Page header, back button
- [page-footer.md](references/page-footer.md) – Page footer
- [sidebar.md](references/sidebar.md) – Sidebar layout
