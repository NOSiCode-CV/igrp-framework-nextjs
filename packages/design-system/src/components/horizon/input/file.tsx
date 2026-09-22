"use client"

import { useCallback, useId, useRef, useState } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { useDropzone, type FileRejection } from "react-dropzone"
import { AlertCircle, UploadCloud, X } from "lucide-react"

import { cn } from "../cn.js"
import { igrpOmitNonDomProps } from "../../../lib/dom-props.js"
import { igrpFormatMessage, useIGRPi18n } from "../../../i18n/index.js"
import type { IGRPInputProps } from "../../../types.js"
import { Input } from "../../primitives/input.js"
import { Card } from "../../primitives/card.js"
import { Button } from "../../primitives/button.js"
import { Alert, AlertDescription, AlertTitle } from "../../primitives/alert.js"
import { Progress } from "../../primitives/progress.js"
import { IGRPLabel } from "../label.js"
import { Field, FieldDescription, FieldError } from "../../primitives/field.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A file entry tracked by the dropzone variant, including upload progress. */
export type FileWithProgress = {
  file: File
  progress: number
  uploaded: boolean
  error?: string
}

/**
 * Props for the IGRPInputFile component.
 * @see IGRPInputFile
 */
interface IGRPInputFileProps extends IGRPInputProps {
  /** Accepted file types (e.g. 'image/*', '.pdf'). For `variant="default"` only. */
  accept?: string
  /** Allow multiple file selection. */
  multiple?: boolean
  /**
   * Render mode.
   * - `"default"` — standard file input (default).
   * - `"dropzone"` — drag-and-drop zone with progress tracking.
   */
  variant?: "default" | "dropzone"
  // --- Dropzone-specific props ---
  /** Max file size in bytes (dropzone only). Default: 10 MB. */
  maxSize?: number
  /** Maximum number of accepted files (dropzone only). */
  maxFiles?: number
  /**
   * Accepted MIME types in react-dropzone format (dropzone only).
   * E.g. `{ "image/*": [".png", ".jpg"] }`
   */
  acceptTypes?: Record<string, string[]>
  /** Drop-zone label. Default: "Arraste arquivos aqui ou clique para selecionar". */
  dropzoneLabel?: string
  /** Hint shown below the label listing accepted types / size. Default: "Tipos aceitos". */
  dropzoneHint?: string
  /** Label for the remove-single-file button. Default: "Remover". */
  removeLabel?: string
  /** Label for the remove-all-files button. Default: "Remover todos". */
  removeAllLabel?: string
  /** Label shown during drag-active state. Default: "Solte os arquivos aqui". */
  dragActiveLabel?: string
  /** Label shown during drag when some files would be rejected. Default: "Alguns arquivos serão rejeitados". */
  dragRejectLabel?: string
  /** Prefix for the max file size constraint. Default: "Tamanho máx:". */
  maxSizeLabel?: string
  /** Prefix for the max file count constraint. Default: "Máx de arquivos:". */
  maxFilesLabel?: string
  /** Title of the rejected-files alert. Default: "Erro no upload". */
  rejectedAlertTitle?: string
  /**
   * Called whenever the file list changes in `variant="dropzone"`.
   * Use this instead of `onChange` when in dropzone mode.
   */
  onFilesChange?: (files: File[]) => void
}

// ---------------------------------------------------------------------------
// Internal dropzone sub-component
// ---------------------------------------------------------------------------

interface IGRPDropzoneInternalProps {
  name: string
  label?: string
  required?: boolean
  disabled?: boolean
  className?: string
  helperText?: string
  error?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  acceptTypes?: Record<string, string[]>
  dropzoneLabel: string
  dropzoneHint: string
  removeLabel: string
  removeAllLabel: string
  dragActiveLabel: string
  dragRejectLabel: string
  maxSizeLabel: string
  maxFilesLabel: string
  rejectedAlertTitle: string
  onFilesChange?: (files: File[]) => void
  /** react-hook-form field onChange (when inside a form). */
  onFieldChange?: (value: File | FileList | File[] | null) => void
  /** react-hook-form field value (when inside a form), so `reset()` can clear the list. */
  fieldValue?: unknown
}

