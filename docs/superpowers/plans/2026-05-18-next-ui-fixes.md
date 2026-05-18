# next-ui Bug Fixes & Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix seven code-quality issues in `@igrp/framework-next-ui` — broken notification count, a derived-state anti-pattern, incorrect hook dependencies, missing error-boundary correctness, and i18n hardcoding.

**Architecture:** All changes are confined to `packages/framework/next-ui/src/`. No public API is broken; optional props are added with existing Portuguese defaults so existing consumers compile unchanged. One changeset covers the full batch.

**Tech Stack:** React 19, Next.js 15 App Router, TypeScript, pnpm workspaces

---

## Files Touched

| File | Change |
|---|---|
| `packages/framework/next-ui/src/components/templates/app-switcher.tsx` | Remove `useState`+`useEffect` for derived state; use `useMemo` only |
| `packages/framework/next-ui/src/components/templates/notifications.tsx` | Derive unread count from prop; add `onMarkAllRead` callback prop |
| `packages/framework/next-ui/src/components/templates/session-watcher.tsx` | Remove unused `session` from `useEffect` dependency array |
| `packages/framework/next-ui/src/components/errors/global.tsx` | Add `'use client'`; add `unstable_rethrow`; extract timeout constants; add `resetLabel`/`retryingLabel`/`errorRefLabel` props |
| `packages/framework/next-ui/src/components/errors/segment.tsx` | Add `unstable_rethrow`; extract timeout constant; add `retryingLabel`/`errorRefLabel` props |
| `packages/framework/next-ui/src/components/templates/command-search.tsx` | Add `commands?: IGRPCommandItem[]` prop; remove hardcoded routes; export type |
| `packages/framework/next-ui/src/index.ts` | Export new `IGRPCommandItem` type |

---

