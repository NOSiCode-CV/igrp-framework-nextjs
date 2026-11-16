"use client"

import { useState, useEffect, useRef, useCallback, useId } from "react"
import Image from "next/image"

import { cn } from "cn"
import { ScrollArea } from "../primitives/scroll-area.js"
import { IGRPButton } from "./button.js"
import { IGRPInputText } from "./input/text.js"
import { IGRPIcon } from "./icon/index.js"
import { useIGRPi18n } from "../../i18n/index.js"

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
  /**
   * Content type for rendering. Unset renders as text; `"button"` renders a button
   * whose click calls `IGRPChat`'s `onAction` (a no-op without it).
   */
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
  /**
   * API endpoint for POST requests: receives `{ messages }`, returns `{ messages }`.
   * Used when `onSend` is not given.
   */
  apiEndpoint?: string
  /**
   * Sends the conversation (including the new user message) and resolves with the
   * reply messages. Replaces the default POST to `apiEndpoint`. A rejection shows
   * the catalog error message in the transcript.
   */
  onSend?: (messages: IGRPChatMessage[]) => Promise<IGRPChatMessage[]>
  /** Messages shown when the chat mounts. */
  initialMessages?: IGRPChatMessage[]
  /** Renders a message's bubble content in place of the built-in text/image/link/button renderers. */
  renderMessage?: (message: IGRPChatMessage) => React.ReactNode
  /** Called when the user clicks a `type: "button"` message. Without it the button does nothing. */
  onAction?: (message: IGRPChatMessage) => void
  /** Placeholder text when there are no messages. */
  labelDescription?: string
  /** HTML name attribute. */
  name?: string
  /** HTML id attribute. */
  id?: string
}

/**
 * POSTs the conversation and returns the reply, or why it failed. Never throws:
 * a rejected fetch (offline, DNS, CORS, aborted request) used to escape as an
 * unhandled rejection and leave the composer disabled for the rest of the session.
 * Module scope so the component has no try/catch, which the React Compiler cannot lower.
 */
async function fetchChatReply(
  apiEndpoint: string,
  messages: IGRPChatMessage[]
): Promise<{ messages: IGRPChatMessage[] } | { error: string }> {
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    })
    if (!response.ok) return { error: `request failed with status ${response.status}` }

    const data = await response.json()
    if (!data.messages || !Array.isArray(data.messages)) return { error: "invalid response format" }

    return { messages: withIds(data.messages as IGRPChatMessage[]) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "request failed" }
  }
}

const withIds = (messages: IGRPChatMessage[]) =>
  messages.map((m, i) => ({ ...m, id: m.id ?? `msg-${Date.now()}-${i}` }))

/**
 * Runs the `onSend` adapter, or the default POST to `apiEndpoint`. Never throws,
 * like `fetchChatReply`; module scope for the same React Compiler reason.
 */
async function requestChatReply(
  onSend: IGRPChatProps["onSend"],
  apiEndpoint: string | undefined,
  messages: IGRPChatMessage[]
): Promise<{ messages: IGRPChatMessage[] } | { error: string }> {
  if (!onSend) {
    return apiEndpoint ? fetchChatReply(apiEndpoint, messages) : { error: "no onSend or apiEndpoint configured" }
  }
  try {
    const reply = await onSend(messages)
    if (!Array.isArray(reply)) return { error: "onSend did not resolve to an array" }
    return { messages: withIds(reply) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "onSend failed" }
  }
}

/**
 * Chat interface with message list, input, and API integration.
 * Sends user messages through `onSend` (or to `apiEndpoint`) and displays responses.
 */
function IGRPChat({
  apiEndpoint,
  onSend,
  initialMessages,
  renderMessage,
  onAction,
  labelDescription: labelDescriptionProp,
  name,
  id,
}: IGRPChatProps) {
  const i18n = useIGRPi18n()
  const labelDescription = labelDescriptionProp ?? i18n.chat.description
  const [messages, setMessages] = useState<IGRPChatMessage[]>(() => withIds(initialMessages ?? []))
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
      sender: i18n.chat.you,
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

    const result = await requestChatReply(onSend, apiEndpoint, [...messages, userMessage])
    if ("error" in result) {
      failWith(result.error)
    } else {
      setMessages((prev) => [...prev, ...result.messages])
    }
    setIsLoading(false)
  }, [apiEndpoint, onSend, input, isLoading, messages, i18n])

  const renderContent = (message: IGRPChatMessage) => {
    if (renderMessage) return renderMessage(message)
    if (message.type === "image") {
      return (
        <div className={cn("relative aspect-video min-h-[120px] w-full max-w-full")}>
          <Image
            src={message.content}
            alt={i18n.chat.sentContent}
            fill
            sizes="(max-width: 768px) 80vw, 400px"
            className={cn("rounded object-contain")}
            unoptimized
          />
        </div>
      )
    }
    if (message.type === "link") {
      return (
        <a href={message.content} className={cn("text-primary underline")} target="_blank" rel="noopener noreferrer">
          {message.content}
        </a>
      )
    }
    if (message.type === "button") {
      return <IGRPButton onClick={onAction ? () => onAction(message) : undefined}>{message.content}</IGRPButton>
    }
    return <p>{message.content}</p>
  }

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

              <div className={cn("max-w-[80%] rounded-lg bg-muted px-4 py-2")}>{renderContent(message)}</div>
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
