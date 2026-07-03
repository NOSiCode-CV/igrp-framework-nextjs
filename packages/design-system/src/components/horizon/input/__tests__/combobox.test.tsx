import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IGRPCombobox } from "../combobox"

const options = [
  { label: "Alpha", value: "a" },
  { label: "Beta", value: "b" },
]

describe("IGRPCombobox uncontrolled mode", () => {
  it("persists the selected option label when used without a value prop", async () => {
    render(<IGRPCombobox name="x" options={options} placeholder="Pick one" />)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(screen.getByText("Alpha"))
    expect(screen.getByRole("combobox")).toHaveTextContent("Alpha")
  })
})
