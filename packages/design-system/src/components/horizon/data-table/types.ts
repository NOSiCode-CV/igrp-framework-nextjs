import type { ReactNode } from "react"
import type { Row } from "@tanstack/react-table"
import type { IGRPIconName } from "../icon"

// ─── Actions ────────────────────────────────────────────────────────────────

export type IGRPDataTableActionType = "link" | "alert" | "modal" | "custom"

export interface IGRPDataTableActionBase<TData> {
  type: IGRPDataTableActionType
  label: string
  icon?: IGRPIconName
  hidden?: (row: Row<TData>) => boolean
  disabled?: (row: Row<TData>) => boolean
}

export interface IGRPDataTableActionLink<TData> extends IGRPDataTableActionBase<TData> {
  type: "link"
  href: (row: Row<TData>) => string
}

export interface IGRPDataTableActionAlert<TData> extends IGRPDataTableActionBase<TData> {
  type: "alert"
  title: string
  description?: string
  onConfirm: (row: Row<TData>) => void | Promise<void>
}

/**
 * Renders a modal dialog triggered by a button.
 * Note: When >2 actions collapse into a dropdown, the `close` callback
 * passed to `render` is a no-op. Use alert or link types if dropdown-compatible
 * close behavior is required.
 */
export interface IGRPDataTableActionModal<TData> extends IGRPDataTableActionBase<TData> {
  type: "modal"
  render: (row: Row<TData>, close: () => void) => ReactNode
}

export interface IGRPDataTableActionCustom<TData> extends IGRPDataTableActionBase<TData> {
  type: "custom"
  render: (row: Row<TData>) => ReactNode
}

export type IGRPDataTableAction<TData> =
  | IGRPDataTableActionLink<TData>
  | IGRPDataTableActionAlert<TData>
  | IGRPDataTableActionModal<TData>
  | IGRPDataTableActionCustom<TData>

// ─── Filter descriptors ──────────────────────────────────────────────────────

export type IGRPDataTableFilterType = "input" | "select" | "dropdown" | "faceted" | "date" | "range"

export interface IGRPDataTableFilterDescriptor {
  type: IGRPDataTableFilterType
  placeholder?: string
  /** Accessible label for the input filter (type "input"). */
  ariaLabel?: string
  options?: { label: string; value: string }[]
  render?: (column: unknown) => ReactNode
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface IGRPDataTablePaginationConfig {
  type?: "simple" | "numeric"
  pageSizeOptions?: number[]
  defaultPageSize?: number
}

// ─── Server-side query ───────────────────────────────────────────────────────

export interface IGRPDataTableQuery {
  page: number
  pageSize: number
  sorting: { id: string; desc: boolean }[]
  filters: { id: string; value: unknown }[]
}
