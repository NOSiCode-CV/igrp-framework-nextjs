export interface Application {
  id: number;
  type: 'INTERNAL' | 'EXTERNAL';
  owner: string;
  name: string;
  description?: string;
  code: string;
  url?: string | null;
  slug?: string;
  creationDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  picture?: string;
  userPermissions?: string[];
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
