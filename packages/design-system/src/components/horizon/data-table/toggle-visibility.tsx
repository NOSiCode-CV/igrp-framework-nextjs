"use no memo"

import { type Table } from "@tanstack/react-table"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../primitives/dropdown-menu"
import { cn } from "../../../lib/utils"
import { IGRPButton } from "../button"
import { useIGRPi18n } from "../../../i18n"

/**
 * Props for the IGRPDataTableToggleVisibility component.
 * @see IGRPDataTableToggleVisibility
 */
type IGRPDataTableVisibilityProps<TData> = {
  /** TanStack Table instance. */
  table: Table<TData>
  /** Button label. */
  label?: string
  /** Dropdown header label. */
  optionsLabel?: string
}

/**
 * Dropdown to toggle column visibility in a data table.
 * Renders a button that opens a list of hideable columns.
 */
function IGRPDataTableToggleVisibility<TData>({ table, label, optionsLabel }: IGRPDataTableVisibilityProps<TData>) {
  const i18n = useIGRPi18n()
  const resolvedOptionsLabel = optionsLabel ?? i18n.dataTable.toggleColumns
  const resolvedLabel = label ?? i18n.dataTable.view

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IGRPButton variant="outline" showIcon={true} iconName="Columns3">
          {resolvedLabel}
        </IGRPButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{resolvedOptionsLabel}</DropdownMenuLabel>
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className={cn("capitalize")}
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { IGRPDataTableToggleVisibility, type IGRPDataTableVisibilityProps }
