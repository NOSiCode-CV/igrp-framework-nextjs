import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { format } from "date-fns"

import { IGRPI18nProvider } from "../../../i18n/index.js"
import { igrpDateFnsLocale } from "../../../i18n/date-fns-locale.js"
import { IGRPDatePickerSingle } from "../input/date-picker/single.js"
import { IGRPInputFile } from "../input/file.js"
import { IGRPInputPhone } from "../input/phone.js"
import { IGRPDataTableCellAmount } from "../data-table/cell.js"
import { formatChartValue } from "../charts/lib.js"

describe("locale-aware formatting", () => {
  it("formats dd MMM yyyy with the provider locale month", () => {
    const date = new Date(2026, 7, 26)
    render(
      <IGRPI18nProvider locale="pt-CV">
        <IGRPDatePickerSingle date={date} onDateChange={() => {}} dateFormat="dd MMM yyyy" />
      </IGRPI18nProvider>
    )
    const expected = format(date, "dd MMM yyyy", { locale: igrpDateFnsLocale("pt-CV") })
    expect(expected).not.toBe(format(date, "dd MMM yyyy"))
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it("file sizes use the locale decimal separator", () => {
    render(
      <IGRPI18nProvider locale="pt-PT">
        <IGRPInputFile name="f" variant="dropzone" maxSize={1572864} maxSizeLabel="Max" />
      </IGRPI18nProvider>
    )
    expect(screen.getByText(/Max .*1,5/)).toBeInTheDocument()
  })

  it("compact chart values follow the locale", () => {
    expect(formatChartValue(1200, undefined, "pt-PT")).toBe("1,2 mil")
  })

  it("phone country names follow the locale", () => {
    render(
      <IGRPI18nProvider locale="fr-FR">
        <IGRPInputPhone name="p" />
      </IGRPI18nProvider>
    )
    expect(screen.getByRole("option", { name: /Cap-Vert/ })).toBeInTheDocument()
  })

  it("amount cell without currency shows no currency symbol", () => {
    const { container } = render(<IGRPDataTableCellAmount field="10" />)
    expect(container.textContent).not.toMatch(/\$|US/)
    expect(container.textContent).toBe("10")
  })
})
