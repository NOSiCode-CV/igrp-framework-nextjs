import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"

import { IGRPI18nProvider } from "../../../i18n/context.js"
import { ChartContainer, ChartTooltipContent } from "../chart.js"

// jsdom has no layout: recharts' ResponsiveContainer measures 0×0 and renders no
// children. Pass them through so the real tooltip content renders under the real
// ChartContainer context.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>()
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

// Recharts hands the tooltip its payload; render the content directly with one.
const payload = [{ name: "sales", value: 1234.5, color: "#000", dataKey: "sales", payload: {} }] as never

const config = { sales: { label: "Sales" } }

describe("ChartTooltipContent number formatting", () => {
  it("formats with the design-system locale (en-GB)", () => {
    render(
      <IGRPI18nProvider locale="en-GB">
        <ChartContainer config={config}>
          <ChartTooltipContent active payload={payload} />
        </ChartContainer>
      </IGRPI18nProvider>
    )
    expect(screen.getByText("1,234.5")).toBeInTheDocument()
  })

  it("formats with pt-PT when no provider is mounted", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} />
      </ChartContainer>
    )
    expect(screen.getByText((1234.5).toLocaleString("pt-PT"))).toBeInTheDocument()
  })
  it("uses valueFormatter over the locale default when given", () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active payload={payload} valueFormatter={(v) => `${v} CVE`} />
      </ChartContainer>
    )
    expect(screen.getByText("1234.5 CVE")).toBeInTheDocument()
  })
})
