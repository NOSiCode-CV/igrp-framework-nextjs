/**
 * Regression tests for three IGRPSelect defects found in review: the `value`
 * prop was write-once, the trigger label came from a non-reactive `getValues()`
 * read, and the in-dropdown search box lost every keystroke after the first to
 * Radix's typeahead.
 */
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../form"
import { IGRPSelect } from "../input/select"

const OPTIONS = [
  { label: "Praia", value: "praia" },
  { label: "Mindelo", value: "mindelo" },
  { label: "Assomada", value: "assomada" },
]

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

const trigger = () => screen.getByRole("combobox")

describe("IGRPSelect controlled value", () => {
  it("follows the value prop after mount", async () => {
    function Harness() {
      const [city, setCity] = useState("praia")
      return (
        <>
          <button onClick={() => setCity("mindelo")}>change</button>
          <IGRPSelect id="city" options={OPTIONS} value={city} placeholder="pick" />
        </>
      )
    }

    const user = userEvent.setup()
    render(<Harness />)
    await settle()
    expect(trigger()).toHaveTextContent("Praia")

    await user.click(screen.getByRole("button", { name: "change" }))
    await settle()

    expect(trigger()).toHaveTextContent("Mindelo")
  })
})

const schema = z.object({ city: z.string().optional() })

describe("IGRPSelect in form mode", () => {
  it("tracks the field when the form is updated from outside", async () => {
    const formRef = { current: null as IGRPFormHandle<typeof schema> | null }
    render(
      <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={{ city: "praia" }}>
        <IGRPSelect id="city" options={OPTIONS} placeholder="pick" />
      </IGRPForm>
    )
    await settle()
    expect(trigger()).toHaveTextContent("Praia")

    // setValue is the case that used to break: `getValues()` inside a useMemo is
    // not reactive, so the form moved on while the trigger kept the old label.
    await act(async () => {
      formRef.current?.setValue("city", "assomada")
    })
    await settle()
    expect(trigger()).toHaveTextContent("Assomada")

    await act(async () => {
      formRef.current?.reset({ city: "mindelo" })
    })
    await settle()
    expect(trigger()).toHaveTextContent("Mindelo")
  })
})

describe("IGRPSelect showSearch", () => {
  it("keeps every keystroke instead of losing them to Radix typeahead", async () => {
    const user = userEvent.setup()
    render(<IGRPSelect id="city" options={OPTIONS} placeholder="pick" showSearch />)
    await settle()

    await user.click(trigger())
    await settle()

    const search = screen.getByRole("textbox") as HTMLInputElement
    await user.type(search, "min")
    await settle()

    expect(search.value).toBe("min")
    expect(screen.queryAllByRole("option").map((option) => option.textContent)).toEqual(["Mindelo"])
  })

  it("does not render a heading for a group whose options are all filtered out", async () => {
    const grouped = [
      { label: "Praia", value: "praia", group: "Santiago" },
      { label: "Assomada", value: "assomada", group: "Santiago" },
      { label: "Mindelo", value: "mindelo", group: "São Vicente" },
    ]

    const user = userEvent.setup()
    render(<IGRPSelect id="city" options={grouped} placeholder="pick" showSearch showGroup />)
    await settle()

    await user.click(trigger())
    await settle()
    await user.type(screen.getByRole("textbox"), "mindelo")
    await settle()

    expect(screen.queryByText("Santiago")).toBeNull()
    expect(screen.getByText("São Vicente")).toBeInTheDocument()
  })
})
