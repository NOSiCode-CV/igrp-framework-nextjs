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

describe("value pairing", () => {
  const pairedSchema = z.object({
    licencaId: z.string({ error: "Escolha uma licença" }).min(1, "Escolha uma licença"),
    licencaNumero: z.string().nullable(),
  })
  const pairedRef = { current: null as IGRPFormHandle<typeof pairedSchema> | null }
  const field = {
    name: "licencaNumero",
    valueName: "licencaId",
    label: "Nº licença",
    lookupLabel: "Pesquisar licença",
    onLookup: vi.fn(),
    inputDisabled: true,
  }
  function Paired({ defaults, ...extra }: { defaults: z.infer<typeof pairedSchema> } & Partial<IGRPLookupFieldProps>) {
    return (
      <IGRPForm schema={pairedSchema} formRef={pairedRef} onSubmit={vi.fn()} defaultValues={defaults}>
        <IGRPLookupField {...field} {...extra} />
      </IGRPForm>
    )
  }

  it("renders a hidden input bound to valueName and shows its error under the visible input", async () => {
    const { container } = render(<Paired defaults={{ licencaId: "", licencaNumero: "" }} />)
    expect(container.querySelector('input[type="hidden"][name="licencaId"]')).not.toBeNull()
    await pairedRef.current!.submit()
    const error = await screen.findByText("Escolha uma licença")
    const input = screen.getByRole("textbox", { name: "Nº licença" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input.getAttribute("aria-describedby")).toContain(error.id)
  })

  it("errorText overrides the valueName error", async () => {
    render(<Paired defaults={{ licencaId: "", licencaNumero: "" }} errorText="Manual" />)
    await pairedRef.current!.submit()
    expect(await screen.findByText("Manual")).toBeInTheDocument()
    expect(screen.queryByText("Escolha uma licença")).toBeNull()
  })

  it("clear writes null to both fields and the button stays gone", async () => {
    const onClear = vi.fn()
    render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "000001/CMS-SG/2026" }} onClear={onClear} />)
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
    expect(pairedRef.current!.getValues("licencaId")).toBeNull()
    expect(pairedRef.current!.getValues("licencaNumero")).toBeNull()
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole("button", { name: "Limpar" })).toBeNull()
  })

  it("offers clear when only the value is set", () => {
    render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "" }} onClear={vi.fn()} />)
    expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument()
  })

  it("re-validates on clear after a submit", async () => {
    render(<Paired defaults={{ licencaId: "u-1", licencaNumero: "1" }} onClear={vi.fn()} />)
    await pairedRef.current!.submit()
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
    expect(await screen.findByText("Escolha uma licença")).toBeInTheDocument()
  })

  it("focuses the visible input when only the valueName field fails on submit", async () => {
    render(<Paired defaults={{ licencaId: "", licencaNumero: "x" }} inputDisabled={false} />)
    await pairedRef.current!.submit()
    await screen.findByText("Escolha uma licença")
    expect(screen.getByRole("textbox", { name: "Nº licença" })).toHaveFocus()
  })

  it("reads a nested valueName error", async () => {
    const nested = z.object({ r: z.array(z.object({ id: z.string().min(1, "Obrigatório"), num: z.string() })) })
    const nestedRef = { current: null as IGRPFormHandle<typeof nested> | null }
    render(
      <IGRPForm schema={nested} formRef={nestedRef} onSubmit={vi.fn()} defaultValues={{ r: [{ id: "", num: "" }] }}>
        <IGRPLookupField {...field} name="r.0.num" valueName="r.0.id" />
      </IGRPForm>
    )
    await nestedRef.current!.submit()
    expect(await screen.findByText("Obrigatório")).toBeInTheDocument()
  })

  it("outside a form, clear only calls onClear", async () => {
    const onClear = vi.fn()
    render(<IGRPLookupField {...field} value="000001" onClear={onClear} />)
    await userEvent.click(screen.getByRole("button", { name: "Limpar" }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
