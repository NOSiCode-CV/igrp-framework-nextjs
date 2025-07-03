export interface IGRPApplicationArgs {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  type: 'INTERNAL' | 'EXTERNAL';
  owner: string;
  picture?: string;
  url?: string | null;
  slug?: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
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

export interface IGRPMenuItemArgs {  
  id: number;
  name: string;
  type: 'FOLDER' | 'MENU_PAGE' | 'EXTERNAL_PAGE';
  position: number;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  target: 'INTERNAL' | 'EXTERNAL';
  url: string | null;
  parentId: number | null;
  applicationId: number;
  resourceId: number | null;
  createdBy: string;
  createdDate: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
}