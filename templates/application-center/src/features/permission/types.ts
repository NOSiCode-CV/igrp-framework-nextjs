export interface Permission {
  id: number;
  name: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  applicationId: number;
}

export interface PermissionRole {
  id: number;
  permissionId: number;
  roleId: number;
  permission: Permission;
}
