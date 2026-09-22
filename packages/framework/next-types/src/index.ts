/**
 * Public barrel.
 *
 * Relative specifiers carry an explicit `.js` extension and must keep it.
 * `tsc` copies them verbatim into `dist/*.d.ts`, and this package is
 * `"type": "module"`, so an extensionless specifier is unresolvable for any
 * consumer on `moduleResolution: "node16" | "nodenext"`. Worse, it fails
 * *silently*: the resulting TS2834 is reported inside a `.d.ts`, which the
 * near-universal `skipLibCheck: true` suppresses — every type in this package
 * then degrades to `any` with no diagnostic anywhere. The in-repo consumers
 * all use `moduleResolution: "bundler"`, which accepts both forms, so nothing
 * here would catch a regression.
 */
export type {
  IGRPMenuType,
  IGRPMenuTypeCRUD,
  IGRPMenuTypeSyncable,
  IGRPStatus,
  IGRPTargetType,
  IGRPApplicationType,
  IGRPApplicationTypeSyncable,
  IGRPConfigurationType,
  IGRPApplicationArgs,
  IGRPMenuItemArgs,
  IGRPRoleDepartmentArgs,
  IGRPMenuCRUDArgs,
  IGRPRoleArgs,
  IGRPRoleUserArgs,
  IGRPDepartmentArgs,
  IGRPGlobalConfigurationArgs,
  IGRPFileUrlArgs,
  IGRPPermissionArgs,
  IGRPPermissionCatalogEntry,
  IGRPResourceType,
  IGRPResourceItem,
  IGRPResourceArgs,
  IGRPUserArgs,
} from './types/access-management.js';

export type {
  IGRPLayoutDataSource,
  IGRPMockDataAsync,
  IGRPMockData,
  IGRPToasterPosition,
  IGRPPackageJson,
} from './types/globals.js';

export type { IGRPHeaderDataArgs, IGRPNotificationArgs } from './types/header.js';

export type { IGRPConfigArgs, IGRPConfigClient, IGRPLayoutConfigArgs } from './types/igrp.js';

export type { IGRPSidebarDataArgs } from './types/sidebar.js';

export type { IGRPAccessClaims, IGRPClaimsState } from '@igrp/framework-next-auth/claims';
