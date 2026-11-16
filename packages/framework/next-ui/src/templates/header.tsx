'use client';

import { Suspense, useEffect } from 'react';
import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import { cn, Separator, useIGRPToast } from '@igrp/igrp-framework-react-design-system';

import type { BreadcrumbItem } from './breadcrumbs.js';
import type { IGRPCommandItem } from './command-search.js';
import {
  IGRPHeaderBreadcrumbs,
  IGRPHeaderDataProvider,
  IGRPHeaderEnd,
  IGRPHeaderLogo,
  IGRPHeaderModeSwitcher,
  IGRPHeaderNotifications,
  IGRPHeaderRoot,
  IGRPHeaderSearch,
  IGRPHeaderSettings,
  IGRPHeaderSidebarTrigger,
  IGRPHeaderStart,
  IGRPHeaderTitle,
  IGRPHeaderUser,
  type IGRPHeaderLabelProps,
  useIGRPHeaderData,
  useOptionalIGRPHeaderData,
} from './header-parts.js';
import { useIGRPHasSidebar } from '../providers/shell.js';

/**
 * Consumer-injected header content, positioned by the framework.
 *
 * Slots are React **elements**, never component references — the header is a
 * Client Component rendered from a Server Component, and functions cannot cross
 * that boundary. An element may itself be produced by an async Server Component;
 * each slot renders inside its own <Suspense> so a slow one can't delay the bar.
 *
 * A supplied slot always renders. `search`, `notifications` and `settings`
 * replace a built-in position; the matching `show*` flag only decides whether
 * the built-in renders when no slot is given. `start` and `actions` have no flag.
 */
export type IGRPHeaderSlots = {
  /** Left region, after the logo/title and before the breadcrumbs. */
  start?: React.ReactNode;
  /** Replaces the built-in command palette. Renders even when `showSearch` is off. */
  search?: React.ReactNode;
  /** Replaces the built-in notifications dropdown. Renders even when `showNotifications` is off. */
  notifications?: React.ReactNode;
  /** Replaces the built-in settings link. Renders even when `showSettings` is off. */
  settings?: React.ReactNode;
  /** Extra items in the right cluster, after notifications, before the theme switcher. */
  actions?: React.ReactNode;
};

/** Minimal icon-sized placeholder shown while an injected slot streams in. */
function HeaderSlotFallback() {
  return <span aria-hidden className={cn('size-6 rounded-md bg-muted animate-pulse')} />;
}

/** Gives each injected slot its own boundary, so one slow slot can't delay the header. */
function HeaderSlot({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<HeaderSlotFallback />}>{children}</Suspense>;
}

interface IGRPTemplateHeaderProps extends IGRPHeaderLabelProps {
  /**
   * Header data. Optional: inside `IGRPHeaderDataProvider` (which
   * `IGRPLayoutHeader` mounts) the provider's data is used.
   */
  data?: IGRPHeaderDataArgs;
  className?: string;
  /** Pre-resolved breadcrumb items. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbs?: BreadcrumbItem[];
  /** App-level route → label map. Forwarded to IGRPTemplateBreadcrumbs. */
  breadcrumbRouteLabels?: Record<string, string>;
  /** Consumer-injected content. See IGRPHeaderSlots for positions and gating. */
  slots?: IGRPHeaderSlots;
  /**
   * Items for the built-in command palette, gated by `showSearch`.
   *
   * @deprecated The layout now fills the palette from the menus on the server.
   * For other entries, render your own palette in `slots.search`. Still works,
   * and wins over the menu commands.
   */
  commands?: IGRPCommandItem[];
  /** App-relative path to the logo used when `headerLogo` is absent or fails. */
  fallbackLogo?: string;
}

