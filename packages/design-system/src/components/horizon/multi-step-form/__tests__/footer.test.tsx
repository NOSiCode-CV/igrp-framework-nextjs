import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useWatch } from "react-hook-form"
import { z } from "zod"

import { IGRPForm } from "../../form/index.js"
import { IGRPInputText } from "../../input/text.js"
import { IGRPMultiStepForm } from "../index.js"
import type { IGRPWizardStep } from "../context.js"
import {
  IGRPMultiStepFormFooter,
  IGRPMultiStepFormNext,
  IGRPMultiStepFormPrevious,
  IGRPMultiStepFormSubmit,
} from "../footer.js"
import { IGRPMultiStepFormSteps } from "../steps.js"

vi.mock("react-hook-form", async (orig) => {
  const actual = await orig<typeof import("react-hook-form")>()
  return { ...actual, useWatch: vi.fn(actual.useWatch) }
})

const formRef = { current: null }

const mk = (keys: string[]): IGRPWizardStep[] =>
  keys.map((key) => ({ key, title: key, fields: [], component: <p>content {key}</p> }))

function Wizard({
  steps = mk(["a", "b", "c"]),
  submitChildren,
  nextProps,
  animate,
}: {
  steps?: IGRPWizardStep[]
  submitChildren?: React.ReactNode
  nextProps?: React.ComponentProps<typeof IGRPMultiStepFormNext>
  animate?: boolean
}) {
  return (
    <IGRPMultiStepForm steps={steps}>
      <IGRPMultiStepFormSteps animate={animate} />
      <IGRPMultiStepFormFooter>
        <IGRPMultiStepFormPrevious />
        <IGRPMultiStepFormNext {...nextProps} />
        <IGRPMultiStepFormSubmit>{submitChildren}</IGRPMultiStepFormSubmit>
      </IGRPMultiStepFormFooter>
    </IGRPMultiStepForm>
  )
}

const btn = (name: string) => screen.queryByRole("button", { name })

describe("footer buttons", () => {
  it("Previous is absent on step 1, Next absent on the last step, Submit present only on the last step", async () => {
    render(<Wizard />)
    expect(btn("Anterior")).toBeNull()
    expect(btn("Próximo")).not.toBeNull()
    expect(btn("Submeter")).toBeNull()
    await userEvent.click(btn("Próximo")!)
    await userEvent.click(await screen.findByRole("button", { name: "Próximo" }))
    expect(await screen.findByRole("button", { name: "Submeter" })).toHaveAttribute("type", "submit")
    expect(btn("Anterior")).not.toBeNull()
    expect(btn("Próximo")).toBeNull()
  })

  it("children override the default labels", async () => {
    render(<Wizard steps={mk(["a"])} submitChildren="Guardar" />)
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument()
  })

  it("Next composes a caller onClick and skips navigation when it calls preventDefault", async () => {
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    render(<Wizard nextProps={{ onClick }} />)
    await userEvent.click(btn("Próximo")!)
    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText("content a")).toBeInTheDocument()
  })
})

describe("form integration", () => {
  it("a wizard without blockingMessage mounts no useWatch and works outside a form provider", async () => {
    vi.mocked(useWatch).mockImplementation(() => {
      throw new Error("useWatch mounted")
    })
    render(<Wizard />)
    await userEvent.click(btn("Próximo")!)
    expect(await screen.findByText("content b")).toBeInTheDocument()
    expect(useWatch).not.toHaveBeenCalled()
    vi.mocked(useWatch).mockReset()
  })

  it("blockingMessage disables Next, re-evaluates per keystroke, and shows the reason on hover and focus", async () => {
    const actual = await vi.importActual<typeof import("react-hook-form")>("react-hook-form")
    vi.mocked(useWatch).mockImplementation(actual.useWatch as never)
    const schema = z.object({ name: z.string() })
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
      <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={{ name: "" }}>
        <Wizard steps={steps} />
      </IGRPForm>
    )
    const next = screen.getByRole("button", { name: "Próximo" })
    expect(next).toBeDisabled()
    await userEvent.hover(next)
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Indique o nome")
    await userEvent.unhover(next)
    // focus reaches the tooltip wrapper (disabled button is not tabbable)
    const wrapper = next.closest('[data-slot="tooltip-trigger-wrapper"]') as HTMLElement
    wrapper.focus()
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Indique o nome")
    await userEvent.type(screen.getByLabelText("Nome"), "An")
    expect(screen.getByRole("button", { name: "Próximo" })).toBeDisabled()
    await userEvent.type(screen.getByLabelText("Nome"), "a")
    // the tooltip wrapper unmounts with the message, so re-query rather than reuse `next`
    expect(screen.getByRole("button", { name: "Próximo" })).toBeEnabled()
  })

  it("Enter on a non-last step does not submit the form", async () => {
    const onSubmit = vi.fn()
    const schema = z.object({ name: z.string() })
    const steps: IGRPWizardStep[] = [
      { key: "a", title: "a", fields: [], component: <IGRPInputText name="name" label="Nome" /> },
      ...mk(["b"]),
    ]
    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit} defaultValues={{ name: "" }}>
        <Wizard steps={steps} />
      </IGRPForm>
    )
    await userEvent.type(screen.getByLabelText("Nome"), "x{Enter}")
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe("steps", () => {
  it("the slide animation is scoped to motion-safe, so reduced motion gets none", () => {
    const { container } = render(<Wizard />)
    const panel = container.querySelector('[data-slot="multi-step-form-steps"]')!
    expect(panel.className).toContain("motion-safe:animate-[igrp-step-in_")
    expect(panel.className.split(/\s+/).filter((c) => c.startsWith("animate-"))).toEqual([])
  })

  it("animate={false} renders no animation class", () => {
    const { container } = render(<Wizard animate={false} />)
    expect(container.querySelector('[data-slot="multi-step-form-steps"]')!.className).not.toContain("animate")
  })

  it("Steps renders nothing for an empty step list", () => {
    const { container } = render(<Wizard steps={[]} />)
    expect(container.querySelector('[data-slot="multi-step-form-steps"]')).toBeNull()
  })
})
