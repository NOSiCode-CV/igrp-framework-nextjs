import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FormProvider, useForm } from "react-hook-form"

import { IGRPInputNumber } from "../input/number"
import { IGRPI18nProvider } from "../../../i18n"

describe("IGRPInputNumber", () => {
  it("renders with role=spinbutton and the pt-PT increment/decrement labels", () => {
    render(<IGRPInputNumber name="qty" label="Quantity" />)
    expect(screen.getByRole("spinbutton", { name: /Quantity/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Incrementar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Decrementar" })).toBeInTheDocument()
  })

  it("increments on stepper click and calls onChange", async () => {
    const onChange = vi.fn()
    render(<IGRPInputNumber name="qty" label="Quantity" defaultValue={5} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    expect(onChange).toHaveBeenCalledWith(6)
  })

  it("clamps to max on increment", async () => {
    const onChange = vi.fn()
    render(<IGRPInputNumber name="qty" label="Quantity" defaultValue={9} max={10} onChange={onChange} />)

    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    expect(onChange).toHaveBeenLastCalledWith(10)
    await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
    // Button is disabled at max — onChange should not fire again.
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("uses overridden i18n strings", () => {
    render(
      <IGRPI18nProvider strings={{ inputNumber: { incrementLabel: "Up", decrementLabel: "Down" } }}>
        <IGRPInputNumber name="qty" label="Quantity" />
      </IGRPI18nProvider>,
    )
    expect(screen.getByRole("button", { name: "Up" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Down" })).toBeInTheDocument()
  })

  it("exposes aria-valuemin/max for assistive tech", () => {
    render(<IGRPInputNumber name="qty" label="Q" min={0} max={100} defaultValue={50} />)
    const spinbutton = screen.getByRole("spinbutton")
    expect(spinbutton).toHaveAttribute("aria-valuemin", "0")
    expect(spinbutton).toHaveAttribute("aria-valuemax", "100")
    expect(spinbutton).toHaveAttribute("aria-valuenow", "50")
  })

  describe("decimals", () => {
    it("lets the user type a decimal value", async () => {
      const onChange = vi.fn()
      render(<IGRPInputNumber name="weight" label="Weight" onChange={onChange} />)

      const input = screen.getByRole("spinbutton")
      await userEvent.click(input)
      await userEvent.type(input, "3.14")

      expect(input).toHaveValue("3.14")
      expect(onChange).toHaveBeenLastCalledWith(3.14)
    })

    it("lets the user type a decimal value inside a form", async () => {
      const Wrapper = () => {
        const methods = useForm()
        return (
          <FormProvider {...methods}>
            <IGRPInputNumber name="weight" label="Weight" />
          </FormProvider>
        )
      }
      render(<Wrapper />)

      const input = screen.getByRole("spinbutton")
      await userEvent.click(input)
      await userEvent.type(input, "3.14")

      expect(input).toHaveValue("3.14")
      expect(input).toHaveAttribute("aria-valuenow", "3.14")
    })

    it("round-trips a locale-formatted value typed by the user", async () => {
      const formatOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
      const onChange = vi.fn()
      render(<IGRPInputNumber name="price" label="Price" formatOptions={formatOptions} onChange={onChange} />)

      const input = screen.getByRole("spinbutton")
      const typed = new Intl.NumberFormat(undefined, formatOptions).format(1234.56)

      await userEvent.click(input)
      await userEvent.type(input, typed)
      expect(onChange).toHaveBeenLastCalledWith(1234.56)

      await userEvent.tab()
      expect(input).toHaveValue(typed)
    })

    it("edits a formatted value without corrupting it", async () => {
      const formatOptions: Intl.NumberFormatOptions = {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
      const onChange = vi.fn()
      render(
        <IGRPInputNumber
          name="price"
          label="Price"
          defaultValue={12.55}
          formatOptions={formatOptions}
          onChange={onChange}
        />,
      )

      const input = screen.getByRole("spinbutton")
      await userEvent.click(input)
      // Focusing swaps the formatted display for an editable, unformatted one.
      expect(input).toHaveValue("12.55")

      await userEvent.type(input, "5")
      expect(onChange).toHaveBeenLastCalledWith(12.555)
    })

    it("edits percent values in percent units", async () => {
      const onChange = vi.fn()
      render(
        <IGRPInputNumber
          name="discount"
          label="Discount"
          defaultValue={0.25}
          formatOptions={{ style: "percent" }}
          onChange={onChange}
        />,
      )

      const input = screen.getByRole("spinbutton")
      await userEvent.click(input)
      expect(input).toHaveValue("25")

      await userEvent.clear(input)
      await userEvent.type(input, "30")
      expect(onChange).toHaveBeenLastCalledWith(0.3)

      await userEvent.tab()
      expect(input).toHaveValue(new Intl.NumberFormat(undefined, { style: "percent" }).format(0.3))
    })

    it("does not clamp mid-typing, only on blur", async () => {
      const onChange = vi.fn()
      render(<IGRPInputNumber name="age" label="Age" min={10} max={100} onChange={onChange} />)

      const input = screen.getByRole("spinbutton")
      await userEvent.click(input)
      // "1" alone is below min, but clamping it there would make "15" untypable.
      await userEvent.type(input, "15")
      expect(input).toHaveValue("15")
      expect(onChange).toHaveBeenLastCalledWith(15)

      await userEvent.clear(input)
      await userEvent.type(input, "5")
      await userEvent.tab()
      expect(input).toHaveValue("10")
      expect(onChange).toHaveBeenLastCalledWith(10)
    })

    it("does not accumulate floating point drift when stepping", async () => {
      render(<IGRPInputNumber name="price" label="Price" defaultValue={12.5} step={0.01} />)

      const increment = screen.getByRole("button", { name: "Incrementar" })
      for (let i = 0; i < 5; i++) {
        await userEvent.click(increment)
      }

      expect(screen.getByRole("spinbutton")).toHaveAttribute("aria-valuenow", "12.55")
    })

    it("steps by a fractional step", async () => {
      const onChange = vi.fn()
      render(<IGRPInputNumber name="weight" label="Weight" defaultValue={1.75} step={0.25} onChange={onChange} />)

      await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
      expect(onChange).toHaveBeenLastCalledWith(2)
      await userEvent.click(screen.getByRole("button", { name: "Incrementar" }))
      expect(onChange).toHaveBeenLastCalledWith(2.25)
    })
  })
})
