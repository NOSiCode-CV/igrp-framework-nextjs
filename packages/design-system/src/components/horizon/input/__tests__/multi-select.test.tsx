/**
 * Contract tests for IGRPMultiSelect — one per rule in consumer request §11
 * (`docs/11-igrp-multi-select.md`) and ADR 0001.
 */
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPI18nProvider } from "../../../../i18n/index.js"
import { IGRPMultiSelect } from "../multi-select.js"

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
  { label: "Gamma", value: "c" },
]

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

const trigger = () => screen.getByRole("combobox")
const chipLabels = () =>
  within(screen.getByRole("list"))
    .queryAllByRole("listitem")
    .map((li) => li.textContent?.trim())

const schema = z.object({ tipos: z.array(z.string()).min(1, "Obrigatório") })
type Handle = IGRPFormHandle<typeof schema>

function renderInForm(
  defaultValues: Record<string, unknown>,
  props: Partial<React.ComponentProps<typeof IGRPMultiSelect>> = {},
  formSchema: z.ZodType = schema
) {
  const formRef = { current: null as Handle | null }
  render(
    <IGRPForm
      schema={formSchema as typeof schema}
      formRef={formRef}
      onSubmit={() => {}}
      defaultValues={defaultValues as z.infer<typeof schema>}
      validationMode="onTouched"
    >
      <IGRPMultiSelect name="tipos" label="Tipos" required options={OPTIONS} {...props} />
    </IGRPForm>
  )
  return formRef
}

describe("IGRPMultiSelect — form-bound", () => {
  it("rehydrates an initial selection as chips", async () => {
    renderInForm({ tipos: ["a", "c"] })
    await settle()
    expect(chipLabels()).toEqual(["Alpha", "Gamma"])
    expect(trigger()).toHaveTextContent("2")
  })

  it("getValues returns the post-click selection, in option order", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ tipos: ["c"] })
    await settle()

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: /Alpha/ }))

    expect(formRef.current?.getValues("tipos")).toEqual(["a", "c"])
  })

  it("keeps both edits when two chips are removed in the same tick", async () => {
    const formRef = renderInForm({ tipos: ["a", "b", "c"] })
    await settle()

    const removeAlpha = screen.getByRole("button", { name: "Remover Alpha" })
    const removeBeta = screen.getByRole("button", { name: "Remover Beta" })
    act(() => {
      fireEvent.click(removeAlpha)
      fireEvent.click(removeBeta)
    })
    await settle()

    expect(formRef.current?.getValues("tipos")).toEqual(["c"])
  })

  it("clears a required error as soon as something is picked", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ tipos: [] })
    await settle()

    await act(async () => {
      await formRef.current?.trigger("tipos")
    })
    expect(screen.getByText("Obrigatório")).toBeInTheDocument()
    expect(trigger()).toHaveAttribute("aria-invalid", "true")

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: /Beta/ }))
    await settle()

    expect(screen.queryByText("Obrigatório")).not.toBeInTheDocument()
    expect(formRef.current?.getFieldState("tipos").isTouched).toBe(true)
    expect(formRef.current?.getFieldState("tipos").isDirty).toBe(true)
  })

  it("keeps unmatched codes, shows them raw and places them after the options", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ tipos: ["zz", "c"] })
    await settle()
    expect(chipLabels()).toContain("zz")

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: /Alpha/ }))

    expect(formRef.current?.getValues("tipos")).toEqual(["a", "c", "zz"])
  })

  it("normalises a bare string into a selection", async () => {
    const user = userEvent.setup()
    const loose = z.object({ tipos: z.union([z.string(), z.array(z.string())]) })
    const formRef = renderInForm({ tipos: "a" }, {}, loose)
    await settle()
    expect(chipLabels()).toEqual(["Alpha"])

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: /Beta/ }))

    expect(formRef.current?.getValues("tipos")).toEqual(["a", "b"])
  })

  it("honours errorText over the form's own message", async () => {
    const formRef = renderInForm({ tipos: [] }, { errorText: "Escolha pelo menos um" })
    await settle()
    await act(async () => {
      await formRef.current?.trigger("tipos")
    })
    expect(screen.getByText("Escolha pelo menos um")).toBeInTheDocument()
    expect(screen.queryByText("Obrigatório")).not.toBeInTheDocument()
  })
})

describe("IGRPMultiSelect — controlled", () => {
  it("reports the next selection through onChange", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    function Harness() {
      const [value, setValue] = useState<string[]>(["b"])
      return (
        <IGRPMultiSelect
          options={OPTIONS}
          value={value}
          onChange={(next) => {
            onChange(next)
            setValue(next)
          }}
        />
      )
    }
    render(<Harness />)

    await user.click(trigger())
    await user.click(screen.getByRole("option", { name: /Gamma/ }))
    expect(onChange).toHaveBeenLastCalledWith(["b", "c"])
    expect(chipLabels()).toEqual(["Beta", "Gamma"])
  })
})

