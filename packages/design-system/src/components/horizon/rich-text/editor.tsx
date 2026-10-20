"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import { useEffect, useId, useMemo, useRef } from "react"
import { Controller, useFormContext } from "react-hook-form"

import { cn } from "../cn.js"
import { useIGRPi18n } from "../../../i18n/context.js"
import { Button } from "../../primitives/button.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"
import { IGRPLabel } from "../label.js"
import {
  RICH_TEXT_FONT_SIZES,
  RICH_TEXT_PRESETS,
  type IGRPRichTextControl,
  type IGRPRichTextPreset,
} from "./controls.js"
import { createRichTextSchema } from "./schema.js"
import { RICH_TEXT_PLACEHOLDER_CLASS, RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS } from "./styles.js"
import { RichTextToolbar, type IGRPRichTextColor } from "./toolbar.js"

/** A clickable token inserted at the caret as plain text, e.g. `{{nome_titular}}`. */
interface IGRPRichTextVariable {
  value: string
  /** Chip text. Defaults to `value`. */
  label?: string
}

interface IGRPRichTextEditorBaseProps {
  name?: string
  id?: string
  label?: string
  labelClassName?: string
  helperText?: string
  required?: boolean
  /** Error shown under the field; wins over the form's own message. */
  error?: string
  /** Controlled value (HTML). Ignored inside `IGRPForm`, which owns the value. */
  value?: string
  /** Receives the body as HTML; an empty body is `""`. */
  onChange?: (html: string) => void
  onBlur?: () => void
  /** Defaults to the i18n catalog's `richText.placeholder`. */
  placeholder?: string
  /** Content stays legible and focusable; toolbar and variables are hidden. */
  readOnly?: boolean
  /** Like `readOnly`, plus disabled styling and `aria-disabled`. */
  disabled?: boolean
  variables?: IGRPRichTextVariable[]
  /** Hint above the variable chips. Defaults to the i18n catalog. */
  variablesLabel?: string
  /** Text-colour palette. Defaults to seven neutral document colours. */
  colors?: IGRPRichTextColor[]
  /** Font-size choices, as CSS lengths. */
  fontSizes?: string[]
  className?: string
  editorClassName?: string
}

/**
 * Props for the IGRPRichTextEditor component. Pick the toolbar with EITHER a
 * `preset` (default `"full"`) OR an explicit `controls` list — never both.
 * @see IGRPRichTextEditor
 */
type IGRPRichTextEditorProps = IGRPRichTextEditorBaseProps &
  ({ preset?: IGRPRichTextPreset; controls?: never } | { controls: readonly IGRPRichTextControl[]; preset?: never })

interface SurfaceProps {
  fieldName: string
  label?: string
  labelClassName?: string
  helperText?: string
  required?: boolean
  error?: string
  value: string
  onChange: (html: string) => void
  onBlur?: () => void
  placeholder: string
  readOnly: boolean
  disabled: boolean
  controls: readonly IGRPRichTextControl[]
  variables?: IGRPRichTextVariable[]
  variablesLabel?: string
  colors?: IGRPRichTextColor[]
  fontSizes: string[]
  className?: string
  editorClassName?: string
}