## Task 1 — Fix `app-switcher.tsx` derived-state anti-pattern

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/app-switcher.tsx`

The component maintains `activeApp` and `listApps` as `useState` initialized from a `useMemo`, then re-syncs them with a `useEffect`. This causes a second render on every props change. Both values are purely derived from props and must be `useMemo` only.

- [ ] **Step 1: Open and read the file**

  Confirm you see `useState<IGRPApplicationArgs | undefined>(currentApp)` at line 37 and the `useEffect` at line 43.

- [ ] **Step 2: Rewrite the file**

  Replace the full file contents with:

  ```tsx
  'use client';

  import {
    cn,
    IGRPIcon,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
  } from '@igrp/igrp-framework-react-design-system';
  import type { IGRPApplicationArgs } from '@igrp/framework-next-types';
  import { useMemo } from 'react';
  import Image from 'next/image';

  import { getLocationOriginURL } from '../../lib/utils';

  interface IGRPTemplateAppSwitcherProps {
    apps?: IGRPApplicationArgs[];
    appCode?: string;
    appCenterUrl?: string;
    baseUrl?: string;
  }

  function IGRPTemplateAppSwitcher({ apps, appCode, appCenterUrl }: IGRPTemplateAppSwitcherProps) {
    const { isMobile } = useSidebar();

    const activeApp = useMemo(() => {
      if (!apps || apps.length === 0) return undefined;
      return appCode ? apps.find((item) => item.code === appCode) : apps[0];
    }, [apps, appCode]);

    const listApps = useMemo(() => {
      if (!apps || !activeApp) return [];
      return apps.filter((item) => item.id !== activeApp.id);
    }, [apps, activeApp]);

    const getAppUrl = (app: IGRPApplicationArgs): string => {
      if (app.url) return app.url;

      const _url = getLocationOriginURL();

      if (app.slug) return app.slug.startsWith('/') ? `${_url}${app.slug}` : `${_url}/${app.slug}`;

      return _url;
    };

    return (
      <SidebarMenu>
        <SidebarMenuItem>
          {activeApp ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                  )}
                >
                  <div
                    className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}
                  >
                    {activeApp.picture ? (
                      <Image
                        src={activeApp.picture}
                        alt={activeApp.name}
                        width={32}
                        height={32}
                        className={cn('h-full w-full rounded-lg object-cover')}
                        priority
                      />
                    ) : (
                      <IGRPIcon iconName="GalleryVerticalEnd" />
                    )}
                  </div>
                  <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
                    <span className={cn('truncate font-medium')}>{activeApp.name}</span>
                    <span className={cn('truncate text-xs')}>{activeApp.description || ''}</span>
                  </div>
                  <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className={cn('min-w-56 rounded-lg')}
                align="start"
                side={isMobile ? 'bottom' : 'right'}
                sideOffset={4}
              >
                {listApps.length > 0 &&
                  listApps.map((app) => (
                    <DropdownMenuItem key={app.code} className={cn('gap-2 p-2')} asChild>
                      <a href={getAppUrl(app)}>
                        <div
                          className={cn('flex size-6 items-center justify-center rounded-md border')}
                        >
                          {app.picture ? (
                            <Image
                              src={app.picture}
                              alt={app.name}
                              width={24}
                              height={24}
                              className={cn('h-full w-full rounded-md object-cover')}
                              priority
                            />
                          ) : (
                            <IGRPIcon iconName="AudioWaveform" className={cn('size-3.5 shrink-0')} />
                          )}
                        </div>
                        {app.name}
                      </a>
                    </DropdownMenuItem>
                  ))}

                {appCenterUrl && (listApps?.length ?? 0) > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className={cn('gap-2 p-2')} asChild>
                      <a href={appCenterUrl}>
                        <div
                          className={cn(
                            'flex size-6 items-center justify-center rounded-md border bg-transparent',
                          )}
                        >
                          <IGRPIcon iconName="CornerDownLeft" className={cn('size-3 shrink-0')} />
                        </div>
                        <div className={cn('text-muted-foreground font-medium')}>
                          Applications Center
                        </div>
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <SidebarMenuButton
              size="lg"
              disabled
              className={cn(
                'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
              )}
            >
              <div className={cn('flex aspect-square size-8 items-center justify-center rounded-lg')}>
                <IGRPIcon iconName="Command" />
              </div>
              <div className={cn('grid flex-1 text-left text-sm leading-tight')}>
                <span className={cn('truncate font-medium')}>N/A</span>
                <span className={cn('truncate text-xs')}>N/A</span>
              </div>
              <IGRPIcon iconName="ChevronsUpDown" className={cn('ml-auto')} />
            </SidebarMenuButton>
          )}
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  export { IGRPTemplateAppSwitcher, type IGRPTemplateAppSwitcherProps };
  ```

- [ ] **Step 3: Verify TypeScript compilation**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: Build completes with no type errors. The `useState` and `useEffect` imports are gone from this file.

- [ ] **Step 4: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/templates/app-switcher.tsx
  git commit -m "fix(next-ui): replace useState+useEffect with useMemo for derived app-switcher state"
  ```

---

