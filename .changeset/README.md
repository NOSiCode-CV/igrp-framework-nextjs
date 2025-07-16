# Changesets

# How to use 

# 📦 Versioning & Publishing with Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for consistent versioning, changelogs, and publishing to npm.

## 🧱 Folder Structure

```
packages/
  framework/
    next/         → @igrp/framework-next
    next-ui/      → @igrp/framework-next-ui
    next-types/   → @igrp/framework-next-types
apps/
  ...
```

All framework packages are versioned together using Changesets **fixed versioning**.

## 🚀 Setup Instructions

### 1. Install Changesets

```bash
pnpm add -D @changesets/cli
npx changeset init
```

This creates:
- `.changeset/` folder
- `.changeset/config.json`

### 2. Configure Fixed Versioning

Update `.changeset/config.json` like this:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [
    [
      "@igrp/framework-next",
      "@igrp/framework-next-ui",
      "@igrp/framework-next-types"
    ]
  ],
  "linked": [],
  "access": "public",
  "baseBranch": "dev",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

## 🔁 How to Release

### 1. Create a changeset

```bash
npx changeset
```

- Select changed packages
- Choose bump type: `patch`, `minor`, or `major`
- Write a changelog message

This creates a file in `.changeset/*.md`

### 2. Apply version changes

```bash
npx changeset version
```

This:
- Bumps the version in `package.json`
- Updates internal dependency versions
- Adds to `CHANGELOG.md`

### 3. Publish

```bash
npx changeset publish
```

This publishes all changed packages to npm.

## 🔬 Prerelease: `0.0.0-alpha.x`

If you're publishing prereleases (e.g., for internal testing):

### 1. Set all packages to `0.0.0`

```json
// in each package.json
"version": "0.0.0"
```

### 2. Enter pre mode

```bash
npx changeset pre enter alpha
```

### 3. Create patch changeset

```bash
npx changeset
```

- Choose `patch`
- Add a small message (e.g., `start alpha cycle`)

### 4. Apply version

```bash
npx changeset version
```

➡️ This creates `0.0.0-alpha.0`, `alpha.1`, etc.

### 5. Publish

```bash
npx changeset publish
```

Install it in consumers with:

```bash
pnpm add @igrp/framework-next@alpha
```

### 6. Exit prerelease mode (optional)

```bash
npx changeset pre exit
```

This reverts back to stable version bumps.

## 🧹 Troubleshooting

- **Getting `0.0.1-alpha.0` instead of `0.0.0-alpha.1`?**
  - Make sure you selected `patch`, not `minor`
  - Set `version: 0.0.0` in all `package.json`s **before** `pre enter`

- **Getting `Cannot read properties of undefined (reading 'push')`?**
  - Ensure all `.changeset/*.md` files have a non-empty changelog section

## 📎 Helpful Commands

| Task | Command |
|------|---------|
| Start a release | `npx changeset` |
| Apply version changes | `npx changeset version` |
| Publish | `npx changeset publish` |
| Enter prerelease mode | `npx changeset pre enter alpha` |
| Exit prerelease mode | `npx changeset pre exit` |

## 🧠 Notes

- Only one changeset is needed to bump **all fixed packages**
- Do **not manually edit version fields** – use `changeset version`
- You can create multiple `.md` changesets and batch them together before releasing

## Documentation

- You can find the full documentation for it [in our repository](https://github.com/changesets/changesets)

- We have a quick list of common questions to get you started engaging with this project in
[our documentation](https://github.com/changesets/changesets/blob/main/docs/common-questions.md)
