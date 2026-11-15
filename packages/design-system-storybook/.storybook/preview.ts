import type { Preview } from '@storybook/nextjs-vite';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      // tokens.css keys dark mode on `.dark`; the backgrounds toolbar alone only paints the canvas.
      // SB 10: the global is `{ value: <option key> }` or the bare key.
      const backgrounds = context.globals.backgrounds as { value?: string } | string | undefined;
      const key = typeof backgrounds === 'string' ? backgrounds : backgrounds?.value;
      document.documentElement.classList.toggle('dark', key === 'dark');
      return Story();
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        light: { name: 'light', value: '#fff' },
        dark: { name: 'dark', value: '#333' },
      },
    },

    layout: 'fullscreen',
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'error',
    },
  },
  tags: ['autodocs'],
};

export default preview;
