import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useForm, type UseFormReturn } from "react-hook-form"

import { Form } from "../../primitives/form.js"

import { IGRPInputFile } from "../input/file.js"

const file = (name: string) => new File(["x"], name, { type: "text/plain" })

describe("IGRPInputFile maxFiles", () => {
  it("counts files already kept, rejecting the overflow of a later drop", async () => {
    const onFilesChange = vi.fn()
    const { container } = render(
      <IGRPInputFile name="f" variant="dropzone" multiple maxFiles={3} onFilesChange={onFilesChange} />
    )
    const input = () => container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input(), { target: { files: [file("a.txt"), file("b.txt")] } })
    await waitFor(() => expect(onFilesChange).toHaveBeenLastCalledWith([expect.any(File), expect.any(File)]))

    fireEvent.change(input(), { target: { files: [file("c.txt"), file("d.txt")] } })
    await waitFor(() => expect(onFilesChange.mock.lastCall?.[0]).toHaveLength(3))
    expect(onFilesChange.mock.lastCall?.[0].map((f: File) => f.name)).toEqual(["a.txt", "b.txt", "c.txt"])
    expect(screen.getByText(/d\.txt/)).toBeInTheDocument()
  })
})

describe("IGRPInputFile single file", () => {
  it("a fully rejected drop keeps the file already picked", async () => {
    const onFilesChange = vi.fn()
    const { container } = render(
      <IGRPInputFile name="f" variant="dropzone" maxSize={5} onFilesChange={onFilesChange} />
    )
    const input = () => container.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input(), { target: { files: [file("contrato.pdf")] } })
    await waitFor(() => expect(onFilesChange).toHaveBeenCalledTimes(1))

    fireEvent.change(input(), { target: { files: [new File(["far too big"], "grande.pdf")] } })
    await screen.findByText(/grande\.pdf/)
    expect(onFilesChange).toHaveBeenCalledTimes(1)
    expect(screen.getByText("contrato.pdf")).toBeInTheDocument()
  })

  it("form.reset() clears the file name the default input shows", async () => {
    let form!: UseFormReturn
    function Harness() {
      form = useForm()
      return (
        <Form {...form}>
          <IGRPInputFile name="f" label="F" />
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText("F") as HTMLInputElement

    await userEvent.upload(input, file("fatura.pdf"))
    expect(input.files).toHaveLength(1)

    act(() => form.reset())
    expect(form.getValues("f")).toBeUndefined()
    expect(input.value).toBe("")
    expect(input.files).toHaveLength(0)
  })
})
