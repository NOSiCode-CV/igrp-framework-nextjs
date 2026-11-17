import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { FieldError } from "../field.js"

describe("FieldError", () => {
  it("renders nothing without errors or children", () => {
    render(<FieldError errors={[]} />)
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows a single (deduplicated) error as plain text", () => {
    render(<FieldError errors={[{ message: "Obrigatório" }, { message: "Obrigatório" }]} />)
    expect(screen.getByRole("alert")).toHaveTextContent("Obrigatório")
    expect(screen.queryByRole("list")).toBeNull()
  })

  it("lists distinct errors", () => {
    render(<FieldError errors={[{ message: "Curto" }, { message: "Inválido" }, { message: "Curto" }]} />)
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["Curto", "Inválido"])
  })

  it("prefers children over errors", () => {
    render(<FieldError errors={[{ message: "Curto" }]}>Personalizado</FieldError>)
    expect(screen.getByRole("alert")).toHaveTextContent("Personalizado")
  })
})
