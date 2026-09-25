"use client"

import type { Editor } from "@tiptap/core"
import { useEditorState } from "@tiptap/react"
import { Fragment, useId, useState, type ReactNode } from "react"

import { cn } from "../cn.js"
import { igrpFormatMessage, useIGRPi18n } from "../../../i18n/context.js"
import type { IGRPI18nStrings } from "../../../i18n/strings.js"
import { Button } from "../../primitives/button.js"
import { Input } from "../../primitives/input.js"
import { Label } from "../../primitives/label.js"
import { Popover, PopoverContent, PopoverTrigger } from "../../primitives/popover.js"
import { Separator } from "../../primitives/separator.js"
import { Toggle } from "../../primitives/toggle.js"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../primitives/tooltip.js"
import { IGRPIcon } from "../icon/index.js"
import { RICH_TEXT_SPECIAL_CHARS, type IGRPRichTextControl } from "./controls.js"

type RichTextStrings = IGRPI18nStrings["richText"]

/** One entry of the text-colour picker. `value` is any CSS colour. */
interface IGRPRichTextColor {
  label: string
  value: string
}

/**
 * The toolbar must never take the caret: a button that steals focus before its
 * command runs inserts nowhere (variables, special characters) or formats
 * nothing. Every control below prevents the mousedown default.
 */
const keepCaret = (event: React.MouseEvent) => event.preventDefault()

/** Content colours — document data, stored as inline style, not UI tokens. */
function defaultColors(t: RichTextStrings): IGRPRichTextColor[] {
  return [
    { label: t.colorBlack, value: "#111827" },
    { label: t.colorGray, value: "#6b7280" },
    { label: t.colorRed, value: "#b91c1c" },
    { label: t.colorOrange, value: "#c2410c" },
    { label: t.colorGreen, value: "#15803d" },
    { label: t.colorBlue, value: "#1d4ed8" },
    { label: t.colorPurple, value: "#6d28d9" },
  ]
}

function WithTooltip({ label, disabled, children }: { label: string; disabled?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* A disabled button gets no pointer events, so its tooltip would never
            open — the wrapping span takes the hover instead. */}
        {disabled ? <span className="inline-flex cursor-not-allowed">{children}</span> : children}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

function ToolbarButton({
  label,
  icon,
  pressed,
  disabled,
  onRun,
}: {
  label: string
  icon: string
  pressed?: boolean
  disabled?: boolean
  onRun: () => void
}) {
  return (
    <WithTooltip label={label} disabled={disabled}>
      <Toggle
        size="sm"
        className="size-8 p-0"
        aria-label={label}
        pressed={pressed ?? false}
        disabled={disabled}
        onMouseDown={keepCaret}
        onPressedChange={onRun}
      >
        <IGRPIcon iconName={icon} />
      </Toggle>
    </WithTooltip>
  )
}

function ToolbarPopover({
  label,
  icon,
  glyph,
  pressed,
  open,
  onOpenChange,
  className,
  children,
}: {
  label: string
  icon?: string
  glyph?: string
  pressed?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  children: ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <WithTooltip label={label}>
        <PopoverTrigger asChild>
          <Toggle
            size="sm"
            className="size-8 p-0"
            aria-label={label}
            pressed={pressed ?? false}
            onMouseDown={keepCaret}
          >
            {icon ? (
              <IGRPIcon iconName={icon} />
            ) : (
              <span aria-hidden className="text-sm font-medium">
                {glyph}
              </span>
            )}
          </Toggle>
        </PopoverTrigger>
      </WithTooltip>
      <PopoverContent className={cn("w-64", className)} align="start">
        {children}
      </PopoverContent>
    </Popover>
  )
}

/** A full-width menu item inside a toolbar popover. */
function PopoverItem({ children, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button type="button" size="sm" variant="ghost" className="justify-start gap-2" onMouseDown={keepCaret} {...props}>
      {children}
    </Button>
  )
}

function LinkPopover({
  editor,
  t,
  active,
  href,
}: {
  editor: Editor
  t: RichTextStrings
  active: boolean
  href: string
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const inputId = useId()

  const onOpenChange = (next: boolean) => {
    // Seed from the link under the caret: an empty box on an existing link made
    // "Aplicar" look like a no-op.
    if (next) setUrl(href)
    setOpen(next)
  }

  const apply = () => {
    const next = url.trim()
    setOpen(false)
    // Empty is a no-op, never a delete — removal is the explicit button.
    if (!next) return
    if (editor.state.selection.empty && !active) {
      // Nothing selected and no link to extend: insert the URL as its own text.
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: next, marks: [{ type: "link", attrs: { href: next } }] })
        .run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run()
    }
  }

  const remove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    setOpen(false)
  }

  return (
    <ToolbarPopover
      label={t.link}
      icon="Link"
      pressed={active}
      open={open}
      onOpenChange={onOpenChange}
      className="w-80"
    >
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{t.linkUrl}</Label>
          <Input
            id={inputId}
            type="url"
            placeholder="https://"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                apply()
              }
            }}
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" onClick={apply}>
            {t.linkApply}
          </Button>
          {active ? (
            <Button type="button" size="sm" variant="outline" onClick={remove}>
              <IGRPIcon iconName="Unlink" />
              {t.linkRemove}
            </Button>
          ) : null}
        </div>
      </div>
    </ToolbarPopover>
  )
}

