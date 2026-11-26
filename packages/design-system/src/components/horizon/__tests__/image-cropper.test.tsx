import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useEffect } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { IGRPImageCropper } from "../image-cropper.js"

// The real cropper needs layout jsdom lacks; this stub reports a crop area at once.
vi.mock("../../primitives/cropper.js", () => ({
  Cropper: ({ onCropChange }: { onCropChange: (a: unknown) => void }) => {
    useEffect(() => onCropChange({ x: 0, y: 0, width: 10, height: 10 }), [onCropChange])
    return null
  },
  CropperCropArea: () => null,
  CropperDescription: () => null,
  CropperImage: () => null,
}))

afterEach(() => vi.unstubAllGlobals())

describe("IGRPImageCropper", () => {
  it("reports an image load failure to onError and does not call onCrop", async () => {
    class FailingImage extends EventTarget {
      setAttribute() {}
      set src(_: string) {
        queueMicrotask(() => this.dispatchEvent(new Event("error")))
      }
    }
    vi.stubGlobal("Image", FailingImage)
    const onCrop = vi.fn()
    const onError = vi.fn()
    render(<IGRPImageCropper src="https://other.example/a.jpg" onCrop={onCrop} onError={onError} />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(onError).toHaveBeenCalledOnce())
    expect(onCrop).not.toHaveBeenCalled()
  })
})