/** The default header layout, built from the parts and driven by the `show*` flags. */
function HeaderDefault({ className, slots }: { className?: string; slots?: IGRPHeaderSlots }) {
  const data = useIGRPHeaderData().data ?? {};
  const hasSidebar = useIGRPHasSidebar();
  const {
    showBreadcrumb,
    showSearch,
    showNotifications,
    showThemeSwitcher,
    showUser,
    showIGRPHeaderLogo,
    showIGRPHeaderTitle,
    showSettings,
  } = data;
  const showSidebarTrigger = Boolean(data.showIGRPSidebarTrigger && hasSidebar);

  // Whether anything renders before the `start` slot. Without this, a header
  // configured with no trigger, logo and title would open with a stray separator.
  const hasLeadingBrand = Boolean(showSidebarTrigger || showIGRPHeaderLogo || showIGRPHeaderTitle);

  // A custom notifications slot replaces the framework's dropdown, so nav-user's
  // link-only Notifications entry has to go too — otherwise the header offers two
  // inconsistent entry points, one of which the consumer's component doesn't own.
  const hasCustomNotifications = Boolean(slots?.notifications);

  return (
    <IGRPHeaderRoot className={className}>
      <IGRPHeaderStart>
        {showSidebarTrigger && <IGRPHeaderSidebarTrigger />}
        {(showIGRPHeaderLogo || showIGRPHeaderTitle) && (
          <div className="flex items-center gap-2">
            {showIGRPHeaderLogo && <IGRPHeaderLogo />}
            {showIGRPHeaderTitle && <IGRPHeaderTitle />}
          </div>
        )}

        {slots?.start && (
          <>
            {hasLeadingBrand && (
              <Separator
                orientation="vertical"
                className={cn('mr-2 data-[orientation=vertical]:h-4')}
              />
            )}
            <HeaderSlot>{slots.start}</HeaderSlot>
          </>
        )}

        {showBreadcrumb && (
          <>
            <Separator
              orientation="vertical"
              className={cn('mr-2 data-[orientation=vertical]:h-4')}
            />
            <IGRPHeaderBreadcrumbs />
          </>
        )}
      </IGRPHeaderStart>
      <IGRPHeaderEnd>
        {slots?.search ? (
          <HeaderSlot>{slots.search}</HeaderSlot>
        ) : (
          showSearch && <IGRPHeaderSearch />
        )}

        {slots?.settings ? (
          <HeaderSlot>{slots.settings}</HeaderSlot>
        ) : (
          showSettings && <IGRPHeaderSettings />
        )}

        {hasCustomNotifications ? (
          // No `hidden md:block` wrapper here, unlike the built-in: the
          // framework hides its own bell on small screens because nav-user
          // carries the mobile entry — and that entry is suppressed when a
          // custom slot is injected. Hiding this too would leave small screens
          // with no notifications at all.
          <HeaderSlot>{slots?.notifications}</HeaderSlot>
        ) : (
          showNotifications && <IGRPHeaderNotifications />
        )}

        {slots?.actions && <HeaderSlot>{slots.actions}</HeaderSlot>}

        {showThemeSwitcher && <IGRPHeaderModeSwitcher />}

        {showUser && (
          // Unset flag stays `undefined` (the menu's default, on), as before.
          <IGRPHeaderUser showNotifications={showNotifications && !hasCustomNotifications} />
        )}
      </IGRPHeaderEnd>
    </IGRPHeaderRoot>
  );
}

/**
 * The framework header: the default composition of the `IGRPHeader*` parts.
 * For a custom layout, compose the parts yourself inside
 * `IGRPHeaderDataProvider`, or pass them as `children` of `IGRPLayoutHeader`.
 */
function IGRPTemplateHeader({
  data: dataProp,
  className,
  breadcrumbs,
  breadcrumbRouteLabels,
  slots,
  commands,
  fallbackLogo,
  ...labels
}: IGRPTemplateHeaderProps) {
  const { igrpToast } = useIGRPToast();
  const inherited = useOptionalIGRPHeaderData()?.data;
  const data = dataProp ?? inherited;

  // Warn (dev) + toast when no header data is configured. This MUST run in an
  // effect, not during render — calling igrpToast() during render updates the
  // toaster provider mid-render (a React anti-pattern, and impure under the
  // React Compiler).
  useEffect(() => {
    if (data) return;
    console.info(
      '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
    );
    // Developer message, untranslated: keep it out of production UI.
    if (process.env.NODE_ENV !== 'production') {
      igrpToast({
        type: 'info',
        description:
          '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
        duration: 10000,
      });
    }
  }, [data, igrpToast]);

  if (!data) return null;

  return (
    <IGRPHeaderDataProvider
      data={dataProp}
      breadcrumbs={breadcrumbs}
      breadcrumbRouteLabels={breadcrumbRouteLabels}
      commands={commands}
      fallbackLogo={fallbackLogo}
      {...labels}
    >
      <HeaderDefault className={className} slots={slots} />
    </IGRPHeaderDataProvider>
  );
}

export { IGRPTemplateHeader, type IGRPTemplateHeaderProps };
