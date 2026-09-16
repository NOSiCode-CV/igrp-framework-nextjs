/**
 * Regression tests for three IGRPFormList defects found in review:
 * item 0 could not be collapsed, the remove button rendered on a list that
 * refused to shrink, and standalone mode re-keyed rows on every removal.
 */
import { useState } from "react"
import { describe, expect, it } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPFormList } from "../form/form-list"

type Item = { label: string }

const settle = async () => {
  await act(async () => {
    await Promise.resolve()
  })
}

function Standalone({
  initial,
  allowEmpty,
  allowMultipleOpen,
}: {
  initial: Item[]
  allowEmpty?: boolean
  allowMultipleOpen?: boolean
}) {
  const [items, setItems] = useState<Item[]>(initial)

  return (
    <IGRPFormList<Item>
      id="things"
      label="Things"
      value={items}
      onChange={setItems}
      defaultItem={{ label: "novo" }}
      allowEmpty={allowEmpty}
      allowMultipleOpen={allowMultipleOpen}
      computeLabel={(item) => item.label}
      renderItem={(item) => <input aria-label={`field-${item.label}`} defaultValue={item.label} />}
    />
  )
}

/** Radix marks the open accordion item's trigger with aria-expanded. */
const expandedLabels = () =>
  screen
    .queryAllByRole("button", { expanded: true })
    .map((button) => button.textContent?.trim())
    .filter(Boolean)

describe("IGRPFormList accordion open state", () => {
  it("lets the user collapse the first item instead of springing it back open", async () => {
    const user = userEvent.setup()
    render(<Standalone initial={[{ label: "um" }, { label: "dois" }]} />)
    await settle()

    expect(expandedLabels()).toEqual(["um"])

    await user.click(screen.getByRole("button", { name: "um" }))
    await settle()

    expect(expandedLabels()).toEqual([])
  })

  it("lets the user collapse every item in multi-open mode", async () => {
    const user = userEvent.setup()
    render(<Standalone initial={[{ label: "um" }, { label: "dois" }]} allowMultipleOpen />)
    await settle()

    expect(expandedLabels()).toEqual(["um"])

    await user.click(screen.getByRole("button", { name: "um" }))
    await settle()

    expect(expandedLabels()).toEqual([])
  })
})

describe("IGRPFormList remove affordance", () => {
  it("hides the remove button on the last item when the list cannot go empty", async () => {
    render(<Standalone initial={[{ label: "um" }]} />)
    await settle()

    expect(screen.queryByRole("button", { name: /Remover item/ })).toBeNull()
  })

  it("shows the remove button on the last item when the list may go empty", async () => {
    render(<Standalone initial={[{ label: "um" }]} allowEmpty />)
    await settle()

    expect(screen.getByRole("button", { name: "Remover item 1" })).toBeInTheDocument()
  })

  it("gives each remove button a position-specific accessible name", async () => {
    render(<Standalone initial={[{ label: "um" }, { label: "dois" }]} />)
    await settle()

    expect(screen.getByRole("button", { name: "Remover item 1" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remover item 2" })).toBeInTheDocument()
  })
})

describe("IGRPFormList standalone item identity", () => {
  it("keeps surviving rows mounted when an earlier row is removed", async () => {
    const user = userEvent.setup()
    render(<Standalone initial={[{ label: "um" }, { label: "dois" }, { label: "tres" }]} allowMultipleOpen />)
    await settle()

    // Type into the third row, then delete the first. With index-based keys the
    // third row's subtree would be reconciled onto the second position and the
    // uncontrolled input would show the wrong value.
    for (const label of ["dois", "tres"]) {
      await user.click(screen.getByRole("button", { name: label }))
      await settle()
    }

    const third = screen.getByLabelText("field-tres")
    await user.clear(third)
    await user.type(third, "editado")
    expect(third).toHaveValue("editado")

    await user.click(screen.getByRole("button", { name: "Remover item 1" }))
    await settle()

    expect(screen.queryByLabelText("field-um")).toBeNull()
    expect(screen.getByLabelText("field-tres")).toHaveValue("editado")
  })
})
