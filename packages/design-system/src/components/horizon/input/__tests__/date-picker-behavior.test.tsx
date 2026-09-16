import { useRef, useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useFormContext } from "react-hook-form"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form"
import { IGRPCalendarSingle } from "../../calendar/single"
import { IGRPDatePickerSingle } from "../date-picker/single"
import { IGRPDatePickerInputSingle } from "../date-picker/input-single"

const schema = z.object({ d: z.any() })

function Wrapper({ defaultValues, children }: { defaultValues: unknown; children: React.ReactNode }) {
  const formRef = useRef<IGRPFormHandle<typeof schema> | null>(null)
  return (
    <IGRPForm
      schema={schema}
      formRef={formRef}
      onSubmit={() => {}}
      defaultValues={defaultValues as Record<string, unknown>}
    >
      {children}
    </IGRPForm>
  )
}

/** Reports the live form value for `d` on every render. */
function FormValueProbe({ onValue }: { onValue: (value: unknown) => void }) {
  const context = useFormContext()
  onValue(context?.watch("d"))
  return null
}

const input = () => screen.getByRole("textbox") as HTMLInputElement
const calendarTrigger = () => document.querySelector('[id^="date-picker-btn-"]')

describe("IGRPDatePickerInputSingle — typing", () => {
  it("keeps a half-typed date instead of wiping the field", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )

    expect(input()).toHaveValue("26-08-2026")

    // Backspacing used to round-trip through the form, parse as invalid and blank the field.
    await user.type(input(), "{Backspace}")
    expect(input()).toHaveValue("26-08-202")

    await user.type(input(), "5")
    expect(input()).toHaveValue("26-08-2025")
  })

  it("inserts the format's separators while digits are typed", async () => {
    const user = userEvent.setup()
    const onDateChange = vi.fn()
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" onDateChange={onDateChange} />
      </Wrapper>
    )

    await user.type(input(), "26082026")

    expect(input()).toHaveValue("26-08-2026")
    expect(onDateChange).toHaveBeenLastCalledWith(new Date(2026, 7, 26))
  })

  it("accepts the natural short spelling and pads it", async () => {
    const user = userEvent.setup()
    const onDateChange = vi.fn()
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" onDateChange={onDateChange} />
      </Wrapper>
    )

    await user.type(input(), "1-8-2026")

    expect(input()).toHaveValue("01-08-2026")
    expect(onDateChange).toHaveBeenLastCalledWith(new Date(2026, 7, 1))
  })

  it("fires onDateChange once per committed change, not once per keystroke", async () => {
    const user = userEvent.setup()
    const onDateChange = vi.fn()
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" onDateChange={onDateChange} />
      </Wrapper>
    )

    await user.type(input(), "26082026")

    // Nine keystrokes produced exactly one real value. It used to be two calls per keystroke.
    expect(onDateChange).toHaveBeenCalledTimes(1)
  })

  it("does not push a half-typed date into the form", async () => {
    const user = userEvent.setup()
    let formValue: unknown
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
        <FormValueProbe onValue={(v) => (formValue = v)} />
      </Wrapper>
    )

    await user.type(input(), "{Backspace}")

    // Untouched: half-typed text is not a value, so the stored date survives the edit.
    expect(formValue).toBe("2026-08-26")
  })

  it("restores the committed value when an unparseable draft is abandoned", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )

    await user.type(input(), "{Backspace}{Backspace}")
    expect(input()).toHaveValue("26-08-20")

    await user.tab()
    expect(input()).toHaveValue("26-08-2026")
  })

  it("stops at the format's width", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )

    await user.type(input(), "260820269999")
    expect(input()).toHaveValue("26-08-2026")
  })

  it("does not offer browser form-history suggestions in place of the calendar", () => {
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )
    expect(input()).toHaveAttribute("autocomplete", "off")
    expect(input()).toHaveAttribute("inputmode", "numeric")
  })
})