function TablePopover({ editor, t, inTable }: { editor: Editor; t: RichTextStrings; inTable: boolean }) {
  const chain = () => editor.chain().focus()
  const actions: { label: string; run: () => void; needsTable: boolean }[] = [
    {
      label: t.tableInsert,
      run: () => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      needsTable: false,
    },
    { label: t.tableColumnBefore, run: () => chain().addColumnBefore().run(), needsTable: true },
    { label: t.tableColumnAfter, run: () => chain().addColumnAfter().run(), needsTable: true },
    { label: t.tableDeleteColumn, run: () => chain().deleteColumn().run(), needsTable: true },
    { label: t.tableRowBefore, run: () => chain().addRowBefore().run(), needsTable: true },
    { label: t.tableRowAfter, run: () => chain().addRowAfter().run(), needsTable: true },
    { label: t.tableDeleteRow, run: () => chain().deleteRow().run(), needsTable: true },
    { label: t.tableMergeOrSplit, run: () => chain().mergeOrSplit().run(), needsTable: true },
    { label: t.tableDelete, run: () => chain().deleteTable().run(), needsTable: true },
  ]
  return (
    <ToolbarPopover label={t.table} icon="Table" pressed={inTable}>
      <div className="flex flex-col gap-1">
        {actions.map((action) => (
          <PopoverItem key={action.label} disabled={action.needsTable && !inTable} onClick={action.run}>
            {action.label}
          </PopoverItem>
        ))}
      </div>
    </ToolbarPopover>
  )
}

function SpecialCharPopover({ editor, t }: { editor: Editor; t: RichTextStrings }) {
  return (
    <ToolbarPopover label={t.specialCharacter} glyph="Ω" className="w-72">
      <div className="grid grid-cols-10 gap-1">
        {RICH_TEXT_SPECIAL_CHARS.map((char) => (
          <Button
            key={char}
            type="button"
            size="sm"
            variant="ghost"
            className="size-7 p-0 font-mono text-sm"
            aria-label={char}
            onMouseDown={keepCaret}
            onClick={() => editor.chain().focus().insertContent(char).run()}
          >
            {char}
          </Button>
        ))}
      </div>
    </ToolbarPopover>
  )
}

function ColorPopover({ editor, t, colors }: { editor: Editor; t: RichTextStrings; colors: IGRPRichTextColor[] }) {
  return (
    <ToolbarPopover label={t.textColor} icon="Palette">
      <div className="flex flex-col gap-1">
        <PopoverItem onClick={() => editor.chain().focus().unsetColor().run()}>
          <span aria-hidden className="size-4 rounded-sm border border-border" />
          {t.defaultFormat}
        </PopoverItem>
        {colors.map((color) => (
          <PopoverItem key={color.value} onClick={() => editor.chain().focus().setColor(color.value).run()}>
            <span
              aria-hidden
              className="size-4 rounded-sm border border-border"
              style={{ backgroundColor: color.value }}
            />
            {color.label}
          </PopoverItem>
        ))}
      </div>
    </ToolbarPopover>
  )
}

