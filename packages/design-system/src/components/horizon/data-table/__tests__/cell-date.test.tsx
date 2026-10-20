import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPI18nProvider } from "../../../../i18n/index.js"
import { IGRPDataTableCellDate } from "../cell.js"

describe("IGRPDataTableCellDate time zone", () => {
  it("renders a date-only cell as that calendar day", () => {
    render(
      <IGRPI18nProvider locale="pt-CV" timeZone="Atlantic/Cape_Verde">
        <IGRPDataTableCellDate date="2026-10-20" />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("20/10/2026")).toBeInTheDocument()
  })

  it("formats timestamps in the provider time zone", () => {
    render(
      <IGRPI18nProvider locale="pt-CV" timeZone="Asia/Tokyo">
        <IGRPDataTableCellDate date="2026-10-12T23:30:00Z" />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("13/10/2026")).toBeInTheDocument()
  })
})
