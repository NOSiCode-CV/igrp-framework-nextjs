import { describe, it, expect, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPCombobox } from "../combobox.js"

const options = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
]

describe("IGRPCombobox uncontrolled mode", () => {
  it("persists the selected option label when used without a value prop", async () => {
    render(<IGRPCombobox name="x" options={options} placeholder="Pick one" />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("Alpha"))
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha")
  })
})

describe("IGRPCombobox field defects (ADR 0001 consequences)", () => {
  const schema = z.object({ city: z.string().min(1, "Obrigatório") })

  function renderInForm(props: Partial<React.ComponentProps<typeof IGRPCombobox>> = {}) {
    const formRef = { current: null as IGRPFormHandle<typeof schema> | null }
    render(
      <IGRPForm
        schema={schema}
        formRef={formRef}
        onSubmit={() => {}}
        defaultValues={{ city: "" }}
        validationMode="onTouched"
      >
        <IGRPCombobox name="city" label="Cidade" options={options} placeholder="Pick one" {...props} />
      </IGRPForm>
    )
    return formRef
  }

  it("marks the field touched when the popover closes, so onTouched validates", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm()
    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{Escape}")

    expect(formRef.current?.getFieldState("city").isTouched).toBe(true)
    expect(await screen.findByText("Obrigatório")).toBeInTheDocument()
  })

  it("opens a non-modal popover", async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">outside</button>
        <IGRPCombobox name="x" options={options} />
      </>
    )
    await user.click(screen.getByRole("combobox"))
    expect(screen.getByRole("button", { name: "outside" })).not.toHaveAttribute("aria-hidden")
  })

  it("is really disabled, keyboard included", async () => {
    const user = userEvent.setup()
    render(<IGRPCombobox name="x" options={options} disabled />)
    expect(screen.getByRole("combobox")).toBeDisabled()
    screen.getByRole("combobox").focus()
    await user.keyboard("{Enter}")
    expect(screen.queryByRole("option")).toBeNull()
  })

  it("honours errorText when form-bound", async () => {
    const formRef = renderInForm({ errorText: "Escolha uma cidade" })
    await act(async () => {
      await formRef.current?.trigger("city")
    })
    expect(screen.getByText("Escolha uma cidade")).toBeInTheDocument()
    expect(screen.queryByText("Obrigatório")).not.toBeInTheDocument()
  })

  it("warns once in development that variant=multiple is deprecated", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <>
        <IGRPCombobox name="m1" options={options} variant="multiple" />
        <IGRPCombobox name="m2" options={options} variant="multiple" />
      </>
    )
    const calls = warn.mock.calls.filter(([msg]) => String(msg).includes("IGRPMultiSelect"))
    expect(calls).toHaveLength(1)
    warn.mockRestore()
  })
})
