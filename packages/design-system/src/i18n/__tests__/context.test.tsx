import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPI18nProvider, useIGRPi18n, IGRP_I18N_DEFAULTS_PT_PT } from "../index"

function StringsProbe({ keyPath }: { keyPath: keyof typeof IGRP_I18N_DEFAULTS_PT_PT.dataTable }) {
  const strings = useIGRPi18n()
  return <span data-testid="probe">{strings.dataTable[keyPath]}</span>
}

describe("IGRPI18nProvider / useIGRPi18n", () => {
  it("returns pt-PT defaults when no provider is mounted", () => {
    render(<StringsProbe keyPath="notFound" />)
    expect(screen.getByTestId("probe")).toHaveTextContent(IGRP_I18N_DEFAULTS_PT_PT.dataTable.notFound)
  })

  it("merges partial overrides with defaults (deep merge per group)", () => {
    render(
      <IGRPI18nProvider strings={{ dataTable: { notFound: "Nothing here." } }}>
        <StringsProbe keyPath="notFound" />
        <StringsProbe keyPath="clearFilters" />
      </IGRPI18nProvider>,
    )

    const probes = screen.getAllByTestId("probe")
    expect(probes[0]).toHaveTextContent("Nothing here.")
    // Sibling key in the same group should fall back to the pt-PT default.
    expect(probes[1]).toHaveTextContent(IGRP_I18N_DEFAULTS_PT_PT.dataTable.clearFilters)
  })

  it("does not leak strings across sibling groups", () => {
    function Probe() {
      const s = useIGRPi18n()
      return (
        <>
          <span data-testid="phone-placeholder">{s.inputPhone.placeholder}</span>
          <span data-testid="number-increment">{s.inputNumber.incrementLabel}</span>
        </>
      )
    }
    render(
      <IGRPI18nProvider strings={{ inputPhone: { placeholder: "Tel #" } }}>
        <Probe />
      </IGRPI18nProvider>,
    )

    expect(screen.getByTestId("phone-placeholder")).toHaveTextContent("Tel #")
    expect(screen.getByTestId("number-increment")).toHaveTextContent(
      IGRP_I18N_DEFAULTS_PT_PT.inputNumber.incrementLabel,
    )
  })
})
