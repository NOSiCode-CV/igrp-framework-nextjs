import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { IGRPChat, type IGRPChatMessage } from "../chat.js"

describe("IGRPChat", () => {
  it("renders initialMessages; an untyped reply is text and a button without onAction is text", () => {
    render(
      <IGRPChat
        initialMessages={[
          { role: "assistant", content: "Olá" },
          { role: "assistant", content: "Aceitar", type: "button" },
        ]}
      />
    )
    expect(screen.getByText("Olá")).toBeInTheDocument()
    expect(screen.getByText("Aceitar").tagName).toBe("P")
  })

  it("routes button messages to onAction", async () => {
    const onAction = vi.fn()
    const button: IGRPChatMessage = { id: "b", role: "assistant", content: "Aceitar", type: "button" }
    render(<IGRPChat initialMessages={[button]} onAction={onAction} />)
    await userEvent.click(screen.getByRole("button", { name: "Aceitar" }))
    expect(onAction).toHaveBeenCalledWith(button)
  })

  it("sends through the onSend adapter and renders the reply", async () => {
    const onSend = vi.fn(async (messages: IGRPChatMessage[]) => [
      { role: "assistant" as const, content: `eco: ${messages.at(-1)?.content}` },
    ])
    render(<IGRPChat onSend={onSend} />)
    await userEvent.type(screen.getByPlaceholderText("Escreva a sua mensagem…"), "teste{enter}")
    expect(await screen.findByText("eco: teste")).toBeInTheDocument()
    expect(onSend).toHaveBeenCalledOnce()
  })

  it("shows the catalog error when onSend rejects", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    render(<IGRPChat onSend={() => Promise.reject(new Error("x"))} />)
    await userEvent.type(screen.getByPlaceholderText("Escreva a sua mensagem…"), "teste{enter}")
    expect(await screen.findByText("Ocorreu um erro. Por favor tente novamente.")).toBeInTheDocument()
  })

  it("uses renderMessage for the bubble content", () => {
    render(
      <IGRPChat
        initialMessages={[{ role: "assistant", content: "Olá" }]}
        renderMessage={(m) => <mark>{m.content.toUpperCase()}</mark>}
      />
    )
    expect(screen.getByText("OLÁ").tagName).toBe("MARK")
  })
})
