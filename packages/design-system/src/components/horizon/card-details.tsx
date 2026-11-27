"use client"

import { useId } from "react"

import { cn } from "cn"
import { igrpCleanString } from "../../lib/utilities.js"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../primitives/card.js"
import { Separator } from "../primitives/separator.js"
import { IGRPCopyTo } from "./copy-to.js"

/**
 * Single detail item (label + content).
 * @see IGRPCardDetails
 */
interface IGRPCardDetailsItemProps {
  /** Field label. */
  label: string
  /** Field content. */
  content: React.ReactNode
  /** Show copy-to-clipboard button. */
  showCopyTo?: boolean
}

/**
 * Props for the IGRPCardDetails component.
 * @see IGRPCardDetails
 */
interface IGRPCardDetailsProps extends React.ComponentProps<typeof Card> {
  /** Card title. */
  title?: string
  /** Card description. */
  description?: string
  /** CSS classes for the content grid. */
  contentClassName?: string
  /** Detail items. */
  items: IGRPCardDetailsItemProps[]
}

/**
 * Card displaying labeled detail items in a grid, with optional copy button.
 */
function IGRPCardDetails({
  title,
  description,
  contentClassName,
  items,
  id,
  className,
  ...props
}: IGRPCardDetailsProps) {
  const _id = useId()
  const ref = id ?? _id

  if (items.length === 0) {
    return null
  }

  return (
    <Card
      id={ref}
      className={cn(
        "animate-fade-in gap-3 overflow-hidden motion-reduce:animate-none",
        "transition-[box-shadow,border-color] duration-200 hover:border-primary/20 hover:shadow-lg",
        className
      )}
      {...props}
    >
      {(title || description) && (
        <CardHeader className={cn("pb-4")}>
          {/* CardTitle is a div; the role makes it a real heading for screen-reader navigation. */}
          {title && (
            <CardTitle role="heading" aria-level={2}>
              {title}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
          <Separator className={cn("mt-4")} />
        </CardHeader>
      )}
      <CardContent className={cn("grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3", contentClassName)}>
        {items.map((item) => {
          const key = igrpCleanString(item.label)

          return (
            <div key={key} className={cn("flex items-center gap-4")}>
              {/* A term/value pair, not a heading: <h3> per field broke the page outline. */}
              <dl>
                <dt className={cn("font-normal text-muted-foreground")}>{item.label}</dt>
                <dd>
                  {typeof item.content === "string" ? (
                    <span className={cn("font-medium")}>{item.content}</span>
                  ) : (
                    item.content
                  )}
                </dd>
              </dl>
              {item.showCopyTo && <IGRPCopyTo value={item.content as string} />}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export { IGRPCardDetails, type IGRPCardDetailsProps, type IGRPCardDetailsItemProps }
