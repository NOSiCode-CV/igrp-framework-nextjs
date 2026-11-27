import { describe, expect, it } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { FormProvider, useForm } from "react-hook-form"

import { IGRPDateTimeInput } from "../input/date-time.js"

function Harness() {
  const form = useForm<{ when: string | null }>({ defaultValues: { when: null } })
  return (
    <FormProvider {...form}>
      <IGRPDateTimeInput name="when" label="Quando" />
    </FormProvider>
  )
}

describe("IGRPDateTimeInput in a form", () => {
  it("formats the first input when the field value is null", () => {
    render(<Harness />)
    const input = screen.getByLabelText("Quando") as HTMLInputElement

    fireEvent.change(input, { target: { value: "120320251030" } })

    expect(input.value).toBe("12/03/2025, 10:30")
  })
})
