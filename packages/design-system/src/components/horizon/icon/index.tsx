"use client"

// IGRPIconObject / IGRPIconList are published alongside the component and are derived
// from the same lucide import; splitting them would duplicate that import.
/* eslint-disable react-refresh/only-export-components */

import { useId } from "react"

import { AlertCircle, type LucideProps, icons } from "lucide-react"

import { cn } from "../cn.js"

/** Lucide icon names. */
type IGRPIconName = keyof typeof icons

const IGRPIconObject = Object.keys(icons).sort()
const IGRPIconList = icons

/**
 * Props for the IGRPIcon component.
 * @see IGRPIcon
 */
interface IGRPIconProps extends Omit<LucideProps, "ref"> {
  /** Lucide icon name. */
  iconName: IGRPIconName | string
  /** HTML id attribute. */
  id?: string
}

/**
 * Renders a Lucide icon by name.
 */
function IGRPIcon({ iconName, className, size = 16, color = "currentColor", id, ...props }: IGRPIconProps) {
  const _id = useId()
  const LucideIcon = icons[iconName as IGRPIconName]

  // Falling back to iconName would emit duplicate DOM ids for every repeat of the
  // same icon on a page, which breaks any aria-* reference pointing at one.
  const ref = id ?? _id

  if (!LucideIcon) {
    // The fallback keeps the caller's sizing and class names so a bad icon name
    // changes the glyph, not the layout around it. Warning here would run during
    // render (twice under StrictMode, and impure as far as the React Compiler is
    // concerned), so the signal is the destructive-coloured glyph instead.
    return (
      <AlertCircle
        aria-hidden="true"
        className={cn("text-destructive", className)}
        id={ref}
        size={size}
        {...props}
        data-igrp-unknown-icon={String(iconName)}
      />
    )
  }

  return <LucideIcon aria-hidden="true" className={className} id={ref} color={color} size={size} {...props} />
}

export { IGRPIcon, IGRPIconObject, type IGRPIconProps, type IGRPIconName, type LucideProps, IGRPIconList }
