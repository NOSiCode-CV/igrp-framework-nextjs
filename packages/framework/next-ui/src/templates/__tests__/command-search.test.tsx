// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Opening the header palette used to take the whole header down: the design
 * system's `CommandDialog` (current shadcn shape) renders its children straight
 * into `DialogContent` without a cmdk root, so `CommandInput` read `subscribe`
 * off an undefined store on mount and `IGRPLayoutErrorBoundary` replaced the
 * header with its error state.
 *
 * This has to mount in a real DOM: the dialog content lives in a Radix portal,
 * which renders nothing on the server, so a `renderToString` test would pass
 * with the bug present.
 */

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const { IGRPTemplateCommandSearch } = await import('../command-search.js');
// Warm the lazy palette's module so React.lazy settles within one act() flush.
await import('../command-palette.js');

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  // jsdom gaps cmdk / Radix touch once the dialog is open.
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
});

let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

function mount(ui: React.ReactNode) {
  const errors: unknown[] = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container, {
    onUncaughtError: (error) => errors.push(error),
    onCaughtError: (error) => errors.push(error),
  });
  act(() => root!.render(ui));
  return errors;
}

// The palette is lazy-loaded on first open, so let its chunk resolve inside act.
async function pressCtrlK() {
  await act(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  });
}

describe('IGRPTemplateCommandSearch', () => {
  it('does not mount the palette before the first open', () => {
    mount(<IGRPTemplateCommandSearch commands={[]} />);
    expect(document.body.querySelector('[data-slot="command-input"]')).toBeNull();
  });

  it('opens with Ctrl+K without throwing and renders the input and commands', async () => {
    const onSelect = vi.fn();
    const errors = mount(
      <IGRPTemplateCommandSearch
        commands={[
          { id: 'dash', label: 'Dashboard', group: 'Navegação', onSelect },
          { id: 'rep', label: 'Relatórios', group: 'Navegação', onSelect },
        ]}
      />,
    );

    await pressCtrlK();

    expect(errors).toEqual([]);
    const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]');
    expect(input?.placeholder).toBe('Digite um comando ou pesquisa...');
    const items = [...document.body.querySelectorAll('[data-slot="command-item"]')].map(
      (el) => el.textContent,
    );
    expect(items).toEqual(['Dashboard', 'Relatórios']);
    expect(document.body.textContent).toContain('Navegação');
  });

  it('selects only one of two items that share a label', async () => {
    const first = vi.fn();
    const second = vi.fn();
    mount(
      <IGRPTemplateCommandSearch
        commands={[
          { label: 'Listar', group: 'Clientes', onSelect: first },
          { label: 'Listar', group: 'Faturas', onSelect: second },
        ]}
      />,
    );

    await pressCtrlK();

    const selected = document.body.querySelectorAll(
      '[data-slot="command-item"][data-selected="true"]',
    );
    expect(selected).toHaveLength(1);
    const items = document.body.querySelectorAll<HTMLElement>('[data-slot="command-item"]');
    act(() => items[1]!.click());
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('filters on the label and group only, never on the id or index in `value`', async () => {
    const onSelect = vi.fn();
    mount(
      <IGRPTemplateCommandSearch
        commands={[
          { label: 'Alfa', group: 'Menu', onSelect },
          { label: 'Beta', group: 'Menu', onSelect },
          { label: 'Gama', group: 'Menu', onSelect },
          { label: 'Delta', group: 'Menu', onSelect },
          { id: 'rep-3', label: 'Relatórios Contabilísticos', group: 'Menu', onSelect },
        ]}
      />,
    );
    await pressCtrlK();

    const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]')!;
    const type = (text: string) =>
      act(() => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
          input,
          text,
        );
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    const visible = () =>
      [...document.body.querySelectorAll('[data-slot="command-item"]')].map((el) => el.textContent);

    // "3" is only in the 4th item's index value and in an id.
    type('3');
    expect(visible()).toEqual([]);
    type('relato');
    expect(visible()).toEqual(['Relatórios Contabilísticos']);
    // Each token matches a word on its own, as cmdk's fuzzy scoring allowed.
    type('rel con');
    expect(visible()).toEqual(['Relatórios Contabilísticos']);
  });

  it('navigates to an href item, or opens an external one in a new tab', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    push.mockClear();
    mount(
      <IGRPTemplateCommandSearch
        commands={Promise.resolve([
          { id: 'in', label: 'Clientes', href: '/clientes' },
          { id: 'out', label: 'Portal', href: 'https://example.org', external: true },
        ])}
      />,
    );
    await pressCtrlK();
    const items = () => document.body.querySelectorAll<HTMLElement>('[data-slot="command-item"]');
    act(() => items()[0]!.click());
    expect(push).toHaveBeenCalledWith('/clientes');

    await pressCtrlK();
    act(() => items()[1]!.click());
    expect(open).toHaveBeenCalledWith('https://example.org', '_blank', 'noopener,noreferrer');
    expect(push).toHaveBeenCalledTimes(1);
    open.mockRestore();
  });

  it('opens with no commands and shows the pt-PT empty state', async () => {
    const errors = mount(<IGRPTemplateCommandSearch />);

    await pressCtrlK();

    expect(errors).toEqual([]);
    expect(document.body.textContent).toContain('Sem resultados.');
  });
});
