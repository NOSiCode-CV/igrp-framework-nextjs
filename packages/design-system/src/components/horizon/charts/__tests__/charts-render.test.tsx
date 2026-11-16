import { render } from "@testing-library/react"
import { cloneElement, type ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"

// jsdom measures every element as 0x0, so the responsive container would render no chart.
vi.mock("recharts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("recharts")>()),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width?: number; height?: number }> }) =>
    cloneElement(children, { width: 500, height: 300 }),
}))

import IGRPAreaChart from "../area-chart-inner.js"
import IGRPLineChartInner from "../line-chart-inner.js"
import { ChartContainer } from "../../../primitives/chart.js"

const year = Array.from({ length: 365 }, (_, i) => ({ day: String(i), value: i }))

describe("chart height", () => {
  it("a line chart keeps its size height however many points it has", () => {
    const { container } = render(
      <IGRPLineChartInner data={year} categoryKey="day" lines={[{ dataKey: "value" }]} size="md" />
    )
    const sized = container.querySelector<HTMLElement>("div[style*='height']")
    expect(sized?.style.height).toBe("280px")
  })
})

describe("IGRPAreaChart gradients", () => {
  it("gives each instance its own url()-safe gradient id", () => {
    const data = [
      { day: "a", "total sales": 1 },
      { day: "b", "total sales": 2 },
    ]
    const areas = [{ dataKey: "total sales", gradient: true }]
    const { container } = render(
      <>
        <IGRPAreaChart data={data} categoryKey="day" areas={areas} />
        <IGRPAreaChart data={data} categoryKey="day" areas={areas} />
      </>
    )
    const ids = [...container.querySelectorAll("linearGradient")].map((g) => g.id)
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe("explicit 0 is kept", () => {
  it("IGRPAreaChart fillOpacity: 0", () => {
    const data = [
      { day: "a", v: 1 },
      { day: "b", v: 2 },
    ]
    const { container } = render(
      <IGRPAreaChart data={data} categoryKey="day" areas={[{ dataKey: "v", fillOpacity: 0 }]} />
    )
    const area = container.querySelector(".recharts-area-area")
    expect(area).not.toBeNull()
    expect(area?.getAttribute("fill-opacity")).toBe("0")
  })
})

describe("chart colour variables", () => {
  it("sanitizes series keys so the style and the series use one valid custom property", () => {
    const data = [
      { day: "a", "Receita Total": 1 },
      { day: "b", "Receita Total": 2 },
    ]
    const { container } = render(<IGRPAreaChart data={data} categoryKey="day" areas={[{ dataKey: "Receita Total" }]} />)
    expect(container.querySelector("style")?.textContent).toContain("--color-Receita_Total: var(--chart-1);")
    expect(container.querySelector(".recharts-area-area")?.getAttribute("fill")).toBe("var(--color-Receita_Total)")
  })

  it("a key or colour containing </style> cannot close the style tag", () => {
    const key = "x</style><script>alert(1)</script>"
    const data = [{ day: "a", [key]: 1 }]
    const { container } = render(
      <IGRPAreaChart data={data} categoryKey="day" areas={[{ dataKey: key, color: "red</style>" }]} />
    )
    expect(container.innerHTML.match(/<\/style>/g)).toHaveLength(1)
    expect(container.querySelector("style")?.textContent).not.toMatch(/[<>]/)
  })

  it("an id with spaces, quotes or </style> still gives a selector that matches the container", () => {
    const { container } = render(
      <ChartContainer id={`a b"]</style>`} config={{ v: { color: "red" } }}>
        <div />
      </ChartContainer>
    )
    const chartId = container.querySelector("[data-chart]")?.getAttribute("data-chart")
    expect(chartId).toMatch(/^chart-[\w-]+$/)
    expect(container.querySelector("style")?.textContent).toContain(`[data-chart=${chartId}]`)
    expect(container.innerHTML.match(/<\/style>/g)).toHaveLength(1)
  })
})
