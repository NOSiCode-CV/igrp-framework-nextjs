/**
 * Fields detect a form the same way (react-hook-form's context, so any
 * FormProvider works) and honour a caller-supplied `error` the same way.
 * form-list used to need IGRPForm specifically, and the date pickers accepted
 * `error` but never rendered it.
 */
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { FormProvider, useForm } from "react-hook-form"

import { IGRPFormList } from "../form/form-list.js"
import { IGRPDatePickerSingle } from "../input/date-picker/single.js"

function PlainForm({ children }: { children: React.ReactNode }) {
  const form = useForm({ defaultValues: { itens: [{ nome: "a" }, { nome: "b" }], data: null } })
  return <FormProvider {...form}>{children}</FormProvider>
}

describe("IGRPFormList under a plain FormProvider", () => {
  it("binds to the form's array", () => {
    render(
      <PlainForm>
        <IGRPFormList
          id="itens"
          label="Itens"
          renderItem={() => null}
          computeLabel={(_, index: number) => `Item ${index + 1}`}
        />
      </PlainForm>
    )
    expect(screen.getAllByText(/^Item \d+$/)).toHaveLength(2)
  })
})

describe("IGRPDatePickerSingle error prop", () => {
  it("renders the caller's error in a form", () => {
    render(
      <PlainForm>
        <IGRPDatePickerSingle name="data" label="Data" helperText="Ajuda" error="Data inválida" />
      </PlainForm>
    )
    expect(screen.getByText("Data inválida")).toBeInTheDocument()
    expect(screen.queryByText("Ajuda")).toBeNull()
  })

  it("renders the caller's error standalone and describes the control with it", () => {
    render(<IGRPDatePickerSingle label="Data" helperText="Ajuda" error="Data inválida" onDateChange={() => {}} />)
    const message = screen.getByText("Data inválida")
    expect(message.id).toMatch(/-error$/)
    expect(document.querySelector(`[aria-describedby="${message.id}"]`)).not.toBeNull()
    expect(screen.queryByText("Ajuda")).toBeNull()
  })
})
