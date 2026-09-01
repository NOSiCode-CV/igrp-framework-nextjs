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

// After the M1 Slot-forwarding fix, IGRPInputText's form-context branch wires
// label↔input via FormControl's id forwarding. We use the accessible name query
// here as a regression guard: if the fix breaks, getByRole({name}) will fail
// and these tests will catch it.

describe("IGRPForm a11y", () => {
  it("associates the FormLabel with the underlying input element (clicking label focuses input)", async () => {
    render(
      <IGRPForm
        schema={schema}
        formRef={createRef<IGRPFormHandle<Schema>>()}
        onSubmit={vi.fn()}
        defaultValues={{ name: "" }}
      >
        <IGRPInputText name="name" label="Email address" />
      </IGRPForm>,
    )

    const input = screen.getByRole("textbox", { name: "Email address" }) as HTMLInputElement
    expect(input.tagName).toBe("INPUT")

    // Clicking the label should focus the input — the canonical accessibility contract.
    const label = screen.getByText("Email address")
    await userEvent.click(label)
    expect(document.activeElement).toBe(input)
  })

  it("wires aria-invalid + aria-describedby through FormControl after a validation error", async () => {
    const formRef = createRef<IGRPFormHandle<Schema>>()
    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={vi.fn()} defaultValues={{ name: "" }}>
        <IGRPInputText name="name" label="Name" />
      </IGRPForm>,
    )

    await formRef.current!.submit()

    const input = screen.getByRole("textbox", { name: "Name" })
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-invalid", "true")
    })
    expect(input.getAttribute("aria-describedby")).toMatch(/form-item-message/)
  })
})

describe("IGRPForm", () => {
  it("submits valid values via the formRef.submit() handle", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const formRef = createRef<IGRPFormHandle<Schema>>()

    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={onSubmit} defaultValues={{ name: "" }}>
        <IGRPInputText name="name" label="Name" />
      </IGRPForm>,
    )

    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement
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

    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement
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
    const input = screen.getByRole("textbox", { name: "Name" }) as HTMLInputElement
    await waitFor(() => expect(input.value).toBe("Initial"))

    await userEvent.click(screen.getByRole("button", { name: "update-defaults" }))

    await waitFor(() => {
      expect(input.value).toBe("Refreshed")
    })
  })
})
