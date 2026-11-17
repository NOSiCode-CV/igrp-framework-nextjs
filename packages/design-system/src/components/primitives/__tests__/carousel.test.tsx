import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"

import { IGRP_I18N_DEFAULTS_PT } from "../../../i18n/strings.js"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "../carousel.js"

// Embla observes slide visibility; jsdom has no IntersectionObserver.
vi.stubGlobal(
  "IntersectionObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
)

function renderCarousel() {
  let api: CarouselApi
  render(
    <Carousel setApi={(a) => (api = a)} aria-label="Galeria">
      <CarouselContent>
        <CarouselItem>Um</CarouselItem>
        <CarouselItem>Dois</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  )
  return () => api!
}

describe("Carousel", () => {
  it("exposes a labelled carousel region with slides", () => {
    renderCarousel()
    expect(screen.getByRole("region", { name: "Galeria" })).toHaveAttribute("aria-roledescription", "carousel")
    expect(screen.getAllByRole("group")).toHaveLength(2)
    expect(screen.getByRole("button", { name: IGRP_I18N_DEFAULTS_PT.carousel.previous })).toBeDisabled()
  })

  it("scrolls with the arrow keys", () => {
    const getApi = renderCarousel()
    const next = vi.spyOn(getApi(), "scrollNext")
    const prev = vi.spyOn(getApi(), "scrollPrev")
    const region = screen.getByRole("region", { name: "Galeria" })
    fireEvent.keyDown(region, { key: "ArrowRight" })
    fireEvent.keyDown(region, { key: "ArrowLeft" })
    expect(next).toHaveBeenCalledOnce()
    expect(prev).toHaveBeenCalledOnce()
  })
})
