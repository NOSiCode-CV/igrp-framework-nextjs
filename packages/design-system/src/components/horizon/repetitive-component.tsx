"use client"

import { Fragment, useId, type ReactNode } from "react"

/**
 * Props for the IGRPRepetitiveComponent component.
 * @see IGRPRepetitiveComponent
 */
interface IGRPRepetitiveComponentProps<T> {
  /** Array of items to render. */
  items: T[]
  /** Render function for each item. */
  children: (item: T) => ReactNode
  /** Extracts unique key from each item. */
  keyExtractor: (item: T) => string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
}

/**
 * Renders a list of items using a render prop.
 */
function IGRPRepetitiveComponent<T>({ items, children, keyExtractor, name, id }: IGRPRepetitiveComponentProps<T>) {
  const _id = useId()
  const ref = name ?? id ?? _id

  return (
    <div id={ref}>
      {items.map((item) => (
        <Fragment key={keyExtractor(item)}>{children(item)}</Fragment>
      ))}
    </div>
  )
}

export { IGRPRepetitiveComponent, type IGRPRepetitiveComponentProps }
