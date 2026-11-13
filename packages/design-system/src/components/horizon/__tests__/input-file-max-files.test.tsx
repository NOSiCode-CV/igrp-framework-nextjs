import { describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

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
