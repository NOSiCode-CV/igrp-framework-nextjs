export interface Role {
  id: number;
  name: string;
  description: string;
  departmentId: number;
  parentId: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  roleId: number;
}
