export interface UserProps {
  id: string;
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

export interface DepartmentProps {
  departmentName: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  availablePermissions: string[];
  application: string;
}

export type InviteUserProps = {
  email: string;
  appCode?: string;
  departmentCode?: string;
  roles?: string;
};

export interface UserPropsImage {
  link: string;
}
