export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE';

export type IGRPMenuTypeCRUD = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';

export type IGRPStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPTargetType = '_self' | '_blank';

export type IGRPApplicationType = 'INTERNAL' | 'EXTERNAL';

export type IGRPConfigurationType = 'CLUSTER' | 'ORGANIZATION';

export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: IGRPStatus;
  type: IGRPApplicationType;
  owner?: string;
  picture?: string;
  url?: string;
  slug?: string;
  departmentCode: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface IGRPMenuItemArgs {
  id: number;
  code: string;
  name: string;
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
  permissions: string[];
}

export type IGRPMenuCRUDArgs = Omit<IGRPMenuItemArgs, 'type'> & {
  type: IGRPMenuTypeCRUD;
};

export interface IGRPRoleArgs {
  id: number;
  name: string;
  description?: string;
  departmentCode: string;
  parentName?: string;
  status: IGRPStatus;
}

export interface IGRPRoleUserArgs {
  userName: string;
  roleName: string;
}

export interface IGRPDepartmentArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status?: IGRPStatus;
  parentCode?: string;
}

export interface IGRPGlobalConfigurationArgs {
  config: string;
  type: IGRPConfigurationType;
}

export interface IGRPFileUrlArgs {
  url: string;
  expiration: Date;
}

export interface IGRPPermissionArgs {
  id: number;
  name: string;
  description?: string;
  status: IGRPStatus;
  applicationCode: string;
}

export type IGRPResourceType = 'API' | 'UI';

export interface IGRPResourceItem {
  id: number;
  name: string;
  url?: string;
  permissionName?: string;
  resourceName: string;
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
  applicationCode: string;
  items?: IGRPResourceItem[];
  externalId?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface IGRPUserArgs {
  id: number;
  name: string;
  username: string;
  email: string;
}
