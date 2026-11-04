import { useState } from "react"
import { describe, it, expect, vi } from "vitest"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form/index.js"
import { IGRPInputText } from "../../input/text.js"
import { IGRPMultiStepForm, type IGRPMultiStepFormProps } from "../index.js"
import { useIGRPMultiStepForm, type IGRPWizardStep } from "../context.js"
import { clampStepIndex, resolveStepIndex } from "../lib.js"

const mk = (keys: string[]): IGRPWizardStep[] =>
  keys.map((key) => ({ key, title: key, fields: [], component: <p>{key}</p> }))
const steps3 = mk(["a", "b", "c"]) as [IGRPWizardStep, IGRPWizardStep, IGRPWizardStep]

function Probe({ replacement }: { replacement?: IGRPWizardStep[] }) {
  const w = useIGRPMultiStepForm()
  const [out, setOut] = useState("")
  const report = (p: Promise<boolean>) => p.then((r) => setOut(String(r)))
  return (
    <div>
      <span data-testid="index">{w.currentStepIndex}</span>
      <span data-testid="key">{w.currentStepData?.key ?? "none"}</span>
      <output data-testid="out">{out}</output>
      <button onClick={() => report(w.goToNext())}>next</button>
      <button onClick={() => w.goToPrevious()}>prev</button>
      <button onClick={() => report(w.goToStep(3))}>to3</button>
      <button onClick={() => report(w.goToStep(1))}>to1</button>
      <button onClick={() => report(w.goToStep(3, { force: true }))}>force3</button>
      <button onClick={() => report(w.goToStep(9))}>to9</button>
      <button onClick={() => w.setSteps(replacement ?? [])}>set</button>
    </div>
  )
}

const idx = () => screen.getByTestId("index").textContent
const click = (name: string) => userEvent.click(screen.getByRole("button", { name }))

function setup(props: Partial<IGRPMultiStepFormProps> = {}, replacement?: IGRPWizardStep[]) {
  return render(
    <IGRPMultiStepForm steps={steps3} {...props}>
      <Probe replacement={replacement} />
    </IGRPMultiStepForm>
  )
}

describe("lib", () => {
  it.each([
    [0, 3, 1],
    [1, 3, 1],
    [3, 3, 3],
    [9, 3, 3],
    [-2, 3, 1],
    [5, 0, 1],
  ])("clampStepIndex(%i, %i) is %i", (v, n, out) => expect(clampStepIndex(v, n)).toBe(out))

  it("resolveStepIndex finds a key or falls back to 1", () => {
    expect(resolveStepIndex(steps3, "c")).toBe(3)
    expect(resolveStepIndex(steps3, "zz")).toBe(1)
    expect(resolveStepIndex([], undefined)).toBe(1)
  })
})

describe("navigation", () => {
  it("goToNext resolves false and stays when onStepValidation returns false", async () => {
    setup({ onStepValidation: () => false })
    await click("next")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("1")
  })

  it("goToNext resolves false and stays when onStepValidation rejects", async () => {
    setup({ onStepValidation: vi.fn().mockRejectedValue(new Error("x")) })
    await click("next")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("1")
  })

  it("goToNext advances and calls onStepChange(2, 1) when validation passes", async () => {
    const onStepChange = vi.fn()
    setup({ onStepValidation: () => true, onStepChange })
    await click("next")
    await waitFor(() => expect(idx()).toBe("2"))
    expect(onStepChange).toHaveBeenCalledWith(2, 1)
    expect(screen.getByTestId("out")).toHaveTextContent("true")
  })

  it("goToNext on the last step resolves false", async () => {
    setup({ initialStep: 3 })
    await click("next")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("3")
  })

  it("ignores a second goToNext while one is in flight", async () => {
    let resolve!: (v: boolean) => void
    const onStepValidation = vi.fn(() => new Promise<boolean>((r) => (resolve = r)))
    setup({ onStepValidation })
    await click("next")
    await click("next")
    expect(onStepValidation).toHaveBeenCalledTimes(1)
    await act(async () => resolve(true))
    await waitFor(() => expect(idx()).toBe("2"))
    expect(onStepValidation).toHaveBeenCalledTimes(1)
  })

  it("goToPrevious moves back without validating", async () => {
    const onStepValidation = vi.fn(() => true)
    setup({ initialStep: 2, onStepValidation })
    await click("prev")
    expect(idx()).toBe("1")
    expect(onStepValidation).not.toHaveBeenCalled()
  })

  it("goToStep validates every step it skips", async () => {
    const onStepValidation = vi.fn((s: IGRPWizardStep) => s.key !== "b")
    setup({ onStepValidation })
    await click("to3")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("2")
    expect(onStepValidation.mock.calls.map((c) => c[0].key)).toEqual(["a", "b"])
  })

  it("goToStep with force skips validation", async () => {
    const onStepValidation = vi.fn(() => false)
    setup({ onStepValidation })
    await click("force3")
    await waitFor(() => expect(idx()).toBe("3"))
    expect(onStepValidation).not.toHaveBeenCalled()
  })

  it("goToStep backwards does not validate", async () => {
    const onStepValidation = vi.fn(() => false)
    setup({ initialStep: 3, onStepValidation })
    await click("to1")
    await waitFor(() => expect(idx()).toBe("1"))
    expect(onStepValidation).not.toHaveBeenCalled()
  })

  it("goToStep outside [1, count] resolves false and stays", async () => {
    setup()
    await click("to9")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("1")
  })
})

