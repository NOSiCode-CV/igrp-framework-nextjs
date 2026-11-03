import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPAccordion } from "../accordion.js"

const six = ["Identificação", "Subcategorias", "Campos", "Fiscalização", "Escalões", "Acréscimos"].map((t) => ({
  title: t,
  content: <p>{t} conteúdo</p>,
}))

describe("IGRPAccordion", () => {
  it("single (default): first item open, opening another closes it, open item collapses", async () => {
    render(<IGRPAccordion items={six.slice(0, 2)} />)
    expect(screen.getByText("Identificação conteúdo")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
    expect(screen.queryByText("Identificação conteúdo")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
    expect(screen.queryByText("Subcategorias conteúdo")).toBeNull()
  })

  it("single: opens the first item by default when it has an explicit value", () => {
    render(<IGRPAccordion items={[{ title: "A", value: "a", content: <p>a</p> }]} />)
    expect(screen.getByText("a")).toBeInTheDocument()
  })

  it("multiple + defaultValue='all': six open, collapsing one leaves five", async () => {
    render(<IGRPAccordion type="multiple" defaultValue="all" items={six} />)
    six.forEach((s) => expect(screen.getByText(`${s.title} conteúdo`)).toBeInTheDocument())
    await userEvent.click(screen.getByRole("button", { name: "Escalões" }))
    expect(screen.queryByText("Escalões conteúdo")).toBeNull()
    expect(screen.getAllByText(/conteúdo$/)).toHaveLength(5)
  })

  it("multiple: items with colliding titles stay independent when given values", async () => {
    const items = [
      { title: "Passo 1", value: "p1", content: <p>um</p> },
      { title: "Passo 2", value: "p2", content: <p>dois</p> },
    ]
    render(<IGRPAccordion type="multiple" defaultValue={[]} items={items} />)
    await userEvent.click(screen.getByRole("button", { name: "Passo 1" }))
    expect(screen.getByText("um")).toBeInTheDocument()
    expect(screen.queryByText("dois")).toBeNull()
  })

  it("multiple: toggles on Enter and Space and wires aria-expanded / aria-controls", async () => {
    render(<IGRPAccordion type="multiple" defaultValue="all" items={six.slice(0, 1)} />)
    const trigger = screen.getByRole("button", { name: "Identificação" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(document.getElementById(trigger.getAttribute("aria-controls")!)).toHaveTextContent("Identificação conteúdo")
    trigger.focus()
    await userEvent.keyboard("{Enter}")
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Identificação conteúdo")).toBeNull() // unmounted: not reachable by keyboard or AT
    await userEvent.keyboard(" ")
    expect(trigger).toHaveAttribute("aria-expanded", "true")
  })

  it("multiple controlled: renders exactly the value prop and reports clicks", async () => {
    const onValueChange = vi.fn()
    const items = six.slice(0, 2).map((s, i) => ({ ...s, value: `s${i}` }))
    const { rerender } = render(
      <IGRPAccordion type="multiple" value={["s0"]} onValueChange={onValueChange} items={items} />
    )
    await userEvent.click(screen.getByRole("button", { name: "Subcategorias" }))
    expect(onValueChange).toHaveBeenCalledWith(["s0", "s1"])
    expect(screen.queryByText("Subcategorias conteúdo")).toBeNull() // prop not changed → still closed
    rerender(<IGRPAccordion type="multiple" value={["s1"]} onValueChange={onValueChange} items={items} />)
    expect(screen.queryByText("Identificação conteúdo")).toBeNull()
    expect(screen.getByText("Subcategorias conteúdo")).toBeInTheDocument()
  })
})

// Type-level guards, checked by the type gate (not run).
// @ts-expect-error single mode takes a string value
;<IGRPAccordion items={[]} value={["a"]} />
// @ts-expect-error array defaultValue is only valid with type="multiple"
;<IGRPAccordion items={[]} defaultValue={["a"]} type="single" />
