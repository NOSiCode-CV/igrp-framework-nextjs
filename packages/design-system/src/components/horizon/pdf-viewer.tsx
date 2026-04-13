"use client"

import type React from "react"
import { useCallback, useEffect, useId, useReducer, useRef, useState } from "react"
import { format } from "date-fns"

import { IGRPColors } from "../../lib/colors"
import { DD_MM_YYYY } from "../../lib/constants"
import { cn } from "../../lib/utils"
import { Card, CardHeader, CardTitle } from "../primitives/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../primitives/dialog"
import { IGRPBadge } from "./badge"
import { IGRPButton } from "./button"
import { IGRPIcon } from "./icon"
import { IGRPLoadingSpinner } from "./loading-spinner"
import { IGRPHeadline } from "./typography/headline"
import { IGRPText } from "./typography/text"

/**
 * Document item shape for PDF viewer.
 * Represents a single document with metadata and file URL.
 */
type IGRPDocumentItem = {
  id: number
  title: string
  description: string
  author: string
  date?: string | Date
  fileUrl: string
}

/**
 * Props for the IGRPPdfViewer component.
 * @see IGRPPdfViewer
 */
interface IGRPPdfViewerProps {
  /** Document to display (metadata and file URL). */
  document: IGRPDocumentItem
  /** Display mode: 'modal' shows a card that opens a dialog, 'inline' embeds the PDF. */
  displayMode?: "modal" | "inline"
  /** Label for the close/cancel button in the modal. */
  labelButtonCancel?: string
  /** Label for the "open in new tab" button. */
  labelButtonNewTab?: string
  /** Height of the inline viewer (e.g. '50vh'). */
  inlineHeight?: string
  /** Message shown when the PDF fails to load. */
  loadErrorLabel?: string
  /** Timeout in ms before showing load error or switching viewer engine. */
  loadTimeoutMs?: number
  /** PDF viewer engine: 'google' (Docs viewer), 'native' (iframe), or 'auto' (fallback). */
  viewerPreference?: "google" | "native" | "auto"
  /** Message shown when no document is provided. */
  notFoundLabel?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
  /** Additional CSS classes. */
  className?: string
}

type PdfViewerState = {
  frameStatus: "loading" | "loaded" | "error"
  viewerEngine: "google" | "native"
}

type PdfViewerAction =
  | { type: "LOADED" }
  | { type: "ERROR" }
  | { type: "FALLBACK_TO_NATIVE" }
  | { type: "TIMEOUT"; viewerPreference: string; viewerEngine: "google" | "native" }
  | { type: "RESET"; viewerPreference: string }

function pdfViewerReducer(state: PdfViewerState, action: PdfViewerAction): PdfViewerState {
  switch (action.type) {
    case "LOADED":
      return { ...state, frameStatus: "loaded" }
    case "ERROR":
      return { ...state, frameStatus: "error" }
    case "FALLBACK_TO_NATIVE":
      return { frameStatus: "loading", viewerEngine: "native" }
    case "RESET":
      return getInitialPdfViewerState(action.viewerPreference)
    case "TIMEOUT":
      if (action.viewerPreference === "auto" && action.viewerEngine === "google") {
        return { frameStatus: "loading", viewerEngine: "native" }
      }
      return { ...state, frameStatus: "error" }
    default:
      return state
  }
}

function getInitialPdfViewerState(viewerPreference: string): PdfViewerState {
  return {
    frameStatus: "loading",
    viewerEngine: viewerPreference === "native" ? "native" : "google",
  }
}

const safeFormatDate = (date?: string | Date) => {
  if (!date) return "—"

  const parsed = date instanceof Date ? date : new Date(date)

  if (Number.isNaN(parsed.getTime())) return "—"

  return format(parsed, DD_MM_YYYY)
}

const openDocNewTab = (fileUrl: string) => {
  const newWindow = window.open(fileUrl, "_blank", "noopener,noreferrer")

  if (newWindow) newWindow.opener = null
}

/**
 * PDF viewer component supporting modal and inline display modes.
 * Uses Google Docs viewer or native iframe with fallback on load failure.
 */