describe("IGRPDatePickerInputSingle — clearing", () => {
  it("empties both the text and the form value", async () => {
    const user = userEvent.setup()
    let formValue: unknown = "unset"
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
        <FormValueProbe onValue={(v) => (formValue = v)} />
      </Wrapper>
    )

    await user.click(screen.getByLabelText("Limpar data"))

    expect(input()).toHaveValue("")
    // `null`, not `undefined` — react-hook-form resurrects an `undefined` field's default.
    expect(formValue).toBeNull()
  })

  it("stays empty after the field re-renders", async () => {
    const user = userEvent.setup()
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )

    await user.click(screen.getByLabelText("Limpar data"))
    await user.tab()

    expect(input()).toHaveValue("")
  })

  it("clears when the text is deleted by hand", async () => {
    const user = userEvent.setup()
    let formValue: unknown = "unset"
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
        <FormValueProbe onValue={(v) => (formValue = v)} />
      </Wrapper>
    )

    await user.clear(input())

    expect(input()).toHaveValue("")
    expect(formValue).toBeNull()
  })

  it("clears a controlled standalone picker", async () => {
    const user = userEvent.setup()
    function Host() {
      const [date, setDate] = useState<Date | undefined>(new Date(2026, 7, 26))
      return <IGRPDatePickerInputSingle name="d" date={date} onDateChange={setDate} />
    }
    render(<Host />)

    expect(input()).toHaveValue("26-08-2026")
    await user.click(screen.getByLabelText("Limpar data"))
    expect(input()).toHaveValue("")
  })
})

describe("IGRPDatePickerInputSingle — calendar affordance", () => {
  it("keeps the calendar button reachable once a date is set", () => {
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )
    // The trigger used to be replaced by the clear button, orphaning the popover.
    expect(calendarTrigger()).not.toBeNull()
    expect(screen.getByLabelText("Limpar data")).toBeInTheDocument()
  })

  it("gives the input and the calendar distinct ids", () => {
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>
    )
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("wires validation state onto the input itself", async () => {
    render(
      <Wrapper defaultValues={{}}>
        <IGRPDatePickerInputSingle name="d" label="Data" helperText="Ajuda" />
      </Wrapper>
    )
    expect(input()).toHaveAttribute("aria-describedby")
  })
})

describe("IGRPDatePickerSingle", () => {
  it("stops displaying the date it was told to clear", async () => {
    const user = userEvent.setup()
    let formValue: unknown = "unset"
    render(
      <Wrapper defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerSingle name="d" label="Data" />
        <FormValueProbe onValue={(v) => (formValue = v)} />
      </Wrapper>
    )

    expect(screen.getByText("26-08-2026")).toBeInTheDocument()

    await user.click(screen.getByLabelText("Limpar data"))

    expect(screen.queryByText("26-08-2026")).not.toBeInTheDocument()
    expect(screen.getByText("Selecionar data")).toBeInTheDocument()
    expect(formValue).toBeNull()
  })

  it("clears a controlled standalone picker", async () => {
    const user = userEvent.setup()
    function Host() {
      const [date, setDate] = useState<Date | undefined>(new Date(2026, 7, 26))
      return <IGRPDatePickerSingle name="d" date={date} onDateChange={setDate} />
    }
    render(<Host />)

    expect(screen.getByText("26-08-2026")).toBeInTheDocument()
    await user.click(screen.getByLabelText("Limpar data"))
    expect(screen.getByText("Selecionar data")).toBeInTheDocument()
  })

  it("defaults its placeholder to the pt-PT catalog", () => {
    render(<IGRPDatePickerSingle name="d" date={undefined} onDateChange={() => {}} />)
    expect(screen.getByText("Selecionar data")).toBeInTheDocument()
  })
})

describe("IGRPCalendarSingle", () => {
  it("deselects when a controlled parent passes no date", () => {
    const month = new Date(2026, 7, 1)
    const selected = () => document.querySelector("[data-selected-single='true'], [aria-selected='true']")

    const { rerender } = render(
      <IGRPCalendarSingle month={month} date={new Date(2026, 7, 26)} onDateChange={() => {}} />
    )
    expect(selected()).not.toBeNull()

    // `date ?? ownDate` made this impossible once an internal selection existed.
    rerender(<IGRPCalendarSingle month={month} date={undefined} onDateChange={() => {}} />)
    expect(selected()).toBeNull()
  })
})
