export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE' | 'GROUP' | 'SYSTEM_PAGE';

export type IGRPItemStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPItemTarget = 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';

export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: IGRPItemStatus;
  type: IGRPItemTarget;
  owner: string;
  picture?: string;
  url?: string | null;
  slug?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
  departmentCode: string;
}

export interface IGRPUserArgs {
  id: number;
  igrpUsername: string;
  username: string;
  fullname?: string | null;
  name: string;
  email: string;
  roles?: string[];
  departments?: string[];
  apps?: string[];
  status: IGRPItemStatus;
  signature?: string | null;
  image?: string | null;
  picture?: string | null;
}

export type IGRPMenuItemArgs = {
  id: number;
    code: string;

  name: string;
  type: IGRPMenuType;
  position: number;
  icon: string | null;
  status: IGRPItemStatus;
  target: string;
  url: string | null;
  pageSlug: string | null;
  applicationCode?: string;
  permissions: string[];
};