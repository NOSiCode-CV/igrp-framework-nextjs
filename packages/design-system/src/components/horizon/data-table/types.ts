import type { ReactNode } from "react"
import type { Row } from "@tanstack/react-table"

// ─── Actions ────────────────────────────────────────────────────────────────

export type IGRPDataTableActionType = "link" | "alert" | "modal" | "custom"

export interface IGRPDataTableActionBase<TData> {
  type: IGRPDataTableActionType
  label: string
  icon?: string
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

export type IGRPDataTableFilterType =
  | "input"
  | "select"
  | "dropdown"
  | "faceted"
  | "date"
  | "range"

export interface IGRPDataTableFilterDescriptor {
  type: IGRPDataTableFilterType
  placeholder?: string
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
