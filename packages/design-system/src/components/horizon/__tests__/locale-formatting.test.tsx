import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { hydrateRoot } from "react-dom/client"
import { act } from "react"
import { format } from "date-fns"

import { IGRPI18nProvider } from "../../../i18n/index.js"
import { igrpDateFnsLocale } from "../../../i18n/date-fns-locale.js"
import { IGRPDatePickerMultiple } from "../input/date-picker/multiple.js"
import { IGRPDatePickerRange } from "../input/date-picker/range.js"
import { IGRPPdfViewer } from "../pdf-viewer.js"
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

  it("range and multiple pickers format with the provider locale", () => {
    const from = new Date(2026, 7, 26)
    const to = new Date(2026, 8, 3)
    const f = (d: Date) => format(d, "dd MMM yyyy", { locale: igrpDateFnsLocale("pt-CV") })
    render(
      <IGRPI18nProvider locale="pt-CV">
        <IGRPDatePickerRange date={{ from, to }} onDateChange={() => {}} dateFormat="dd MMM yyyy" />
        <IGRPDatePickerMultiple date={[from, to]} onDateChange={() => {}} dateFormat="dd MMM yyyy" />
      </IGRPI18nProvider>
    )
    expect(f(from)).not.toBe(format(from, "dd MMM yyyy"))
    expect(screen.getAllByText(`${f(from)} - ${f(to)}`)).toHaveLength(2)
  })

  describe("pdf viewer date", () => {
    const doc = (date: string) => ({ id: 1, title: "T", description: "D", author: "A", date, fileUrl: "/x.pdf" })
    const view = (date: string, timeZone?: string) =>
      render(
        <IGRPI18nProvider locale="pt-PT" timeZone={timeZone}>
          <IGRPPdfViewer document={doc(date)} displayMode="inline" />
        </IGRPI18nProvider>
      )

    it("an impossible date-only string renders the empty marker", () => {
      view("2026-02-30")
      expect(screen.getByText("—")).toBeInTheDocument()
    })

    it("a date-only string keeps its calendar day under a negative-offset zone", () => {
      view("2026-03-15", "America/New_York")
      expect(screen.getByText("15/03/2026")).toBeInTheDocument()
    })
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

  it("phone hydrates against server markup, then shows localized country names", async () => {
    const tree = (
      <IGRPI18nProvider locale="fr-FR">
        <IGRPInputPhone name="p" />
      </IGRPI18nProvider>
    )
    const container = document.createElement("div")
    container.innerHTML = renderToString(tree)
    document.body.appendChild(container)
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    // RTL only flags act() support for its own render(); hydrateRoot is driven by hand here.
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    let root: ReturnType<typeof hydrateRoot> | undefined
    await act(async () => {
      root = hydrateRoot(container, tree)
    })
    await waitFor(() => expect(container.querySelector("select")?.textContent).toContain("Cap-Vert"))
    expect(errors).not.toHaveBeenCalled()
    errors.mockRestore()
    act(() => root?.unmount())
    container.remove()
  })

  it("phone country names follow a locale change after mount", () => {
    const { container, rerender } = render(
      <IGRPI18nProvider locale="en-GB">
        <IGRPInputPhone name="p" />
      </IGRPI18nProvider>
    )
    expect(container.querySelector("select")?.textContent).toContain("Cape Verde")
    rerender(
      <IGRPI18nProvider locale="fr-FR">
        <IGRPInputPhone name="p" />
      </IGRPI18nProvider>
    )
    expect(container.querySelector("select")?.textContent).toContain("Cap-Vert")
  })
})
