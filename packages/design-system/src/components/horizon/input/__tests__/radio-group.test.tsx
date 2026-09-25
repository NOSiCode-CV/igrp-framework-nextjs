/**
 * Contract tests for IGRPRadioGroup — the behaviour in consumer request §12
 * (`docs/12-igrp-card-radio-group.md`), for both the default and the option-card variant.
 */
import { describe, expect, it } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPRadioGroup } from "../radio-group.js"

const OPTIONS = [
  { label: "Nova", value: "nova", description: "Primeiro pedido", icon: "FilePlus", badge: "Novo" },
  { label: "Renovação", value: "renovacao", description: "Prolonga uma licença existente" },
  { label: "Alteração", value: "alteracao", description: "Muda dados da licença", disabled: true },
]

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

const schema = z.object({ tipo: z.string().min(1, "Obrigatório") })
type Handle = IGRPFormHandle<typeof schema>

function renderInForm(props: Partial<React.ComponentProps<typeof IGRPRadioGroup>> = {}) {
  const formRef = { current: null as Handle | null }
  render(
    <IGRPForm
      schema={schema}
      formRef={formRef}
      onSubmit={() => {}}
      defaultValues={{ tipo: "" }}
      validationMode="onSubmit"
    >
      <IGRPRadioGroup name="tipo" label="Tipo de pedido" required options={OPTIONS} {...props} />
    </IGRPForm>
  )
  return formRef
}

describe.each(["default", "card"] as const)("IGRPRadioGroup variant=%s — form-bound", (variant) => {
  it("picking an option writes it and marks the field dirty and touched", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ variant })
    await settle()

    await user.click(screen.getByText("Renovação"))

    expect(formRef.current?.getValues("tipo")).toBe("renovacao")
    expect(screen.getByRole("radio", { name: /Renovação/ })).toBeChecked()
    const state = formRef.current?.getFieldState("tipo")
    expect(state?.isDirty).toBe(true)
    expect(state?.isTouched).toBe(true)
  })

  it("shows a required error as an alert on an invalid group, and clears it on pick", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ variant })
    await settle()

    await act(() => formRef.current!.submit())
    const group = screen.getByRole("radiogroup", { name: "Tipo de pedido" })
    expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório")
    expect(group).toHaveAttribute("aria-invalid", "true")
    expect(group).toHaveAccessibleDescription("Obrigatório")
    expect(group.closest("fieldset")).toHaveAttribute("data-invalid", "true")

    await user.click(screen.getByText("Nova"))

    expect(screen.queryByRole("alert")).toBeNull()
    expect(group).not.toHaveAttribute("aria-invalid")
  })

  it("is named by its legend", async () => {
    renderInForm({ variant })
    await settle()
    const legend = screen.getByText("Tipo de pedido")
    expect(legend.tagName).toBe("LEGEND")
    expect(screen.getByRole("radiogroup", { name: "Tipo de pedido" })).toBeInTheDocument()
  })

  it("a disabled option cannot be picked", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ variant })
    await settle()

    await user.click(screen.getByText("Alteração"))

    expect(screen.getByRole("radio", { name: /Alteração/ })).toBeDisabled()
    expect(formRef.current?.getValues("tipo")).toBe("")
  })

  it("arrow keys move the pick within the group, skipping disabled options", async () => {
    const user = userEvent.setup()
    const formRef = renderInForm({ variant })
    await settle()

    await user.click(screen.getByRole("radio", { name: /Nova/ }))
    // Radix moves focus on a timeout and only picks on focus while the arrow is still
    // held; user-event releases it first, so hold it across the wait as a real key does.
    const arrowDown = async () => {
      await user.keyboard("{ArrowDown>}")
      await new Promise((resolve) => setTimeout(resolve, 0))
      await user.keyboard("{/ArrowDown}")
    }
    await arrowDown()
    await waitFor(() => expect(formRef.current?.getValues("tipo")).toBe("renovacao"))
    await arrowDown()
    await waitFor(() => expect(formRef.current?.getValues("tipo")).toBe("nova"))
  })

  it("shows the empty label instead of an empty group", async () => {
    renderInForm({ variant, options: [] })
    await settle()
    expect(screen.queryByRole("radiogroup")).toBeNull()
    expect(screen.getByText("Sem opções disponíveis.")).toBeInTheDocument()
  })
})

describe("IGRPRadioGroup — option ids", () => {
  it("two groups with the same name label their own radios", async () => {
    const user = userEvent.setup()
    render(
      <>
        <IGRPRadioGroup name="tipo" label="A" options={OPTIONS} variant="card" value="" />
        <IGRPRadioGroup name="tipo" label="B" options={OPTIONS} variant="card" value="" />
      </>
    )
    const [first, second] = screen.getAllByRole("radio", { name: /Renovação/ })
    expect(first?.id).not.toBe(second?.id)
    expect(first).toHaveAccessibleName(expect.stringContaining("Renovação"))
    await user.click(screen.getAllByText("Renovação")[1]!)
    expect(second).toHaveFocus()
  })
})

describe("IGRPRadioGroup — option content", () => {
  it("option cards render the icon and badge", () => {
    const { container } = render(<IGRPRadioGroup label="Tipo" options={OPTIONS} variant="card" />)
    expect(screen.getByText("Novo")).toBeInTheDocument()
    expect(container.querySelectorAll("svg").length).toBeGreaterThan(0)
  })

  it("the default variant ignores icon and badge", () => {
    const { container } = render(<IGRPRadioGroup label="Tipo" options={OPTIONS} />)
    expect(screen.queryByText("Novo")).toBeNull()
    expect(container.querySelectorAll("[data-slot=radio-group-item] ~ * svg").length).toBe(0)
  })
})

describe("IGRPRadioGroup — controlled", () => {
  it("shows errorText and applies className only to the field set", () => {
    render(<IGRPRadioGroup label="Tipo" options={OPTIONS} value="" errorText="Escolha um" className="custom-x" />)
    expect(screen.getByRole("alert")).toHaveTextContent("Escolha um")
    const group = screen.getByRole("radiogroup", { name: "Tipo" })
    expect(group).toHaveAttribute("aria-invalid", "true")
    expect(group).not.toHaveClass("custom-x")
    expect(group.closest("fieldset")).toHaveClass("custom-x")
  })

  it("reports picks through onValueChange", async () => {
    const user = userEvent.setup()
    const picks: string[] = []
    render(
      <IGRPRadioGroup label="Tipo" options={OPTIONS} variant="card" value="" onValueChange={(v) => picks.push(v)} />
    )
    await user.click(screen.getByText("Renovação"))
    expect(picks).toEqual(["renovacao"])
  })
})
