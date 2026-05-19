"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "../primitives/button"
import { Cropper, CropperCropArea, CropperDescription, CropperImage } from "../primitives/cropper"
import { Slider } from "../primitives/slider"
import { cn } from "../../lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Area = { x: number; y: number; width: number; height: number }

export type IGRPImageCropperVariant = "basic" | "circular" | "zoom" | "preview"

export interface IGRPImageCropperProps {
  src: string
  variant?: IGRPImageCropperVariant
  onCrop?: (blob: Blob) => void
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
  outputHeight: number = pixelCrop.height,
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return null
    }

    canvas.width = outputWidth
    canvas.height = outputHeight

    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, outputWidth, outputHeight)

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, "image/jpeg")
    })
  } catch (error) {
    console.error("Error in getCroppedImg:", error)
    return null
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function IGRPImageCropper({
  src,
  variant = "basic",
  onCrop,
  cropLabel = "Crop",
  className,
}: IGRPImageCropperProps) {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [zoom, setZoom] = useState(1)
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null)

  const showZoom = variant === "zoom" || variant === "preview"
  const showPreview = variant === "preview"
  const isCircular = variant === "circular"

  const handleCropChange = useCallback((pixels: Area | null) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleCrop = async () => {
    if (!croppedAreaPixels) return

    try {
      const blob = await getCroppedImg(src, croppedAreaPixels)
      if (!blob) return

      onCrop?.(blob)

      if (showPreview) {
        const newUrl = URL.createObjectURL(blob)
        if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl)
        setCroppedImageUrl(newUrl)
      }
    } catch (error) {
      console.error("Error during cropping:", error)
      if (showPreview && croppedImageUrl) {
        URL.revokeObjectURL(croppedImageUrl)
        setCroppedImageUrl(null)
      }
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
                aria-label="Zoom slider"
              />
              <output className={cn("block w-10 shrink-0 text-right text-sm font-medium tabular-nums text-foreground")}>
                {parseFloat(zoom.toFixed(1))}x
              </output>
            </div>
          )}

          <Button onClick={handleCrop} disabled={!croppedAreaPixels} className={cn("w-full")}>
            {cropLabel}
          </Button>
        </div>

        {showPreview && (
          <div className={cn("flex w-full flex-col gap-2 md:w-40")}>
            <div
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-lg border border-border bg-muted",
              )}
            >
              {croppedImageUrl ? (
                // eslint-disable-next-line @next/next-eslint/no-img-element
                <img
                  src={croppedImageUrl}
                  alt="Cropped result"
                  className={cn("size-full object-cover")}
                />
              ) : (
                <div
                  className={cn(
                    "flex size-full items-center justify-center p-2 text-center text-xs text-muted-foreground",
                  )}
                >
                  Image preview
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
