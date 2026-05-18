# Design System Experimental Promotions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote 4 experimental components to production: `IGRPBreadcrumb` (Horizon), upgraded `IGRPInputFile` with dropzone mode, `IGRPBanner`, and `IGRPImageCropper`.

**Architecture:** Each component moves from `src/components/experimental/` to `src/components/horizon/`, is uncommented, adapted to use semantic tokens, and exported from `src/index.ts`. The experimental source files are deleted after promotion.

**Tech Stack:** React 19, Tailwind v4 semantic tokens, CVA, react-dropzone, @origin-space/image-cropper, lucide-react

**Dependency note:** Run `ds-quick-cleanup` plan first (removes dead experimentals so this plan only touches live promotions).

---

## File Map

**Create:**
- `packages/design-system/src/components/horizon/breadcrumb.tsx`
- `packages/design-system/src/components/horizon/banner.tsx`
- `packages/design-system/src/components/horizon/image-cropper.tsx`

**Modify:**
- `packages/design-system/src/components/horizon/inputs/file.tsx` — add dropzone mode
- `packages/design-system/src/index.ts` — add 4 new exports

**Delete:**
- `packages/design-system/src/components/experimental/breadcrumb.tsx`
- `packages/design-system/src/components/experimental/banner.tsx`
- `packages/design-system/src/components/experimental/cropper-image.tsx`
- `packages/design-system/src/components/experimental/dropzone/index.tsx`

---

### Task 1: Promote IGRPBreadcrumb to Horizon

**Files:**
- Create: `packages/design-system/src/components/horizon/breadcrumb.tsx`
- Delete: `packages/design-system/src/components/experimental/breadcrumb.tsx`
- Modify: `packages/design-system/src/index.ts`

The experimental breadcrumb is 422 lines with size/color variants, home icon, and dropdown collapsing for long paths. The `Breadcrumb` primitive stays untouched; this adds `IGRPBreadcrumb` to Horizon.

- [ ] **Step 1: Copy and uncomment the experimental file**

```powershell
Copy-Item "packages/design-system/src/components/experimental/breadcrumb.tsx" "packages/design-system/src/components/horizon/breadcrumb.tsx"
```

- [ ] **Step 2: Uncomment the full file content**

Open `packages/design-system/src/components/horizon/breadcrumb.tsx`. The entire implementation is wrapped in `/* ... */`. Remove the block comment delimiters so all code is active.

- [ ] **Step 3: Add `"use client"` directive**

The file must start with:

```ts
"use client"
```

Add it as the very first line (before any imports).

- [ ] **Step 4: Fix imports**

The experimental file imports using relative paths for `../horizon/icon`. Update all relative imports to match the new location (`./icon`, `../primitives/dropdown-menu`, etc.):

```ts
// Update these import paths:
import { IGRPIcon } from "./icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../primitives/dropdown-menu"
import { cn } from "../../lib/utils"
```

- [ ] **Step 5: Verify no raw colors**

```powershell
Select-String -Path "packages/design-system/src/components/horizon/breadcrumb.tsx" -Pattern "gray-|blue-|red-|green-|amber-"
```

Expected: no output. If any are found, replace with semantic tokens (`text-muted-foreground`, `text-foreground`, etc.).

- [ ] **Step 6: Export from index.ts**

In `packages/design-system/src/index.ts`, add after the existing Horizon exports:

```ts
export {
  IGRPBreadcrumb,
  IGRPBreadcrumbList,
  IGRPBreadcrumbItem,
  IGRPBreadcrumbLink,
  IGRPBreadcrumbPage,
  IGRPBreadcrumbSeparator,
  type IGRPBreadcrumbProps,
} from "./components/horizon/breadcrumb"
```

- [ ] **Step 7: Delete the experimental source**

```powershell
Remove-Item "packages/design-system/src/components/experimental/breadcrumb.tsx"
```