function IGRPPdfViewer({
  document,
  displayMode = "modal",
  labelButtonCancel = "Close",
  labelButtonNewTab = "Open in new tab",
  inlineHeight = "50vh",
  loadErrorLabel = "Could not load PDF",
  loadTimeoutMs = 8000,
  viewerPreference = "google",
  notFoundLabel = "No File found",
  name,
  id,
  className,
}: IGRPPdfViewerProps) {
  const [selectedDocument, setSelectedDocument] = useState<IGRPDocumentItem>()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const _id = useId()
  const ref = name ?? id ?? _id

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  const handleDocumentClick = useCallback(
    (doc: IGRPDocumentItem) => {
      if (displayMode === "modal") {
        setSelectedDocument(doc)
        setIsModalOpen(true)
      }
    },
    [displayMode],
  )

  if (loading) return <IGRPLoadingSpinner />

  if (!document) {
    return (
      <div className={cn("flex items-center gap-3")} id={ref}>
        <IGRPIcon iconName="FileX2" className={cn(IGRPColors.solid.destructive.text)} />
        <IGRPText as="p" size="default" weight="semibold" spacing="none">
          {notFoundLabel}
        </IGRPText>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col", className)} id={ref}>
      {displayMode === "inline" && (
        <IGRPPdfViewerInline
          key={`${document.fileUrl}-${viewerPreference}`}
          document={document}
          labelButtonNewTab={labelButtonNewTab}
          height={inlineHeight}
          loadErrorLabel={loadErrorLabel}
          loadTimeoutMs={loadTimeoutMs}
          viewerPreference={viewerPreference}
        />
      )}

      {displayMode === "modal" && (
        <>
          <IGRPPdfViewerCard
            key={document.id}
            document={document}
            onView={handleDocumentClick}
            clickable={displayMode === "modal"}
          />
          <IGRPPdfViewerModal
            key={selectedDocument ? `${selectedDocument.fileUrl}-${viewerPreference}` : "closed"}
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            document={selectedDocument || null}
            labelButtonCancel={labelButtonCancel}
            labelButtonNewTab={labelButtonNewTab}
            loadErrorLabel={loadErrorLabel}
            loadTimeoutMs={loadTimeoutMs}
            viewerPreference={viewerPreference}
          />
        </>
      )}
    </div>
  )
}

/**
 * Props for the internal IGRPPdfViewerCard component.
 */
type IGRPPdfViewerCardProps = {
  /** Document to display in the card. */
  document: IGRPDocumentItem
  /** Callback when the user requests to view the document. */
  onView: (doc: IGRPDocumentItem) => void
  /** Whether the card is clickable to open the modal. */
  clickable?: boolean
}

/** Card preview for a PDF document in modal mode. */
function IGRPPdfViewerCard({ document, onView, clickable = true }: IGRPPdfViewerCardProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!clickable) return

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onView(document)
    }
  }

  return (
    <Card
      key={document.id}
      className={cn("transition-all py-3", clickable ? "cursor-pointer hover:shadow-md" : "")}
      onClick={clickable ? () => onView(document) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <CardHeader className={cn("gap-0")}>
        <div className={cn("flex items-start justify-between")}>
          <div className={cn("flex items-center gap-2")}>
            <IGRPIcon iconName="FileText" className={cn("text-muted-foreground")} />
            <CardTitle className={cn("text-sm font-medium leading-tight")}>{document.title}</CardTitle>
          </div>
          <IGRPBadge variant="soft" color="destructive" badgeClassName={cn("px-3")}>
            PDF
          </IGRPBadge>
        </div>
      </CardHeader>
    </Card>
  )
}

/**
 * Props for the internal IGRPPdfViewerInline component.
 */
type IGRPPdfViewerInlineProps = {
  /** Document to display inline. */
  document: IGRPDocumentItem
  /** Label for the "open in new tab" button. */
  labelButtonNewTab?: string
  /** Height of the iframe container. */
  height?: string
  /** Message shown when the PDF fails to load. */
  loadErrorLabel?: string
  /** Timeout in ms before showing load error or switching viewer engine. */
  loadTimeoutMs?: number
  /** PDF viewer engine preference. */
  viewerPreference?: "google" | "native" | "auto"
}