function RichTextField({
  fieldName,
  label,
  labelClassName,
  helperText,
  required,
  error,
  value,
  onChange,
  onBlur,
  placeholder,
  readOnly,
  disabled,
  controls,
  variables,
  variablesLabel,
  colors,
  fontSizes,
  className,
  editorClassName,
}: SurfaceProps) {
  const t = useIGRPi18n().richText
  const editable = !readOnly && !disabled
  const helperId = `${fieldName}-helper`
  const errorId = `${fieldName}-error`

  // Placeholder is read once, at schema build time — the caller remounts this
  // component (via `key`) when it changes.
  const extensions = useMemo(() => createRichTextSchema(placeholder), [placeholder])

  /**
   * TipTap binds the `onUpdate`/`onBlur` it was constructed with and never
   * re-reads them, so a callback captured on the first render would stick for
   * the editor's whole life. Route both through refs.
   */
  const onChangeRef = useRef(onChange)
  const onBlurRef = useRef(onBlur)
  useEffect(() => {
    onChangeRef.current = onChange
    onBlurRef.current = onBlur
  })

  /**
   * `<label for>` cannot name a contenteditable, and `aria-*` on a wrapper is
   * never announced for the inner textbox — so the textbox carries them itself.
   */
  const attributes = useMemo(
    () => ({
      id: fieldName,
      role: "textbox",
      "aria-multiline": "true",
      ...(label ? { "aria-label": label } : {}),
      ...(error ? { "aria-describedby": errorId } : helperText ? { "aria-describedby": helperId } : {}),
      ...(error ? { "aria-invalid": "true" } : {}),
      ...(required ? { "aria-required": "true" } : {}),
      ...(disabled ? { "aria-disabled": "true" } : {}),
      class: cn(RICH_TEXT_PROSE_CLASS, RICH_TEXT_TABLE_CLASS, RICH_TEXT_PLACEHOLDER_CLASS, "min-h-50 p-4"),
    }),
    [fieldName, label, error, errorId, helperText, helperId, required, disabled]
  )

  const editor = useEditor({
    extensions,
    content: value,
    editable,
    // Client-only by design; without this TipTap warns under the Next.js app router.
    immediatelyRender: false,
    editorProps: { attributes },
    // An empty body is "", not "<p></p>", or a required rule never fails.
    onUpdate: ({ editor: ed }) => onChangeRef.current(ed.isEmpty ? "" : ed.getHTML()),
    onBlur: () => onBlurRef.current?.(),
  })

  useEffect(() => {
    if (!editor) return
    const current = editor.isEmpty ? "" : editor.getHTML()
    if ((value ?? "") !== current) editor.commands.setContent(value ?? "", { emitUpdate: false })
  }, [value, editor])

  /**
   * `useEditor` re-applies its options with `editable` pinned to the editor's
   * CURRENT value, so the prop never reaches a mounted editor on its own.
   * `false` = no update event: flipping read-only is not a content change, and
   * emitting one would push an identical value back and dirty the form.
   */
  useEffect(() => {
    if (editor && editor.isEditable !== editable) editor.setEditable(editable, false)
  }, [editor, editable])

  return (
    <Field className={className} data-disabled={disabled || undefined}>
      {label ? (
        <IGRPLabel
          label={label}
          className={labelClassName}
          required={required}
          id={fieldName}
          onClick={() => editor?.commands.focus()}
        />
      ) : null}

      <div
        className={cn(
          "rounded-lg border bg-background shadow-xs",
          "focus-within:ring-[3px] focus-within:ring-ring/50",
          error && "border-destructive focus-within:ring-destructive/20",
          disabled && "cursor-not-allowed opacity-50",
          editorClassName
        )}
      >
        {editable && editor ? (
          <RichTextToolbar editor={editor} controls={controls} colors={colors} fontSizes={fontSizes} />
        ) : null}
        <EditorContent editor={editor} />
        {editable && editor && variables?.length ? (
          <div className="flex flex-col gap-2 border-t bg-muted/20 p-2">
            <p className="text-xs text-muted-foreground">{variablesLabel ?? t.variablesHint}</p>
            <div className="flex flex-wrap gap-1.5">
              {variables.map((variable) => (
                <Button
                  key={variable.value}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 font-mono text-xs"
                  // Keep the caret: the chip must not take focus before inserting.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().insertContent(variable.value).run()}
                >
                  {variable.label ?? variable.value}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {helperText && !error ? <FieldDescription id={helperId}>{helperText}</FieldDescription> : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  )
}

/**
 * WYSIWYG rich-text field. Form-bound inside `IGRPForm` (keyed by `name`),
 * controlled through `value`/`onChange` outside one. Writes HTML restricted to
 * the shared rich-text schema; render it back with `IGRPRichTextView`, never
 * with `dangerouslySetInnerHTML`.
 *
 * Deliberately offers no images and no raw-HTML source view (ADR 0003).
 * Client-only: renders its chrome on the server and the surface after hydration.
 */
function IGRPRichTextEditor({
  name,
  id,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  readOnly = false,
  disabled = false,
  preset,
  controls,
  fontSizes = RICH_TEXT_FONT_SIZES,
  ...rest
}: IGRPRichTextEditorProps) {
  const t = useIGRPi18n().richText
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const formContext = useFormContext()

  const shared = {
    ...rest,
    fieldName,
    placeholder: placeholder ?? t.placeholder,
    readOnly,
    disabled,
    controls: controls ?? RICH_TEXT_PRESETS[preset ?? "full"],
    fontSizes,
  }

  if (!formContext) {
    return (
      <RichTextField
        key={shared.placeholder}
        {...shared}
        error={error}
        value={value ?? ""}
        onChange={(html) => onChange?.(html)}
        onBlur={onBlur}
      />
    )
  }

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => (
        <RichTextField
          key={shared.placeholder}
          {...shared}
          error={error || fieldState.error?.message}
          value={(field.value as string | undefined) ?? ""}
          onChange={(html) => {
            field.onChange(html)
            onChange?.(html)
          }}
          onBlur={() => {
            field.onBlur()
            onBlur?.()
          }}
        />
      )}
    />
  )
}

export { IGRPRichTextEditor, type IGRPRichTextEditorProps, type IGRPRichTextVariable }
