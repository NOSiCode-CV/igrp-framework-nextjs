import React from 'react'
import { useDepartmentAvailableMenus } from '../use-departments';

export default function DepartamentMenus({ departmentCode }: { departmentCode: string }) {
    const { data: menus, isLoading } = useDepartmentAvailableMenus(departmentCode || "");
    console.log("select - ", menus)

  return (
    <div></div>
  )
}