/** Inline PDF viewer with embedded iframe. */
function IGRPPdfViewerInline({
  document,
  labelButtonNewTab = "Open in new tab",
  height = "50vh",
  loadErrorLabel = "Could not load PDF",
  loadTimeoutMs = 8000,
  viewerPreference = "auto",
}: IGRPPdfViewerInlineProps) {
  const { fileUrl, title, author, date } = document
  const [state, dispatch] = useReducer(pdfViewerReducer, viewerPreference, getInitialPdfViewerState)
  const { frameStatus, viewerEngine } = state

  const handleFrameLoad = useCallback(() => dispatch({ type: "LOADED" }), [])
  const handleFrameError = useCallback(() => {
    if (viewerPreference === "auto" && viewerEngine === "google") {
      dispatch({ type: "FALLBACK_TO_NATIVE" })
      return
    }
    dispatch({ type: "ERROR" })
  }, [viewerPreference, viewerEngine])

  useEffect(() => {
    if (frameStatus !== "loading") return

    const timeout = setTimeout(() => {
      dispatch({ type: "TIMEOUT", viewerPreference, viewerEngine })
    }, loadTimeoutMs)

    return () => clearTimeout(timeout)
  }, [frameStatus, loadTimeoutMs, viewerEngine, viewerPreference])

  const iframeSrc =
    viewerEngine === "google"
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : fileUrl

  return (
    <div className={cn("flex flex-col gap-2")}>
      <div className={cn("flex flex-col")}>
        <div className={cn("flex items-center justify-between")}>
          <div>
            <IGRPHeadline variant="h6" title={title} />
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground")}>
              <div className={cn("flex items-center gap-1 text-xs")}>
                <IGRPIcon iconName="User" className={cn("text-primary")} />
                {author}
              </div>
              <div className={cn("flex items-center gap-1 text-xs")}>
                <IGRPIcon iconName="Calendar" className={cn("text-primary")} />
                {safeFormatDate(date)}
              </div>
            </div>
          </div>

          <IGRPButton
            variant="default"
            onClick={() => openDocNewTab(fileUrl)}
            showIcon
            iconName="ExternalLink"
            size="sm"
            aria-label={`${labelButtonNewTab} ${title}`}
          >
            {labelButtonNewTab}
          </IGRPButton>
        </div>
      </div>

      <div
        className={cn("w-full bg-gray-100 rounded-lg overflow-hidden relative")}
        style={{ height }}
        aria-busy={frameStatus === "loading"}
      >
        {frameStatus === "loading" && (
          <div className={cn("absolute inset-0 flex items-center justify-center bg-background/70")}>
            <IGRPLoadingSpinner />
          </div>
        )}

        {frameStatus === "error" && (
          <div
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground",
            )}
          >
            <IGRPIcon iconName="AlertCircle" className={cn("text-destructive")} />
            <span>{loadErrorLabel}</span>
          </div>
        )}

        <iframe
          src={iframeSrc}
          className={cn("w-full h-full border-0", frameStatus === "error" ? "hidden" : "block")}
          title={`PDF Viewer - ${title}`}
          aria-label={`PDF Viewer for ${title}`}
          loading="lazy"
          onLoad={handleFrameLoad}
          onError={handleFrameError}
        />
      </div>
    </div>
  )
}

/**
 * Props for the internal IGRPPdfViewerModal component.
 */
type IGRPPdfViewerModalProps = {
  /** Whether the modal is open. */
  open: boolean
  /** Document to display, or null when closed. */
  document: IGRPDocumentItem | null
  /** Callback when the modal should close. */
  onClose: (open: boolean) => void
  /** Label for the close button. */
  labelButtonCancel?: string
  /** Label for the "open in new tab" button. */
  labelButtonNewTab?: string
  /** Message shown when the PDF fails to load. */
  loadErrorLabel?: string
  /** Timeout in ms before showing load error or switching viewer engine. */
  loadTimeoutMs?: number
  /** PDF viewer engine preference. */
  viewerPreference?: "google" | "native" | "auto"
}

