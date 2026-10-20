"use client"

import { useTheme } from "next-themes"
import { useCallback, useMemo } from "react"

import { IGRP_META_THEME_COLORS } from "../lib/meta-theme-colors.js"

/**
 * Returns the current meta theme-color and a setter to update it.
 * Syncs with next-themes resolved theme.
 */
export function useIGRPMetaColor() {
  const { resolvedTheme } = useTheme()

  const metaColor = useMemo(() => {
    return resolvedTheme === "dark" ? IGRP_META_THEME_COLORS.dark : IGRP_META_THEME_COLORS.light
  }, [resolvedTheme])

  const setMetaColor = useCallback((color: string) => {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement("meta")
      meta.setAttribute("name", "theme-color")
      document.head.appendChild(meta)
    }
    meta.setAttribute("content", color)
  }, [])

  return {
    metaColor,
    setMetaColor,
  }
}