- [ ] **Step 8: Build and verify**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "feat(design-system): promote IGRPBreadcrumb from experimental to Horizon"
```

---

### Task 2: Upgrade IGRPInputFile with dropzone mode

**Files:**
- Modify: `packages/design-system/src/components/horizon/inputs/file.tsx`
- Delete: `packages/design-system/src/components/experimental/dropzone/index.tsx`

The experimental dropzone is feature-complete (drag-drop, validation, progress, file management) but has hardcoded Portuguese strings. Merge it into `IGRPInputFile` via a `variant` prop.

- [ ] **Step 1: Read the current IGRPInputFile**

Open `packages/design-system/src/components/horizon/inputs/file.tsx` and note its current props and render structure. You'll be adding to it, not replacing it.

- [ ] **Step 2: Read the experimental dropzone**

Open `packages/design-system/src/components/experimental/dropzone/index.tsx`. Uncomment the full file mentally — note the feature set: `maxSize`, `maxFiles`, `accept`, `FileWithProgress` type, progress/upload/error tracking, add/remove.

- [ ] **Step 3: Add dropzone props to IGRPInputFile**

In `packages/design-system/src/components/horizon/inputs/file.tsx`, add a `variant` prop and dropzone-specific props to the interface:

```ts
interface IGRPInputFileProps extends IGRPBaseAttributes {
  // existing props...
  variant?: "default" | "dropzone"
  // dropzone-only props (ignored when variant="default"):
  maxSize?: number          // bytes, e.g. 5 * 1024 * 1024 for 5MB
  maxFiles?: number
  accept?: Record<string, string[]>  // react-dropzone accept format
  // i18n strings (Portuguese defaults):
  dropzoneLabel?: string    // default: "Arraste arquivos aqui ou clique para selecionar"
  dropzoneHint?: string     // default: "Tipos aceitos"
  removeLabel?: string      // default: "Remover"
  removeAllLabel?: string   // default: "Remover todos"
  onChange?: (files: File[]) => void
}
```

- [ ] **Step 4: Implement the dropzone branch**

Add the dropzone render branch inside `IGRPInputFile`. The dropzone uses `react-dropzone` (already a dependency via the experimental file — verify it's in `packages/design-system/package.json`):

```powershell
Select-String -Path "packages/design-system/package.json" -Pattern "react-dropzone"
```

If missing, add it:
```powershell
pnpm --filter @igrp/igrp-framework-react-design-system add react-dropzone
```

Implement the dropzone branch using the logic from the experimental file, replacing hardcoded strings with props:

```tsx
if (variant === "dropzone") {
  return (
    <IGRPDropzoneInternal
      maxSize={maxSize}
      maxFiles={maxFiles}
      accept={accept}
      label={label}
      dropzoneLabel={dropzoneLabel ?? "Arraste arquivos aqui ou clique para selecionar"}
      dropzoneHint={dropzoneHint ?? "Tipos aceitos"}
      removeLabel={removeLabel ?? "Remover"}
      removeAllLabel={removeAllLabel ?? "Remover todos"}
      onChange={onChange}
    />
  )
}
```

Extract the full dropzone UI into a local `IGRPDropzoneInternal` component in the same file. Port the logic from the experimental file: `useDropzone` hook, `FileWithProgress` type, progress tracking state, rejected files alert, remove single/remove all buttons.

Replace any `Card`, `Button`, `Alert`, `Progress` imports from the experimental file with their Horizon equivalents (`IGRPCard`, `IGRPButton`, `IGRPAlert`) or primitives as appropriate.

- [ ] **Step 5: Verify no hardcoded Portuguese strings**

```powershell
Select-String -Path "packages/design-system/src/components/horizon/inputs/file.tsx" -Pattern "Arraste|aceitos|Remover"
```

Expected: only inside default string values (prop defaults), not hardcoded in JSX.

- [ ] **Step 6: Delete the experimental dropzone**

```powershell
Remove-Item -Recurse "packages/design-system/src/components/experimental/dropzone"
```

- [ ] **Step 7: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "feat(design-system): add dropzone variant to IGRPInputFile"
```

---

### Task 3: Promote IGRPBanner to Horizon

**Files:**
- Create: `packages/design-system/src/components/horizon/banner.tsx`
- Delete: `packages/design-system/src/components/experimental/banner.tsx`
- Modify: `packages/design-system/src/index.ts`

Two variants: `"cookie"` (consent) and `"announcement"` (with optional learn-more link).

- [ ] **Step 1: Create the banner file**

Create `packages/design-system/src/components/horizon/banner.tsx`:

```tsx
"use client"

import { X } from "lucide-react"
import { useState } from "react"
import { cn } from "../../lib/utils"
import { Button } from "../primitives/button"

interface IGRPBannerProps {
  variant: "cookie" | "announcement"
  message: string
  learnMoreHref?: string       // announcement only
  learnMoreLabel?: string      // default: "Learn more"
  acceptLabel?: string         // cookie only, default: "Accept"
  declineLabel?: string        // cookie only, default: "Decline"
  onAccept?: () => void        // cookie only
  onDecline?: () => void       // cookie only
  onDismiss?: () => void       // announcement only
  className?: string
}

function IGRPBanner({
  variant,
  message,
  learnMoreHref,
  learnMoreLabel = "Learn more",
  acceptLabel = "Accept",
  declineLabel = "Decline",
  onAccept,
  onDecline,
  onDismiss,
  className,
}: IGRPBannerProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  if (variant === "cookie") {
    return (
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-4 border-t bg-background px-6 py-4 shadow-lg",
          className,
        )}
      >
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setVisible(false)
              onDecline?.()
            }}
          >
            {declineLabel}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setVisible(false)
              onAccept?.()
            }}
          >
            {acceptLabel}
          </Button>
        </div>
      </div>
    )
  }

  // announcement variant
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-primary px-6 py-3 text-primary-foreground",
        className,
      )}
    >
      <p className="text-sm">
        {message}
        {learnMoreHref && (
          <a
            href={learnMoreHref}
            className="ml-2 underline underline-offset-4 hover:opacity-80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {learnMoreLabel}
          </a>
        )}
      </p>
      <button
        type="button"
        aria-label="Dismiss"
        className="shrink-0 opacity-70 hover:opacity-100"
        onClick={() => {
          setVisible(false)
          onDismiss?.()
        }}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}

export { IGRPBanner, type IGRPBannerProps }
```

