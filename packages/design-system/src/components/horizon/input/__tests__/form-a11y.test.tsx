import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm } from "../../form/index.js"
import { IGRPCombobox } from "../combobox.js"
import { IGRPDatePickerSingle } from "../date-picker/single.js"
import { IGRPDatePickerRange } from "../date-picker/range.js"
import { IGRPDatePickerMultiple } from "../date-picker/multiple.js"
import { IGRPInputFile } from "../file.js"
import { IGRPInputText } from "../text.js"
import { IGRPSelect } from "../select.js"

const options = [
  { label: "Praia", value: "praia" },
  { label: "Mindelo", value: "mindelo" },
]

const schema = z.object({ f: z.any() })
function InForm({ children }: { children: React.ReactNode }) {
  return (
    <IGRPForm schema={schema} formRef={{ current: null }} onSubmit={vi.fn()} defaultValues={{ f: undefined }}>
      {children}
    </IGRPForm>
  )
}

/** The text of every element an `aria-describedby` points at — fails on a dangling id. */
function describedText(el: HTMLElement) {
  const ids = el.getAttribute("aria-describedby")?.split(" ") ?? []
  return ids.map((id) => {
    const target = document.getElementById(id)
    expect(target, `aria-describedby references missing #${id}`).not.toBeNull()
    return target!.textContent
  })
}

describe("form controls: accessible name, errors, required", () => {
  it("names the combobox by its label standalone (id only) and in a form", () => {
    const { unmount } = render(<IGRPCombobox id="city" label="Cidade" options={options} />)
    expect(screen.getByRole("combobox", { name: "Cidade" })).toBeInTheDocument()
    unmount()

    render(
      <InForm>
        <IGRPCombobox name="f" label="Cidade" options={options} />
      </InForm>
    )
    expect(screen.getByRole("combobox", { name: "Cidade" })).toBeInTheDocument()
  })

  it("wires combobox errorText and required onto the trigger, in a form and standalone", () => {
    const { unmount } = render(
      <InForm>
        <IGRPCombobox name="f" label="Cidade" options={options} errorText="Escolha uma" required />
      </InForm>
    )
    let trigger = screen.getByRole("combobox", { name: "Cidade obrigatório" })
    expect(trigger).toHaveAttribute("aria-invalid", "true")
    expect(trigger).toHaveAttribute("aria-required", "true")
    expect(describedText(trigger)).toEqual(["Escolha uma"])
    unmount()

    render(<IGRPCombobox id="c" label="Cidade" options={options} errorText="Escolha uma" required />)
    trigger = screen.getByRole("combobox", { name: "Cidade obrigatório" })
    expect(trigger).toHaveAttribute("aria-invalid", "true")
    expect(trigger).toHaveAttribute("aria-required", "true")
    expect(describedText(trigger)).toEqual(["Escolha uma"])
  })

  it("keeps multiple-combobox chip remove buttons named and outside the trigger", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<IGRPCombobox id="m" label="Cidades" variant="multiple" options={options} value={["praia"]} />)
    const remove = screen.getByRole("button", { name: "Remover Praia" })
    expect(screen.getByRole("combobox", { name: "Cidades" })).not.toContainElement(remove)
  })

  it("moves focus to the next chip, then the previous, then the trigger when a chip is removed", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    const three = [...options, { label: "Sal", value: "sal" }]
    function Controlled() {
      const [value, setValue] = useState<string | string[]>(["praia", "mindelo", "sal"])
      return (
        <IGRPCombobox
          id="m"
          label="Cidades"
          variant="multiple"
          options={three}
          value={value}
          onChange={(v) => setValue(v as string[])}
        />
      )
    }
    render(<Controlled />)
    fireEvent.click(screen.getByRole("button", { name: "Remover Praia" }))
    expect(screen.getByRole("button", { name: "Remover Mindelo" })).toHaveFocus()
    fireEvent.click(screen.getByRole("button", { name: "Remover Sal" }))
    expect(screen.getByRole("button", { name: "Remover Mindelo" })).toHaveFocus()
    fireEvent.click(screen.getByRole("button", { name: "Remover Mindelo" }))
    expect(screen.getByRole("combobox", { name: "Cidades" })).toHaveFocus()
  })

  it("names date picker triggers by label plus the shown value, announcing required through the label", () => {
    const { unmount } = render(
      <IGRPDatePickerSingle id="d" label="Data" placeholder="Escolha" onDateChange={vi.fn()} required />
    )
    // role=button does not support aria-required; the label's visually hidden text carries it.
    const single = screen.getByRole("button", { name: "Data obrigatório Escolha" })
    expect(single).not.toHaveAttribute("aria-required")
    unmount()

    render(
      <InForm>
        <IGRPDatePickerRange name="f" label="Período" placeholder="Escolha" required />
      </InForm>
    )
    const range = screen.getByRole("button", { name: "Período obrigatório Escolha" })
    expect(range).not.toHaveAttribute("aria-required")
    // FormControl's id reached the trigger, so the form label's `for` resolves to it.
    expect(document.getElementById("f-label")).toHaveAttribute("for", range.id)
  })

  it("names the multiple date picker in a form and never reuses the trigger id for the calendar", () => {
    render(
      <InForm>
        <IGRPDatePickerMultiple name="f" label="Dias" placeholder="Escolha" />
      </InForm>
    )
    const trigger = screen.getByRole("button", { name: "Dias Escolha" })
    expect(document.querySelectorAll(`[id="${trigger.id}"]`)).toHaveLength(1)
  })

  it("wires a caller error on a text input in a form", () => {
    render(
      <InForm>
        <IGRPInputText name="f" label="Nome" error="Nome inválido" helperText="ajuda" />
      </InForm>
    )
    const input = screen.getByRole("textbox", { name: "Nome" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(describedText(input)).toEqual(["Nome inválido"])
  })

  it("only references a description that is rendered", () => {
    render(
      <InForm>
        <IGRPInputText name="f" label="Nome" />
      </InForm>
    )
    expect(screen.getByRole("textbox", { name: "Nome" })).not.toHaveAttribute("aria-describedby")
  })

  it("wires standalone select errors and required onto the trigger", () => {
    render(<IGRPSelect id="s" label="Ilha" options={options} error="Obrigatório" required />)
    const trigger = screen.getByRole("combobox")
    expect(trigger).toHaveAttribute("aria-invalid", "true")
    expect(trigger).toHaveAttribute("aria-required", "true")
    expect(describedText(trigger)).toEqual(["Obrigatório"])
  })

  it("exposes the dropzone as a named button wired to its error", () => {
    render(<IGRPInputFile name="docs" label="Documentos" variant="dropzone" error="Ficheiro em falta" />)
    const zone = screen.getByRole("button", { name: /^Documentos / })
    expect(zone).toHaveAttribute("aria-invalid", "true")
    expect(describedText(zone)).toEqual(["Ficheiro em falta"])
  })

  it("keeps the dropzone's file input out of the a11y tree and its label from targeting it", () => {
    const { container } = render(<IGRPInputFile name="docs" label="Documentos" variant="dropzone" required />)
    const zone = screen.getByRole("button", { name: /^Documentos obrigatório / })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    expect(input).toHaveAttribute("aria-hidden", "true")
    expect(input).not.toHaveAttribute("aria-label")
    expect(input).not.toHaveAttribute("id")
    expect(document.getElementById("docs-label")).not.toHaveAttribute("for")
    // Keyboard activation still opens the picker through the zone.
    const click = vi.spyOn(input, "click")
    fireEvent.keyDown(zone, { key: "Enter" })
    expect(click).toHaveBeenCalled()
  })
})
