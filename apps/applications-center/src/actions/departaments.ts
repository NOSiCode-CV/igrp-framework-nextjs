'use server';

import { callApi } from '@/lib/api-client';
import { getIGRPAccessClient, mapperDepartments } from '@igrp/framework-next';

export async function getDepartments() {
  // return callApi<Department[]>('/api/departments', {
  //   method: 'GET',
  // });
  try {   
      const client = await getIGRPAccessClient();
      const result = await client.departments.getDepartments();
      const departments = mapperDepartments(result);
      return departments;
    } catch (error) {
      console.error('[departments] Não foi possível obter lista de dados dos departamentos:', error);
      throw error;
    }
}

// export async function getDepartment(id: number) {
//   if (!id) {
//     throw new Error('Department ID is required');
//   }

//   return callApi<Department>(`/api/departments/${id}`, {
//     method: 'GET',
//   });
// }

// export async function createDepartment(departmentData: Partial<Department>) {
//   if (!departmentData.name || !departmentData.code) {
//     throw new Error('Name and code are required');
//   }

//   return callApi<Department>('/api/department', {
//     method: 'POST',
//     body: JSON.stringify(departmentData),
//   });
// }

// export async function updateDepartment(id: number, departmentData: Partial<Department>) {
//   if (!id) {
//     throw new Error('Department ID is required');
//   }

//   return callApi<Department>(`/api/departments/${id}`, {
//     method: 'PUT',
//     body: JSON.stringify(departmentData),
//   });
// }

// export async function deleteDepartment(id: number) {
//   if (!id) {
//     throw new Error('Department ID is required');
//   }

//   return callApi<void>(`/api/departments/${id}`, {
//     method: 'DELETE',
//   });
// }
