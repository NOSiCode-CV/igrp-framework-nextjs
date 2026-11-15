/**
 * Regression tests for three IGRPFormList defects found in review:
 * item 0 could not be collapsed, the remove button rendered on a list that
 * refused to shrink, and standalone mode re-keyed rows on every removal.
 */
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPFormList } from "../form/form-list.js"

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

describe("IGRPFormList standalone without defaultItem", () => {
  it("still passes renderItem an onChange that writes the edit", async () => {
    const user = userEvent.setup()
    function NoDefault() {
      const [items, setItems] = useState<Item[]>([{ label: "um" }])
      return (
        <>
          <output>{items[0]?.label}</output>
          <IGRPFormList<Item>
            id="things"
            label="Things"
            value={items}
            onChange={setItems}
            computeLabel={(item) => item.label}
            renderItem={(item, _index, onChange) => (
              <input aria-label="field" value={item.label} onChange={(e) => onChange?.({ label: e.target.value })} />
            )}
          />
        </>
      )
    }
    render(<NoDefault />)
    await settle()

    await user.type(screen.getByLabelText("field"), "x")
    expect(screen.getByRole("status")).toHaveTextContent("umx")
  })
})

describe("IGRPFormList standalone keys for rows supplied from outside", () => {
  it("keeps each row's own subtree when the first external row is removed", async () => {
    const user = userEvent.setup()
    function External() {
      const [items, setItems] = useState<Item[]>([])
      return (
        <>
          <button type="button" onClick={() => setItems([{ label: "a" }, { label: "b" }, { label: "c" }])}>
            load
          </button>
          <IGRPFormList<Item>
            id="things"
            label="Things"
            value={items}
            onChange={setItems}
            defaultItem={{ label: "novo" }}
            allowEmpty
            allowMultipleOpen
            computeLabel={(item) => item.label}
            renderItem={(item) => <input aria-label={`field-${item.label}`} defaultValue={item.label} />}
          />
        </>
      )
    }
    render(<External />)
    await user.click(screen.getByRole("button", { name: "load" }))
    await settle()

    await user.click(screen.getByRole("button", { name: "b" }))
    await settle()
    const b = screen.getByLabelText("field-b")
    await user.clear(b)
    await user.type(b, "editado")

    await user.click(screen.getByRole("button", { name: "Remover item 1" }))
    await settle()

    expect(screen.queryByLabelText("field-a")).toBeNull()
    expect(screen.getByLabelText("field-b")).toHaveValue("editado")
  })
})

describe("IGRPFormList padded keys after a remove", () => {
  it("gives an externally appended row a fresh key instead of reusing a stored padded one", async () => {
    const user = userEvent.setup()
    const errors = vi.spyOn(console, "error").mockImplementation(() => {})
    function External() {
      const [items, setItems] = useState<Item[]>([])
      return (
        <>
          <button type="button" onClick={() => setItems([{ label: "a" }, { label: "b" }, { label: "c" }])}>
            load
          </button>
          <button type="button" onClick={() => setItems((prev) => [...prev, { label: "d" }])}>
            append
          </button>
          <IGRPFormList<Item>
            id="things"
            label="Things"
            value={items}
            onChange={setItems}
            defaultItem={{ label: "novo" }}
            allowEmpty
            allowMultipleOpen
            computeLabel={(item) => item.label}
            renderItem={(item) => <input aria-label={`field-${item.label}`} defaultValue={item.label} />}
          />
        </>
      )
    }
    try {
      render(<External />)
      await user.click(screen.getByRole("button", { name: "load" }))
      await settle()
      await user.click(screen.getByRole("button", { name: "Remover item 1" }))
      await settle()
      await user.click(screen.getByRole("button", { name: "append" }))
      await settle()

      expect(["b", "c", "d"].map((label) => screen.getAllByRole("button", { name: label }).length)).toEqual([1, 1, 1])
      expect(errors.mock.calls.flat().join(" ")).not.toMatch(/same key/)
    } finally {
      errors.mockRestore()
    }
  })
})
