import { IGRPCopyTo } from '@igrp/igrp-framework-react-design-system';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta = {
  title: "Components/CopyTo",
  component: IGRPCopyTo,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A copy-to-clipboard button component with visual feedback, toast notifications, and accessibility features.",
      },
    },
  },
  argTypes: {
    value: {
      control: "text",
      description: "The text content to copy to clipboard",
    },
    tooltipMessage: {
      control: "text",
      description: "The text tooltipMessage to copy to clipboard",
    },
    successMessage: {
      control: "text",
      description: "The text successMessage to copy to clipboard",
    },
    errorMessage: {
      control: "text",
      description: "The text errorMessage to error copy to clipboard",
    },
    triggerClassName: {
      control: "text",
      description: "The text triggerClassName",
    },
    tooltipDelayDuration: {
      control: { type: "number", min: 0, max: 20000, step: 1000 },
      description: "Delay before tooltip appears (in milliseconds)",
    },
    toastDuration: {
      control: { type: "number", min: 0, max: 20000, step: 1000 },
      description: "Delay before toastDuration appears (in milliseconds)",
    },

    onCopySuccess: {
      description: "Callback fired when copy succeeds",
    },
    onCopyError: {
      description: "Callback fired when copy fails",
    },
  },
  // args: {
  //   onCopySuccess: fn(),
  //   onCopyError: fn(),
  // },
} satisfies Meta<typeof IGRPCopyTo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: "Hello, World!",
  },
}

export const CustomMessages: Story = {
  args: {
    value: "npm install @igrp/components",
    tooltipMessage: "Copy command",
    successMessage: "Command copied!",
  },
}

export const LongText: Story = {
  args: {
    value:
      "This is a very long text that demonstrates how the copy button works with longer content. It includes multiple sentences and should still copy correctly to the clipboard without any issues.",
    tooltipMessage: "Copy long text",
  },
}

export const CodeSnippet: Story = {
  args: {
    value: `function greet(name: string) {
  return \`Hello, \${name}!\`;
}`,
    tooltipMessage: "Copy code",
    successMessage: "Code copied!",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
        <code className="flex-1">
          function greet(name: string) &#123;
          <br />
          &nbsp;&nbsp;return `Hello, $&#123;name&#125;!`;
          <br />
          &#125;
        </code>
        <Story />
      </div>
    ),
  ],
}

export const APIKey: Story = {
  args: {
    value: "sk_test_4eC39HqLyjWDarjtT1zdp7dc",
    tooltipMessage: "Copy API key",
    successMessage: "API key copied!",
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">API Key</div>
          <code className="text-xs text-muted-foreground">sk_test_4eC39HqLyjWDarjtT1zdp7dc</code>
        </div>
        <Story />
      </div>
    ),
  ],
}

export const FastTooltip: Story = {
  args: {
    value: "Quick copy example",
    tooltipDelayDuration: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip appears immediately without delay",
      },
    },
  },
}

export const SlowTooltip: Story = {
  args: {
    value: "Delayed tooltip example",
    tooltipDelayDuration: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: "Tooltip appears after 1 second delay",
      },
    },
  },
}

export const LongCopiedState: Story = {
  args: {
    value: "Extended feedback example",
    toastDuration: 3000,
  },
  parameters: {
    docs: {
      description: {
        story: 'The "copied" state persists for 3 seconds',
      },
    },
  },
}

export const ShortCopiedState: Story = {
  args: {
    value: "Quick feedback example",
    toastDuration: 1000,
  },
  parameters: {
    docs: {
      description: {
        story: 'The "copied" state only shows for 1 second',
      },
    },
  },
}

export const WithCallbacks: Story = {
  args: {
    value: "Callback example",
    onCopySuccess: (value) => {
      console.log("Successfully copied:", value)
    },
    onCopyError: (error) => {
      console.error("Copy failed:", error)
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstrates success and error callbacks (check browser console)",
      },
    },
  },
}

export const EmptyValue: Story = {
  args: {
    value: "",
  },
  parameters: {
    docs: {
      description: {
        story: "Component is disabled when value is empty",
      },
    },
  },
}

export const InDarkMode: Story = {
  args: {
    value: "Dark mode example",
  },
  parameters: {
    backgrounds: { default: "dark" },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
}