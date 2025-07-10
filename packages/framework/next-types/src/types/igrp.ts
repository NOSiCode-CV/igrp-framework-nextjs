export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: IGRPItemStatus;
  type: IGRPItemTarget;
  owner?: string;
  picture?: string;
  url?: string | null;
  slug?: string;
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
  status: 'ACTIVE' | 'INACTIVE';
  signature?: string | null;
  image?: string | null;
  picture?: string | null;
}

export type IGRPMenuType = 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';

export type IGRPItemStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export type IGRPItemTarget = 'INTERNAL' | 'EXTERNAL';

export type IGRPMenuItemArgs = {
  id: number;
  name: string;
  type: IGRPMenuType;
  position: number | null;
  icon: string | undefined;
  status: IGRPItemStatus;
  target: IGRPItemTarget;
  url: string | null;
  parentId: number | null;
  applicationId: number;
  resourceId: number | null;
};