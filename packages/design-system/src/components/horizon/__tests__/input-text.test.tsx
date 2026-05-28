import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import { IGRPInputText } from "../input/text"

describe("IGRPInputText (standalone, no form context)", () => {
  it("renders the label and associates it with the input via id", () => {
    render(<IGRPInputText name="email" label="Email address" />)

    const input = screen.getByRole("textbox", { name: "Email address" })
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute("name", "email")
  })

  it("renders helper text with role=region and aria-live=polite when no error", () => {
    render(<IGRPInputText name="email" label="Email" helperText="We never share your email." />)

    const helper = screen.getByText("We never share your email.")
    expect(helper).toHaveAttribute("role", "region")
    expect(helper).toHaveAttribute("aria-live", "polite")
  })

  it("renders error message with role=alert and wires aria-invalid + aria-describedby", () => {
    render(<IGRPInputText name="email" label="Email" error="Invalid email" />)

    const input = screen.getByRole("textbox", { name: "Email" })
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(input).toHaveAttribute("aria-describedby", "email-error")

    const error = screen.getByRole("alert")
    expect(error).toHaveTextContent("Invalid email")
    expect(error).toHaveAttribute("id", "email-error")
  })

  it("hides helper text when an error is present", () => {
    render(<IGRPInputText name="email" label="Email" helperText="Helper" error="Bad" />)

    expect(screen.queryByText("Helper")).not.toBeInTheDocument()
    expect(screen.getByText("Bad")).toBeInTheDocument()
  })

  it("marks the input as required when the required prop is set", () => {
    render(<IGRPInputText name="email" label="Email" required />)

    const input = screen.getByRole("textbox", { name: /Email/ })
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("aria-required", "true")
  })
})
