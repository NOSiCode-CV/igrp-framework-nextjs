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

  it("keeps a date-only day in a negative-offset provider zone", () => {
    // Runtime-independent: UTC-midnight parsing formatted in New York would give 19/10.
    render(
      <IGRPI18nProvider locale="pt-CV" timeZone="America/New_York">
        <IGRPDataTableCellDate date="2026-10-20" />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("20/10/2026")).toBeInTheDocument()
  })

  it("dateOptions.timeZone takes precedence over the provider zone", () => {
    render(
      <IGRPI18nProvider locale="pt-CV" timeZone="America/New_York">
        <IGRPDataTableCellDate date="2026-10-12T23:30:00Z" dateOptions={{ timeZone: "Asia/Tokyo" }} />
      </IGRPI18nProvider>
    )
    expect(screen.getByText("13/10/2026")).toBeInTheDocument()
  })

  it.each(["2026-02-31", "2026-13-45"])("renders nothing for an impossible date-only string (%s)", (date) => {
    const { container } = render(<IGRPDataTableCellDate date={date} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("dateFormat path keeps the calendar day of a date-only string", () => {
    const { container } = render(<IGRPDataTableCellDate date="2026-10-20" dateFormat="dd/MM/yyyy" />)
    expect(container).toHaveTextContent("20/10/2026")
  })
})
