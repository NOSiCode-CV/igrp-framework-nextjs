import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPStatsCardTopBorderColored } from "../stats-card-top-border-colored.js"

describe("IGRPStatsCardTopBorderColored", () => {
  it("renders title and value as static content", () => {
    render(<IGRPStatsCardTopBorderColored title="Pedidos" value="1.204" cardVariant="success" id="pedidos" />)
    expect(screen.getByText("Pedidos")).toBeInTheDocument()
    expect(screen.getByText("1.204")).toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeNull()
    expect(document.getElementById("pedidos")).toContainElement(screen.getByText("Pedidos"))
  })
})