describe("steps and initialStep", () => {
  it("initialStep beyond the count clamps to the last step; below 1 clamps to 1", () => {
    const { unmount } = setup({ initialStep: 9 })
    expect(idx()).toBe("3")
    unmount()
    setup({ initialStep: 0 })
    expect(idx()).toBe("1")
  })

  it("an empty step list renders and currentStepData is undefined", () => {
    setup({ steps: [] })
    expect(idx()).toBe("1")
    expect(screen.getByTestId("key")).toHaveTextContent("none")
  })

  it("changing initialStep re-applies it", () => {
    const ui = (n: number) => (
      <IGRPMultiStepForm steps={steps3} initialStep={n}>
        <Probe />
      </IGRPMultiStepForm>
    )
    const { rerender } = render(ui(1))
    rerender(ui(3))
    expect(idx()).toBe("3")
  })

  it("replacing steps while on a removed step resets to the first step", async () => {
    setup({ initialStep: 3 }, mk(["a", "b"]))
    await click("set")
    await waitFor(() => expect(idx()).toBe("1"))
  })

  it("replacing steps keeps the current step matched by key", async () => {
    setup({ initialStep: 2 }, mk(["x", "a", "b"]))
    await click("set")
    await waitFor(() => expect(idx()).toBe("3"))
    expect(screen.getByTestId("key")).toHaveTextContent("b")
  })

  it("a new steps array with the same keys keeps the current step", async () => {
    function Parent() {
      const [list, setList] = useState<IGRPWizardStep[]>(steps3)
      return (
        <>
          <button onClick={() => setList(steps3.map((s) => ({ ...s })))}>rerender</button>
          <IGRPMultiStepForm steps={list}>
            <Probe />
          </IGRPMultiStepForm>
        </>
      )
    }
    render(<Parent />)
    await click("next")
    await waitFor(() => expect(idx()).toBe("2"))
    await click("rerender")
    expect(idx()).toBe("2")
  })
})

describe("default validation", () => {
  const schema = z.object({ name: z.string().min(1, "name required"), other: z.string().min(1, "other required") })

  const formRef: { current: IGRPFormHandle<typeof schema> | null } = { current: null }

  function inForm(stepList: IGRPWizardStep[]) {
    function Host() {
      return (
        <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={{ name: "", other: "" }}>
          <IGRPMultiStepForm steps={stepList}>
            <IGRPInputText name="name" label="Name" />
            <IGRPInputText name="other" label="Other" />
            <Probe />
          </IGRPMultiStepForm>
        </IGRPForm>
      )
    }
    return render(<Host />)
  }

  it("resolves true outside an IGRPForm", async () => {
    setup()
    await click("next")
    await waitFor(() => expect(idx()).toBe("2"))
  })

  it("calls form.trigger(step.fields) inside an IGRPForm", async () => {
    inForm([{ ...steps3[0], fields: ["name"] }, steps3[1]])
    await click("next")
    expect(await screen.findByText("name required")).toBeInTheDocument()
    expect(screen.queryByText("other required")).not.toBeInTheDocument()
    expect(formRef.current?.getFieldState("other").error).toBeUndefined()
    expect(idx()).toBe("1")
    await userEvent.type(screen.getByLabelText("Name"), "x")
    await click("next")
    await waitFor(() => expect(idx()).toBe("2"))
  })

  it("default validation skips trigger for a step with no fields", async () => {
    inForm(steps3)
    await click("next")
    await waitFor(() => expect(idx()).toBe("2"))
  })

  it("a step whose blockingMessage returns a string blocks goToNext", async () => {
    inForm([{ ...steps3[0], blockingMessage: (v) => (v.name ? null : "Nome em falta") }, steps3[1]])
    await click("next")
    await waitFor(() => expect(screen.getByTestId("out")).toHaveTextContent("false"))
    expect(idx()).toBe("1")
  })
})

it("useIGRPMultiStepForm throws outside the provider", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {})
  expect(() => render(<Probe />)).toThrow(/within IGRPMultiStepForm/)
  spy.mockRestore()
})
