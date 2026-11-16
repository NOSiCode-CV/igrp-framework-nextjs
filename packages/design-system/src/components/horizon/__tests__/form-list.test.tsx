import { StrictMode, useRef, useState } from "react"
import { describe, expect, it, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../form/index.js"
import { IGRPFormList } from "../form/form-list.js"
import { IGRPInputText } from "../input/text.js"

const schema = z.object({
  anexos: z.array(z.object({ idTipoDocumento: z.coerce.number(), url: z.string().optional() })).optional(),
})
type Schema = typeof schema

const STABLE_ITEM = { idTipoDocumento: 0, url: "" }

function Harness({
  defaultValues,
  allowEmpty,
  inlineDefaultItem = false,
  disabled,
}: {
  defaultValues?: z.input<Schema>
  allowEmpty?: boolean
  inlineDefaultItem?: boolean
  disabled?: boolean
}) {
  const formRef = useRef<IGRPFormHandle<Schema> | null>(null)
  const [stableItem] = useState(STABLE_ITEM)

  return (
    <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}} defaultValues={defaultValues} disabled={disabled}>
      <IGRPFormList
        id="anexos"
        label="Anexos"
        allowEmpty={allowEmpty}
        renderItem={(_, index: number) => <IGRPInputText name={`anexos.${index}.url`} label="URL" />}
        computeLabel={(_, index: number) => `Doc ${index + 1}`}
        defaultItem={inlineDefaultItem ? { idTipoDocumento: 0, url: "" } : stableItem}
      />
    </IGRPForm>
  )
}

const rowCount = () => screen.queryAllByText(/^Doc \d+$/).length
const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}

describe("IGRPFormList seeding in form mode", () => {
  it("seeds exactly one row when there are no defaultValues", async () => {
    render(<Harness />)
    await settle()
    expect(rowCount()).toBe(1)
  })

  // Regression: the seeding effect used to gate on the `fields` snapshot of its own render.
  // StrictMode re-invokes mount effects against that same snapshot, so it appended twice.
  it("seeds exactly one row under StrictMode (no duplicate append)", async () => {
    render(
      <StrictMode>
        <Harness />
      </StrictMode>
    )
    await settle()
    expect(rowCount()).toBe(1)
  })

  it("seeds exactly one row under StrictMode with an unstable defaultItem identity", async () => {
    render(
      <StrictMode>
        <Harness inlineDefaultItem />
      </StrictMode>
    )
    await settle()
    expect(rowCount()).toBe(1)
  })

  // Regression: IGRPForm's defaultValues sync used to re-apply defaults on mount, which runs
  // after child effects and wiped the seeded row, leaving an empty list that never re-seeded.
  it("seeds one row when defaultValues carry an explicitly empty array", async () => {
    render(<Harness defaultValues={{ anexos: [] }} />)
    await settle()
    expect(rowCount()).toBe(1)
  })

  it("keeps a single pre-filled row instead of adding a seeded one", async () => {
    render(<Harness defaultValues={{ anexos: [{ idTipoDocumento: 3, url: "a" }] }} />)
    await settle()
    expect(rowCount()).toBe(1)
  })

  it("renders every pre-filled row", async () => {
    render(
      <Harness
        defaultValues={{
          anexos: [
            { idTipoDocumento: 3, url: "a" },
            { idTipoDocumento: 4, url: "b" },
          ],
        }}
      />
    )
    await settle()
    expect(rowCount()).toBe(2)
  })

  it("stays empty when allowEmpty is set", async () => {
    render(<Harness defaultValues={{ anexos: [] }} allowEmpty />)
    await settle()
    expect(rowCount()).toBe(0)
  })

  it("stays empty under StrictMode when allowEmpty is set", async () => {
    render(
      <StrictMode>
        <Harness defaultValues={{ anexos: [] }} allowEmpty />
      </StrictMode>
    )
    await settle()
    expect(rowCount()).toBe(0)
  })
})

describe("IGRPFormList in a disabled IGRPForm", () => {
  it("disables the add button itself, not only through the fieldset", async () => {
    render(<Harness disabled />)
    await settle()
    expect(screen.getByRole("button", { name: /Adicionar/ })).toHaveAttribute("disabled")
  })
})

describe("IGRPFormList mode", () => {
  function InForm({ mode, onChange }: { mode?: "form" | "standalone"; onChange?: (items: unknown[]) => void }) {
    const formRef = useRef<IGRPFormHandle<Schema> | null>(null)
    return (
      <IGRPForm schema={schema} formRef={formRef} onSubmit={() => {}}>
        <IGRPFormList
          id="anexos"
          mode={mode}
          value={[STABLE_ITEM, STABLE_ITEM, STABLE_ITEM]}
          onChange={onChange}
          renderItem={() => null}
          computeLabel={(_, index: number) => `Doc ${index + 1}`}
          defaultItem={STABLE_ITEM}
        />
      </IGRPForm>
    )
  }

  it('honours value inside IGRPForm when mode="standalone"', async () => {
    render(<InForm mode="standalone" />)
    await settle()
    expect(rowCount()).toBe(3)
  })

  it("warns in development when value/onChange are passed in form mode", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<InForm onChange={() => {}} />)
    await settle()
    expect(rowCount()).toBe(1)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mode="standalone"'))
    warn.mockRestore()
  })
})
