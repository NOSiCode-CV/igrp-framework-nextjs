"use client"

import { useId } from "react"

import { Avatar, AvatarImage, AvatarFallback } from "../primitives/avatar.js"
import { cn } from "cn"
import { useIGRPi18n } from "../../i18n/index.js"

/**
 * Props for the IGRPUserAvatar component.
 * @see IGRPUserAvatar
 */
interface IGRPUserAvatarProps {
  /** Image URL for the avatar. */
  image?: string | null
  /** Alt text for the image. */
  alt?: string
  /** Content shown when image fails to load (e.g. initials). */
  fallbackContent: React.ReactNode
  /** Additional CSS classes for the avatar container. */
  className?: string
  /** CSS classes for the fallback element. */
  fallbackClass?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
}

/**
 * User avatar with image and fallback content.
 * Renders an image when available, otherwise shows fallbackContent.
 */
function IGRPUserAvatar({ image, alt, fallbackContent, className, fallbackClass, name, id }: IGRPUserAvatarProps) {
  const i18n = useIGRPi18n()
  const _id = useId()
  const ref = name ?? id ?? _id

  return (
    <Avatar className={cn(className)} id={ref}>
      <AvatarImage src={image || undefined} alt={alt || i18n.avatar.currentUser} />
      <AvatarFallback className={cn(fallbackClass)}>{fallbackContent}</AvatarFallback>
    </Avatar>
  )
}

export { IGRPUserAvatar, type IGRPUserAvatarProps }
