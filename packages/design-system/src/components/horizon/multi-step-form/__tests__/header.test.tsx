import { describe, it, expect, vi } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm } from "../../form/index.js"
import { IGRPInputText } from "../../input/text.js"
import { IGRPMultiStepForm } from "../index.js"
import type { IGRPWizardStep } from "../context.js"
import { IGRPMultiStepFormHeader } from "../header.js"
import { IGRPMultiStepFormNext } from "../footer.js"

const formRef = { current: null }

const mk = (keys: string[]): IGRPWizardStep[] =>
  keys.map((key) => ({ key, title: key, fields: [], component: <p>content {key}</p> }))

const items = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[data-slot="stepper-item"]'))

describe("IGRPMultiStepFormHeader", () => {
  it("renders one item per step with its title, and the current step active", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b", "c"])}>
        <IGRPMultiStepFormHeader />
      </IGRPMultiStepForm>
    )
    const list = items(container)
    expect(list).toHaveLength(3)
    expect(list[0]).toHaveAttribute("data-state", "active")
    expect(list[1]).toHaveAttribute("data-state", "inactive")
    for (const t of ["a", "b", "c"]) expect(screen.getByText(t)).toBeInTheDocument()
  })

  it("passes variant to every indicator", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b", "c"])}>
        <IGRPMultiStepFormHeader variant="number" />
      </IGRPMultiStepForm>
    )
    const ind = container.querySelectorAll('[data-slot="stepper-indicator"]')
    expect(ind).toHaveLength(3)
    ind.forEach((i) => expect(i).toHaveAttribute("data-variant", "number"))
  })

  it("defaults to the ring variant", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b"])}>
        <IGRPMultiStepFormHeader />
      </IGRPMultiStepForm>
    )
    expect(container.querySelector('[data-slot="stepper-indicator"]')).toHaveAttribute("data-variant", "ring")
  })

  it("is not navigable by default: no step buttons", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b", "c"])}>
        <IGRPMultiStepFormHeader />
      </IGRPMultiStepForm>
    )
    expect(within(container).queryAllByRole("button")).toEqual([])
  })

  it("navigable: clicking a later step calls goToStep and validates", async () => {
    const onStepValidation = vi.fn<(s: IGRPWizardStep) => boolean>(() => true)
    render(
      <IGRPMultiStepForm steps={mk(["a", "b", "c"])} onStepValidation={onStepValidation}>
        <IGRPMultiStepFormHeader navigable />
      </IGRPMultiStepForm>
    )
    await userEvent.click(screen.getByText("c"))
    expect(onStepValidation.mock.calls.map((c) => c[0]!.key)).toEqual(["a", "b"])
    expect(items(document.body)[2]).toHaveAttribute("data-state", "active")
  })

  it("navigable: steps after a blocked current step are disabled and show the message", async () => {
    const steps: IGRPWizardStep[] = [
      {
        key: "a",
        title: "a",
        fields: ["name"],
        component: <IGRPInputText name="name" label="Nome" />,
        blockingMessage: (v) => (String(v.name ?? "").length < 3 ? "Indique o nome" : null),
      },
      ...mk(["b"]),
    ]
    render(
      <IGRPForm
        schema={z.object({ name: z.string() })}
        formRef={formRef}
        onSubmit={() => {}}
        defaultValues={{ name: "" }}
      >
        <IGRPMultiStepForm steps={steps}>
          <IGRPMultiStepFormHeader navigable />
          <IGRPMultiStepFormNext />
        </IGRPMultiStepForm>
      </IGRPForm>
    )
    const b = screen.getByText("b").closest("button")!
    expect(b).toBeDisabled()
    expect(screen.getByText("a").closest("button")).toBeEnabled()
    await userEvent.hover(b.closest('[data-slot="tooltip-trigger-wrapper"]')!)
    expect((await screen.findAllByRole("tooltip"))[0]).toHaveTextContent("Indique o nome")
  })

  it("isLoading shows the spinner on the active indicator only", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b"])}>
        <IGRPMultiStepFormHeader isLoading />
      </IGRPMultiStepForm>
    )
    const [first, second] = items(container)
    expect(first).toHaveAttribute("data-loading")
    expect(second).not.toHaveAttribute("data-loading")
  })

  it("separators are absolutely positioned with no caller calc()", () => {
    const { container } = render(
      <IGRPMultiStepForm steps={mk(["a", "b", "c"])}>
        <IGRPMultiStepFormHeader />
      </IGRPMultiStepForm>
    )
    const list = items(container)
    const seps = container.querySelectorAll('[data-slot="stepper-separator"]')
    expect(seps).toHaveLength(2)
    seps.forEach((s) => {
      const own = s.className.split(/\s+/).filter((c) => !c.includes("group-has"))
      expect(own).toContain("absolute")
      expect(own.join(" ")).not.toContain("calc(")
    })
    expect(list[2]!.querySelector('[data-slot="stepper-separator"]')).toBeNull()
  })
})
