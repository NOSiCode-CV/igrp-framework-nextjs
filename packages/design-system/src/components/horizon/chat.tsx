"use client"

import { useState, useEffect, useRef, useCallback, useId } from "react"
import Image from "next/image"

import { cn } from "cn"
import { ScrollArea } from "../primitives/scroll-area"
import { IGRPButton } from "./button"
import { IGRPInputText } from "./input/text"
import { IGRPIcon } from "./icon"
import { useIGRPi18n } from "../../i18n"

/**
 * Chat message shape for IGRPChat.
 * @see IGRPChat
 */
interface IGRPChatMessage {
  /** Unique message id for React keys. */
  id?: string
  /** Message role. */
  role: "user" | "assistant" | "system"
  /** Message content (text or URL depending on type). */
  content: string
  /** Content type for rendering. */
  type?: "text" | "image" | "link" | "button"
  /** ISO timestamp. */
  timestamp?: string
  /** Sender display name. */
  sender?: string
}

/**
 * Props for the IGRPChat component.
 * @see IGRPChat
 */
interface IGRPChatProps {
  /** API endpoint for POST requests (receives messages, returns new messages). */
  apiEndpoint: string
  /** Placeholder text when there are no messages. */
  labelDescription?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
}

/**
 * Chat interface with message list, input, and API integration.
 * Sends user messages to the endpoint and displays responses.
 */
function IGRPChat({ apiEndpoint, labelDescription = "Ask me anything!", name, id }: IGRPChatProps) {
  const i18n = useIGRPi18n()
  const [messages, setMessages] = useState<IGRPChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const _id = useId()
  const ref = name ?? id ?? _id

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: IGRPChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
      sender: "You",
      type: "text",
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const failWith = (reason: string) => {
      console.error(`IGRPChat: ${reason}`)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: i18n.chat.errorMessage,
          type: "text",
          timestamp: new Date().toISOString(),
        },
      ])
    }

    // Every exit path has to clear `isLoading`. A rejected fetch (offline, DNS,
    // CORS, aborted request) used to escape as an unhandled rejection and leave
    // the composer disabled for the rest of the session.
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) {
        failWith(`request failed with status ${response.status}`)
        return
      }

      const data = await response.json()
      if (!data.messages || !Array.isArray(data.messages)) {
        failWith("invalid response format")
        return
      }

      const newMessages = (data.messages as IGRPChatMessage[]).map((m, i) => ({
        ...m,
        id: m.id ?? `msg-${Date.now()}-${i}`,
      }))
      setMessages((prev) => [...prev, ...newMessages])
    } catch (error) {
      failWith(error instanceof Error ? error.message : "request failed")
    } finally {
      setIsLoading(false)
    }
  }, [apiEndpoint, input, isLoading, messages, i18n])

  return (
    <div className={cn("flex h-full flex-col")} id={ref}>
      <ScrollArea className={cn("h-[80%] pr-4")}>
        <div className={cn("flex flex-col gap-4")} aria-live="polite" aria-atomic="false">
          {messages.length === 0 && (
            <div className={cn("flex h-40 flex-col items-center justify-center text-muted-foreground")}>
              <IGRPIcon iconName="Bot" className={cn("mb-2 size-12 opacity-20")} />
              <p>{labelDescription}</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id ?? `${message.timestamp}-${message.content.slice(0, 20)}`}
              className={cn("flex items-start gap-2", message.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <div className={cn("shrink-0 rounded-full p-2", message.role === "user" ? "bg-primary" : "bg-muted")}>
                {message.role === "user" ? (
                  <IGRPIcon iconName="User" className={cn("size-4 text-primary-foreground")} />
                ) : (
                  <IGRPIcon iconName="Bot" className={cn("size-4")} />
                )}
              </div>

              <div className={cn("max-w-[80%] rounded-lg bg-muted px-4 py-2")}>
                {message.type === "text" && <p>{message.content} </p>}
                {message.type === "image" && (
                  <div className={cn("relative aspect-video min-h-[120px] w-full max-w-full")}>
                    <Image
                      src={message.content}
                      alt="Sent content"
                      fill
                      sizes="(max-width: 768px) 80vw, 400px"
                      className={cn("rounded object-contain")}
                      unoptimized
                    />
                  </div>
                )}
                {message.type === "link" && (
                  <a
                    href={message.content}
                    className={cn("text-primary underline")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {message.content}
                  </a>
                )}
                {message.type === "button" && <IGRPButton>{message.content}</IGRPButton>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          sendMessage()
        }}
        className={cn("mt-4 flex gap-2 border-t pt-4")}
      >
        <IGRPInputText
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={i18n.chat.messagePlaceholder}
          disabled={isLoading}
          className={cn("flex-1")}
          type="text"
        />
        <IGRPButton
          type="submit"
          disabled={isLoading}
          aria-label={i18n.chat.sendMessage}
          size="icon"
          iconName={isLoading ? "Loader" : "Send"}
          iconClassName={cn(isLoading ? "size-4 animate-spin motion-reduce:animate-none" : "size-4")}
        />
      </form>
    </div>
  )
}

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage }
