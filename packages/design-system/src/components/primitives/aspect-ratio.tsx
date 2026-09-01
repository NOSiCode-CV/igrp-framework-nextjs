// shadcn: 2026-05-18
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"

function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />
}

export { AspectRatio }