- [ ] **Step 2: Delete the experimental banner**

```powershell
Remove-Item "packages/design-system/src/components/experimental/banner.tsx"
```

- [ ] **Step 3: Export from index.ts**

```ts
export { IGRPBanner, type IGRPBannerProps } from "./components/horizon/banner"
```

- [ ] **Step 4: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat(design-system): add IGRPBanner with cookie and announcement variants"
```

---

### Task 4: Promote IGRPImageCropper to Horizon

**Files:**
- Create: `packages/design-system/src/components/horizon/image-cropper.tsx`
- Delete: `packages/design-system/src/components/experimental/cropper-image.tsx`
- Modify: `packages/design-system/src/index.ts`

4 variants: `"basic"`, `"circular"`, `"zoom"`, `"preview"`. Powered by `@origin-space/image-cropper` (already in package.json).

- [ ] **Step 1: Verify the dependency**

```powershell
Select-String -Path "packages/design-system/package.json" -Pattern "origin-space"
```

Expected: `"@origin-space/image-cropper": "^0.1.9"`.

- [ ] **Step 2: Create the image-cropper file**

Create `packages/design-system/src/components/horizon/image-cropper.tsx`. Port the implementation from the experimental file, exposing a single `IGRPImageCropper` component with a `variant` prop:

```tsx
"use client"

import { useRef, useState } from "react"
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "../primitives/cropper"
import { Slider } from "../primitives/slider"
import { Button } from "../primitives/button"
import { cn } from "../../lib/utils"

type IGRPImageCropperVariant = "basic" | "circular" | "zoom" | "preview"

interface IGRPImageCropperProps {
  src: string
  variant?: IGRPImageCropperVariant
  onCrop?: (blob: Blob) => void
  cropLabel?: string        // default: "Crop"
  className?: string
  circular?: boolean        // shorthand for variant="circular"
}

// Helper: extract cropped image as Blob
async function getCroppedImg(
  cropperEl: HTMLElement | null,
): Promise<Blob | null> {
  if (!cropperEl) return null
  const canvas = document.createElement("canvas")
  // Implementation: draw the visible crop area onto canvas and export as blob
  // Port the full getCroppedImg helper from the experimental file verbatim
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95)
  })
}

function IGRPImageCropper({
  src,
  variant = "basic",
  onCrop,
  cropLabel = "Crop",
  className,
}: IGRPImageCropperProps) {
  const [zoom, setZoom] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const cropperRef = useRef<HTMLElement>(null)

  const isCircular = variant === "circular"
  const showZoom = variant === "zoom" || variant === "preview"
  const showPreview = variant === "preview"

  const handleCrop = async () => {
    const blob = await getCroppedImg(cropperRef.current)
    if (!blob) return
    if (showPreview) {
      const url = URL.createObjectURL(blob)
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    }
    onCrop?.(blob)
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Cropper className={cn("relative h-64 w-full overflow-hidden rounded-md bg-muted")}>
        <CropperDescription className="sr-only">
          Image cropper. Drag to reposition.
        </CropperDescription>
        <CropperImage src={src} style={{ transform: `scale(${zoom})` }} />
        <CropperCropArea
          className={cn(isCircular && "rounded-full")}
        />
      </Cropper>

      {showZoom && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Zoom</span>
          <Slider
            min={1}
            max={3}
            step={0.01}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            className="flex-1"
          />
        </div>
      )}

      <Button onClick={handleCrop}>{cropLabel}</Button>

      {showPreview && previewUrl && (
        <div className="overflow-hidden rounded-md border border-border">
          <img src={previewUrl} alt="Cropped preview" className="h-40 w-full object-cover" />
        </div>
      )}
    </div>
  )
}

export { IGRPImageCropper, type IGRPImageCropperProps, type IGRPImageCropperVariant }
```

**Important:** The `getCroppedImg` helper in the experimental file has the full canvas implementation. Port it verbatim inside this file.

- [ ] **Step 3: Delete the experimental source**

```powershell
Remove-Item "packages/design-system/src/components/experimental/cropper-image.tsx"
```

- [ ] **Step 4: Export from index.ts**

```ts
export {
  IGRPImageCropper,
  type IGRPImageCropperProps,
  type IGRPImageCropperVariant,
} from "./components/horizon/image-cropper"
```

- [ ] **Step 5: Build**

```powershell
pnpm build:ds
```

Expected: exits 0.

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat(design-system): add IGRPImageCropper with basic/circular/zoom/preview variants"
```

---

### Task 5: Create changeset

- [ ] **Step 1: Create changeset**

```powershell
pnpm changeset
```

When prompted:
- Select `@igrp/igrp-framework-react-design-system`
- Type: `patch`
- Summary: `Promote IGRPBreadcrumb, IGRPBanner, IGRPImageCropper from experimental; add dropzone variant to IGRPInputFile`

- [ ] **Step 2: Final build**

```powershell
pnpm build:ds
```

Expected: exits 0.