/**
 * Key for a file row. Index keys re-map every row after a removal onto its
 * neighbour, which restarts the wrong progress bar and moves focus.
 */
function fileKey(file: File): string {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function IGRPDropzoneInternal({
  name,
  label,
  required = false,
  disabled = false,
  className,
  helperText,
  error,
  multiple = true,
  maxSize = 10 * 1024 * 1024,
  maxFiles,
  acceptTypes,
  dropzoneLabel,
  dropzoneHint,
  removeLabel,
  removeAllLabel,
  dragActiveLabel,
  dragRejectLabel,
  maxSizeLabel,
  maxFilesLabel,
  rejectedAlertTitle,
  onFilesChange,
  onFieldChange,
  fieldValue,
}: IGRPDropzoneInternalProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])

  // The picked files live in local state (they carry upload progress, which the
  // form value does not). That left the list stranded on `form.reset()`: the form
  // value went empty while the UI still showed every file. Mirror the clear.
  const fieldIsEmpty =
    fieldValue === undefined || fieldValue === null || (Array.isArray(fieldValue) && fieldValue.length === 0)
  const [lastFieldIsEmpty, setLastFieldIsEmpty] = useState(fieldIsEmpty)
  if (lastFieldIsEmpty !== fieldIsEmpty) {
    setLastFieldIsEmpty(fieldIsEmpty)
    if (fieldIsEmpty) {
      setFiles([])
      setRejectedFiles([])
    }
  }

  const updateFiles = useCallback(
    (next: FileWithProgress[]) => {
      setFiles(next)
      const rawFiles = next.map((f) => f.file)
      if (onFilesChange) onFilesChange(rawFiles)
      if (onFieldChange) {
        if (!multiple) {
          onFieldChange(rawFiles[0] ?? null)
        } else {
          onFieldChange(rawFiles)
        }
      }
    },
    [multiple, onFilesChange, onFieldChange]
  )

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setRejectedFiles(rejected)
      } else {
        setRejectedFiles([])
      }

      const newItems: FileWithProgress[] = accepted.map((file) => ({
        file,
        progress: 0,
        uploaded: false,
      }))

      if (multiple) {
        updateFiles([...files, ...newItems])
      } else {
        updateFiles(newItems)
      }
    },
    [multiple, files, updateFiles]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptTypes,
    maxSize,
    maxFiles,
    multiple: multiple && maxFiles !== 1,
    disabled,
  })

  const removeFile = useCallback(
    (fileToRemove: File) => {
      updateFiles(files.filter((item) => item.file !== fileToRemove))
    },
    [files, updateFiles]
  )

  const removeAllFiles = useCallback(() => {
    updateFiles([])
  }, [updateFiles])

  const removeRejectedFile = useCallback((index: number) => {
    setRejectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatAcceptedTypes = () => {
    if (!acceptTypes) return null
    return Object.entries(acceptTypes)
      .map(([type, extensions]) => (type.startsWith(".") ? type : extensions.join(", ")))
      .join(", ")
  }

  return (
    <Field className={cn("gap-4", className)}>
      {label && <IGRPLabel label={label} required={required} id={name} />}

      <Card
        {...getRootProps()}
        className={cn(
          "cursor-pointer border-dashed transition-[color,background-color,border-color,box-shadow] duration-200",
          "hover:border-primary hover:shadow-md",
          "flex flex-col items-center gap-2 p-6 text-center",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/10",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} name={name} />
        <UploadCloud
          className={cn(
            "size-10",
            isDragActive && !isDragReject ? "text-primary" : "text-muted-foreground",
            isDragReject && "text-destructive"
          )}
        />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">
            {isDragActive ? (isDragReject ? dragRejectLabel : dragActiveLabel) : dropzoneLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptTypes && (
              <span>
                {dropzoneHint}: {formatAcceptedTypes()}
              </span>
            )}
            {maxSize !== undefined && acceptTypes ? <span> · </span> : null}
            {maxSize !== undefined ? (
              <span>
                {maxSizeLabel} {formatFileSize(maxSize)}
              </span>
            ) : null}
            {maxFiles !== undefined && (maxSize !== undefined || acceptTypes) ? <span> · </span> : null}
            {maxFiles !== undefined ? (
              <span>
                {maxFilesLabel} {maxFiles}
              </span>
            ) : null}
          </p>
        </div>
      </Card>

      {rejectedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{rejectedAlertTitle}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {rejectedFiles.map((item, index) => (
                <li key={fileKey(item.file)} className="flex items-center justify-between">
                  <span>
                    {item.file.name} — {item.errors.map((e) => e.message).join(", ")}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={() => removeRejectedFile(index)}
                    aria-label={igrpFormatMessage(removeLabel, { name: item.file.name })}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map((item) => (
            <div
              key={fileKey(item.file)}
              className="flex items-center justify-between gap-2 rounded-md border border-input p-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.file.name}</p>
                <Progress value={item.progress} className="mt-1 h-1" />
              </div>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => removeFile(item.file)}
                aria-label={igrpFormatMessage(removeLabel, { name: item.file.name })}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" type="button" onClick={removeAllFiles} className="w-full">
            {removeAllLabel}
          </Button>
        </div>
      )}

      {helperText && !error && <FieldDescription id={`${name}-helper`}>{helperText}</FieldDescription>}

      {error && <FieldError id={`${name}-error`}>{error}</FieldError>}
    </Field>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * File input with label, helper text, and form integration.
 *
 * Set `variant="dropzone"` to enable the drag-and-drop zone with progress
 * tracking. All UI strings are props with Portuguese defaults.
 */
function IGRPInputFile({
  name,
  id,
  label,
  className,
  required = false,
  disabled = false,
  labelClassName,
  accept,
  multiple = false,
  variant = "default",
  maxSize,
  maxFiles,
  acceptTypes,
  dropzoneLabel,
  dropzoneHint,
  removeLabel,
  removeAllLabel,
  dragActiveLabel,
  dragRejectLabel,
  maxSizeLabel,
  maxFilesLabel,
  rejectedAlertTitle,
  onFilesChange,
  placeholder,
  onChange,
  error,
  helperText,
  ...props
}: IGRPInputFileProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id
  const i18n = useIGRPi18n()

  // Props still win; the catalog only supplies what the caller left out, so a
  // consumer that overrides these strings via IGRPI18nProvider gets them here too.
  const labels = {
    dropzoneLabel: dropzoneLabel ?? i18n.inputFile.dropzoneLabel,
    dropzoneHint: dropzoneHint ?? i18n.inputFile.dropzoneHint,
    removeLabel: removeLabel ?? i18n.inputFile.removeFile,
    removeAllLabel: removeAllLabel ?? i18n.inputFile.removeAllFiles,
    dragActiveLabel: dragActiveLabel ?? i18n.inputFile.dragActive,
    dragRejectLabel: dragRejectLabel ?? i18n.inputFile.dragReject,
    maxSizeLabel: maxSizeLabel ?? i18n.inputFile.maxSize,
    maxFilesLabel: maxFilesLabel ?? i18n.inputFile.maxFiles,
    rejectedAlertTitle: rejectedAlertTitle ?? i18n.inputFile.rejectedTitle,
  }

  const inputRef = useRef<HTMLInputElement>(null)
  const formContext = useFormContext()

  // ── Dropzone variant ─────────────────────────────────────────────────────
  if (variant === "dropzone") {
    if (!formContext) {
      return (
        <IGRPDropzoneInternal
          name={fieldName}
          label={label}
          required={required}
          disabled={disabled}
          className={className}
          helperText={helperText}
          error={error}
          multiple={multiple}
          maxSize={maxSize}
          maxFiles={maxFiles}
          acceptTypes={acceptTypes}
          dropzoneLabel={labels.dropzoneLabel}
          dropzoneHint={labels.dropzoneHint}
          removeLabel={labels.removeLabel}
          removeAllLabel={labels.removeAllLabel}
          dragActiveLabel={labels.dragActiveLabel}
          dragRejectLabel={labels.dragRejectLabel}
          maxSizeLabel={labels.maxSizeLabel}
          maxFilesLabel={labels.maxFilesLabel}
          rejectedAlertTitle={labels.rejectedAlertTitle}
          onFilesChange={onFilesChange}
        />
      )
    }

    const fieldError = formContext.formState.errors[fieldName]
    const errorMessage = error || (fieldError?.message as string)

    return (
      <Controller
        name={fieldName}
        control={formContext.control}
        render={({ field, fieldState }) => (
          <IGRPDropzoneInternal
            fieldValue={field.value}
            name={fieldName}
            label={label}
            required={required}
            disabled={disabled}
            className={className}
            helperText={helperText}
            error={errorMessage || (fieldState.error?.message as string)}
            multiple={multiple}
            maxSize={maxSize}
            maxFiles={maxFiles}
            acceptTypes={acceptTypes}
            dropzoneLabel={labels.dropzoneLabel}
            dropzoneHint={labels.dropzoneHint}
            removeLabel={labels.removeLabel}
            removeAllLabel={labels.removeAllLabel}
            dragActiveLabel={labels.dragActiveLabel}
            dragRejectLabel={labels.dragRejectLabel}
            maxSizeLabel={labels.maxSizeLabel}
            maxFilesLabel={labels.maxFilesLabel}
            rejectedAlertTitle={labels.rejectedAlertTitle}
            onFilesChange={onFilesChange}
            onFieldChange={field.onChange}
          />
        )}
      />
    )
  }

  // ── Default variant ───────────────────────────────────────────────────────
  if (!formContext) {
    return (
      <Field>
        {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}
        <Input
          ref={inputRef}
          id={fieldName}
          name={fieldName}
          className={cn(
            "cursor-pointer p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-input file:px-4 file:py-2 file:transition-colors",
            error && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          type="file"
          disabled={disabled}
          accept={accept}
          multiple={multiple}
          placeholder={placeholder}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
          {...igrpOmitNonDomProps(props)}
        />

        {helperText && !error && <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>}

        {error && <FieldError id={`${fieldName}-error`}>{error}</FieldError>}
      </Field>
    )
  }

  const fieldError = formContext.formState.errors[fieldName]
  const errorMessage = error || (fieldError?.message as string)

  return (
    <Controller
      name={fieldName}
      control={formContext.control}
      render={({ field, fieldState }) => {
        const safeFieldProps = {
          name: field.name,
          onBlur: field.onBlur,
        }

        return (
          <Field>
            {label && <IGRPLabel label={label} className={labelClassName} required={required} id={fieldName} />}
            <Input
              ref={inputRef}
              id={fieldName}
              className={cn(
                "cursor-pointer p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-input file:px-4 file:py-2 file:transition-colors",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className
              )}
              type="file"
              disabled={disabled}
              accept={accept}
              multiple={multiple}
              placeholder={placeholder}
              onChange={(e) => {
                const files = e.target.files
                const fileValue = multiple ? files : files?.[0] || null

                field.onChange(fileValue)

                if (onChange) {
                  onChange(e)
                }
              }}
              aria-invalid={!!fieldState.error || !!error}
              aria-describedby={
                errorMessage || fieldState.error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined
              }
              {...safeFieldProps}
              {...igrpOmitNonDomProps(props)}
              name={fieldName}
            />

            {helperText && !errorMessage && !fieldState.error && (
              <FieldDescription id={`${fieldName}-helper`}>{helperText}</FieldDescription>
            )}

            {(errorMessage || fieldState.error) && (
              <FieldError id={`${fieldName}-error`}>{errorMessage || fieldState.error?.message}</FieldError>
            )}
          </Field>
        )
      }}
    />
  )
}

export { IGRPInputFile, type IGRPInputFileProps }
