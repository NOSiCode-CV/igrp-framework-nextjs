// Pinned to a UTC-N zone on purpose. The defect this file guards against — a date-only ISO
// string being read as UTC midnight and rendering as the previous day — cannot reproduce in
// UTC or east of Greenwich, where these assertions pass with or without the fix.
process.env.TZ = "Atlantic/Cape_Verde" // UTC-1

import { useRef } from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../../form"
import { IGRPDatePickerSingle } from "../date-picker/single"
import { IGRPDatePickerInputSingle } from "../date-picker/input-single"
import { IGRPDatePickerRange } from "../date-picker/range"
import { IGRPDatePickerMultiple } from "../date-picker/multiple"
import { toLocalDate, toLocalDateRange, toLocalDates } from "../../../../lib/calendar-utils"

// Guard the guard: if the runtime ignored the TZ assignment, every assertion below would
// pass vacuously and the suite would report false confidence.
describe("timezone fixture", () => {
  it("runs west of Greenwich", () => {
    expect(new Date("2026-08-26").getDate()).toBe(25)
  })
})

describe("toLocalDate", () => {
  it("reads a date-only ISO string as local midnight", () => {
    const d = toLocalDate("2026-08-26")!
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 8, 26])
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
  })

  it("passes a Date through unchanged", () => {
    const original = new Date(2026, 7, 26, 13, 45)
    expect(toLocalDate(original)).toBe(original)
  })

  it("leaves a string carrying a time untouched", () => {
    // An instant, not a calendar day — shifting it would be wrong.
    expect(toLocalDate("2026-08-26T10:30:00")!.getHours()).toBe(10)
  })

  it("returns undefined for empty, non-string and unparseable input", () => {
    expect(toLocalDate("")).toBeUndefined()
    expect(toLocalDate(undefined)).toBeUndefined()
    expect(toLocalDate(null)).toBeUndefined()
    expect(toLocalDate("not-a-date")).toBeUndefined()
  })

  it("maps both ends of a range and every entry of a list", () => {
    expect(toLocalDateRange({ from: "2026-08-26", to: "2026-08-28" })!.from.getDate()).toBe(26)
    expect(toLocalDateRange({ from: "2026-08-26", to: "2026-08-28" })!.to!.getDate()).toBe(28)
    expect(toLocalDates(["2026-08-26", "2026-08-28"])!.map((d) => d.getDate())).toEqual([26, 28])
  })
})

const singleSchema = z.object({ d: z.any() })
const rangeSchema = z.object({ r: z.any() })
const multipleSchema = z.object({ m: z.any() })

function Wrapper<S extends z.ZodType>({
  schema,
  defaultValues,
  children,
}: {
  schema: S
  defaultValues: z.input<S>
  children: React.ReactNode
}) {
  const formRef = useRef<IGRPFormHandle<S> | null>(null)
  return (
    <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={defaultValues}>
      {children}
    </IGRPForm>
  )
}

describe("date pickers render a date-only ISO form value on the correct day", () => {
  it("IGRPDatePickerSingle", () => {
    render(
      <Wrapper schema={singleSchema} defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerSingle name="d" label="Data" />
      </Wrapper>,
    )
    // The trigger is labelled by its <label>, so assert on the rendered text, not the name.
    expect(screen.getByText("26-08-2026")).toBeInTheDocument()
  })

  it("IGRPDatePickerInputSingle", () => {
    render(
      <Wrapper schema={singleSchema} defaultValues={{ d: "2026-08-26" }}>
        <IGRPDatePickerInputSingle name="d" label="Data" />
      </Wrapper>,
    )
    expect(screen.getByRole("textbox")).toHaveValue("26-08-2026")
  })

  it("IGRPDatePickerRange", () => {
    render(
      <Wrapper schema={rangeSchema} defaultValues={{ r: { from: "2026-08-26", to: "2026-08-28" } }}>
        <IGRPDatePickerRange name="r" label="Intervalo" />
      </Wrapper>,
    )
    expect(screen.getByText("26-08-2026 - 28-08-2026")).toBeInTheDocument()
  })

  it("IGRPDatePickerMultiple", () => {
    render(
      <Wrapper schema={multipleSchema} defaultValues={{ m: ["2026-08-26", "2026-08-28"] }}>
        <IGRPDatePickerMultiple name="m" label="Datas" />
      </Wrapper>,
    )
    expect(screen.getByText(/26-08-2026 - 28-08-2026/)).toBeInTheDocument()
  })
})
