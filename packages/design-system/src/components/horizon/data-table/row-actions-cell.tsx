"use client"

import type { Row } from "@tanstack/react-table"

import { IGRPDataTableButtonAlert, IGRPDataTableButtonLink, IGRPDataTableButtonModal } from "./action-button-icon"
import {
  IGRPDataTableDropdownMenu,
  IGRPDataTableDropdownMenuAlert,
  IGRPDataTableDropdownMenuLink,
  IGRPDataTableDropdownMenuCustom,
  type IGRPDataTableActionDropdown,
} from "./action-dropdown-menu"
import type { IGRPDataTableAction } from "./types"

interface IGRPDataTableRowActionsCellProps<TData> {
  row: Row<TData>
  actions: IGRPDataTableAction<TData>[]
}

/**
 * Renders inline icon buttons (≤2 actions) or a dropdown (>2 actions) for a single row.
 * Lives in its own file (no `"use no memo"` directive) so the React Compiler can
 * memoize per-row renders — the parent `IGRPDataTable` opts out of compiler memoization
 * because `useReactTable` mutates state in ways the compiler can't reason about.
 * @internal
 */
function IGRPDataTableRowActionsCell<TData>({ row, actions }: IGRPDataTableRowActionsCellProps<TData>) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row))
  if (visibleActions.length === 0) return null

  if (visibleActions.length <= 2) {
    return (
      <div className="flex items-center gap-1">
        {visibleActions.map((action, i) => {
          if (action.type === "link") {
            return (
              <IGRPDataTableButtonLink
                key={i}
                href={action.href(row)}
                icon={action.icon ?? "Eye"}
                labelTrigger={action.label}
                disabled={action.disabled?.(row)}
              />
            )
          }
          if (action.type === "alert") {
            return (
              <IGRPDataTableButtonAlert
                key={i}
                icon={action.icon ?? "Trash2"}
                labelTrigger={action.label}
                modalTitle={action.title}
                onClickConfirm={() => action.onConfirm(row)}
                disabled={action.disabled?.(row)}
              >
                {action.description}
              </IGRPDataTableButtonAlert>
            )
          }
          if (action.type === "modal") {
            return (
              <IGRPDataTableButtonModal
                key={i}
                icon={action.icon ?? "Edit"}
                labelTrigger={action.label}
                disabled={action.disabled?.(row)}
                render={(close) => action.render(row, close)}
              />
            )
          }
          if (action.type === "custom") {
            return <span key={i}>{action.render(row)}</span>
          }
          return null
        })}
      </div>
    )
  }

  // >2 actions: dropdown
  const dropdownItems: IGRPDataTableActionDropdown[] = []
  for (const action of visibleActions) {
    if (action.type === "link") {
      dropdownItems.push({
        component: IGRPDataTableDropdownMenuLink,
        props: { labelTrigger: action.label, href: action.href(row) },
      })
    } else if (action.type === "alert") {
      dropdownItems.push({
        component: IGRPDataTableDropdownMenuAlert,
        props: {
          labelTrigger: action.label,
          modalTitle: action.title,
          children: action.description,
          onClickConfirm: () => action.onConfirm(row),
        },
      })
    } else if (action.type === "modal") {
      const capturedRender = action.render
      dropdownItems.push({
        component: IGRPDataTableDropdownMenuCustom,
        props: {
          labelTrigger: action.label,
          action: () => {
            capturedRender(row, () => undefined)
          },
        },
      })
    } else if (action.type === "custom") {
      const capturedRender = action.render
      dropdownItems.push({
        component: IGRPDataTableDropdownMenuCustom,
        props: {
          labelTrigger: action.label,
          action: () => {
            capturedRender(row)
          },
        },
      })
    }
  }

  return <IGRPDataTableDropdownMenu items={dropdownItems} />
}

export { IGRPDataTableRowActionsCell }
