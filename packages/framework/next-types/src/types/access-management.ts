export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE';

export type IGRPMenuTypeCRUD = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';

export type IGRPStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPTargetType = '_self' | '_blank';

export type IGRPApplicationType = 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';

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
  url?: string | null;
  slug?: string;
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
  name: string;
  icon?: string;
  description?: string;
  departmentCode: string;
  parentCode?: string;
  status: IGRPStatus;
  permissions?: IGRPPermissionArgs[];
}

export interface IGRPRoleUserArgs {
  userName: string;
  roleName: string;
}

export interface IGRPDepartmentArgs {
  id: number;
  code: string;
  name: string;
  icon?: string;
  description?: string;
  status: IGRPStatus;
  parentCode?: string;
}

export interface IGRPGlobalConfigurationArgs {
  config: string;
  type: IGRPConfigurationType;
}

export interface IGRPFileUrlArgs {
  url: string;
  expiration: string;
}

export interface IGRPPermissionArgs {
  id: number;
  name: string;
  description?: string;
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

export type IGRPResourceType = 'API' | 'UI';

export interface IGRPResourceItem {
  id: number;
  name: string;
  url?: string;
  permissionName?: string;
  resourceName: string;
  permissions?: IGRPPermissionArgs[];
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface IGRPResourceArgs {
  id: number;
  name: string;
  description?: string;
  type: IGRPResourceType;
  status: IGRPStatus;
  applications: string[];
  permissions?: IGRPPermissionArgs[];
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
