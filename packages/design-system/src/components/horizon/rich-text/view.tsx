"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { cn } from "../cn.js"
import { useIGRPi18n } from "../../../i18n/context.js"
import { Button } from "../../primitives/button.js"
import { createRichTextSchema, isBlankRichText } from "./schema.js"
import { RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS } from "./styles.js"

/**
 * Props for the IGRPRichTextView component.
 * @see IGRPRichTextView
 */
interface IGRPRichTextViewProps {
  /** Stored rich-text body (HTML). */
  html: string | null | undefined
  /** Shown instead of the body when it has nothing to show. Default `"—"`. */
  emptyLabel?: ReactNode
  /**
   * Clips a long body to this height, with a "Ver mais" toggle. A number is
   * pixels. The toggle only appears when the body actually overflows.
   */
  maxHeight?: number | string
  className?: string
}

/**
 * Read-only renderer for stored rich text. Use it instead of
 * `dangerouslySetInnerHTML`.
 *
 * It is a renderer with an allow-list, NOT a sanitiser: the HTML is re-parsed
 * through the same schema `IGRPRichTextEditor` writes with, so only nodes, marks
 * and attributes that schema declares reach the DOM — a `<script>`, an
 * `<img onerror>` or a `javascript:` link is dropped. It protects this DOM only;
 * the stored HTML is unchanged and still reaches every other consumer (a mail
 * client, a PDF renderer) as-is.
 *
 * Client-only: it renders nothing until it hydrates.
 */
function IGRPRichTextView({ html, emptyLabel = "—", maxHeight, className }: IGRPRichTextViewProps) {
  // The empty case never pays for a ProseMirror instance — summary screens
  // render several of these per page.
  if (isBlankRichText(html)) {
    return <p className={cn("text-sm text-foreground", className)}>{emptyLabel}</p>
  }
  return <RichTextDocument html={html as string} maxHeight={maxHeight} className={className} />
}

function RichTextDocument({
  html,
  maxHeight,
  className,
}: {
  html: string
  maxHeight?: number | string
  className?: string
}) {
  const t = useIGRPi18n().richText
  const extensions = useMemo(() => createRichTextSchema(), [])
  const editor = useEditor({
    extensions,
    content: html,
    editable: false,
    // Client-only by design; without this TipTap warns under the Next.js app router.
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor || html === editor.getHTML()) return
    editor.commands.setContent(html, { emitUpdate: false })
  }, [html, editor])

  const bodyId = useId()
  const bodyRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const clipped = maxHeight !== undefined

  useLayoutEffect(() => {
    const body = bodyRef.current
    // Measured only while clipped: an expanded body never overflows, and
    // re-measuring then would hide the "Ver menos" toggle.
    if (!clipped || expanded || !body || !editor) return
    const measure = () => setOverflows(body.scrollHeight > body.clientHeight + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [clipped, expanded, editor, html])

  const collapsed = clipped && overflows && !expanded

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        id={bodyId}
        ref={bodyRef}
        className={cn("relative", clipped && !expanded && "overflow-hidden")}
        style={clipped && !expanded ? { maxHeight } : undefined}
        // Keyboard focus landing on a link hidden below the fold would be
        // invisible; show the whole body instead of trapping it there.
        onFocus={collapsed ? () => setExpanded(true) : undefined}
      >
        <EditorContent
          editor={editor}
          className={cn(RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS, "text-foreground")}
        />
        {collapsed ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-background to-transparent"
          />
        ) : null}
      </div>
      {clipped && overflows ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="self-start px-0"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t.showLess : t.showMore}
        </Button>
      ) : null}
    </div>
  )
}

export { IGRPRichTextView, type IGRPRichTextViewProps }
