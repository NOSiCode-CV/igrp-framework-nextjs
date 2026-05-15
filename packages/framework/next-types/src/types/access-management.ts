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
  id: number;
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
