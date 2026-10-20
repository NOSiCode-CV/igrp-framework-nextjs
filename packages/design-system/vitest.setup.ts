import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

afterEach(() => {
  cleanup()
})

// Radix UI primitives rely on these jsdom-missing APIs.
if (typeof window !== "undefined") {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false
  }
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {}
  }
  // ProseMirror (the rich-text editor) measures the caret to scroll it into view.
  const emptyRects = () =>
    ({ length: 0, item: () => null, [Symbol.iterator]: [][Symbol.iterator] }) as unknown as DOMRectList
  const zeroRect = () => new DOMRect(0, 0, 0, 0)
  for (const proto of [window.Range.prototype, window.Text.prototype, window.HTMLElement.prototype] as unknown as {
    getClientRects?: () => DOMRectList
    getBoundingClientRect?: () => DOMRect
  }[]) {
    if (!proto.getClientRects) proto.getClientRects = emptyRects
    if (!proto.getBoundingClientRect) proto.getBoundingClientRect = zeroRect
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
}