## Task 2 — Fix `notifications.tsx` unread count

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/notifications.tsx`

The notification count is hardcoded to `3` and has no connection to the `notifications` array prop. The `isRead` field on `IGRPNotificationArgs` exists specifically for this. Add an `onMarkAllRead?: () => void` prop so consumers can handle the server-side mutation; derive count from the prop.

- [ ] **Step 1: Rewrite the file**

  ```tsx
  'use client';

  import {
    cn,
    Badge,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    IGRPIcon,
  } from '@igrp/igrp-framework-react-design-system';
  import type { IGRPNotificationArgs } from '@igrp/framework-next-types';
  import Link from 'next/link';
  import { getLocationOriginURL } from '../../lib/utils';

  interface IGRPTemplateNotificationsProps {
    notifications: IGRPNotificationArgs[];
    notificationsUrl?: string;
    /** Called when the user clicks "Mark all as read". Consumer is responsible for updating the notifications array. */
    onMarkAllRead?: () => void;
  }

  function IGRPTemplateNotifications({
    notifications,
    notificationsUrl,
    onMarkAllRead,
  }: IGRPTemplateNotificationsProps) {
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const handleUrl = () => {
      const _url = getLocationOriginURL();
      return notificationsUrl ? notificationsUrl : `${_url}/notifications`;
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-6 relative">
            <IGRPIcon iconName="Bell" strokeWidth={2} />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-0.5 h-3.5 w-3.5 flex text-[10px] py-0 px-0"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
            <span className={cn('sr-only')}>Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-w-80">
          <DropdownMenuLabel className={cn('flex items-center justify-between')}>
            <span>Notifications</span>
            {unreadCount > 0 && onMarkAllRead && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead} className="h-auto text-xs">
                Mark all as read
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup className={cn('max-h-72 overflow-auto')}>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn('flex flex-col items-start p-4')}
                >
                  <div className={cn('font-medium')}>{notification.title}</div>
                  <div className={cn('text-sm text-muted-foreground')}>{notification.message}</div>
                  <div className={cn('text-xs text-muted-foreground mt-1')}>
                    {notification.timestamp.toLocaleString()}
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className={cn('py-4 px-2 text-center text-muted-foreground')}>
                Sem notificações
              </div>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className={cn('justify-center')} asChild>
            <Link href={handleUrl()}>Todas as notificações</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  export { IGRPTemplateNotifications, type IGRPTemplateNotificationsProps };
  ```

- [ ] **Step 2: Update the barrel export in `index.ts`**

  Open `packages/framework/next-ui/src/index.ts`. Find the line that exports `IGRPTemplateNotifications` and add the new type export beside it:

  ```ts
  export { IGRPTemplateNotifications, type IGRPTemplateNotificationsProps } from './components/templates/notifications';
  ```

  (Replace the existing `IGRPTemplateNotifications` export line — do not duplicate it.)

- [ ] **Step 3: Verify**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: No errors. Confirm `IGRPTemplateNotificationsProps` appears in `dist/index.d.ts`.

- [ ] **Step 4: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/templates/notifications.tsx packages/framework/next-ui/src/index.ts
  git commit -m "fix(next-ui): derive notification unread count from prop; add onMarkAllRead callback"
  ```

---

## Task 3 — Fix `session-watcher.tsx` unused dependency

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/session-watcher.tsx`

`session` is destructured but never read inside the `useEffect` body. It being in the dependency array causes the redirect effect to re-run on every session token refresh (common with OIDC sliding sessions), potentially causing unnecessary re-renders.

- [ ] **Step 1: Edit the file**

  Current content:
  ```tsx
  'use client';

  import { useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { useSession } from '@igrp/framework-next-auth/client';

  export function IGRPSessionWatcher({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push('/login');
      }
    }, [status, session, router]);

    return children;
  }
  ```

  Replace with:
  ```tsx
  'use client';

  import { useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { useSession } from '@igrp/framework-next-auth/client';

  export function IGRPSessionWatcher({ children }: { children: React.ReactNode }) {
    const { status } = useSession();
    const router = useRouter();
    useEffect(() => {
      if (status === 'unauthenticated') {
        router.push('/login');
      }
    }, [status, router]);

    return children;
  }
  ```

- [ ] **Step 2: Verify**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: Build passes. No lint warnings about unused variables.

- [ ] **Step 3: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/templates/session-watcher.tsx
  git commit -m "fix(next-ui): remove unused session dependency from session-watcher effect"
  ```

---

## Task 4 — Fix `global.tsx` — `'use client'`, `unstable_rethrow`, constants, i18n props

**Files:**
- Modify: `packages/framework/next-ui/src/components/errors/global.tsx`

Four issues in one file:
1. Missing `'use client'` directive (other error files have it; direct consumers outside the barrel would fail).
2. `unstable_rethrow` not called — if a Next.js redirect or `notFound()` is thrown inside a child and bubbles to this boundary, it gets swallowed and shows an error page instead of performing the navigation.
3. Timeout values `300` and `1000` are magic numbers.
4. `'A tentar...'`, `'Tentar novamente'`, and `'ID de referência:'` are hardcoded Portuguese strings with no prop escape hatch.

- [ ] **Step 1: Rewrite the file**

  ```tsx
  'use client';

  import { useEffect, useState } from 'react';
  import Image from 'next/image';
  import { unstable_rethrow } from 'next/navigation';
  import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

  const ANIMATION_DELAY_MS = 300;
  const RESET_DELAY_MS = 1000;

  const DEFAULT_COPY = {
    title: 'Ocorreu um erro inesperado.',
    description:
      'Tente novamente. Se o problema persistir, contacte a equipa de suporte e indique o ID de referência apresentado abaixo.',
  };

  interface IGRPGlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
    children?: React.ReactNode;
    /**
     * Resolves a user-facing `{ title, description }` pair for the error.
     * Consumers typically look up copy keyed by `error.code` (framework typed
     * errors) and fall back to a generic message. Falls back to
     * `DEFAULT_COPY` when omitted or when the resolver returns nothing.
     */
    resolveCopy?: (error: Error) => { title: string; description: string };
    /** Label for the retry button. Defaults to `'Tentar novamente'`. */
    resetLabel?: string;
    /** Label shown while the reset is in progress. Defaults to `'A tentar...'`. */
    retryingLabel?: string;
    /** Label prefix for the error reference ID. Defaults to `'ID de referência:'`. */
    errorRefLabel?: string;
  }

  // TODO: check the image
  function IGRPGlobalError({
    error,
    reset,
    children,
    resolveCopy,
    resetLabel = 'Tentar novamente',
    retryingLabel = 'A tentar...',
    errorRefLabel = 'ID de referência:',
  }: IGRPGlobalErrorProps) {
    if (children) return <>{children}</>;

    const [isResetting, setIsResetting] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);

    useEffect(() => {
      unstable_rethrow(error);
      console.error(error);

      const timer = setTimeout(() => setErrorVisible(true), ANIMATION_DELAY_MS);
      return () => clearTimeout(timer);
    }, [error]);

    const handleReset = () => {
      setIsResetting(true);
      setTimeout(() => {
        reset();
        setIsResetting(false);
      }, RESET_DELAY_MS);
    };

    const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;

    return (
      <div className={cn('flex min-h-[calc(100vh-12rem)] items-center justify-center bg-primary-50')}>
        <div className={cn('w-full max-w-3xl')}>
          <div className={cn('text-center')}>
            <Image
              src="/error-img.webp"
              alt="Error Image"
              width={300}
              height={200}
              className={cn('mx-auto mb-2')}
            />
            <h1 className={cn('text-2xl font-bold tracking-tight text-gray-900 dark:text-white')}>
              {title}
            </h1>
            <p className={cn('mb-4 text-base text-gray-600 dark:text-gray-300')}>{description}</p>

            {error.digest && (
              <div
                className={cn(
                  'mx-auto max-w-xl transform overflow-hidden rounded-lg p-3 mb-4 backdrop-blur transition-all duration-500 bg-stone-100 dark:bg-gray-800/50 shadow-xs',
                  errorVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                )}
              >
                <p className={cn('text-xs text-gray-500')}>
                  {errorRefLabel}{' '}
                  <code className={cn('rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-700')}>
                    {error.digest}
                  </code>
                </p>
              </div>
            )}

            <div className={cn('flex flex-col items-center justify-center gap-4 sm:flex-row')}>
              <IGRPButton
                onClick={handleReset}
                size="lg"
                className={cn('group min-w-40')}
                disabled={isResetting}
                showIcon
                iconName="RefreshCw"
                iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
              >
                <span>{isResetting ? retryingLabel : resetLabel}</span>
              </IGRPButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export { IGRPGlobalError, type IGRPGlobalErrorProps };
  ```

- [ ] **Step 2: Verify**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: No errors. `unstable_rethrow` resolves from `next/navigation` — if it fails, your Next.js version is below 15.1; check `packages/framework/next-ui/package.json` for the `next` peer dep version.

- [ ] **Step 3: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/errors/global.tsx
  git commit -m "fix(next-ui): add 'use client', unstable_rethrow, constants and i18n props to IGRPGlobalError"
  ```

---

## Task 5 — Fix `segment.tsx` — `unstable_rethrow`, constant, i18n prop

**Files:**
- Modify: `packages/framework/next-ui/src/components/errors/segment.tsx`

Same `unstable_rethrow` omission. The `400` ms reset delay is a magic number. `'A tentar...'` and `'ID de referência:'` are hardcoded Portuguese strings.

- [ ] **Step 1: Rewrite the file**

  ```tsx
  'use client';

  import { useEffect, useState } from 'react';
  import Link from 'next/link';
  import { unstable_rethrow } from 'next/navigation';
  import { cn, IGRPButton } from '@igrp/igrp-framework-react-design-system';

  const RESET_DELAY_MS = 400;

  /**
   * Props for {@link IGRPSegmentError}.
   *
   * The component is designed for a **segment-level** Next.js App Router
   * `error.tsx` — that is, an error boundary nested inside a parent layout
   * (header / sidebar chrome). For errors that must render *without* surrounding
   * layout (root `global-error.tsx`, bootstrap failures), use `IGRPGlobalError`
   * instead.
   */
  export interface IGRPSegmentErrorProps {
    /** Error passed into the App Router `error.tsx` boundary. */
    error: Error & { digest?: string };

    /** Next.js-provided reset function — re-renders the erroring segment. */
    reset: () => void;

    /**
     * Optional override. If a segment wants to render entirely custom content
     * it can pass children; all other props are ignored.
     */
    children?: React.ReactNode;

    /**
     * Resolves a user-facing message. Receives the error; returns a
     * `{ title, description }` pair. Consumers typically look up a translation
     * keyed by `error.name` (e.g. `'IgrpConfigError'`) or a framework
     * `IgrpError.code`. Falls back to a generic Portuguese copy.
     */
    resolveCopy?: (error: Error) => {
      title: string;
      description: string;
    };

    /** Link target for the "go home" button. Defaults to `/`. */
    homeHref?: string;

    /** Label for the home button. Defaults to `'Voltar ao início'`. */
    homeLabel?: string;

    /** Label for the reset button. Defaults to `'Tentar novamente'`. */
    resetLabel?: string;

    /** Label shown while the reset is in progress. Defaults to `'A tentar...'`. */
    retryingLabel?: string;

    /** Label prefix for the error reference ID. Defaults to `'ID de referência:'`. */
    errorRefLabel?: string;
  }

  const DEFAULT_COPY = {
    title: 'Ocorreu um erro nesta secção.',
    description:
      'Tente novamente ou volte ao início. Se o problema persistir, contacte a equipa de suporte.',
  };

  function IGRPSegmentError({
    error,
    reset,
    children,
    resolveCopy,
    homeHref = '/',
    homeLabel = 'Voltar ao início',
    resetLabel = 'Tentar novamente',
    retryingLabel = 'A tentar...',
    errorRefLabel = 'ID de referência:',
  }: IGRPSegmentErrorProps) {
    if (children) return <>{children}</>;

    const [isResetting, setIsResetting] = useState(false);

    useEffect(() => {
      unstable_rethrow(error);
      // Basic dev-time logging. Templates should compose a `reportError` hook
      // above this boundary for production observability.
      console.error('[IGRPSegmentError]', error);
    }, [error]);

    const { title, description } = resolveCopy?.(error) ?? DEFAULT_COPY;

    const handleReset = () => {
      setIsResetting(true);
      setTimeout(() => {
        reset();
        setIsResetting(false);
      }, RESET_DELAY_MS);
    };

    return (
      <div className={cn('flex min-h-[320px] items-center justify-center p-6')}>
        <div className={cn('w-full max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm')}>
          <div className={cn('space-y-4')}>
            <div className={cn('space-y-1')}>
              <h2 className={cn('text-lg font-semibold text-foreground')}>{title}</h2>
              <p className={cn('text-sm text-muted-foreground')}>{description}</p>
            </div>

            {error.digest ? (
              <p className={cn('text-xs text-muted-foreground')}>
                {errorRefLabel}{' '}
                <code
                  className={cn('rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground')}
                >
                  {error.digest}
                </code>
              </p>
            ) : null}

            <div className={cn('flex flex-col items-stretch gap-2 sm:flex-row sm:items-center')}>
              <IGRPButton
                onClick={handleReset}
                disabled={isResetting}
                showIcon
                iconName="RefreshCw"
                iconClassName={cn('mr-2 h-4 w-4 transition-transform', isResetting && 'animate-spin')}
              >
                <span>{isResetting ? retryingLabel : resetLabel}</span>
              </IGRPButton>
              <IGRPButton
                asChild
                variant="outline"
                showIcon
                iconName="Home"
                iconClassName={cn('mr-2 h-4 w-4')}
              >
                <Link href={homeHref}>{homeLabel}</Link>
              </IGRPButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export { IGRPSegmentError };
  ```

- [ ] **Step 2: Verify**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: No errors.

- [ ] **Step 3: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/errors/segment.tsx
  git commit -m "fix(next-ui): add unstable_rethrow, extract RESET_DELAY_MS, add retryingLabel/errorRefLabel to IGRPSegmentError"
  ```

---

## Task 6 — Add `commands` prop to `command-search.tsx`

**Files:**
- Modify: `packages/framework/next-ui/src/components/templates/command-search.tsx`
- Modify: `packages/framework/next-ui/src/index.ts`

The component has hardcoded route suggestions that don't match real IGRP routes and a `// TODO: Search items` comment. Expose a `commands?: IGRPCommandItem[]` prop so consumers can inject their own items. Remove the hardcoded routes — they never matched any real IGRP path and are confusing.

- [ ] **Step 1: Rewrite `command-search.tsx`**

  ```tsx
  'use client';

  import { useCallback, useEffect, useState } from 'react';
  import { useRouter } from 'next/navigation';
  import {
    cn,
    IGRPIcon,
    IGRPButton,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
  } from '@igrp/igrp-framework-react-design-system';

  export interface IGRPCommandItem {
    /** Display label shown in the command list. */
    label: string;
    /** Lucide icon name rendered before the label. Optional. */
    icon?: string;
    /** Group heading the item appears under. Items without a group are shown ungrouped. */
    group?: string;
    /** Called when the user selects this item. */
    onSelect: () => void;
  }

  interface IGRPTemplateCommandSearchProps {
    /** Command items to render in the palette. When omitted, the palette shows only the empty state. */
    commands?: IGRPCommandItem[];
  }

  function IGRPTemplateCommandSearch({ commands = [] }: IGRPTemplateCommandSearchProps) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
      const controller = new AbortController();

      const down = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((prev) => !prev);
        }
      };

      document.addEventListener('keydown', down, { signal: controller.signal });
      return () => {
        controller.abort();
      };
    }, []);

    const runCommand = useCallback((command: () => unknown) => {
      setOpen(false);
      command();
    }, []);

    // Group commands by their `group` field. Items without a group are collected under undefined.
    const grouped = commands.reduce<Map<string | undefined, IGRPCommandItem[]>>((acc, item) => {
      const key = item.group;
      const list = acc.get(key) ?? [];
      list.push(item);
      acc.set(key, list);
      return acc;
    }, new Map());

    return (
      <>
        <IGRPButton
          onClick={() => setOpen(true)}
          variant="outline"
          size="lg"
          className={cn(
            'justify-between focus-visible:outline-none focus-visible:ring-1 border-input px-3 shadow-none sm:pe-12 md:flex-none sm:w-40 lg:w-52 xl:w-64',
          )}
        >
          <span className={cn('flex items-center ')}>
            <IGRPIcon iconName="Search" className={cn('mr-1 size-3')} />
            <span>Pesquisar...</span>
          </span>
          <kbd
            className={cn(
              'pointer-events-none select-none flex items-center gap-1 rounded border px-1 py-1 font-mono text-[10px] font-medium',
            )}
          >
            <span className={cn('text-xs')}>⌘</span>K
          </kbd>
        </IGRPButton>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Digite um comando ou pesquisa..." />
          <CommandList>
            <CommandEmpty>Sem Resultados.</CommandEmpty>
            {Array.from(grouped.entries()).map(([group, items], groupIndex) => (
              <>
                {groupIndex > 0 && <CommandSeparator key={`sep-${group ?? 'ungrouped'}`} />}
                <CommandGroup key={group ?? 'ungrouped'} heading={group}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.label}
                      onSelect={() => runCommand(item.onSelect)}
                    >
                      {item.icon && <IGRPIcon iconName={item.icon} className={cn('mr-2')} />}
                      <span>{item.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ))}
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  export { IGRPTemplateCommandSearch, type IGRPTemplateCommandSearchProps };
  ```

- [ ] **Step 2: Export the new type from `index.ts`**

  Open `packages/framework/next-ui/src/index.ts`. Find the existing `IGRPTemplateCommandSearch` export line and update it to also export the new types:

  ```ts
  export {
    IGRPTemplateCommandSearch,
    type IGRPTemplateCommandSearchProps,
    type IGRPCommandItem,
  } from './components/templates/command-search';
  ```

  (Replace the existing single-name export for `IGRPTemplateCommandSearch`.)

- [ ] **Step 3: Verify**

  ```powershell
  pnpm build:next-ui
  ```

  Expected: No errors. Confirm `IGRPCommandItem` and `IGRPTemplateCommandSearchProps` appear in `dist/index.d.ts`.

- [ ] **Step 4: Commit**

  ```powershell
  git add packages/framework/next-ui/src/components/templates/command-search.tsx packages/framework/next-ui/src/index.ts
  git commit -m "feat(next-ui): expose commands prop on IGRPTemplateCommandSearch; remove hardcoded routes"
  ```

---

## Task 7 — Changeset and build verification

**Files:**
- Create: `.changeset/<auto-generated-name>.md` (via `pnpm changeset`)

All changes so far are `patch` level (fixes and additive-only prop additions). Per the repo hard rules, changesets must always use `patch` type.

- [ ] **Step 1: Create the changeset**

  ```powershell
  pnpm changeset
  ```

  In the interactive prompt:
  - Select `@igrp/framework-next-ui` (use space bar to select, enter to confirm)
  - Choose **patch**
  - Summary: `Fix derived-state anti-pattern in app-switcher; bind notification unread count to prop; add unstable_rethrow to error boundaries; add i18n props to error components; expose commands prop on command search`

- [ ] **Step 2: Full framework build**

  ```powershell
  pnpm build:framework
  ```

  Expected: All packages build in order (next-auth → next-types → design-system → next-ui → next) with no errors. This catches any type regressions in downstream packages that consume `@igrp/framework-next-ui`.

- [ ] **Step 3: Spot-check the demo in preview mode**

  ```powershell
  pnpm dev:demo
  ```

  Navigate to `http://localhost:3000`. Verify:
  - Sidebar app switcher renders (no console errors about hooks)
  - Notification bell shows `0` (or the actual unread count from mock data) — **not** `3`
  - Opening command palette (Cmd/Ctrl+K) shows an empty state — **not** the old hardcoded Home/Library/Settings routes

- [ ] **Step 4: Commit the changeset**

  ```powershell
  git add .changeset/
  git commit -m "chore: add changeset for next-ui bug fixes"
  ```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `app-switcher.tsx` derived state → Task 1
- [x] `notifications.tsx` unread count → Task 2
- [x] `session-watcher.tsx` unused dep → Task 3
- [x] `global.tsx` missing `'use client'`, `unstable_rethrow`, constants, labels → Task 4
- [x] `segment.tsx` `unstable_rethrow`, constant, labels → Task 5
- [x] `command-search.tsx` `commands` prop → Task 6
- [x] Changeset + build verification → Task 7

**Placeholder scan:** No TBDs, no "add appropriate X", no "similar to Task N" references. Every step has complete code.

**Type consistency:**
- `IGRPCommandItem` is defined in Task 6 (command-search.tsx) and exported in the same task.
- `IGRPTemplateNotificationsProps` is defined in Task 2 and exported in the same task.
- `retryingLabel`/`errorRefLabel` props are added to both `IGRPGlobalErrorProps` (Task 4) and `IGRPSegmentErrorProps` (Task 5) independently — no cross-reference between the two.
- `RESET_DELAY_MS` in `segment.tsx` (Task 5) is a module-level constant — no naming conflict with `RESET_DELAY_MS` in `global.tsx` (Task 4) since they are separate files.
