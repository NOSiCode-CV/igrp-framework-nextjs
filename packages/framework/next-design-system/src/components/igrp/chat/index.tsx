'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

import { ScrollArea } from '@/components/primitives/scroll-area';
import { IGRPButton } from '@/components/igrp/button';
import { IGRPInputText } from '@/components/igrp/input';
import { IGRPIcon } from '@/components/igrp/icon';

import { cn } from '@/lib/utils';

interface IGRPChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'image' | 'link' | 'button';
  timestamp?: string;
  sender?: string;
}

interface IGRPChatProps {
  apiEndpoint: string;
  labelDescription?: string;
}

function IGRPChat({ apiEndpoint, labelDescription = 'Ask me anything!' }: IGRPChatProps) {
  const [messages, setMessages] = useState<IGRPChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: IGRPChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
      sender: 'You',
      type: 'text',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      if (!data.messages || !Array.isArray(data.messages))
        throw new Error('Invalid response format');

      setMessages((prev) => [...prev, ...data.messages]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Something went wrong. Please try again!',
          type: 'text',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, input, isLoading, messages]);

  return (
    <div className='flex flex-col h-full'>
      <ScrollArea className='pr-4 h-[80%]'>
        <div className='space-y-4'>
          {messages.length === 0 && (
            <div className='flex flex-col items-center justify-center h-40 text-muted-foreground'>
              <IGRPIcon
                iconName='Bot'
                className='h-12 w-12 mb-2 opacity-20'
              />
              <p>{labelDescription}</p>
            </div>
          )}
          {messages.map((message, i) => (
            <div
              key={i}
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
                  <IGRPIcon
                    iconName='User'
                    className='h-4 w-4 text-primary-foreground'
                  />
                ) : (
                  <IGRPIcon
                    iconName='Bot'
                    className='h-4 w-4'
                  />
                )}
              </div>

              <div className='rounded-lg px-4 py-2 max-w-[80%] bg-muted'>
                {message.type === 'text' && <p>{message.content} </p>}
                {message.type === 'image' && (
                  <img
                    src={message.content}
                    alt='Sent content'
                    className='max-w-full rounded'
                  />
                )}
                {message.type === 'link' && (
                  <a
                    href={message.content}
                    className='text-blue-500 underline'
                    target='_blank'
                    rel='noopener noreferrer'
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
        className='flex gap-2 mt-4 pt-4 border-t'
      >
        <IGRPInputText
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type your message...'
          disabled={isLoading}
          className='flex-1'
          type='text'
        />
        <IGRPButton
          type='submit'
          disabled={isLoading}
          size='icon'
          iconName={isLoading ? 'Loader' : 'Send'}
          iconClassName={isLoading ? 'animate-spin h-4 w-4' : 'h-4 w-4'}
        />
      </form>
    </div>
  );
}

export { IGRPChat, type IGRPChatProps, type IGRPChatMessage };
