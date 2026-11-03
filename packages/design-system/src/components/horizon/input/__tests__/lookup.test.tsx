import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPLookupField, type IGRPLookupFieldProps } from "../lookup.js"

const base = { name: "nif", label: "NIF", lookupLabel: "Pesquisar NIF" }

function Standalone(props: IGRPLookupFieldProps) {
  const [value, setValue] = useState("")
  return (
    <IGRPLookupField
      {...props}
      value={value}
      onChange={(e) => {
        setValue(e.target.value)
        props.onChange?.(e)
      }}
    />
  )
}

const schema = z.object({ nif: z.string() })
const ref = { current: null as IGRPFormHandle<typeof schema> | null }
function InForm({ children }: { children: React.ReactNode }) {
  return (
    <IGRPForm schema={schema} formRef={ref} onSubmit={vi.fn()} defaultValues={{ nif: "" }}>
      {children}
    </IGRPForm>
  )
}

describe("IGRPLookupField", () => {
  it("fires onLookup on click and never while typing", async () => {
    const onLookup = vi.fn()
    render(<Standalone {...base} onLookup={onLookup} />)
    await userEvent.type(screen.getByRole("textbox", { name: "NIF" }), "123")
    expect(onLookup).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("button", { name: "Pesquisar NIF" }))
    expect(onLookup).toHaveBeenCalledTimes(1)
  })

  it("typing in a form reaches the form and the caller", async () => {
    const onChange = vi.fn()
    render(
      <InForm>
        <IGRPLookupField {...base} onLookup={vi.fn()} onChange={onChange} />
      </InForm>
    )
    await userEvent.type(screen.getByRole("textbox", { name: "NIF" }), "12")
    expect(ref.current!.getValues("nif")).toBe("12")
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it("inputDisabled leaves the button live; disabled disables both", () => {
    const { rerender } = render(<IGRPLookupField {...base} onLookup={vi.fn()} inputDisabled lookupDisabledReason="x" />)
    expect(screen.getByRole("textbox")).toBeDisabled()
    const button = screen.getByRole("button", { name: "Pesquisar NIF" })
    expect(button).toBeEnabled()
    expect(button.closest('[data-slot="tooltip-trigger-wrapper"]')).toBeNull()
    rerender(<IGRPLookupField {...base} onLookup={vi.fn()} disabled />)
    expect(screen.getByRole("textbox")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Pesquisar NIF" })).toBeDisabled()
  })

  it("opens lookupDisabledReason on hover over a disabled button", async () => {
    render(<IGRPLookupField {...base} onLookup={vi.fn()} lookupDisabled lookupDisabledReason="Introduza 9 dígitos" />)
    await userEvent.hover(screen.getByRole("button", { name: "Pesquisar NIF" }).parentElement!)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Introduza 9 dígitos")
  })

  it("opens lookupDisabledReason on keyboard focus over a disabled button", async () => {
    render(<IGRPLookupField {...base} onLookup={vi.fn()} lookupDisabled lookupDisabledReason="Introduza 9 dígitos" />)
    await userEvent.tab()
    await userEvent.tab()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Introduza 9 dígitos")
  })

  it("wires helperText and errorText into aria-describedby and sets aria-invalid", () => {
    const { rerender } = render(<IGRPLookupField {...base} onLookup={vi.fn()} helperText="Ajuda" errorText="Erro" />)
    const input = screen.getByRole("textbox", { name: "NIF" })
    const ids = input.getAttribute("aria-describedby")!.split(" ")
    expect(ids).toEqual(expect.arrayContaining([screen.getByText("Ajuda").id, screen.getByText("Erro").id]))
    expect(input).toHaveAttribute("aria-invalid", "true")
    rerender(<IGRPLookupField {...base} onLookup={vi.fn()} helperText="Ajuda" />)
    expect(input).toHaveAttribute("aria-invalid", "false")
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("Ajuda").id)
  })

  it("loading disables the button and shows a spinner in place of the icon", () => {
    render(<IGRPLookupField {...base} onLookup={vi.fn()} loading />)
    const button = screen.getByRole("button", { name: "Pesquisar NIF" })
    expect(button).toBeDisabled()
    expect(button.querySelector('[data-slot="spinner"]')).not.toBeNull()
  })

  it("the label Info tooltip trigger is a focusable button with an accessible name", async () => {
    render(<IGRPLookupField {...base} onLookup={vi.fn()} labelTooltip="Número de identificação fiscal" />)
    const info = screen.getByRole("button", { name: "Mais informação" })
    await userEvent.tab()
    expect(info).toHaveFocus()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Número de identificação fiscal")
  })
})
