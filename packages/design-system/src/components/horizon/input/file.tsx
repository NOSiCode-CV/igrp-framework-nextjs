"use client"

import { useCallback, useId, useRef, useState } from "react"
import { useFormContext, Controller } from "react-hook-form"
import { useDropzone, type FileRejection } from "react-dropzone"
import { AlertCircle, UploadCloud, X } from "lucide-react"

import { cn } from "../../../lib/utils"
import type { IGRPInputProps } from "../../../types"
import { Input } from "../../primitives/input"
import { Card } from "../../primitives/card"
import { Button } from "../../primitives/button"
import { Alert, AlertDescription, AlertTitle } from "../../primitives/alert"
import { Progress } from "../../primitives/progress"
import { IGRPLabel } from "../label"

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
}: IGRPDropzoneInternalProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])

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
    [multiple, onFilesChange, onFieldChange],
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
    [multiple, files, updateFiles],
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
    [files, updateFiles],
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
    <div className={cn("space-y-4", className)}>
      {label && <IGRPLabel label={label} required={required} id={name} />}

      <Card
        {...getRootProps()}
        className={cn(
          "border-dashed cursor-pointer transition-[color,background-color,border-color,box-shadow] duration-200",
          "hover:shadow-md hover:border-primary",
          "p-6 text-center flex flex-col items-center gap-2",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/10",
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <input {...getInputProps()} name={name} />
        <UploadCloud
          className={cn(
            "size-10",
            isDragActive && !isDragReject ? "text-primary" : "text-muted-foreground",
            isDragReject && "text-destructive",
          )}
        />
        <div className="space-y-1">
          <p className="text-sm font-medium">
            {isDragActive ? (isDragReject ? dragRejectLabel : dragActiveLabel) : dropzoneLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {acceptTypes && (
              <span>
                {dropzoneHint}: {formatAcceptedTypes()}
              </span>
            )}
            {maxSize && acceptTypes && <span> · </span>}
            {maxSize && (
              <span>
                {maxSizeLabel} {formatFileSize(maxSize)}
              </span>
            )}
            {maxFiles && (maxSize || acceptTypes) && <span> · </span>}
            {maxFiles && (
              <span>
                {maxFilesLabel} {maxFiles}
              </span>
            )}
          </p>
        </div>
      </Card>

      {rejectedFiles.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>{rejectedAlertTitle}</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 text-sm list-disc pl-5 space-y-1">
              {rejectedFiles.map((item, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span>
                    {item.file.name} — {item.errors.map((e) => e.message).join(", ")}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={() => removeRejectedFile(index)}
                    aria-label={removeLabel}
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
        <div className="space-y-2">
          {files.map((item, index) => (
            <div key={index} className="flex items-center justify-between border border-input rounded-md p-2 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.file.name}</p>
                <Progress value={item.progress} className="h-1 mt-1" />
              </div>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => removeFile(item.file)}
                aria-label={removeLabel}
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

      {helperText && !error && (
        <p id={`${name}-helper`} className="text-muted-foreground text-xs" role="region" aria-live="polite">
          {helperText}
        </p>
      )}

      {error && (
        <p id={`${name}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
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
  accept,
  multiple = false,
  variant = "default",
  maxSize,
  maxFiles,
  acceptTypes,
  dropzoneLabel = "Arraste arquivos aqui ou clique para selecionar",
  dropzoneHint = "Tipos aceitos",
  removeLabel = "Remover",
  removeAllLabel = "Remover todos",
  dragActiveLabel = "Solte os arquivos aqui",
  dragRejectLabel = "Alguns arquivos serão rejeitados",
  maxSizeLabel = "Tamanho máx:",
  maxFilesLabel = "Máx de arquivos:",
  rejectedAlertTitle = "Erro no upload",
  onFilesChange,
  placeholder,
  onChange,
  error,
  helperText,
  ...props
}: IGRPInputFileProps) {
  const _id = useId()
  const fieldName = name ?? id ?? _id

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
          dropzoneLabel={dropzoneLabel}
          dropzoneHint={dropzoneHint}
          removeLabel={removeLabel}
          removeAllLabel={removeAllLabel}
          dragActiveLabel={dragActiveLabel}
          dragRejectLabel={dragRejectLabel}
          maxSizeLabel={maxSizeLabel}
          maxFilesLabel={maxFilesLabel}
          rejectedAlertTitle={rejectedAlertTitle}
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
            dropzoneLabel={dropzoneLabel}
            dropzoneHint={dropzoneHint}
            removeLabel={removeLabel}
            removeAllLabel={removeAllLabel}
            dragActiveLabel={dragActiveLabel}
            dragRejectLabel={dragRejectLabel}
            maxSizeLabel={maxSizeLabel}
            maxFilesLabel={maxFilesLabel}
            rejectedAlertTitle={rejectedAlertTitle}
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
      <div className={cn("*:not-first:mt-2")}>
        {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}
        <Input
          ref={inputRef}
          id={fieldName}
          name={fieldName}
          className={cn(
            "p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-input file:py-2 file:px-4 file:transition-colors cursor-pointer",
            error && "border-destructive focus-visible:ring-destructive/20",
            className,
          )}
          type="file"
          disabled={disabled}
          accept={accept}
          multiple={multiple}
          placeholder={placeholder}
          onChange={onChange}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldName}-error` : helperText ? `${fieldName}-helper` : undefined}
          {...props}
        />

        {helperText && !error && (
          <p
            id={`${fieldName}-helper`}
            className={cn("text-muted-foreground mt-2 text-xs")}
            role="region"
            aria-live="polite"
          >
            {helperText}
          </p>
        )}

        {error && (
          <p id={`${fieldName}-error`} className={cn("text-destructive mt-2 text-xs")} role="alert">
            {error}
          </p>
        )}
      </div>
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
          <div className={cn("*:not-first:mt-2")}>
            {label && <IGRPLabel label={label} className={className} required={required} id={fieldName} />}
            <Input
              ref={inputRef}
              id={fieldName}
              className={cn(
                "p-0 pe-3 file:me-3 file:border-0 file:border-e file:border-input file:py-2 file:px-4 file:transition-colors cursor-pointer",
                (fieldState.error || error) && "border-destructive focus-visible:ring-destructive/20",
                className,
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
              {...props}
              name={fieldName}
            />

            {helperText && !errorMessage && !fieldState.error && (
              <p
                id={`${fieldName}-helper`}
                className={cn("text-muted-foreground mt-2 text-xs")}
                role="region"
                aria-live="polite"
              >
                {helperText}
              </p>
            )}

            {(errorMessage || fieldState.error) && (
              <p id={`${fieldName}-error`} className={cn("text-destructive mt-2 text-xs")} role="alert">
                {errorMessage || fieldState.error?.message}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}

export { IGRPInputFile, type IGRPInputFileProps }
