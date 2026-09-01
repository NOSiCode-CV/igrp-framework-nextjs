# Framework dependency order

```
framework-next-auth → framework-next-types → design-system → framework-next-ui → framework-next
```

- `pnpm build:framework` runs packages in exactly this order. **Don't reorder** — `next-ui` imports from the DS and auth; `next` imports from `next-ui` / `next-auth` / `next-types`.
- `framework-next-auth` is the **root** — changes here cascade downstream to every other framework package.
- `framework-next` is the **top** — changes only affect templates/apps, no other framework package.
- After any public-API change to a framework package, run `pnpm build:framework` before consuming downstream.
