import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPNotification } from "../notification.js"
import { IGRPStatsCard } from "../stats-card.js"
import { IGRPPageHeader } from "../page-header/index.js"
import { IGRPText } from "../typography/text.js"
import { IGRPLoadingSpinner } from "../loading-spinner.js"
import { IGRPStatusBanner } from "../../custom/status-banner.js"

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

describe("Horizon defaults and small defects", () => {
  it("dismisses IGRPNotification from its close button and reports it", async () => {
    const onClose = vi.fn()
    render(<IGRPNotification content="Aviso" showClose onClose={onClose} />)

    await userEvent.click(screen.getByRole("button", { name: "Fechar notificação" }))

    expect(screen.queryByText("Aviso")).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("renders a stats card value of 0", () => {
    render(<IGRPStatsCard title="Incidentes" value={0} showIcon={false} />)
    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("never gives the page-header headline the id h-undefined", () => {
    const { container } = render(<IGRPPageHeader title="Utilizadores" />)
    expect(container.querySelector("#h-undefined")).toBeNull()
  })

  it("keeps the deprecated IGRPText variant off the DOM", () => {
    const { container } = render(<IGRPText variant="success">Olá</IGRPText>)
    expect(container.querySelector("[variant]")).toBeNull()
  })

  it("labels the spinner from the catalog", () => {
    render(<IGRPLoadingSpinner />)
    expect(screen.getByText("A carregar…")).toBeInTheDocument()
  })

  it("renders no placeholder copy in IGRPStatusBanner", () => {
    render(<IGRPStatusBanner text="Serviço operacional" />)
    expect(screen.queryByText("Badge Text")).not.toBeInTheDocument()
    expect(screen.getByText("Serviço operacional")).toBeInTheDocument()
  })
})
