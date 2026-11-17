import { render, screen } from "@testing-library/react"
import { cloneElement, type ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

// jsdom measures every element as 0x0, so the responsive container would render no chart.
vi.mock("recharts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("recharts")>()),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
    cloneElement(children, { width: 500, height: 300 }),
}))

import IGRPLineChartInner from "../charts/line-chart-inner.js"
import { IGRPStepperProcess } from "../process/stepper.js"
import { IGRPInputAddOn } from "../input/with-addons.js"
import { IGRPBadge } from "../badge.js"

describe("chart text alternative", () => {
  const data = [{ m: "a", v: 1 }]

  it("names and describes the figure from title and description", () => {
    render(
      <IGRPLineChartInner data={data} categoryKey="m" lines={[{ dataKey: "v" }]} title="Vendas" description="Por mês" />
    )
    const figure = screen.getByRole("figure", { name: "Vendas" })
    expect(figure).toHaveAccessibleDescription("Por mês")
  })

  it("is not a figure without title or description", () => {
    render(<IGRPLineChartInner data={data} categoryKey="m" lines={[{ dataKey: "v" }]} />)
    expect(screen.queryByRole("figure")).toBeNull()
  })
})

describe("IGRPStepperProcess completed step", () => {
  it("keeps the title and completed state in the step's accessible name", () => {
    render(
      <IGRPStepperProcess
        currentStep={2}
        steps={[
          { step: 1, stepKey: "a", title: "Pedido", status: "completed" as const },
          { step: 2, stepKey: "b", title: "Análise" },
        ]}
      >
        <p>conteúdo</p>
      </IGRPStepperProcess>
    )
    expect(screen.getByRole("button", { name: /Pedido.*concluído/ })).toBeInTheDocument()
  })
})

describe("IGRPInputAddOn focus", () => {
  it("shows a focus ring on the wrapper since the inner controls drop theirs", () => {
    render(<IGRPInputAddOn name="r" options={[{ value: "a", label: "A" }]} />)
    const wrapper = screen.getByRole("textbox").parentElement
    expect(wrapper).toHaveClass("focus-within:ring-2", "focus-within:ring-ring/50")
  })
})

describe("IGRPBadge", () => {
  it("hides the colour-only dot from assistive tech", () => {
    const { container } = render(<IGRPBadge dot>x</IGRPBadge>)
    expect(container.querySelector('[data-slot="badge"] > div')).toHaveAttribute("aria-hidden", "true")
  })

  it("warns when an icon-only badge has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<IGRPBadge showIcon />)
    render(<IGRPBadge showIcon aria-label="Info" />)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })
})