/** Modal dialog containing the PDF viewer. */
function IGRPPdfViewerModal({
  open,
  document,
  onClose,
  labelButtonCancel,
  labelButtonNewTab,
  loadErrorLabel = "Could not load PDF",
  loadTimeoutMs = 8000,
  viewerPreference = "auto",
}: IGRPPdfViewerModalProps) {
  const [state, dispatch] = useReducer(pdfViewerReducer, viewerPreference, getInitialPdfViewerState)
  const { frameStatus, viewerEngine } = state

  const handleFrameLoad = useCallback(() => dispatch({ type: "LOADED" }), [])
  const handleFrameError = useCallback(() => {
    if (viewerPreference === "auto" && viewerEngine === "google") {
      dispatch({ type: "FALLBACK_TO_NATIVE" })
      return
    }
    dispatch({ type: "ERROR" })
  }, [viewerPreference, viewerEngine])

  const prevDocIdRef = useRef<number | null>(null)
  useEffect(() => {
    if (document && document.id !== prevDocIdRef.current) {
      prevDocIdRef.current = document.id
      dispatch({ type: "RESET", viewerPreference })
    } else if (!document) {
      prevDocIdRef.current = null
    }
  }, [document, viewerPreference])

  useEffect(() => {
    if (frameStatus !== "loading") return

    const timeout = setTimeout(() => {
      dispatch({ type: "TIMEOUT", viewerPreference, viewerEngine })
    }, loadTimeoutMs)

    return () => clearTimeout(timeout)
  }, [frameStatus, loadTimeoutMs, viewerEngine, viewerPreference])

  if (!document) return null

  const { fileUrl, title, author, date } = document
  const iframeSrc =
    viewerEngine === "google"
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
      : fileUrl

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("sm:max-w-6xl w-[95vw] max-h-[95vh] overflow-auto flex flex-col gap-0")}>
        <DialogHeader>
          <DialogTitle className={cn("text-xl font-semibold")}>{title}</DialogTitle>
          <DialogDescription className={cn("flex items-center gap-4 mt-1")}>
            <div className={cn("flex items-center gap-1")}>
              <IGRPIcon iconName="User" className={cn("text-primary")} />
              {author}
            </div>
            <div className={cn("flex items-center gap-1")}>
              <IGRPIcon iconName="Calendar" className={cn("text-primary")} />
              {safeFormatDate(date)}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className={cn("flex-1 mt-4")}>
          <div
            className={cn("w-full h-[60vh] bg-gray-100 rounded-lg overflow-hidden relative")}
            aria-busy={frameStatus === "loading"}
          >
            {frameStatus === "loading" && (
              <div className={cn("absolute inset-0 flex items-center justify-center bg-background/70")}>
                <IGRPLoadingSpinner />
              </div>
            )}

            {frameStatus === "error" && (
              <div
                className={cn(
                  "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground",
                )}
              >
                <IGRPIcon iconName="AlertCircle" className={cn("text-destructive")} />
                <span>{loadErrorLabel}</span>
              </div>
            )}

            <iframe
              src={iframeSrc}
              className={cn("w-full h-full border-0", frameStatus === "error" ? "hidden" : "block")}
              title={`PDF Viewer - ${title}`}
              aria-label={`PDF Viewer for ${title}`}
              loading="lazy"
              onLoad={handleFrameLoad}
              onError={handleFrameError}
            />
          </div>
        </div>

        <DialogFooter className={cn("mt-4")}>
          <IGRPButton variant="default" onClick={() => onClose(false)}>
            {labelButtonCancel}
          </IGRPButton>
          <IGRPButton
            variant="secondary"
            onClick={() => openDocNewTab(fileUrl)}
            showIcon
            iconName="ExternalLink"
            aria-label={`${labelButtonNewTab} ${title}`}
          >
            {labelButtonNewTab}
          </IGRPButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { IGRPPdfViewer, type IGRPPdfViewerProps, type IGRPDocumentItem }
