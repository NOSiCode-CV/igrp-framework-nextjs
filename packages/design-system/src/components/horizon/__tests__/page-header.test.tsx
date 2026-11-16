import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPPageHeader } from "../page-header/index.js"

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

describe("IGRPPageHeader backButton slot", () => {
  it("renders the backButton node and ignores the deprecated backButton* props", () => {
    render(
      <IGRPPageHeader
        title="Pedidos"
        backButton={<a href="/lista">Voltar à lista</a>}
        showBackButton
        urlBackButton="/outra"
      />
    )
    expect(screen.getByRole("link", { name: "Voltar à lista" })).toHaveAttribute("href", "/lista")
    expect(screen.getAllByRole("link")).toHaveLength(1)
  })

  it("backButton={null} hides the back button instead of falling back to the legacy props", () => {
    render(<IGRPPageHeader title="Pedidos" backButton={null} showBackButton urlBackButton="/outra" />)
    expect(screen.queryByRole("link")).toBeNull()
  })

  it("still renders the legacy back button from showBackButton", () => {
    render(<IGRPPageHeader title="Pedidos" showBackButton urlBackButton="/outra" />)
    expect(screen.getByRole("link")).toHaveAttribute("href", "/outra")
  })
})
