import { describe, expect, it } from "vitest"
import { render } from "@testing-library/react"
import { enUS } from "date-fns/locale"

import { IGRPI18nProvider } from "../../../i18n/context.js"
import { Calendar } from "../calendar.js"

const month = new Date(2026, 8, 1)

function dataDays(container: HTMLElement): string[] {
  return [...container.querySelectorAll("button[data-day]")].map((b) => b.getAttribute("data-day") ?? "")
}

describe("Calendar locale", () => {
  it("formats data-day with the provider's Intl tag even when date-fns has no locale for it", () => {
    const { container } = render(
      <IGRPI18nProvider locale="de-DE">
        <Calendar mode="single" defaultMonth={month} />
      </IGRPI18nProvider>
    )
    // Never the runtime default locale: an SSR-rendered attribute must hydrate identically.
    expect(dataDays(container)).toContain(month.toLocaleDateString("de-DE"))
  })

  it("formats the month dropdown with the provider's Intl tag", () => {
    const { container } = render(
      <IGRPI18nProvider locale="de-DE">
        <Calendar mode="single" defaultMonth={month} captionLayout="dropdown" />
      </IGRPI18nProvider>
    )
    const options = [...container.querySelectorAll("option")].map((o) => o.textContent)
    expect(options).toContain(month.toLocaleString("de-DE", { month: "short" }))
  })

  it("lets an explicit `locale` prop win over the provider", () => {
    const { container } = render(
      <IGRPI18nProvider locale="de-DE">
        <Calendar mode="single" defaultMonth={month} locale={enUS} />
      </IGRPI18nProvider>
    )
    expect(dataDays(container)).toContain(month.toLocaleDateString("en-US"))
  })
})
