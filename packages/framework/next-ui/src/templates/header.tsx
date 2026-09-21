'use client';

import { Suspense, useEffect } from 'react';
import type { IGRPHeaderDataArgs } from '@igrp/framework-next-types';
import {
  cn,
  IGRPIcon,
  Separator,
  SidebarTrigger,
  useIGRPToast,
} from '@igrp/igrp-framework-react-design-system';

import { type BreadcrumbItem, IGRPTemplateBreadcrumbs } from './breadcrumbs.js';
import {
  IGRPTemplateCommandSearch,
  type IGRPCommandItem,
  type IGRPCommandSearchLabels,
} from './command-search.js';
import { IGRPTemplateModeSwitcher, type IGRPModeSwitcherLabels } from './mode-switcher.js';
import { IGRPTemplateNavUser, type IGRPNavUserLabels } from './nav-user.js';
import { IGRPTemplateNotifications, type IGRPNotificationsLabels } from './notifications.js';
import { IGRPTemplateImage } from './template-image.js';
import { withBasePath } from '../lib/utils.js';
import Image from 'next/image';
import Link from 'next/link';

/**
 * Logo used when the header data carries no logo, or its logo fails to load.
 *
 * This package publishes only `dist`, so the file is NOT shipped with it — the
 * path is a contract with the consuming app's `public/` directory. Apps that do
 * not have it should pass `fallbackLogo`, otherwise the fallback is itself a
 * broken image, which is the one case a fallback exists to prevent.
 */
const DEFAULT_HEADER_LOGO = '/logo-no-text.png';

/**
 * Consumer-injected header content, positioned by the framework.
 *
 * Slots are React **elements**, never component references — the header is a
 * Client Component rendered from a Server Component, and functions cannot cross
 * that boundary. An element may itself be produced by an async Server Component;
 * each slot renders inside its own <Suspense> so a slow one can't delay the bar.
 *
 * Gating differs by position:
 * - `search`, `notifications` and `settings` occupy positions the framework
 *   already knows about, so `showSearch`/`showNotifications`/`showSettings`
 *   still decide whether the position renders at all; the slot only replaces
 *   *what* renders there.
 * - `start` and `actions` have no flag — passing the node is the whole contract.
 */
