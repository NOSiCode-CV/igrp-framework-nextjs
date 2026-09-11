import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormProvider, useForm, type Resolver, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { IGRPInputColor } from "../input/color"
import { IGRPI18nProvider } from "../../../i18n"

function FormHarness({
  defaultValue = "#ff0000",
  resolver,
  onReady,
  children,
}: {
  defaultValue?: string
  resolver?: Resolver<{ brand: string }>
  onReady?: (form: UseFormReturn<{ brand: string }>) => void
  children: React.ReactNode
}) {
  const form = useForm<{ brand: string }>({ defaultValues: { brand: defaultValue }, resolver })
  onReady?.(form)
  return <FormProvider {...form}>{children}</FormProvider>
}

describe("IGRPInputColor", () => {
  it("renders the form value, not an internal default", () => {
    render(
      <FormHarness>
        <IGRPInputColor name="brand" label="Cor" />
      </FormHarness>,
    )
    expect(screen.getByLabelText("Cor")).toHaveValue("#ff0000")
    expect(screen.getByRole("textbox", { name: /Cor/ })).toHaveValue("#ff0000")
  })

  it("follows setValue and reset from the form", async () => {
    let form!: UseFormReturn<{ brand: string }>
    render(
      <FormHarness onReady={(f) => (form = f)}>
        <IGRPInputColor name="brand" label="Cor" />
      </FormHarness>,
    )

    await act(async () => form.setValue("brand", "#00ff00"))
    expect(screen.getByRole("textbox", { name: /Cor/ })).toHaveValue("#00ff00")

    await act(async () => form.reset({ brand: "#0000ff" }))
    expect(screen.getByRole("textbox", { name: /Cor/ })).toHaveValue("#0000ff")
  })

  it("associates the visible label with the picker", () => {
    render(<IGRPInputColor name="brand" label="Cor" />)
    expect(screen.getByLabelText("Cor")).toHaveAttribute("type", "color")
  })

  it("names the picker from i18n when there is no visible label", () => {
    render(<IGRPInputColor name="brand" />)
    expect(screen.getByLabelText("Seletor de cor")).toHaveAttribute("type", "color")
  })

  it("uses overridden i18n strings", () => {
    render(
      <IGRPI18nProvider strings={{ inputColor: { pickerLabel: "Colour picker" } }}>
        <IGRPInputColor name="brand" />
      </IGRPI18nProvider>,
    )
    expect(screen.getByLabelText("Colour picker")).toBeInTheDocument()
  })

  it("disables the value field and the format selector", () => {
    render(<IGRPInputColor name="brand" label="Cor" disabled />)
    expect(screen.getByLabelText("Cor")).toBeDisabled()
    expect(screen.getByRole("textbox", { name: /Cor/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Formato da cor" })).toBeDisabled()
  })

  it("accepts a pasted value in any supported syntax", async () => {
    const onChange = vi.fn()
    render(<IGRPInputColor name="brand" label="Cor" format="hex" defaultValue="#000000" onChange={onChange} />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "rgb(255 0 0 / 50%){Enter}")

    expect(onChange).toHaveBeenLastCalledWith("#ff0000")
    expect(input).toHaveValue("#ff0000")
  })

  it("reports an unparseable value instead of silently reverting", async () => {
    const onChange = vi.fn()
    render(<IGRPInputColor name="brand" label="Cor" format="hex" defaultValue="#000000" onChange={onChange} />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")

    expect(input).toHaveValue("nope")
    expect(screen.getByRole("alert")).toHaveTextContent("Introduza uma cor válida")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("publishes unparseable text so the value matches what is shown", async () => {
    const onChange = vi.fn()
    render(<IGRPInputColor name="brand" label="Cor" format="hex" defaultValue="#000000" onChange={onChange} />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")

    expect(onChange).toHaveBeenLastCalledWith("nope")
  })

  it("lets the consumer schema reject an unparseable value", async () => {
    let form!: UseFormReturn<{ brand: string }>
    const onValid = vi.fn()
    render(
      <FormHarness
        onReady={(f) => (form = f)}
        resolver={zodResolver(z.object({ brand: z.string().regex(/^#[0-9a-f]{6}$/i, "Cor inválida") }))}
      >
        <IGRPInputColor name="brand" label="Cor" format="hex" />
      </FormHarness>,
    )

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")

    await act(async () => form.handleSubmit(onValid)())
    expect(onValid).not.toHaveBeenCalled()
    expect(form.getValues("brand")).toBe("nope")
    expect(await screen.findByText("Cor inválida")).toBeInTheDocument()
  })

  it("keeps the swatch on the last valid color while the text is unparseable", async () => {
    render(<IGRPInputColor name="brand" label="Cor" format="hex" defaultValue="#ff0000" />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")

    expect(screen.getByLabelText("Cor")).toHaveValue("#ff0000")
  })

  it("does not stack its own message on top of a field error", async () => {
    render(<IGRPInputColor name="brand" label="Cor" format="hex" error="Cor não disponível" />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")

    expect(screen.queryByText("Introduza uma cor válida")).not.toBeInTheDocument()
    expect(screen.getByText("Cor não disponível")).toBeInTheDocument()
  })

  it("clears the invalid state once a valid value is committed", async () => {
    render(<IGRPInputColor name="brand" label="Cor" format="hex" defaultValue="#000000" />)

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")
    expect(screen.getByRole("alert")).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, "#abcdef{Enter}")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
    expect(input).toHaveValue("#abcdef")
  })

  it("keeps the format the stored value declares", () => {
    render(<IGRPInputColor name="brand" label="Cor" value="#ff0000" />)
    expect(screen.getByRole("textbox", { name: /Cor/ })).toHaveValue("#ff0000")
  })

  it("emits in the selected format when the user switches it", async () => {
    const onChange = vi.fn()
    render(<IGRPInputColor name="brand" label="Cor" defaultValue="#ff0000" onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Formato da cor" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "RGB" }))

    expect(onChange).toHaveBeenLastCalledWith("rgb(255, 0, 0)")
  })

  it("forwards input props to the value field", () => {
    render(<IGRPInputColor name="brand" label="Cor" placeholder="#rrggbb" readOnly />)
    const input = screen.getByRole("textbox", { name: /Cor/ })
    expect(input).toHaveAttribute("placeholder", "#rrggbb")
    expect(input).toHaveAttribute("readonly")
  })

  it("points the picker at its helper text", () => {
    render(<IGRPInputColor name="brand" label="Cor" helperText="Cor principal da marca" />)
    expect(screen.getByLabelText("Cor")).toHaveAccessibleDescription("Cor principal da marca")
  })
})

describe("IGRPInputColor — regression probes", () => {
  it("does not leak IGRP-only props onto the DOM input", () => {
    const onError = vi.spyOn(console, "error").mockImplementation(() => {})
    render(<IGRPInputColor name="brand" label="Cor" showIcon iconName="House" iconSize={16} />)
    const input = screen.getByRole("textbox", { name: /Cor/ })
    expect(input).not.toHaveAttribute("iconname")
    expect(input).not.toHaveAttribute("showicon")
    expect(onError).not.toHaveBeenCalled()
    onError.mockRestore()
  })

  it("drops a pending invalid draft when the form value is reset", async () => {
    let form!: UseFormReturn<{ brand: string }>
    render(
      <FormHarness onReady={(f) => (form = f)}>
        <IGRPInputColor name="brand" label="Cor" />
      </FormHarness>,
    )

    const input = screen.getByRole("textbox", { name: /Cor/ })
    await userEvent.clear(input)
    await userEvent.type(input, "nope{Enter}")
    expect(screen.getByRole("alert")).toBeInTheDocument()

    await act(async () => form.reset({ brand: "#0000ff" }))
    expect(input).toHaveValue("#0000ff")
    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })
})
