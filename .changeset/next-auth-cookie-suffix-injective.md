---
'@igrp/framework-next-auth': patch
---

Make `basePathCookieSuffix` injective, so two co-hosted apps can never share a
session-cookie name.

The `~` terminator makes the suffix set prefix-free. That is a different
property from collision-free, and the slug transform was many-to-one: it folds
every non-alphanumeric run to `-` and lowercases. So distinct basePaths produced
the **identical** suffix:

```
/apps/a-b        -> .apps-a-b~        ┐ same cookie name
/apps/a/b        -> .apps-a-b~        ┘
/apps/hr-admin, /apps/hr_admin, /apps/hr.admin  -> .apps-hr-admin~
/apps/hr, /apps/HR                              -> .apps-hr~
```

Two apps that collide get exactly the interference this module exists to
prevent — same cookie name, same path, same host — so one decodes the other's
token (wrong audience, wrong roles) and `SessionStore#clean()` deletes the
other's session on sign-out.

A basePath whose slug is ambiguous now carries a short hash of the original
path: `/apps/a-b` -> `.apps-a-b.9f2b1c04~`. The separator is `.`, which the slug
can never contain, so the hashed and unhashed classes stay disjoint and the
suffix set stays prefix-free.

⚠️ **No cookie rename for ordinary deployments.** The hash is added only when
slugging is actually lossy. A basePath of lowercase alphanumeric segments —
`/apps/template`, `/apps/hr`, `/apps/a/b` — is reversible and keeps the exact
name it has today, so no user is signed out and no second cookie is orphaned.
A basePath containing uppercase, `_`, `.` or a literal `-` does change name
once, and those users sign in again.
