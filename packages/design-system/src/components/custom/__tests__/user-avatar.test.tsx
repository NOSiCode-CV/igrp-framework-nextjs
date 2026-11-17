import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRP_I18N_DEFAULTS_PT } from "../../../i18n/strings.js"
import { IGRPUserAvatar } from "../user-avatar.js"

// jsdom never loads images; make Radix's probe see a loaded image.
function stubLoadedImages() {
  vi.spyOn(window.HTMLImageElement.prototype, "complete", "get").mockReturnValue(true)
  vi.spyOn(window.HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(10)
}

describe("IGRPUserAvatar", () => {
  afterEach(() => vi.restoreAllMocks())

  it("shows the fallback when there is no image", () => {
    render(<IGRPUserAvatar image={null} fallbackContent="JD" />)
    expect(screen.getByText("JD")).toBeInTheDocument()
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("renders the loaded image with its alt text instead of the fallback", () => {
    stubLoadedImages()
    render(<IGRPUserAvatar image="/me.png" alt="Joana Dias" fallbackContent="JD" />)
    expect(screen.getByRole("img", { name: "Joana Dias" })).toHaveAttribute("src", "/me.png")
    expect(screen.queryByText("JD")).toBeNull()
  })

  it("falls back to the catalog alt text when none is given", () => {
    stubLoadedImages()
    render(<IGRPUserAvatar image="/me.png" fallbackContent="JD" />)
    expect(screen.getByRole("img", { name: IGRP_I18N_DEFAULTS_PT.avatar.currentUser })).toBeInTheDocument()
  })
})
