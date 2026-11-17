import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPStatusBanner } from "../status-banner.js"

describe("IGRPStatusBanner", () => {
  it("announces its text politely as a status by default", () => {
    render(<IGRPStatusBanner text="Ativo" />)
    const banner = screen.getByRole("status")
    expect(banner).toHaveTextContent("Ativo")
    expect(banner).toHaveAttribute("aria-live", "polite")
  })

  it("is an assertive alert for the destructive colour", () => {
    render(<IGRPStatusBanner text="Bloqueado" color="destructive" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Bloqueado")
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("renders the badge only when badgeText is given", () => {
    const { rerender } = render(<IGRPStatusBanner text="Ativo" />)
    expect(screen.queryByText("v2")).toBeNull()
    rerender(<IGRPStatusBanner text="Ativo" badgeText="v2" />)
    expect(screen.getByRole("status")).toHaveTextContent("v2")
  })

  it("uses id as the element id", () => {
    render(<IGRPStatusBanner text="Ativo" id="estado" />)
    expect(screen.getByRole("status")).toHaveAttribute("id", "estado")
  })
})