describe("IGRPMultiSelect — structure and behaviour", () => {
  it("never nests an interactive control inside the trigger", () => {
    render(<IGRPMultiSelect options={OPTIONS} value={["a", "b"]} />)
    expect(within(trigger()).queryByRole("button")).toBeNull()
  })

  it("opens a non-modal popover that leaves the rest of the page accessible", async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">outside</button>
        <IGRPMultiSelect options={OPTIONS} value={[]} />
      </>
    )
    await user.click(trigger())
    expect(screen.getByRole("button", { name: "outside" })).not.toHaveAttribute("aria-hidden")
  })

  it("is really disabled: no popover, no chip removal", async () => {
    const user = userEvent.setup()
    render(<IGRPMultiSelect options={OPTIONS} value={["a"]} disabled />)
    expect(trigger()).toBeDisabled()
    await user.click(trigger())
    expect(screen.queryByRole("option")).toBeNull()
    expect(screen.queryByRole("button", { name: "Remover Alpha" })).toBeNull()
  })

  it("hides chips on request", () => {
    render(<IGRPMultiSelect options={OPTIONS} value={["a"]} hideChips />)
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("shows the search box from 8 options up, overridable either way", async () => {
    const user = userEvent.setup()
    const many = Array.from({ length: 8 }, (_, i) => ({ label: `Opt ${i}`, value: `o${i}` }))

    const { unmount } = render(<IGRPMultiSelect options={OPTIONS} value={[]} />)
    await user.click(trigger())
    expect(screen.queryByRole("combobox", { name: /pesquisar/i })).toBeNull()
    expect(screen.queryByPlaceholderText("Pesquisar...")).toBeNull()
    unmount()

    const second = render(<IGRPMultiSelect options={many} value={[]} />)
    await user.click(trigger())
    expect(screen.getByPlaceholderText("Pesquisar...")).toBeInTheDocument()
    second.unmount()

    render(<IGRPMultiSelect options={OPTIONS} value={[]} showSearch />)
    await user.click(trigger())
    expect(screen.getByPlaceholderText("Pesquisar...")).toBeInTheDocument()
  })

  it("selects all in one step, and clears", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <IGRPMultiSelect
        options={[...OPTIONS, { label: "Off", value: "x", disabled: true }]}
        value={["b"]}
        onChange={onChange}
      />
    )
    await user.click(trigger())

    await user.click(screen.getByRole("button", { name: "Selecionar tudo" }))
    expect(onChange).toHaveBeenLastCalledWith(["a", "b", "c"])

    await user.click(screen.getByRole("button", { name: "Limpar" }))
    expect(onChange).toHaveBeenLastCalledWith([])
  })

  it("with maxSelected, offers only clear and blocks picks past the cap", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<IGRPMultiSelect options={OPTIONS} value={["a", "b"]} maxSelected={2} onChange={onChange} />)
    await user.click(trigger())

    expect(screen.queryByRole("button", { name: "Selecionar tudo" })).toBeNull()
    expect(screen.getByRole("button", { name: "Limpar" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Gamma/ })).toHaveAttribute("aria-disabled", "true")
  })

  it("groups options only when some option carries a group", async () => {
    const user = userEvent.setup()
    const grouped = [
      { label: "Alpha", value: "a", group: "Letras" },
      { label: "Um", value: "1", group: "Números" },
    ]
    const { unmount } = render(<IGRPMultiSelect options={grouped} value={[]} />)
    await user.click(trigger())
    expect(screen.getByText("Letras")).toBeInTheDocument()
    expect(screen.getByText("Números")).toBeInTheDocument()
    unmount()

    render(<IGRPMultiSelect options={OPTIONS} value={[]} />)
    await user.click(trigger())
    expect(screen.queryByText("Opções")).toBeNull()
  })

  it("renders option descriptions when present", async () => {
    const user = userEvent.setup()
    render(<IGRPMultiSelect options={[{ label: "Alpha", value: "a", description: "Primeira letra" }]} value={[]} />)
    await user.click(trigger())
    expect(screen.getByText("Primeira letra")).toBeInTheDocument()
  })

  it("summarises one pick by label and several by count, with overridable strings", () => {
    const { rerender } = render(<IGRPMultiSelect options={OPTIONS} value={["b"]} />)
    expect(trigger()).toHaveTextContent("Beta")

    rerender(<IGRPMultiSelect options={OPTIONS} value={["a", "b"]} />)
    expect(trigger()).toHaveTextContent("2 opções selecionadas")

    rerender(<IGRPMultiSelect options={OPTIONS} value={["a", "b"]} selectedCountLabel="{count} picked" />)
    expect(trigger()).toHaveTextContent("2 picked")
  })

  it("takes its default strings from IGRPI18nProvider", () => {
    render(
      <IGRPI18nProvider strings={{ multiSelect: { selectedCount: "{count} selected" } }}>
        <IGRPMultiSelect options={OPTIONS} value={["a", "b"]} />
      </IGRPI18nProvider>
    )
    expect(trigger()).toHaveTextContent("2 selected")
  })
})
