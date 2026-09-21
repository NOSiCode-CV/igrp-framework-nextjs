# Reference assets — NOT published

`package.json` sets `files: ["dist"]`, so nothing in this directory ships with
the package. These files exist so a consuming app can copy them into its own
`public/`, which is where the framework expects to find them at runtime:

| File               | Used by                            | Override            |
| ------------------ | ---------------------------------- | ------------------- |
| `logo-no-text.png` | `IGRPTemplateHeader` logo fallback | `fallbackLogo` prop |

`IGRPGlobalError` expects `/error-img.webp` on the same terms; it is not
mirrored here because the template already owns a branded one.

Do not add `public` to `files` — the framework resolves these by URL from the
app's own origin, not from the package, so publishing them would ship bytes no
consumer can reach.
