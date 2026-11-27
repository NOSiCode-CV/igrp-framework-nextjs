"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import NextImage from "next/image"

import { Button } from "../primitives/button.js"
import { Cropper, CropperCropArea, CropperDescription, CropperImage } from "../primitives/cropper.js"
import { Slider } from "../primitives/slider.js"
import { cn } from "cn"
import { useIGRPi18n } from "../../i18n/index.js"

// ─── Types ───────────────────────────────────────────────────────────────────

type Area = { x: number; y: number; width: number; height: number }

export type IGRPImageCropperVariant = "basic" | "circular" | "zoom" | "preview"

export interface IGRPImageCropperProps {
  src: string
  variant?: IGRPImageCropperVariant
  onCrop?: (blob: Blob) => void
  /** Called when the crop operation fails. Receives the thrown error. */
  onError?: (error: unknown) => void
  cropLabel?: string
  className?: string
}

// ─── Helper ──────────────────────────────────────────────────────────────────

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", (error) => reject(error))
    image.setAttribute("crossOrigin", "anonymous")
    image.src = url
  })

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number = pixelCrop.width,
  outputHeight: number = pixelCrop.height
): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context unavailable")

  canvas.width = outputWidth
  canvas.height = outputHeight

  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))), "image/jpeg")
  })
}

/**
 * Crops and hands the blob to `onCrop`; a throw from either comes back as `error`.
 * Module scope because the React Compiler cannot lower this try/catch inside a component.
 */
async function cropAndDeliver(
  src: string,
  area: Area,
  onCrop?: (blob: Blob) => void
): Promise<{ blob: Blob } | { error: unknown }> {
  try {
    const blob = await getCroppedImg(src, area)
    onCrop?.(blob)
    return { blob }
  } catch (error) {
    return { error }
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function IGRPImageCropper({
  src,
  variant = "basic",
  onCrop,
  onError,
  cropLabel,
  className,
}: IGRPImageCropperProps) {
  const i18n = useIGRPi18n()
  // Only read on click: a ref, so dragging the crop area does not re-render on every pointer move.
  const croppedAreaRef = useRef<Area | null>(null)
  const [hasCropArea, setHasCropArea] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  const showZoom = variant === "zoom" || variant === "preview"
  const showPreview = variant === "preview"
  const isCircular = variant === "circular"

  const handleCropChange = useCallback((pixels: Area | null) => {
    croppedAreaRef.current = pixels
    setHasCropArea(pixels !== null)
  }, [])

  const handleCrop = async () => {
    const area = croppedAreaRef.current
    if (!area) return

    const result = await cropAndDeliver(src, area, onCrop)
    if ("error" in result) {
      onError?.(result.error)
      if (showPreview && croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl)
        setCroppedImageUrl(null)
      }
      return
    }

    if (showPreview) {
      const newUrl = URL.createObjectURL(result.blob)
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl)
      setCroppedImageUrl(newUrl)
    }
  }

  useEffect(() => {
    const currentUrl = croppedImageUrl
    return () => {
      if (currentUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [croppedImageUrl])

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      <div className={cn("flex w-full flex-col gap-4", showPreview && "md:flex-row")}>
        <div className={cn("flex flex-col gap-4", showPreview && "md:flex-1")}>
          <Cropper
            className={cn("h-80")}
            image={src}
            zoom={showZoom ? zoom : undefined}
            onZoomChange={showZoom ? setZoom : undefined}
            onCropChange={handleCropChange}
          >
            <CropperDescription />
            <CropperImage />
            <CropperCropArea className={cn(isCircular && "rounded-full")} />
          </Cropper>

          {showZoom && (
            <div className={cn("mx-auto flex w-full max-w-80 items-center gap-2")}>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.01}
                onValueChange={(value) => setZoom(value[0] ?? 1)}
                aria-label={i18n.imageCropper.zoomSlider}
              />
              <output className={cn("block w-10 shrink-0 text-right text-sm font-medium text-foreground tabular-nums")}>
                {parseFloat(zoom.toFixed(1))}
                {/* igrp-i18n-ignore */}x
              </output>
            </div>
          )}

          <Button onClick={handleCrop} disabled={!hasCropArea} className={cn("w-full")}>
            {cropLabel ?? i18n.imageCropper.crop}
          </Button>
        </div>

        {showPreview && (
          <div className={cn("flex w-full flex-col gap-2 md:w-40")}>
            <div
              className={cn("relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted")}
            >
              {croppedImageUrl ? (
                <NextImage
                  src={croppedImageUrl}
                  alt={i18n.imageCropper.croppedResult}
                  fill
                  sizes="160px"
                  className={cn("object-cover")}
                  unoptimized
                />
              ) : (
                <div
                  className={cn(
                    "flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground"
                  )}
                >
                  {i18n.imageCropper.previewPlaceholder}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
