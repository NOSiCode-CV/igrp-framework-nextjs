---
"@igrp/template-migrator": patch
---

Migration 68: demo-v1's `next.config.ts` serves every lucide icon from one lazy chunk under `next dev` instead of ~1,950 per-icon chunks, which made the first compile slow on Windows; `next build` keeps the per-icon map. lucide is now resolved from the design system's real location, so the alias also works from the monorepo's workspace link.
