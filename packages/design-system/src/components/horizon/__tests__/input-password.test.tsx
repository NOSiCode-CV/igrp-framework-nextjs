import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPInputPassword } from "../input/password"
import { IGRPI18nProvider } from "../../../i18n"

describe("IGRPInputPassword", () => {
  it("renders as type=password by default and toggles to type=text", async () => {
    render(<IGRPInputPassword name="pwd" label="Password" />)

    const input = screen.getByLabelText("Password") as HTMLInputElement
    expect(input.type).toBe("password")

    // Default pt-PT toggle label.
    const toggle = screen.getByRole("button", { name: "Mostrar palavra-passe" })
    await userEvent.click(toggle)

    expect(input.type).toBe("text")
    expect(screen.getByRole("button", { name: "Ocultar palavra-passe" })).toBeInTheDocument()
  })

  it("hides the visibility toggle when showPasswordToggle=false", () => {
    render(<IGRPInputPassword name="pwd" label="Password" showPasswordToggle={false} />)
    expect(screen.queryByRole("button", { name: /palavra-passe/ })).not.toBeInTheDocument()
  })

  it("calls onChange with the typed value", async () => {
    const onChange = vi.fn()
    render(<IGRPInputPassword name="pwd" label="Password" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText("Password"), "abc")
    expect(onChange).toHaveBeenLastCalledWith("abc")
  })

  it("uses overridden i18n strings when wrapped in IGRPI18nProvider", () => {
    render(
      <IGRPI18nProvider
        strings={{ inputPassword: { showPasswordLabel: "Show", hidePasswordLabel: "Hide" } }}
      >
        <IGRPInputPassword name="pwd" label="Password" />
      </IGRPI18nProvider>,
    )

    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument()
  })

  it("renders an error message and marks the input invalid", () => {
    render(<IGRPInputPassword name="pwd" label="Password" error="Too short" />)

    const input = screen.getByLabelText("Password")
    expect(input).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("Too short")
  })
})
