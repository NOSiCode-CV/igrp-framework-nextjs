import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPI18nProvider } from "../../../i18n/context.js"
import { IGRP_I18N_DEFAULTS_EN } from "../../../i18n/strings.en.js"
import { IGRP_I18N_DEFAULTS_FR } from "../../../i18n/strings.fr.js"
import { IGRP_I18N_DEFAULTS_PT } from "../../../i18n/strings.js"
import { Dialog, DialogContent, DialogTitle } from "../dialog.js"
import { Pagination, PaginationNext, PaginationPrevious } from "../pagination.js"
import { Sheet, SheetContent, SheetTitle } from "../sheet.js"
import { SidebarProvider, SidebarTrigger } from "../sidebar.js"

describe.each([
  ["en", IGRP_I18N_DEFAULTS_EN],
  ["fr", IGRP_I18N_DEFAULTS_FR],
] as const)("primitives use the %s catalog", (_l, strings) => {
  it("dialog close", () => {
    render(
      <IGRPI18nProvider strings={strings}>
        <Dialog open>
          <DialogContent>
            <DialogTitle>t</DialogTitle>
          </DialogContent>
        </Dialog>
      </IGRPI18nProvider>
    )
    expect(screen.getByText(strings.dialog.close)).toBeInTheDocument()
  })

  it("sheet close", () => {
    render(
      <IGRPI18nProvider strings={strings}>
        <Sheet open>
          <SheetContent>
            <SheetTitle>t</SheetTitle>
          </SheetContent>
        </Sheet>
      </IGRPI18nProvider>
    )
    expect(screen.getByText(strings.sheet.close)).toBeInTheDocument()
  })

  it("pagination labels", () => {
    render(
      <IGRPI18nProvider strings={strings}>
        <PaginationPrevious href="#" />
        <PaginationNext href="#" />
      </IGRPI18nProvider>
    )
    expect(screen.getByLabelText(strings.pagination.goToPrevious)).toHaveTextContent(strings.pagination.previous)
    expect(screen.getByLabelText(strings.pagination.goToNext)).toHaveTextContent(strings.pagination.next)
  })

  it("pagination nav label", () => {
    render(
      <IGRPI18nProvider strings={strings}>
        <Pagination />
      </IGRPI18nProvider>
    )
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", strings.pagination.label)
  })
})

describe("primitive prop overrides", () => {
  it("pagination aria-label wins over the catalog", () => {
    render(<Pagination aria-label="Custom" />)
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "Custom")
  })

  it("pagination `text` wins over the catalog", () => {
    render(<PaginationNext href="#" text="Custom" />)
    expect(screen.getByLabelText(IGRP_I18N_DEFAULTS_PT.pagination.goToNext)).toHaveTextContent("Custom")
  })
})

it("sidebar trigger is labelled from the catalog", () => {
  window.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never
  render(
    <SidebarProvider>
      <SidebarTrigger />
    </SidebarProvider>
  )
  expect(screen.getByRole("button", { name: IGRP_I18N_DEFAULTS_PT.sidebar.toggle })).toBeInTheDocument()
})
