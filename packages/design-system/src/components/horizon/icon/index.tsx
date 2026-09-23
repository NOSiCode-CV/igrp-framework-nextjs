"use client"

import { useCallback, useEffect, useId, useSyncExternalStore } from "react"

import { AlertCircle, Icon, type IconNode, type LucideProps, type icons } from "lucide-react"
import dynamicIconImports from "lucide-react/dynamicIconImports"

import { cn } from "../cn.js"

/** Lucide icon names. */
type IGRPIconName = keyof typeof icons

/**
 * Props for the IGRPIcon component.
 * @see IGRPIcon
 */
interface IGRPIconProps extends Omit<LucideProps, "ref"> {
  /** Lucide icon name — PascalCase (`"LayoutDashboard"`) or kebab-case (`"layout-dashboard"`). */
  iconName: IGRPIconName | string
  /** HTML id attribute. */
  id?: string
}

type IconLoader = () => Promise<{ __iconNode: IconNode; default: { displayName?: string } }>

/** What a loaded icon needs to render through lucide's static `Icon`. */
type LoadedIcon = { iconNode: IconNode; className: string }

/*
 * Icons load one at a time. This component used to index lucide's full `icons`
 * object, which put all ~1,700 icons (~146 KB gzipped) in every page's bundle.
 * The names are runtime data — menus arrive from Access Management as strings —
 * so a static import per icon is impossible; lucide's per-icon lazy loaders are
 * the tree-shakeable alternative.
 *
 * lucide's own `DynamicIcon` is not used because it keeps no cache: every mount
 * renders empty until its effect re-resolves, so icons blink on every client
 * navigation even after they have loaded. The cache below makes a loaded icon
 * render synchronously for the rest of the session. It caches the icon's SVG
 * node data rather than its component, and renders it through lucide's static
 * `Icon` — the same thing lucide's per-icon components do — so no component is
 * chosen at render time.
 */
const loaders = dynamicIconImports as unknown as Record<string, IconLoader>

// PascalCase and kebab-case collapse to the same key: "Clock1" / "clock-1" →
// "clock1". lucide's colliding spellings (e.g. "grid-2x2" / "grid-2-x-2") are
// aliases that load the same file, so last-one-wins is harmless.
const loaderKeyByNormalizedName = new Map(Object.keys(loaders).map((key) => [key.replace(/-/g, ""), key]))

function resolveLoaderKey(iconName: string): string | undefined {
  return loaderKeyByNormalizedName.get(iconName.replace(/-/g, "").toLowerCase())
}

// lucide's toKebabCase — used to reproduce the class names createLucideIcon sets.
function toKebabCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
}

const loadedIcons = new Map<string, LoadedIcon>()
const pendingIcons = new Map<string, Promise<LoadedIcon>>()

// A tiny external store over `loadedIcons`, read with useSyncExternalStore so
// hydration is exact: React renders the SERVER snapshot (nothing loaded) while
// hydrating, then the client snapshot. Reading the cache directly in render
// broke that — a Suspense-streamed subtree (the header) hydrates after the
// sidebar has already loaded the same icons, rendered the real icon where the
// server sent a placeholder, and threw a hydration mismatch (React #418).
// Outside hydration the client snapshot is used from the first render, so a
// cached icon still never blinks through the placeholder.
//
// Listeners are keyed by icon: a load notifies only the instances showing THAT
// icon. A single shared listener set made every load notify every mounted
// icon — quadratic, invisible on a page with 30 icons, and it froze the main
// thread outright on a 1,700-icon gallery.
const listenersByKey = new Map<string, Set<() => void>>()

function subscribeToIcon(key: string | undefined, listener: () => void): () => void {
  if (!key) return () => {}
  let listeners = listenersByKey.get(key)
  if (!listeners) {
    listeners = new Set()
    listenersByKey.set(key, listeners)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) listenersByKey.delete(key)
  }
}

const getServerSnapshot = (): undefined => undefined

function loadIcon(key: string): Promise<LoadedIcon> {
  let pending = pendingIcons.get(key)
  if (!pending) {
    pending = loaders[key]!().then((mod) => {
      // Same classes a lucide icon component renders: `lucide-<kebab of its
      // PascalCase name>` and `lucide-<its registry name>` (`Icon` adds `lucide`).
      const displayName = mod.default.displayName ?? key
      // Deduped, as lucide's mergeClasses does — the two usually coincide.
      const classes = new Set([`lucide-${toKebabCase(displayName)}`, `lucide-${key}`])
      const icon = { iconNode: mod.__iconNode, className: [...classes].join(" ") }
      loadedIcons.set(key, icon)
      for (const listener of listenersByKey.get(key) ?? []) listener()
      return icon
    })
    // A failed chunk load must not poison the key forever — allow a retry.
    pending.catch(() => pendingIcons.delete(key))
    pendingIcons.set(key, pending)
  }
  return pending
}

/**
 * Renders a Lucide icon by name.
 *
 * The first use of a given icon in a session renders a same-sized empty `<svg>`
 * until its chunk arrives (on the server too, so hydration matches); every
 * later render of it is synchronous. An unknown name renders a destructive
 * `AlertCircle` immediately.
 */
function IGRPIcon({ iconName, className, size = 16, color = "currentColor", id, ...props }: IGRPIconProps) {
  const _id = useId()
  // Falling back to iconName would emit duplicate DOM ids for every repeat of the
  // same icon on a page, which breaks any aria-* reference pointing at one.
  const ref = id ?? _id

  const key = resolveLoaderKey(String(iconName))
  const subscribe = useCallback((listener: () => void) => subscribeToIcon(key, listener), [key])
  const icon = useSyncExternalStore(subscribe, () => (key ? loadedIcons.get(key) : undefined), getServerSnapshot)

  useEffect(() => {
    if (!key || loadedIcons.has(key)) return
    loadIcon(key).catch(() => {
      // Chunk failed to load (offline, deploy skew). Keep the placeholder
      // rather than flashing the "unknown icon" glyph for a valid name.
    })
  }, [key])

  if (!key) {
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

  if (!icon) {
    return (
      <svg aria-hidden="true" className={className} id={ref} width={size} height={size} data-igrp-icon-loading={key} />
    )
  }

  return (
    <Icon
      aria-hidden="true"
      className={className ? `${icon.className} ${className}` : icon.className}
      iconNode={icon.iconNode}
      id={ref}
      color={color}
      size={size}
      {...props}
    />
  )
}

export { IGRPIcon, type IGRPIconProps, type IGRPIconName, type LucideProps }
