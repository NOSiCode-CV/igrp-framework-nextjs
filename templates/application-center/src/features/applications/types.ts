export interface Application {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  type: 'INTERNAL' | 'EXTERNAL' | 'SYSTEM';
  owner: string;
  picture?: string;
  url?: string | null;
  slug?: string;
  departmentCode: string;
  createdBy?: string;
  createdDate?: string;
  lastModifiedBy?: string;
  lastModifiedDate?: string;
}

export interface FolderRef {
  id: number;
  name: string;
  parentId?: number | null;
}

export interface MenuFormData {
  id?: number;
  name: string;
  type: 'FOLDER' | 'EXTERNAL_PAGE' | 'MENU_PAGE';
  position: number;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  target: 'INTERNAL' | 'EXTERNAL';
  url?: string;
  parentId?: number | null;
  applicationId: number;
  folderRef?: FolderRef | null;
  resourceId?: number | null;
}
