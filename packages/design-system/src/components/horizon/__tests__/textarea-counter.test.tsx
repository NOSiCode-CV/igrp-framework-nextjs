import { describe, expect, it, vi } from "vitest"
import type { ReactNode } from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm, type FieldValues, type Resolver, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Form } from "../../primitives/form.js"
import { IGRPTextarea } from "../input/textarea.js"

function Harness({
  children,
  defaultValues = {},
  onForm,
  resolver,
}: {
  children: ReactNode
  defaultValues?: FieldValues
  onForm?: (form: UseFormReturn<FieldValues>) => void
  resolver?: Resolver<FieldValues>
}) {
  const form = useForm<FieldValues>({ defaultValues, resolver })
  onForm?.(form)
  return (
    <Form {...form}>
      <form noValidate>{children}</form>
    </Form>
  )
}

const status = () => screen.getByRole("status")

describe("IGRPTextarea counter", () => {
  it("maxLength without showCounter renders exactly what it did before", () => {
    const { container } = render(<IGRPTextarea name="f" label="F" maxLength={10} />)
    expect(screen.queryByRole("status")).toBeNull()
    expect(container.querySelector("[data-level]")).toBeNull()
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "10")
  })

  it("no counter without a positive maxLength", () => {
    render(<IGRPTextarea name="f" label="F" showCounter />)
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("standalone: counts defaultValue and updates on typing", async () => {
    render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter defaultValue="abc" />)
    expect(status()).toHaveTextContent(/Caracteres utilizados:\s*3\s*\/\s*de\s*10/)
    await userEvent.type(screen.getByRole("textbox"), "de")
    expect(status()).toHaveTextContent(/5\s*\/\s*de\s*10/)
  })

  it("standalone: a controlled value drives the count", () => {
    render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter value="abcd" onChange={() => {}} />)
    expect(status()).toHaveTextContent(/4/)
  })

  it("form: counts the field value and updates on typing", async () => {
    render(
      <Harness defaultValues={{ f: "ab" }}>
        <IGRPTextarea name="f" label="F" maxLength={10} showCounter />
      </Harness>
    )
    expect(status()).toHaveTextContent(/2\s*\/\s*de\s*10/)
    await userEvent.type(screen.getByRole("textbox"), "c")
    expect(status()).toHaveTextContent(/3\s*\/\s*de\s*10/)
  })

  it.each([[null], [undefined], [42]])("form: %s counts as 0", (v) => {
    render(
      <Harness defaultValues={{ f: v }}>
        <IGRPTextarea name="f" label="F" maxLength={10} showCounter />
      </Harness>
    )
    expect(status()).toHaveTextContent(/^\D*0\D*10$/)
  })

  it("is a polite live region referenced by the textarea, alongside the helper", () => {
    render(<IGRPTextarea name="f" label="F" helperText="Ajuda" maxLength={10} showCounter />)
    expect(status()).toHaveAttribute("aria-live", "polite")
    expect(status()).toHaveAttribute("id", "f-counter")
    expect(screen.getByRole("textbox").getAttribute("aria-describedby")?.split(" ")).toEqual(["f-helper", "f-counter"])
  })

  it("form: error and counter are both referenced", () => {
    render(
      <Harness>
        <IGRPTextarea name="f" label="F" error="Erro" maxLength={10} showCounter />
      </Harness>
    )
    expect(screen.getByRole("textbox").getAttribute("aria-describedby")?.split(" ")).toEqual(["f-error", "f-counter"])
  })

  it("keeps a caller aria-describedby", () => {
    render(<IGRPTextarea name="f" label="F" aria-describedby="extra" maxLength={10} showCounter />)
    expect(screen.getByRole("textbox").getAttribute("aria-describedby")?.split(" ")).toEqual(["extra", "f-counter"])
  })

  it.each([
    [8, 10, 0.9, "normal"],
    [9, 10, 0.9, "warning"],
    [10, 10, 0.9, "limit"],
    [69, 100, 30, "normal"],
    [70, 100, 30, "warning"],
    [100, 100, 30, "limit"],
  ])("length %i of %i with warnAt %s is %s", (len, max, warnAt, level) => {
    const { container } = render(
      <IGRPTextarea name="f" label="F" maxLength={max} warnAt={warnAt} showCounter defaultValue={"x".repeat(len)} />
    )
    const [bar, counter] = container.querySelectorAll(`[data-level]`)
    expect(bar).toHaveAttribute("data-level", level)
    expect(counter).toHaveAttribute("data-level", level)
    expect(bar).toHaveClass(
      ({ normal: "bg-primary/35", warning: "bg-warning", limit: "bg-destructive" } as const)[level as "normal"]
    )
  })

  it("bar width is capped at 100%", () => {
    const { container } = render(
      <IGRPTextarea name="f" label="F" maxLength={10} showCounter value={"x".repeat(15)} onChange={() => {}} />
    )
    expect(container.querySelector("[data-level]")).toHaveStyle({ width: "100%" })
  })

  it("showProgress={false} hides the bar; showProgress alone shows only the bar", () => {
    const a = render(<IGRPTextarea name="f" label="F" maxLength={10} showCounter showProgress={false} />)
    expect(a.container.querySelectorAll("[data-level]")).toHaveLength(1)
    expect(screen.getByRole("status")).toBeInTheDocument()
    a.unmount()
    const b = render(<IGRPTextarea name="f" label="F" maxLength={10} showProgress />)
    expect(b.container.querySelectorAll("[data-level]")).toHaveLength(1)
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("none of the new props reach the DOM", () => {
    render(
      <IGRPTextarea name="f" label="F" maxLength={10} showCounter showProgress warnAt={0.5} enforceMaxLength={false} />
    )
    const ta = screen.getByRole("textbox")
    for (const a of ["showcounter", "showprogress", "warnat", "enforcemaxlength"]) expect(ta).not.toHaveAttribute(a)
  })

  describe("value cap (form)", () => {
    let form!: UseFormReturn<FieldValues>
    const onForm = (f: UseFormReturn<FieldValues>) => (form = f)
    const resolver = vi.fn(zodResolver(z.object({ f: z.string().max(10) })) as unknown as Resolver<FieldValues>)

    it("setValue over the limit is truncated, dirty and re-validated", async () => {
      render(
        <Harness resolver={resolver} onForm={onForm}>
          <IGRPTextarea name="f" label="F" maxLength={10} showCounter />
        </Harness>
      )
      resolver.mockClear()
      act(() => form.setValue("f", "x".repeat(60)))
      await waitFor(() => expect(form.getValues("f")).toBe("x".repeat(10)))
      expect(form.getFieldState("f").isDirty).toBe(true)
      expect(resolver).toHaveBeenCalledWith(
        expect.objectContaining({ f: "x".repeat(10) }),
        undefined,
        expect.anything()
      )
      expect(status()).toHaveTextContent(/10\s*\/\s*de\s*10/)
    })

    it("reset over the limit is truncated and the counter follows", async () => {
      render(
        <Harness onForm={onForm}>
          <IGRPTextarea name="f" label="F" maxLength={10} showCounter />
        </Harness>
      )
      act(() => form.reset({ f: "y".repeat(15) }))
      await waitFor(() => expect(form.getValues("f")).toBe("y".repeat(10)))
      expect(status()).toHaveTextContent(/10\s*\/\s*de\s*10/)
    })

    it("enforceMaxLength={false} keeps the over-long value for Zod to fault", async () => {
      render(
        <Harness resolver={resolver} onForm={onForm}>
          <IGRPTextarea name="f" label="F" maxLength={10} enforceMaxLength={false} />
        </Harness>
      )
      act(() => form.setValue("f", "x".repeat(15)))
      await act(() => form.trigger("f"))
      expect(form.getValues("f")).toHaveLength(15)
      expect(document.querySelector('[data-slot="field-error"]')).toHaveTextContent(/10/)
    })

    it("leaves a non-string value alone", () => {
      render(
        <Harness defaultValues={{ f: 12345678901 }} onForm={onForm}>
          <IGRPTextarea name="f" label="F" maxLength={10} />
        </Harness>
      )
      expect(form.getValues("f")).toBe(12345678901)
    })

    it("without maxLength nothing is truncated", async () => {
      render(
        <Harness onForm={onForm}>
          <IGRPTextarea name="f" label="F" />
        </Harness>
      )
      act(() => form.setValue("f", "x".repeat(60)))
      await act(async () => {})
      expect(form.getValues("f")).toHaveLength(60)
    })
  })
})
