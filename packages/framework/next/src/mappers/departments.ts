import type { IGRPDepartmentArgs, IGRPStatus } from '@igrp/framework-next-types';
import type { ApiResponse, DepartmentDTO } from '@igrp/platform-access-management-client-ts';

const mapDepartment = (department: DepartmentDTO): IGRPDepartmentArgs => ({
  id: department.id as number,
  code: department.code,
  name: department.name,
  description: department.description,
  status: department.status as IGRPStatus,
  parentCode: department.parent_code || '',
});

export const mapperDepartments = (
  departments: ApiResponse<DepartmentDTO[]>,
): IGRPDepartmentArgs[] => {
  if (!departments.data) return [];
  return departments.data.map(mapDepartment);
};

export const mapperCreateDepartment = (
  department: ApiResponse<DepartmentDTO>,
): IGRPDepartmentArgs => {
  if (!department.data) return {} as IGRPDepartmentArgs;
  return mapDepartment(department.data);
};
