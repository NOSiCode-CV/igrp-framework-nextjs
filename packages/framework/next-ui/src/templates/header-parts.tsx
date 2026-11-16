'use client';

import { createContext, use, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import { cn, IGRPIcon, SidebarTrigger } from '@igrp/igrp-framework-react-design-system';

import { useIGRPBranding } from '../branding/provider.js';
import { resolveHeaderLogo } from '../branding/resolve.js';
import {
  IGRPChromeI18nProvider,
  useIGRPChromeI18n,
  type IGRPChromeStringsOverrides,
} from '../i18n/context.js';
import { withBasePath } from '../lib/utils.js';
import { useIGRPBreadcrumbItems } from '../providers/breadcrumbs.js';
import { useIGRPHasSidebar } from '../providers/shell.js';
import {
  type BreadcrumbItem,
  IGRPTemplateBreadcrumbs,
  type IGRPTemplateBreadcrumbsProps,
} from './breadcrumbs.js';
import {
  IGRPTemplateCommandSearch,
  type IGRPCommandItem,
  type IGRPCommandSearchLabels,
} from './command-search.js';
import type { IGRPPaletteCommand } from './menus/palette-commands.js';
import { IGRPTemplateModeSwitcher, type IGRPModeSwitcherLabels } from './mode-switcher.js';
import { IGRPTemplateNavUser, type IGRPNavUserLabels } from './nav-user.js';
import { IGRPTemplateNotifications, type IGRPNotificationsLabels } from './notifications.js';
import { IGRPTemplateImage } from './template-image.js';

/**
 * Logo used when the header data carries no logo, or its logo fails to load.
 *
 * This package publishes only `dist`, so the file is NOT shipped with it — the
 * path is a contract with the consuming app's `public/` directory. Apps that do
 * not have it should pass `fallbackLogo`, otherwise the fallback is itself a
 * broken image, which is the one case a fallback exists to prevent.
 */
const DEFAULT_HEADER_LOGO = '/logo-no-text.png';

export interface IGRPHeaderContextValue {
  /** Header data; `undefined` until a provider supplies it. */
  data?: IGRPHeaderDataArgs;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumbRouteLabels?: Record<string, string>;
  /** Client-built palette items (the deprecated header `commands` prop). Win over `paletteCommands`. */
  commands?: IGRPCommandItem[];
  /** Serializable palette items, usually built on the server from the menus. */
  paletteCommands?: IGRPPaletteCommand[] | Promise<IGRPPaletteCommand[]>;
  fallbackLogo: string;
}

const HeaderContext = createContext<IGRPHeaderContextValue | null>(null);
const NO_HEADER: IGRPHeaderContextValue = { fallbackLogo: DEFAULT_HEADER_LOGO };

/** The header context, or `null` outside a provider. Internal. */
export function useOptionalIGRPHeaderData(): IGRPHeaderContextValue | null {
  return use(HeaderContext);
}

/** What the surrounding `IGRPHeaderDataProvider` holds (empty outside one). */
export function useIGRPHeaderData(): IGRPHeaderContextValue {
  return use(HeaderContext) ?? NO_HEADER;
}

/** Label overrides for the header's children, threaded into the chrome catalog. */
export interface IGRPHeaderLabelProps {
  /** Accessible name of the built-in settings link. */
  settingsLabel?: string;
  navUserLabels?: Partial<IGRPNavUserLabels>;
  commandSearchLabels?: Partial<IGRPCommandSearchLabels>;
  notificationsLabels?: Partial<IGRPNotificationsLabels>;
  modeSwitcherLabels?: Partial<IGRPModeSwitcherLabels>;
  /** Screen-reader label for the breadcrumb home link. */
  breadcrumbHomeLabel?: string;
  /** Screen-reader label for the collapsed-breadcrumbs menu. */
  breadcrumbEllipsisLabel?: string;
}

/** Header label props as chrome overrides; `undefined` when none is set. */
export function headerLabelOverrides(
  labels: IGRPHeaderLabelProps,
): IGRPChromeStringsOverrides | undefined {
  const overrides: IGRPChromeStringsOverrides = {};
  if (labels.settingsLabel !== undefined) overrides.header = { settings: labels.settingsLabel };
  if (labels.navUserLabels) overrides.navUser = labels.navUserLabels;
  if (labels.commandSearchLabels) overrides.commandSearch = labels.commandSearchLabels;
  if (labels.notificationsLabels) overrides.notifications = labels.notificationsLabels;
  if (labels.modeSwitcherLabels) overrides.modeSwitcher = labels.modeSwitcherLabels;
  if (labels.breadcrumbHomeLabel !== undefined || labels.breadcrumbEllipsisLabel !== undefined) {
    overrides.breadcrumbs = {
      home: labels.breadcrumbHomeLabel,
      ellipsis: labels.breadcrumbEllipsisLabel,
    };
  }
  return Object.keys(overrides).length > 0 ? overrides : undefined;
}

export interface IGRPHeaderDataProviderProps
  extends Partial<Omit<IGRPHeaderContextValue, 'fallbackLogo'>>, IGRPHeaderLabelProps {
  /** App-relative path to the logo used when `headerLogo` is absent or fails. */
  fallbackLogo?: string;
  children: React.ReactNode;
}

/**
 * Supplies header data to the `IGRPHeader*` parts below it. Each prop left
 * undefined is inherited from an enclosing provider, so a nested provider can
 * change one thing. `IGRPLayoutHeader` (in `@igrp/framework-next`) mounts it
 * with the fetched data.
 */
export function IGRPHeaderDataProvider({
  data,
  breadcrumbs,
  breadcrumbRouteLabels,
  commands,
  paletteCommands,
  fallbackLogo,
  children,
  ...labels
}: IGRPHeaderDataProviderProps) {
  const parent = use(HeaderContext);
  const value: IGRPHeaderContextValue = {
    data: data ?? parent?.data,
    breadcrumbs: breadcrumbs ?? parent?.breadcrumbs,
    breadcrumbRouteLabels: breadcrumbRouteLabels ?? parent?.breadcrumbRouteLabels,
    commands: commands ?? parent?.commands,
    paletteCommands: paletteCommands ?? parent?.paletteCommands,
    fallbackLogo: fallbackLogo ?? parent?.fallbackLogo ?? DEFAULT_HEADER_LOGO,
  };
  const overrides = headerLabelOverrides(labels);
  const content = <HeaderContext value={value}>{children}</HeaderContext>;
  return overrides ? (
    <IGRPChromeI18nProvider overrides={overrides}>{content}</IGRPChromeI18nProvider>
  ) : (
    content
  );
}

/** An unset env reaches us as "", which as an href reloads the page; children default only on undefined. */
function urlOrUndefined(url: string | undefined): string | undefined {
  return url || undefined;
}

// ── Parts ──────────────────────────────────────────────────────────────────

type DivProps = { className?: string; children?: React.ReactNode };

/** The header bar. */
export function IGRPHeaderRoot({ className, children }: DivProps) {
  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Left cluster. */
export function IGRPHeaderStart({ className, children }: DivProps) {
  return <div className={cn('flex items-center gap-2 h-12 min-w-0', className)}>{children}</div>;
}

/** Right cluster. */
export function IGRPHeaderEnd({ className, children }: DivProps) {
  return <div className={cn('flex items-center gap-2 shrink-0', className)}>{children}</div>;
}

/** Sidebar collapse button. Renders nothing when the layout has no sidebar. */
export function IGRPHeaderSidebarTrigger({ className }: { className?: string }) {
  const hasSidebar = useIGRPHasSidebar();
  if (!hasSidebar) return null;
  return <SidebarTrigger className={cn('-ml-1', className)} />;
}

/** One header mark; the fallback carries the same visibility class so a failed dark image never shows in light mode. */
function HeaderLogoImage({
  src,
  fallbackSrc,
  className,
}: {
  src: string;
  fallbackSrc: string;
  className?: string;
}) {
  return (
    <IGRPTemplateImage
      src={src}
      // igrp-i18n-ignore: brand name
      alt="IGRP"
      width={40}
      height={40}
      className={cn('object-contain size-10', className)}
      priority
      fallback={
        <Image
          src={fallbackSrc}
          // igrp-i18n-ignore: brand name
          alt="IGRP"
          width={40}
          height={40}
          className={cn('object-contain size-10', className)}
          priority
        />
      }
    />
  );
}

/** The logo: brand header mark, else the data's `headerLogo`, else the fallback. */
export function IGRPHeaderLogo({ className }: { className?: string }) {
  const { data, fallbackLogo } = useIGRPHeaderData();
  const branding = useIGRPBranding();
  const fallback = withBasePath(fallbackLogo);
  const logo = resolveHeaderLogo({ branding, headerLogo: data?.headerLogo, fallback });

  return (
    <div
      className={cn(
        'size-10 rounded-lg overflow-hidden flex items-center justify-center',
        className,
      )}
    >
      <HeaderLogoImage
        src={logo.light}
        fallbackSrc={fallback}
        className={logo.dark ? 'dark:hidden' : undefined}
      />
      {logo.dark && (
        <HeaderLogoImage src={logo.dark} fallbackSrc={fallback} className="hidden dark:block" />
      )}
    </div>
  );
}

/** The wordmark. Children replace the default "iGRP". */
export function IGRPHeaderTitle({ className, children }: DivProps) {
  return (
    <span className={cn('text-base font-semibold', className)}>
      {/* igrp-i18n-ignore: brand name */}
      {children ?? 'iGRP'}
    </span>
  );
}

/**
 * Breadcrumbs, fed from the header context (props win). A trail a page declares
 * with `IGRPPageBreadcrumbs` / `useIGRPBreadcrumbs` takes precedence over the
 * context's `breadcrumbs`.
 */
export function IGRPHeaderBreadcrumbs(props: IGRPTemplateBreadcrumbsProps) {
  const { breadcrumbs, breadcrumbRouteLabels } = useIGRPHeaderData();
  const pageItems = useIGRPBreadcrumbItems();
  return (
    <IGRPTemplateBreadcrumbs
      items={pageItems ?? breadcrumbs}
      routeLabels={breadcrumbRouteLabels}
      {...props}
    />
  );
}

/** Palette items from serializable commands; navigation handlers are built here, on the client. */
function toCommandItems(
  commands: IGRPPaletteCommand[],
  router: ReturnType<typeof useRouter>,
): IGRPCommandItem[] {
  return commands.map((command) => ({
    id: command.id,
    label: command.label,
    icon: command.icon,
    group: command.group,
    onSelect: () => {
      // router.push applies basePath; window.open is only for other origins / new tabs.
      if (command.external) window.open(command.href, '_blank', 'noopener,noreferrer');
      else router.push(command.href);
    },
  }));
}

/**
 * The command palette trigger. Uses the context's client `commands` when set,
 * else its `paletteCommands`. A promise is resolved inside the palette dialog,
 * so the trigger is one instance throughout and keeps its state while the menus
 * stream in.
 */
export function IGRPHeaderSearch({ labels }: { labels?: Partial<IGRPCommandSearchLabels> }) {
  const { commands, paletteCommands } = useIGRPHeaderData();
  const router = useRouter();
  // Memoized on the promise: a new derived promise per render would re-suspend the list.
  const items = useMemo(() => {
    if (commands || !paletteCommands) return commands;
    return Array.isArray(paletteCommands)
      ? toCommandItems(paletteCommands, router)
      : // Promise.resolve: an RSC-streamed thenable's `then` returns undefined instead of a new promise.
        Promise.resolve(paletteCommands).then((resolved) => toCommandItems(resolved, router));
  }, [commands, paletteCommands, router]);
  return <IGRPTemplateCommandSearch commands={items} labels={labels} />;
}

/** Settings link (`settingsUrl`, default `/settings`). */
export function IGRPHeaderSettings({ label }: { label?: string }) {
  const { data } = useIGRPHeaderData();
  const chrome = useIGRPChromeI18n();
  return (
    // `aria-label` IS the accessible name here — it overrides element
    // content, so an additional sr-only span would never be announced.
    <Link href={data?.settingsUrl || '/settings'} aria-label={label ?? chrome.header.settings}>
      <IGRPIcon iconName={data?.settingsIcon ?? 'Settings'} aria-hidden="true" />
    </Link>
  );
}

/** Notifications dropdown. Hidden below `md`, where the user menu carries the entry. */
export function IGRPHeaderNotifications() {
  const { data } = useIGRPHeaderData();
  return (
    <span className={cn('hidden md:block')}>
      <IGRPTemplateNotifications
        notifications={data?.notifications || []}
        notificationsUrl={urlOrUndefined(data?.notificationsUrl)}
      />
    </span>
  );
}

/** Light/dark switcher. */
export function IGRPHeaderModeSwitcher() {
  return <IGRPTemplateModeSwitcher />;
}

export interface IGRPHeaderUserProps {
  /** Extra menu entries (`IGRPNavUserItem`), before sign-out. */
  items?: React.ReactNode;
  /**
   * Show the menu's Notifications entry. Defaults to `true`: unlike the sidebar
   * parts, this does not read the header data's `showNotifications` (in a
   * composition a part shows by being included). A value here overrides it.
   */
  showNotifications?: boolean;
}

/** The user menu, with the header data's user and URLs. */
export function IGRPHeaderUser({ items, showNotifications }: IGRPHeaderUserProps) {
  const { data } = useIGRPHeaderData();
  return (
    <IGRPTemplateNavUser
      variant="header"
      user={data?.user}
      profileUrl={urlOrUndefined(data?.userProfileUrl)}
      notificationsUrl={urlOrUndefined(data?.notificationsUrl)}
      settingsUrl={urlOrUndefined(data?.settingsUrl)}
      logoutUrl={urlOrUndefined(data?.logoutUrl)}
      showNotifications={showNotifications}
      items={items}
    />
  );
}
