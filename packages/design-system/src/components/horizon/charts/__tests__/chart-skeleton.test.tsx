import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { IGRPLineChart } from "../line.js"
import { IGRPHorizontalBarChart } from "../bars/horizontal.js"

const skeleton = (container: HTMLElement) => container.querySelector<HTMLElement>("[data-slot='skeleton']")

// The lazy chart has not loaded on the first synchronous render, so the fallback is what's on screen.
describe("chart lazy fallback", () => {
  it("is as tall as the chart for its size", () => {
    const { container } = render(<IGRPLineChart data={[]} categoryKey="d" lines={[]} size="lg" />)
    expect(skeleton(container)?.style.height).toBe("400px")
  })

  it("honours an explicit height and width", () => {
    const { container } = render(<IGRPLineChart data={[]} categoryKey="d" lines={[]} height={320} width="50%" />)
    expect(skeleton(container)?.style.height).toBe("320px")
    expect(skeleton(container)?.style.width).toBe("50%")
  })

  it("grows with the data for a horizontal bar chart, like the chart does", () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ d: String(i), v: i }))
    const { container } = render(<IGRPHorizontalBarChart data={data} categoryKey="d" bars={[]} size="sm" />)
    expect(skeleton(container)?.style.height).toBe("430px")
  })
})
