'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Image from 'next/image';

import { cn } from '../../lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { IGRPButton } from './button';
import { IGRPInputText } from './input/text';
import { IGRPIcon } from './icon';

/**
 * Chat message shape for IGRPChat.
 * @see IGRPChat
 */
interface IGRPChatMessage {
  /** Unique message id for React keys. */
  id?: string;
  /** Message role. */
  role: 'user' | 'assistant' | 'system';
  /** Message content (text or URL depending on type). */
  content: string;
  /** Content type for rendering. */
  type?: 'text' | 'image' | 'link' | 'button';
  /** ISO timestamp. */
  timestamp?: string;
  /** Sender display name. */
  sender?: string;
}

/**
 * Props for the IGRPChat component.
 * @see IGRPChat
 */
interface IGRPChatProps {
  /** API endpoint for POST requests (receives messages, returns new messages). */
  apiEndpoint: string;
  /** Placeholder text when there are no messages. */
  labelDescription?: string;
  /** HTML name attribute. */
  name?: string;
  /** HTML id attribute. */
  id?: string;
}

/**
 * Chat interface with message list, input, and API integration.
 * Sends user messages to the endpoint and displays responses.
 */
function IGRPChat({ apiEndpoint, labelDescription = 'Ask me anything!', name, id }: IGRPChatProps) {
  const [messages, setMessages] = useState<IGRPChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const _id = useId();
  const ref = name ?? id ?? _id;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: IGRPChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      sender: 'You',
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!response.ok) {
      console.error('Error: Failed to get response');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Something went wrong. Please try again!',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    const data = await response.json();
    if (!data.messages || !Array.isArray(data.messages)) {
      console.error('Error: Invalid response format');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'system',
          content: 'Something went wrong. Please try again!',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    const newMessages = (data.messages as IGRPChatMessage[]).map((m, i) => ({
      ...m,
      id: m.id ?? `msg-${Date.now()}-${i}`,
    }));
    setMessages((prev) => [...prev, ...newMessages]);
    setIsLoading(false);
  }, [apiEndpoint, input, isLoading, messages]);

  return (
    <div className={cn('flex flex-col h-full')} id={ref}>
      <ScrollArea className={cn('pr-4 h-[80%]')}>
        <div className={cn('space-y-4')}>
          {messages.length === 0 && (
            <div
              className={cn('flex flex-col items-center justify-center h-40 text-muted-foreground')}
            >
              <IGRPIcon iconName="Bot" className={cn('size-12 mb-2 opacity-20')} />
              <p>{labelDescription}</p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id ?? `${message.timestamp}-${message.content.slice(0, 20)}`}
              className={cn(
                'flex items-start space-x-2',
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row',
              )}
            >
              <div
                className={cn(
                  'shrink-0 rounded-full p-2',
                  message.role === 'user' ? 'bg-primary' : 'bg-muted',
                )}
              >
                {message.role === 'user' ? (
                  <IGRPIcon iconName="User" className={cn('h-4 w-4 text-muted-foreground')} />
                ) : (
                  <IGRPIcon iconName="Bot" className={cn('h-4 w-4')} />
                )}
              </div>

              <div className={cn('rounded-lg px-4 py-2 max-w-[80%] bg-muted')}>
                {message.type === 'text' && <p>{message.content} </p>}
                {message.type === 'image' && (
                  <div className={cn('relative w-full max-w-full min-h-[120px] aspect-video')}>
                    <Image
                      src={message.content}
                      alt="Sent content"
                      fill
                      sizes="(max-width: 768px) 80vw, 400px"
                      className={cn('object-contain rounded')}
                      unoptimized
                    />
                  </div>
                )}
                {message.type === 'link' && (
                  <a
                    href={message.content}
                    className={cn('text-blue-500 underline')}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {message.content}
                  </a>
                )}
                {message.type === 'button' && <IGRPButton>{message.content}</IGRPButton>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
        className={cn('flex gap-2 mt-4 pt-4 border-t')}
      >
        <IGRPInputText
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className={cn('flex-1')}
          type="text"
        />
        <IGRPButton
          type="submit"
          disabled={isLoading}
          size="icon"
          iconName={isLoading ? 'Loader' : 'Send'}
          iconClassName={cn(isLoading ? 'animate-spin h-4 w-4' : 'h-4 w-4')}
        />
      </form>
    </div>
  );
}

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage };
