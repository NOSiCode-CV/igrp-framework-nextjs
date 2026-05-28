import { describe, expect, it, vi } from "vitest"
import { createRef, useState } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../form"
import { IGRPInputText } from "../input/text"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
})
type Schema = typeof schema

// IGRPInputText's form-context branch wraps the Input in a positioning div, which
// captures FormControl's forwarded id — so label/input aren't associated by htmlFor.
// We query by the name attribute instead until that's fixed in IGRPInputText.
const inputByName = (name: string): HTMLInputElement => {
  const el = document.querySelector(`input[name="${name}"]`)
  if (!el) throw new Error(`no input[name="${name}"] in document`)
  return el as HTMLInputElement
}

describe("IGRPForm", () => {
  it("submits valid values via the formRef.submit() handle", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const formRef = createRef<IGRPFormHandle<Schema>>()

    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit} defaultValues={{ name: "" }}>
        <IGRPInputText name="name" label="Name" />
      </IGRPForm>,
    )

    const input = inputByName("name")
    await userEvent.type(input, "Alice")

    await formRef.current!.submit()

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(onSubmit).toHaveBeenCalledWith({ name: "Alice" })
  })

  it("does not call onSubmit when Zod validation fails", async () => {
    const onSubmit = vi.fn()
    const formRef = createRef<IGRPFormHandle<Schema>>()

    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit} defaultValues={{ name: "" }}>
        <IGRPInputText name="name" label="Name" />
      </IGRPForm>,
    )

    await formRef.current!.submit()

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("surfaces a global error and shows it in the banner when onSubmit throws", async () => {
    const formRef = createRef<IGRPFormHandle<Schema>>()
    const onSubmit = vi.fn().mockRejectedValue(new Error("Server down"))

    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit} defaultValues={{ name: "Bob" }}>
        <IGRPInputText name="name" label="Name" />
      </IGRPForm>,
    )

    await formRef.current!.submit()

    await waitFor(() => {
      expect(screen.getByText("Server down")).toBeInTheDocument()
    })
  })

  it("does not clobber user input when defaultValues identity changes but the user has typed (isDirty guard)", async () => {
    function Wrapper() {
      const [defaults, setDefaults] = useState({ name: "Initial" })
      return (
        <>
          <button type="button" onClick={() => setDefaults({ name: "Refreshed" })}>
            update-defaults
          </button>
          <IGRPForm
            schema={schema}
            formRef={createRef<IGRPFormHandle<Schema>>()}
            onSubmit={vi.fn()}
            defaultValues={defaults}
          >
            <IGRPInputText name="name" label="Name" />
          </IGRPForm>
        </>
      )
    }

    render(<Wrapper />)

    const input = inputByName("name")
    await waitFor(() => expect(input.value).toBe("Initial"))

    // User types — form becomes dirty.
    await userEvent.clear(input)
    await userEvent.type(input, "User edit")
    expect(input.value).toBe("User edit")

    // Parent updates defaultValues — must NOT clobber dirty user input.
    await userEvent.click(screen.getByRole("button", { name: "update-defaults" }))
    expect(input.value).toBe("User edit")
  })

  it("does sync new defaultValues into a pristine form (no isDirty)", async () => {
    function Wrapper() {
      const [defaults, setDefaults] = useState({ name: "Initial" })
      return (
        <>
          <button type="button" onClick={() => setDefaults({ name: "Refreshed" })}>
            update-defaults
          </button>
          <IGRPForm
            schema={schema}
            formRef={createRef<IGRPFormHandle<Schema>>()}
            onSubmit={vi.fn()}
            defaultValues={defaults}
          >
            <IGRPInputText name="name" label="Name" />
          </IGRPForm>
        </>
      )
    }

    render(<Wrapper />)
    const input = inputByName("name")
    await waitFor(() => expect(input.value).toBe("Initial"))

    await userEvent.click(screen.getByRole("button", { name: "update-defaults" }))

    await waitFor(() => {
      expect(input.value).toBe("Refreshed")
    })
  })
})
