import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import {
  IGRPMenuNavigation,
  IGRPMenuNavigationProvider,
  useIGRPMenuNavigation,
  type IGRPMenuNavigationItem,
} from "../menu-navigation.js"

const sections: IGRPMenuNavigationItem[] = [
  { id: "dados", label: "Dados", icon: "User" },
  { id: "morada", label: <strong>Morada</strong>, icon: "Home", badge: <span>2</span> },
]

function ActiveProbe() {
  const { activeSection } = useIGRPMenuNavigation()
  return <output>{activeSection ?? "nenhuma"}</output>
}

describe("IGRPMenuNavigation", () => {
  it("renders node labels, per-item badges and the badge slot", () => {
    render(<IGRPMenuNavigation sections={sections} badge={<span>novo</span>} badgeContent="velho" />)
    expect(screen.getByRole("button", { name: /Morada/ }).querySelector("strong")).not.toBeNull()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("novo")).toBeInTheDocument()
    expect(screen.queryByText("velho")).not.toBeInTheDocument()
  })

  it("shares the active section through the provider", async () => {
    const onSectionChange = vi.fn()
    render(
      <IGRPMenuNavigationProvider onSectionChange={onSectionChange}>
        <IGRPMenuNavigation sections={sections} />
        <ActiveProbe />
      </IGRPMenuNavigationProvider>
    )
    expect(screen.getByRole("status")).toHaveTextContent("nenhuma")
    await userEvent.click(screen.getByRole("button", { name: /Morada/ }))
    expect(screen.getByRole("status")).toHaveTextContent("morada")
    expect(screen.getByRole("button", { name: /Morada/ })).toHaveAttribute("aria-current", "page")
    expect(onSectionChange).toHaveBeenCalledWith("morada")
  })

  it("follows a controlled provider activeSection", () => {
    render(
      <IGRPMenuNavigationProvider activeSection="morada">
        <IGRPMenuNavigation sections={sections} />
      </IGRPMenuNavigationProvider>
    )
    expect(screen.getByRole("button", { name: /Morada/ })).toHaveAttribute("aria-current", "page")
  })
})
