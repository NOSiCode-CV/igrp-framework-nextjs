import type {
  IGRPBrandingTokenCatalogEntry,
  IGRPBrandingTokenGroup,
} from '@igrp/framework-next-types';

const GROUPS: Record<IGRPBrandingTokenGroup, string[]> = {
  brand: [
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--accent',
    '--accent-foreground',
    '--ring',
  ],
  surface: [
    '--background',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--muted',
    '--border',
    '--input',
  ],
  text: ['--foreground', '--muted-foreground'],
  status: [
    '--destructive',
    '--destructive-foreground',
    '--success',
    '--success-foreground',
    '--warning',
    '--warning-foreground',
    '--info',
    '--info-foreground',
    '--indigo',
    '--indigo-foreground',
    '--highlight',
    '--highlight-foreground',
  ],
  sidebar: [
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-active',
    '--sidebar-active-foreground',
    '--sidebar-border',
    '--sidebar-ring',
  ],
  chart: [
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    '--chart-6',
    '--chart-7',
    '--chart-8',
  ],
  other: ['--ring-invalid', '--process-completed', '--process-active'],
};

/** The 50 core Tokens a Brand may override, grouped as the editor shows them. */
export const IGRP_BRANDING_CORE_TOKENS: IGRPBrandingTokenCatalogEntry[] = Object.entries(
  GROUPS,
).flatMap(([group, names]) =>
  names.map((name) => ({ name, group: group as IGRPBrandingTokenGroup })),
);