function FontSizePopover({ editor, t, fontSizes }: { editor: Editor; t: RichTextStrings; fontSizes: string[] }) {
  return (
    <ToolbarPopover label={t.fontSize} icon="Baseline">
      <div className="flex flex-col gap-1">
        <PopoverItem onClick={() => editor.chain().focus().unsetFontSize().run()}>{t.defaultFormat}</PopoverItem>
        {fontSizes.map((size) => (
          <PopoverItem key={size} onClick={() => editor.chain().focus().setFontSize(size).run()}>
            <span style={{ fontSize: size }}>{size}</span>
          </PopoverItem>
        ))}
      </div>
    </ToolbarPopover>
  )
}

/** Where a separator goes: after the last control of each group that is shown. */
const GROUPS: IGRPRichTextControl[][] = [
  ["history"],
  ["bold", "italic", "underline", "strike", "highlight", "subscript", "superscript", "clearFormatting"],
  ["heading"],
  ["bulletList", "orderedList", "blockquote", "indent", "horizontalRule"],
  ["textAlign"],
  ["link", "table", "specialCharacter", "color", "fontSize"],
]

function RichTextToolbar({
  editor,
  controls,
  colors,
  fontSizes,
}: {
  editor: Editor
  controls: readonly IGRPRichTextControl[]
  colors?: IGRPRichTextColor[]
  fontSizes: string[]
}) {
  const t = useIGRPi18n().richText
  /**
   * TipTap v3 does not re-render React on every transaction, and emits `update`
   * only when the DOCUMENT changes. Without this subscription the toggles miss
   * every selection-only change: Bold on an empty selection applied the mark
   * but left the button unpressed, and moving the caret out of bold text left
   * it pressed.
   */
  const s = useEditorState({
    editor,
    selector: ({ editor: ed }) => ({
      canUndo: ed.can().undo(),
      canRedo: ed.can().redo(),
      bold: ed.isActive("bold"),
      italic: ed.isActive("italic"),
      underline: ed.isActive("underline"),
      strike: ed.isActive("strike"),
      highlight: ed.isActive("highlight"),
      subscript: ed.isActive("subscript"),
      superscript: ed.isActive("superscript"),
      h1: ed.isActive("heading", { level: 1 }),
      h2: ed.isActive("heading", { level: 2 }),
      h3: ed.isActive("heading", { level: 3 }),
      bulletList: ed.isActive("bulletList"),
      orderedList: ed.isActive("orderedList"),
      blockquote: ed.isActive("blockquote"),
      canSink: ed.can().sinkListItem("listItem"),
      canLift: ed.can().liftListItem("listItem"),
      left: ed.isActive({ textAlign: "left" }),
      center: ed.isActive({ textAlign: "center" }),
      right: ed.isActive({ textAlign: "right" }),
      justify: ed.isActive({ textAlign: "justify" }),
      link: ed.isActive("link"),
      href: (ed.getAttributes("link").href as string | undefined) ?? "",
      inTable: ed.isActive("table"),
    }),
  })
  const run = () => editor.chain().focus()

  const render = (c: IGRPRichTextControl): ReactNode => {
    switch (c) {
      case "history":
        return (
          <>
            <ToolbarButton label={t.undo} icon="Undo" disabled={!s.canUndo} onRun={() => run().undo().run()} />
            <ToolbarButton label={t.redo} icon="Redo" disabled={!s.canRedo} onRun={() => run().redo().run()} />
          </>
        )
      case "bold":
        return <ToolbarButton label={t.bold} icon="Bold" pressed={s.bold} onRun={() => run().toggleBold().run()} />
      case "italic":
        return (
          <ToolbarButton label={t.italic} icon="Italic" pressed={s.italic} onRun={() => run().toggleItalic().run()} />
        )
      case "underline":
        return (
          <ToolbarButton
            label={t.underline}
            icon="Underline"
            pressed={s.underline}
            onRun={() => run().toggleUnderline().run()}
          />
        )
      case "strike":
        return (
          <ToolbarButton
            label={t.strike}
            icon="Strikethrough"
            pressed={s.strike}
            onRun={() => run().toggleStrike().run()}
          />
        )
      case "highlight":
        return (
          <ToolbarButton
            label={t.highlight}
            icon="Highlighter"
            pressed={s.highlight}
            onRun={() => run().toggleHighlight().run()}
          />
        )
      case "subscript":
        return (
          <ToolbarButton
            label={t.subscript}
            icon="Subscript"
            pressed={s.subscript}
            onRun={() => run().toggleSubscript().run()}
          />
        )
      case "superscript":
        return (
          <ToolbarButton
            label={t.superscript}
            icon="Superscript"
            pressed={s.superscript}
            onRun={() => run().toggleSuperscript().run()}
          />
        )
      case "clearFormatting":
        return (
          <ToolbarButton
            label={t.clearFormatting}
            icon="RemoveFormatting"
            onRun={() => run().unsetAllMarks().clearNodes().run()}
          />
        )
      case "heading":
        return ([1, 2, 3] as const).map((level) => (
          <ToolbarButton
            key={level}
            label={igrpFormatMessage(t.heading, { level })}
            icon={`Heading${level}`}
            pressed={s[`h${level}`]}
            onRun={() => run().toggleHeading({ level }).run()}
          />
        ))
      case "bulletList":
        return (
          <ToolbarButton
            label={t.bulletList}
            icon="List"
            pressed={s.bulletList}
            onRun={() => run().toggleBulletList().run()}
          />
        )
      case "orderedList":
        return (
          <ToolbarButton
            label={t.orderedList}
            icon="ListOrdered"
            pressed={s.orderedList}
            onRun={() => run().toggleOrderedList().run()}
          />
        )
      case "blockquote":
        return (
          <ToolbarButton
            label={t.blockquote}
            icon="Quote"
            pressed={s.blockquote}
            onRun={() => run().toggleBlockquote().run()}
          />
        )
      case "indent":
        return (
          <>
            <ToolbarButton
              label={t.indent}
              icon="ListIndentIncrease"
              disabled={!s.canSink}
              onRun={() => run().sinkListItem("listItem").run()}
            />
            <ToolbarButton
              label={t.outdent}
              icon="ListIndentDecrease"
              disabled={!s.canLift}
              onRun={() => run().liftListItem("listItem").run()}
            />
          </>
        )
      case "horizontalRule":
        return <ToolbarButton label={t.horizontalRule} icon="Minus" onRun={() => run().setHorizontalRule().run()} />
      case "textAlign":
        return (
          <>
            <ToolbarButton
              label={t.alignLeft}
              icon="TextAlignStart"
              pressed={s.left}
              onRun={() => run().setTextAlign("left").run()}
            />
            <ToolbarButton
              label={t.alignCenter}
              icon="TextAlignCenter"
              pressed={s.center}
              onRun={() => run().setTextAlign("center").run()}
            />
            <ToolbarButton
              label={t.alignRight}
              icon="TextAlignEnd"
              pressed={s.right}
              onRun={() => run().setTextAlign("right").run()}
            />
            <ToolbarButton
              label={t.alignJustify}
              icon="TextAlignJustify"
              pressed={s.justify}
              onRun={() => run().setTextAlign("justify").run()}
            />
          </>
        )
      case "link":
        return <LinkPopover editor={editor} t={t} active={s.link} href={s.href} />
      case "table":
        return <TablePopover editor={editor} t={t} inTable={s.inTable} />
      case "specialCharacter":
        return <SpecialCharPopover editor={editor} t={t} />
      case "color":
        return <ColorPopover editor={editor} t={t} colors={colors ?? defaultColors(t)} />
      case "fontSize":
        return <FontSizePopover editor={editor} t={t} fontSizes={fontSizes} />
    }
  }

  const shown = new Set(controls)
  const groups = GROUPS.map((group) => group.filter((c) => shown.has(c))).filter((group) => group.length > 0)

  return (
    <TooltipProvider delayDuration={300}>
      <div role="toolbar" aria-label={t.toolbar} className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-1">
        {groups.map((group, index) => (
          <Fragment key={group.join()}>
            {index > 0 ? <Separator orientation="vertical" className="mx-1 h-6" /> : null}
            {group.map((c) => (
              <Fragment key={c}>{render(c)}</Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </TooltipProvider>
  )
}

export { RichTextToolbar, type IGRPRichTextColor }
