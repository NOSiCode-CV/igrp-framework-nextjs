/**
 * Framework-facing shapes for the Access Management contract.
 *
 * These deliberately mirror the DTOs of
 * `@igrp/platform-access-management-client-ts` rather than re-exporting them,
 * for one reason: the client models `status` / `type` / `resourceType` as
 * `declare enum`s, and templates author menus and applications as **object
 * literals with plain strings** (`type: 'MENU_PAGE'`). A literal union is the
 * only shape that is both authorable by hand and assignable from the enum.
 *
 * Mirroring by hand is how the two drift, so it is enforced rather than
 * trusted: `contract/am-contract.ts` asserts, at build time, that every DTO
 * below is assignable to its framework counterpart. If the AM client changes a
 * field, `pnpm --filter @igrp/framework-next-types check:contract` fails.
 * Do not edit a type here without re-running that check.
 *
 * Fields the framework deliberately **normalises** away from the DTO (and so
 * are excluded from the whole-object assertions) are called out inline.
 */

/**
 * Superset of the client's `MenuType` enum: `SYSTEM_PAGE` is framework-only
 * (framework-owned routes such as the settings page) and is never returned by
 * Access Management.
 */
export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE';

/** The subset of {@link IGRPMenuType} a menu-editing UI may create or update. */
export type IGRPMenuTypeCRUD = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';

export type IGRPStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPTargetType = '_self' | '_blank';

/**
 * Superset of the client's `ApplicationType` enum: `SYSTEM` is framework-only
 * and is never returned by Access Management.
 */
export type IGRPApplicationType = 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `GlobalConfigurationType`. Import that enum directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export type IGRPConfigurationType = 'CLUSTER' | 'ORGANIZATION';

export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  status: IGRPStatus;
  type: IGRPApplicationType;
  owner?: string;
  picture?: string | null;
  /**
   * Normalised: the DTO types this `string | null`, the applications mapper
   * collapses `null` to `undefined`.
   */
  slug?: string;
  url?: string | null;
  departments: string[];
  lastAccess?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface IGRPRoleDepartmentArgs {
  roleCode: string;
  departmentCode: string;
}

export interface IGRPMenuItemArgs {
  id?: number;
  name: string;
  code: string;
  type: IGRPMenuType;
  position: number;
  icon?: string;
  status: IGRPStatus;
  target?: IGRPTargetType;
  url?: string | null;
  pageSlug?: string | null;
  parentCode?: string | null;
  applicationCode: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  roles: IGRPRoleDepartmentArgs[];
}

export type IGRPMenuCRUDArgs = Omit<IGRPMenuItemArgs, 'type'> & {
  type: IGRPMenuTypeCRUD;
};

export interface IGRPRoleArgs {
  id: number;
  code: string;
  /** Optional on the wire — AM returns roles that carry only a `code`. */
  name?: string;
  icon?: string;
  description?: string | null;
  departmentCode: string;
  parentCode?: string | null;
  status: IGRPStatus;
  /** Permission **names**, not permission objects — matches `RoleDTO`. */
  permissions?: string[];
}

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `RoleUserDTO`. Import that type directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export interface IGRPRoleUserArgs {
  userName: string;
  roleName: string;
}

export interface IGRPDepartmentArgs {
  id: number;
  code: string;
  name: string;
  icon?: string;
  description?: string | null;
  /** Optional on the wire — `DepartmentDTO.status` may be absent. */
  status?: IGRPStatus;
  parentCode?: string;
}

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `GlobalConfigurationDTO`. Import that type directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export interface IGRPGlobalConfigurationArgs {
  config: string;
  type: IGRPConfigurationType;
}

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `FileUrlDTO` — which types `expiration` as a `Date`, not a `string`. Import
 * that type directly from `@igrp/platform-access-management-client-ts`. Kept
 * for one release.
 */
export interface IGRPFileUrlArgs {
  url: string;
  expiration: string | Date;
}

export interface IGRPPermissionArgs {
  id: number;
  name: string;
  description?: string | null;
  status: IGRPStatus;
  departmentCode: string;
}

/**
 * A permission an application **declares** so it gets registered in the
 * Access Management catalog. Distinct from the two neighbouring senses of
 * "permission" in this codebase — keep them apart:
 *
 * - `IGRPPermissionCatalogEntry` (this type) — what the app declares. Carries
 *   only what the app can legitimately know: a name, a human description, and
 *   whether it is active. No `id` (AM assigns it), no `departmentCode` (a
 *   manager binds the permission to roles/departments later in the AM UI).
 * - `IGRPPermissionArgs` — a permission **as AM returns it**: has AM's `id`,
 *   `status`, and `departmentCode`. A read model; never an input to the sync.
 * - A permission **claim** on the access token — the string `${org}.${suffix}`
 *   matched by `claimsAllow`. Registering an entry here does NOT make it
 *   checkable: AM still has to grant it to a role, and the user's token has to
 *   carry the resulting claim.
 *
 * `name` must match `^[A-Za-z0-9._-]+$` and be ≤ 255 chars (the AM contract);
 * it is the upsert key, so never rename in place — retire and add instead.
 */
export interface IGRPPermissionCatalogEntry {
  /** Upsert key. Prefer a bare suffix (`manage_access`) — see the note above. */
  name: string;
  /** Human-readable label; surfaces in the AM admin UI. */
  description?: string;
  /** `true` → `ACTIVE`, `false` → `INACTIVE`. Disabled entries still exist in AM. */
  enabled: boolean;
}

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `ResourceType`. Import that enum directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export type IGRPResourceType = 'API' | 'UI';

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `ResourceItemDTO`. Import that type directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export interface IGRPResourceItem {
  id?: number;
  name: string;
  url?: string;
  permissionName?: string;
  resourceName: string;
  /** Permission **names**, not permission objects — matches `ResourceItemDTO`. */
  permissions?: string[];
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

/**
 * @deprecated Unused by the framework and a pure mirror of the AM client's
 * `ResourceDTO`. Import that type directly from
 * `@igrp/platform-access-management-client-ts`. Kept for one release.
 */
export interface IGRPResourceArgs {
  id?: number;
  name: string;
  description?: string;
  type: IGRPResourceType;
  status?: IGRPStatus;
  applications: string[];
  /** Permission **names**, not permission objects — matches `ResourceDTO`. */
  permissions?: string[];
  items?: IGRPResourceItem[];
  externalId?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface IGRPUserArgs {
  id: string;
  name: string;
  username?: string;
  email: string;
  status: IGRPStatus;
  picture?: string;
  signature?: string;
}
