import { useEffect } from "react"
import { describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm, type UseFormReturn } from "react-hook-form"

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../form.js"

type Values = { email: string | null }

let form: UseFormReturn<Values>

function Harness({ description, message }: { description?: boolean; message?: string }) {
  const methods = useForm<Values>({ defaultValues: { email: "" } })
  useEffect(() => {
    form = methods
  })
  return (
    <Form {...methods}>
      <FormField
        control={methods.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <input {...field} value={field.value ?? ""} />
            </FormControl>
            {description && <FormDescription>O seu email</FormDescription>}
            <FormMessage message={message} />
          </FormItem>
        )}
      />
    </Form>
  )
}

describe("Form primitives", () => {
  it("labels the control and binds typed input to the form value", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText("Email"), "a@b.cv")
    expect(form.getValues("email")).toBe("a@b.cv")
  })

  it("clears the control when the field is set to null", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText("Email"), "a@b.cv")
    act(() => form.setValue("email", null))
    expect(screen.getByLabelText("Email")).toHaveValue("")
  })

  it("describes the control only by parts that are rendered", () => {
    const { rerender } = render(<Harness />)
    const input = screen.getByLabelText("Email")
    expect(input).not.toHaveAttribute("aria-describedby")
    expect(input).toHaveAttribute("aria-invalid", "false")

    rerender(<Harness description />)
    expect(input).toHaveAccessibleDescription("O seu email")
  })

  it("marks the control invalid and announces the RHF error", () => {
    render(<Harness description />)
    act(() => form.setError("email", { message: "Obrigatório" }))
    const input = screen.getByLabelText("Email")
    expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription("O seu email Obrigatório")
  })

  it("treats a caller-supplied message as an error", () => {
    render(<Harness message="Email já existe" />)
    const input = screen.getByLabelText("Email")
    expect(screen.getByRole("alert")).toHaveTextContent("Email já existe")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAccessibleDescription("Email já existe")
  })
})
