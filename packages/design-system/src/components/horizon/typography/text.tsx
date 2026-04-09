/* eslint-disable react-refresh/only-export-components */
"use client"

import { useId } from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { IGRPColors, type IGRPColorVariants } from "../../../lib/colors"
import { cn } from "../../../lib/utils"

const EMPTY_HIGHLIGHT: string[] = []

/** Escapes special regex characters in a string. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** @internal Renders text with optional term highlighting. */
function TextWithHighlight({ text, highlight }: { text: string; highlight: string[] }) {
  if (highlight.length === 0) return <>{text}</>

  const parts: React.ReactNode[] = []
  const remaining = text
  const combinedPattern = highlight.map((term) => escapeRegExp(term)).join("|")
  const regex = new RegExp(`(${combinedPattern})`, "gi")
  let lastIndex = 0
  let match: RegExpExecArray | null
  let matchIndex = 0

  while ((match = regex.exec(remaining)) !== null) {
    parts.push(remaining.slice(lastIndex, match.index))
    parts.push(
      <mark key={`h-${matchIndex}`} className={cn("bg-yellow-200 dark:bg-yellow-800 px-1 rounded")}>
        {match[0]}
      </mark>,
    )
    lastIndex = match.index + match[0].length
    matchIndex += 1
  }
  parts.push(remaining.slice(lastIndex))

  return <>{parts}</>
}

const igrpTextVariants = cva("transition-all duration-300 ease-in-out", {
  variants: {
    size: {
      sm: "text-sm leading-5",
      default: "text-base leading-6",
      lg: "text-lg leading-7",
      xl: "text-xl leading-8",
    },
    weight: {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
      justify: "text-justify",
    },
    spacing: {
      tight: "mb-2",
      normal: "mb-4",
      loose: "mb-6",
      none: "mb-0",
    },
  },
  defaultVariants: {
    size: "default",
    weight: "normal",
    align: "left",
    spacing: "tight",
  },
})

/**
 * Props for the IGRPText component.
 * @see IGRPText
 */
interface IGRPTextProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof igrpTextVariants> {
  /** Text content. */
  children: React.ReactNode
  /** Color variant. */
  variant?: IGRPColorVariants
  /** Animate on scroll into view. */
  animate?: boolean
  /** Truncate with ellipsis. */
  truncate?: boolean
  /** Max lines before truncation. */
  maxLines?: number
  /** Strings to highlight. */
  highlight?: string[]
  /** HTML element to render as. */
  as?: "p" | "span" | "div"
  /** HTML name attribute. */
  name?: string
}

/**
 * Text with size, weight, alignment, and optional highlight/truncate.
 */
function IGRPText({
  children,
  variant = "primary",
  size,
  weight,
  align,
  spacing,
  animate = false,
  truncate = false,
  maxLines,
  highlight = EMPTY_HIGHLIGHT,
  as: Component = "div",
  className,
  name,
  id,
  ...props
}: IGRPTextProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  const truncateStyles = truncate
    ? maxLines
      ? {
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }
      : {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
        }
    : {}

  const colorClass = IGRPColors["solid"][variant]

  return (
    <Component
      className={cn(
        igrpTextVariants({ size, weight, align, spacing }),
        colorClass.text,
        animate && "animate-[igrp-text-fade-in_0.3s_ease-in-out_0.1s_both]",
        className,
      )}
      style={truncateStyles}
      id={ref}
      {...props}
    >
      {typeof children === "string" ? <TextWithHighlight text={children} highlight={highlight} /> : children}
    </Component>
  )
}

export { IGRPText, type IGRPTextProps, igrpTextVariants }
