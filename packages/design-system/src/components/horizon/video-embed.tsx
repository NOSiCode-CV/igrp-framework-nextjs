"use client"

import { useId } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

type IGRPVideoEmbedAllowFeature =
  | "autoplay"
  | "clipboard-write"
  | "encrypted-media"
  | "gyroscope"
  | "picture-in-picture"
  | "web-share"
  | "accelerometer"

const videoVariants = cva("", {
  variants: {
    aspectRatio: {
      "1/1": "aspect-square",
      "4/3": "aspect-[4/3]",
      "16/9": "aspect-video",
      "21/9": "aspect-[21/9]",
      "3/2": "aspect-[3/2]",
      auto: "aspect-auto",
    },
  },
  defaultVariants: {
    aspectRatio: "16/9",
  },
})

/**
 * Props for the IGRPVideoEmbed component.
 * @see IGRPVideoEmbed
 */
interface IGRPVideoEmbedProps extends VariantProps<typeof videoVariants> {
  /** Video URL (YouTube, Vimeo, etc.). */
  src: string
  /** Accessible title for the iframe. */
  title: string
  /** Iframe loading strategy. */
  loading?: "eager" | "lazy"
  /** Allowed iframe features. */
  allow?: IGRPVideoEmbedAllowFeature[]
  /** Allow fullscreen. */
  allowFullScreen?: boolean
  /** Autoplay on load. */
  autoplay?: boolean
  /** Mute by default. */
  muted?: boolean
  /** Show controls. */
  controls?: boolean
  /** Loop video. */
  loop?: boolean
  /** Additional CSS classes. */
  className?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
  /** Start time in seconds. */
  start?: number
}

/**
 * Embeds video from YouTube, Vimeo, or similar via iframe.
 */
function IGRPVideoEmbed({
  src,
  title,
  loading = "lazy",
  allow = ["autoplay", "encrypted-media", "picture-in-picture"],
  allowFullScreen = true,
  autoplay = false,
  muted = false,
  controls = true,
  loop = false,
  className,
  name,
  id,
  start = 0,
  aspectRatio = "16/9",
}: IGRPVideoEmbedProps) {
  const _id = useId()
  const ref = name ?? id ?? _id

  let videoUrl: URL
  try {
    videoUrl = new URL(src)
  } catch {
    console.error("[VideoEmbed] Invalid URL provided:", src)
    return (
      <div
        className={cn(
          "w-full overflow-hidden bg-muted flex items-center justify-center p-8",
          videoVariants({ aspectRatio }),
          className,
        )}
        id={ref}
      >
        <p className={cn("text-muted-foreground text-sm")}>Invalid video URL</p>
      </div>
    )
  }

  if (start > 0) {
    videoUrl.searchParams.set("start", start.toString())
  }

  videoUrl.searchParams.set("autoplay", autoplay ? "1" : "0")
  videoUrl.searchParams.set("mute", muted ? "1" : "0")
  videoUrl.searchParams.set("controls", controls ? "1" : "0")
  videoUrl.searchParams.set("loop", loop ? "1" : "0")

  const allowValue = allow.join("; ")

  return (
    <div className={cn("w-full overflow-hidden", className)} id={ref}>
      <iframe
        key={src}
        src={videoUrl.toString()}
        className={cn("w-full h-full border-0", videoVariants({ aspectRatio }))}
        title={title}
        loading={loading}
        allowFullScreen={allowFullScreen}
        allow={allowValue}
        referrerPolicy="strict-origin-when-cross-origin"
        name={name}
      />
    </div>
  )
}

export { IGRPVideoEmbed, type IGRPVideoEmbedProps, type IGRPVideoEmbedAllowFeature }