export type IGRPHeaderSlots = {
  /** Left region, after the logo/title and before the breadcrumbs. */
  start?: React.ReactNode;
  /** Replaces the built-in command palette. Gated by `showSearch`. */
  search?: React.ReactNode;
  /** Replaces the built-in notifications dropdown. Gated by `showNotifications`. */
  notifications?: React.ReactNode;
  /** Replaces the built-in settings link. Gated by `showSettings`. */
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

interface IGRPTemplateHeaderProps {
  /** Optional because the component already renders nothing without it. */
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
   * Without these the palette opens empty on every ⌘K — the only way to give it
   * contents used to be replacing it wholesale through `slots.search`.
   */
  commands?: IGRPCommandItem[];
  /** App-relative path to the logo used when `headerLogo` is absent or fails. */
  fallbackLogo?: string;
  /**
   * Accessible name of the built-in settings link. pt-PT default.
   *
   * The link renders an icon and nothing else, so without this a screen reader
   * announces only the href.
   */
  settingsLabel?: string;
  /**
   * Partial overrides of the pt-PT strings of the header's children.
   *
   * Each child owns its own catalog, but the header is how apps actually mount
   * them — without these pass-throughs the override props existed and were
   * unreachable.
   */
  navUserLabels?: Partial<IGRPNavUserLabels>;
  commandSearchLabels?: Partial<IGRPCommandSearchLabels>;
  notificationsLabels?: Partial<IGRPNotificationsLabels>;
  modeSwitcherLabels?: Partial<IGRPModeSwitcherLabels>;
  /** Screen-reader label for the breadcrumb home link. pt-PT default. */
  breadcrumbHomeLabel?: string;
  /** Screen-reader label for the collapsed-breadcrumbs menu. pt-PT default. */
  breadcrumbEllipsisLabel?: string;
}

function IGRPTemplateHeader({
  data,
  className,
  breadcrumbs,
  breadcrumbRouteLabels,
  slots,
  commands,
  fallbackLogo = DEFAULT_HEADER_LOGO,
  settingsLabel = 'Definições',
  navUserLabels,
  commandSearchLabels,
  notificationsLabels,
  modeSwitcherLabels,
  breadcrumbHomeLabel,
  breadcrumbEllipsisLabel,
}: IGRPTemplateHeaderProps) {
  const { igrpToast } = useIGRPToast();

  // Warn (dev) + toast when no header data is configured. This MUST run in an
  // effect, not during render — calling igrpToast() during render updates the
  // toaster provider mid-render (a React anti-pattern, and impure under the
  // React Compiler).
  useEffect(() => {
    if (data) return;
    console.info(
      '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
    );
    igrpToast({
      type: 'info',
      description:
        '[header-template] Cabeçalho do IGRP não tem dados, define os dados no src/igrp.template.config.',
      duration: 10000,
    });
  }, [data, igrpToast]);

  if (!data) return null;

  const {
    user,
    showBreadcrumb,
    showSearch,
    showNotifications,
    showThemeSwitcher,
    showUser,
    showIGRPSidebarTrigger,
    showIGRPHeaderLogo,
    showIGRPHeaderTitle,
    headerLogo,
    showSettings,
    settingsUrl,
    settingsIcon,
    userProfileUrl,
    notificationsUrl,
    notifications,
  } = data;

  // Whether anything renders before the `start` slot. Without this, a header
  // configured with no trigger, logo and title would open with a stray separator.
  const hasLeadingBrand = Boolean(
    showIGRPSidebarTrigger || showIGRPHeaderLogo || showIGRPHeaderTitle,
  );

  // A custom notifications slot replaces the framework's dropdown, so nav-user's
  // link-only Notifications entry has to go too — otherwise the header offers two
  // inconsistent entry points, one of which the consumer's component doesn't own.
  const hasCustomNotifications = Boolean(slots?.notifications);

  return (
    <div
      className={cn(
        'bg-background sticky top-0 inset-x-0 isolate z-40 border-b flex items-center justify-between gap-2 px-4 py-2 min-w-0',
        className,
      )}
    >
      <div className="flex items-center gap-2 h-12 min-w-0">
        {showIGRPSidebarTrigger && <SidebarTrigger className="-ml-1" />}
        {(showIGRPHeaderLogo || showIGRPHeaderTitle) && (
          <div className="flex items-center gap-2">
            {showIGRPHeaderLogo && (
              <div className="size-10 rounded-lg overflow-hidden flex items-center justify-center">
                <IGRPTemplateImage
                  src={headerLogo || withBasePath(fallbackLogo)}
                  alt="IGRP"
                  width={40}
                  height={40}
                  className="object-contain size-10"
                  priority
                  fallback={
                    <Image
                      src={withBasePath(fallbackLogo)}
                      alt="IGRP"
                      width={40}
                      height={40}
                      className="object-contain size-10"
                      priority
                    />
                  }
                />
              </div>
            )}
            {showIGRPHeaderTitle && <span className="text-base font-semibold">iGRP</span>}
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
            <IGRPTemplateBreadcrumbs
              items={breadcrumbs}
              routeLabels={breadcrumbRouteLabels}
              homeLabel={breadcrumbHomeLabel}
              ellipsisLabel={breadcrumbEllipsisLabel}
            />
          </>
        )}
      </div>
      <div className={cn('flex items-center gap-2 shrink-0')}>
        {showSearch &&
          (slots?.search ? (
            <HeaderSlot>{slots.search}</HeaderSlot>
          ) : (
            <IGRPTemplateCommandSearch commands={commands} labels={commandSearchLabels} />
          ))}

        {showSettings &&
          (slots?.settings ? (
            <HeaderSlot>{slots.settings}</HeaderSlot>
          ) : (
            // `aria-label` IS the accessible name here — it overrides element
            // content, so an additional sr-only span would never be announced.
            <Link href={settingsUrl || '/settings'} aria-label={settingsLabel}>
              <IGRPIcon iconName={settingsIcon ?? 'Settings'} aria-hidden="true" />
            </Link>
          ))}

        {showNotifications &&
          (hasCustomNotifications ? (
            // No `hidden md:block` wrapper here, unlike the built-in below: the
            // framework hides its own bell on small screens because nav-user
            // carries the mobile entry — and that entry is suppressed when a
            // custom slot is injected. Hiding this too would leave small screens
            // with no notifications at all.
            <HeaderSlot>{slots?.notifications}</HeaderSlot>
          ) : (
            <span className={cn('hidden md:block')}>
              <IGRPTemplateNotifications
                notifications={notifications || []}
                notificationsUrl={notificationsUrl}
                labels={notificationsLabels}
              />
            </span>
          ))}

        {slots?.actions && <HeaderSlot>{slots.actions}</HeaderSlot>}

        {showThemeSwitcher && <IGRPTemplateModeSwitcher labels={modeSwitcherLabels} />}

        {showUser && (
          <IGRPTemplateNavUser
            user={user}
            isHeader={true}
            userProfileUrl={userProfileUrl}
            notificationsUrl={notificationsUrl}
            showNotifications={showNotifications && !hasCustomNotifications}
            labels={navUserLabels}
          />
        )}
      </div>
    </div>
  );
}

export { IGRPTemplateHeader };
