---
'@igrp/framework-next-ui': patch
---

`IGRPSessionWatcher` no longer returns `null` on every `useSession` refetch. NextAuth briefly flips status to `'loading'` after `signOut`, on focus refetch, and on every polling interval; returning `null` there unmounted the whole subtree and forced child components to re-run their mount effects from scratch. The visible symptom was `/logout` running `signOut` twice and stalling on its loading template because the in-flight effect closure was racing the remount. The watcher now only renders `null` during the genuine initial probe (status `'loading'` AND no session data yet), which is the only state SSR can't already populate.
