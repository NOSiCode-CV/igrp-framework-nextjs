import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { Decorator } from '@storybook/nextjs-vite';
import { IGRPChat } from '@igrp/igrp-framework-react-design-system';

/**
 * IGRPChat POSTs the conversation to `apiEndpoint` and expects `{ messages: IGRPChatMessage[] }` back.
 * This decorator mocks `window.fetch` so the stories are interactive without a real backend —
 * it echoes a canned assistant reply for any request to the demo endpoint.
 */
const withMockedFetch: Decorator = (Story) => {
  const originalFetch = window.fetch;
  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/storybook-chat-demo')) {
      const body = init?.body ? JSON.parse(init.body as string) : { messages: [] };
      const last = body.messages?.[body.messages.length - 1]?.content ?? '';
      return new Response(
        JSON.stringify({
          messages: [
            {
              role: 'assistant',
              type: 'text',
              content: `You said: "${last}". This is a mocked reply from the Storybook demo.`,
              timestamp: new Date().toISOString(),
              sender: 'Assistant',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return originalFetch(input, init);
  }) as typeof window.fetch;

  return (
    <div className='h-[500px] w-full max-w-lg rounded-lg border p-4'>
      <Story />
    </div>
  );
};

const meta = {
  title: 'Components/Chat',
  component: IGRPChat,
  decorators: [withMockedFetch],
  argTypes: {
    apiEndpoint: { control: 'text' },
    labelDescription: { control: 'text' },
  },
} satisfies Meta<typeof IGRPChat>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Interactive chat — type a message and the mocked endpoint echoes a reply. */
export const Default: Story = {
  args: {
    apiEndpoint: '/storybook-chat-demo',
  },
};

/** Empty state with a custom placeholder prompt. */
export const CustomPlaceholder: Story = {
  args: {
    apiEndpoint: '/storybook-chat-demo',
    labelDescription: 'How can I help you today?',
  },
};
