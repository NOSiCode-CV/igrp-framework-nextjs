import { describe, expect, it, vi } from "vitest"
import { createRef } from "react"
import { render, screen } from "@testing-library/react"
import { z } from "zod"

import { IGRPForm, type IGRPFormHandle } from "../form/index.js"
import { IGRPCheckbox } from "../input/checkbox.js"
import { IGRPSwitch } from "../input/switch.js"
import { IGRPInputColor } from "../input/color.js"

const schema = z.object({ a: z.boolean(), b: z.boolean(), c: z.string() })

describe("form-bound error override", () => {
  it("shows the `error` prop as the message on checkbox, switch and color", () => {
    render(
      <IGRPForm
        schema={schema}
        formRef={createRef<IGRPFormHandle<typeof schema>>()}
        onSubmit={vi.fn()}
        defaultValues={{ a: false, b: false, c: "" }}
      >
        <IGRPCheckbox name="a" label="A" error="Erro A" />
        <IGRPSwitch name="b" label="B" error="Erro B" />
        <IGRPInputColor name="c" label="C" error="Erro C" />
      </IGRPForm>
    )

    expect(screen.getByText("Erro A")).toBeInTheDocument()
    expect(screen.getByText("Erro B")).toBeInTheDocument()
    expect(screen.getByText("Erro C")).toBeInTheDocument()
  })
})
