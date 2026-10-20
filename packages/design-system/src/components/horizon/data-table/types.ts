import type { ReactNode } from "react"
import type { Row } from "@tanstack/react-table"
import type { IGRPIconName } from "../icon/index.js"

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
 * Renders a modal dialog, triggered by an icon button inline (≤2 actions) or a menu item
 * in the dropdown (>2). In both, `close` closes the dialog. The dialog shows a cancel
 * button; put your own submit/confirm controls in `render`.
 */
export interface IGRPDataTableActionModal<TData> extends IGRPDataTableActionBase<TData> {
  type: "modal"
  render: (row: Row<TData>, close: () => void) => ReactNode
}

/**
 * Renders `render(row)` as-is inline (≤2 actions). In the dropdown (>2) the returned element
 * becomes the menu item itself (its `onClick` runs on select), so return one element such as
 * an `IGRPButton`, and keep any overlay it opens outside the menu.
 */
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
