// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, ...props }: { href: string }) => <a data-next-link href={href} {...props} />,
}));

const { IGRPTemplateNotifications } = await import('../notifications.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

const base = {
  message: 'm',
  type: 'info' as const,
  timestamp: '2026-01-01T00:00:00Z',
  isRead: false,
};

describe('IGRPTemplateNotifications', () => {
  it('renders href items as links and reports the selected notification', () => {
    const onSelect = vi.fn();
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <IGRPTemplateNotifications
          open
          onOpenChange={() => {}}
          onSelect={onSelect}
          notifications={[
            { ...base, id: 'plain', title: 'Plain' },
            { ...base, id: 'in', title: 'Internal', href: '/inbox/1' },
            { ...base, id: 'out', title: 'External', href: 'https://example.com/x' },
          ]}
        />,
      ),
    );

    const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const byTitle = (t: string) => items.find((el) => el.textContent?.includes(t))!;
    expect(byTitle('Plain').tagName).toBe('DIV');
    expect(byTitle('Internal').hasAttribute('data-next-link')).toBe(true);
    expect(byTitle('Internal').getAttribute('href')).toBe('/inbox/1');
    expect(byTitle('External').hasAttribute('data-next-link')).toBe(false);
    expect(byTitle('External').getAttribute('href')).toBe('https://example.com/x');

    act(() => byTitle('Plain').click());
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'plain' }));
  });
});
