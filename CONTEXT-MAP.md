# Context Map

## Contexts

- [Design System](./packages/design-system/CONTEXT.md): Horizon fields, their values and how they bind to `IGRPForm`
- [Framework Runtime](./packages/framework/CONTEXT.md): what every generated app shares at request time — locales, catalogs, chrome

## Relationships

- **Framework Runtime → Design System**: the runtime picks the locale and hands the design system its catalog and format locale; the design system never resolves a locale itself
