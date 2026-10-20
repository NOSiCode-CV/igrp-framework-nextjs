import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPNotification } from "../notification.js"
import { IGRPStatsCard } from "../stats-card.js"
import { IGRPPageHeader } from "../page-header/index.js"
import { IGRPText } from "../typography/text.js"
import { IGRPLoadingSpinner } from "../loading-spinner.js"
import { IGRPI18nProvider } from "../../../i18n/context.js"
import { IGRP_I18N_DEFAULTS_EN } from "../../../i18n/strings.en.js"
import { IGRP_I18N_DEFAULTS_FR } from "../../../i18n/strings.fr.js"
import { IGRPDataTable } from "../data-table/index.js"
import { IGRPPdfViewer } from "../pdf-viewer.js"
import { Spinner } from "../../primitives/spinner.js"
import { DialogFooter } from "../../primitives/dialog.js"
import { Dialog, DialogContent, DialogTitle } from "../../primitives/dialog.js"
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

const manyRows = Array.from({ length: 60 }, (_, i) => ({ n: `r${i}` }))

describe("remaining literals come from the catalog", () => {
  it("translates pagination, spinner, dialog footer and PDF labels (en)", () => {
    render(
      <IGRPI18nProvider strings={IGRP_I18N_DEFAULTS_EN}>
        <IGRPDataTable
          columns={[{ accessorKey: "n", header: "N" }]}
          data={manyRows}
          showPagination
          isNumericPagination
        />
        <Spinner />
        <IGRPPdfViewer displayMode="inline" document={{ title: "Doc", fileUrl: "/a.pdf" } as never} />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument()
    expect(screen.getByRole("status", { name: "Loading…" })).toBeInTheDocument()
    expect(screen.getByTitle("PDF viewer - Doc")).toHaveAttribute("aria-label", "PDF viewer for Doc")
  })

  it("translates the page-size label and footer close (fr)", () => {
    render(
      <IGRPI18nProvider strings={IGRP_I18N_DEFAULTS_FR}>
        <IGRPDataTable columns={[{ accessorKey: "n", header: "N" }]} data={manyRows} showPagination />
        <Dialog open>
          <DialogContent showCloseButton={false}>
            <DialogTitle>t</DialogTitle>
            <DialogFooter showCloseButton />
          </DialogContent>
        </Dialog>
      </IGRPI18nProvider>
    )
    expect(screen.getByText("Lignes par page")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: IGRP_I18N_DEFAULTS_FR.dialog.close })).toBeInTheDocument()
  })
})
