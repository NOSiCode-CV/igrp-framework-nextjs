import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPColors } from "../../../lib/colors.js"
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

  it("single: defaultValue matching an item's own value opens that item", () => {
    const items = ["p1", "p2"].map((v) => ({ title: v.toUpperCase(), value: v, content: <p>{v} conteúdo</p> }))
    render(<IGRPAccordion items={items} defaultValue="p2" />)
    expect(screen.getByText("p2 conteúdo")).toBeInTheDocument()
    expect(screen.queryByText("p1 conteúdo")).toBeNull()
  })

  it("single: collapsible={false} keeps the open item open", async () => {
    render(<IGRPAccordion items={six.slice(0, 1)} collapsible={false} />)
    await userEvent.click(screen.getByRole("button", { name: "Identificação" }))
    expect(screen.getByText("Identificação conteúdo")).toBeInTheDocument()
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

  it("renders count 0 as a tabular-nums pill", () => {
    render(<IGRPAccordion items={[{ title: "Escalões", count: 0, empty: false, content: <p>x</p> }]} />)
    expect(screen.getByText("0")).toHaveClass("tabular-nums")
  })

  it("count 0 shows the empty card and does not render content", () => {
    const Content = vi.fn(() => <p>tabela</p>)
    render(
      <IGRPAccordion
        items={[
          {
            title: "Escalões",
            count: 0,
            emptyIcon: "Layers",
            emptyLabel: "Sem escalões definidos.",
            content: <Content />,
          },
        ]}
      />
    )
    expect(screen.getByText("Sem escalões definidos.")).toBeInTheDocument()
    expect(Content).not.toHaveBeenCalled()
  })

  it("count 0 with empty={false} renders content", () => {
    render(<IGRPAccordion items={[{ title: "Escalões", count: 0, empty: false, content: <p>tabela</p> }]} />)
    expect(screen.getByText("tabela")).toBeInTheDocument()
  })

  it("empty without emptyLabel falls back to the catalog text", () => {
    render(<IGRPAccordion items={[{ title: "Docs", empty: true, content: <p>x</p> }]} />)
    expect(screen.getByText("Sem registos.")).toBeInTheDocument()
  })

  it("badgeIcon renders a chip with IGRPColors.soft[badgeColor]", () => {
    const { container } = render(
      <IGRPAccordion items={[{ title: "Taxa", badgeIcon: "Layers", badgeColor: "success", content: <p>x</p> }]} />
    )
    const chip = container.querySelector("[data-slot=accordion-badge-icon]")
    expect(chip).toHaveClass(...IGRPColors.soft.success.bg.split(" "), ...IGRPColors.soft.success.text.split(" "))
  })

  it("an item with none of the new fields renders the bare title as before", () => {
    render(<IGRPAccordion items={[{ title: "Simples", content: <p>x</p> }]} />)
    expect(screen.getByRole("button", { name: "Simples" }).querySelector("[data-slot=accordion-title]")).toBeNull()
  })

  it("action is clickable without toggling the section", async () => {
    const onEdit = vi.fn()
    render(
      <IGRPAccordion
        type="multiple"
        defaultValue="all"
        items={[
          {
            title: "Identificação",
            content: <p>corpo</p>,
            action: (
              <button type="button" onClick={onEdit}>
                Editar
              </button>
            ),
          },
        ]}
      />
    )
    await userEvent.click(screen.getByRole("button", { name: "Editar" }))
    screen.getByRole("button", { name: "Editar" }).focus()
    await userEvent.keyboard("{Enter} ")
    expect(onEdit).toHaveBeenCalledTimes(3)
    expect(screen.getByRole("button", { name: "Identificação" })).toHaveAttribute("aria-expanded", "true")
  })

  it("action is not nested inside the trigger button", () => {
    render(<IGRPAccordion items={[{ title: "A", content: <p>a</p>, action: <button type="button">Editar</button> }]} />)
    expect(screen.getByRole("button", { name: "A" })).not.toContainElement(
      screen.getByRole("button", { name: "Editar" })
    )
  })
})

// Type-level guards, checked by the type gate (not run).
// @ts-expect-error single mode takes a string value
;<IGRPAccordion items={[]} value={["a"]} />
// @ts-expect-error array defaultValue is only valid with type="multiple"
;<IGRPAccordion items={[]} defaultValue={["a"]} type="single" />
