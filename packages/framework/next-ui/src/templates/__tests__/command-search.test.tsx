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

const { IGRPTemplateCommandSearch } = await import('../command-search.js');

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

function pressCtrlK() {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  });
}

describe('IGRPTemplateCommandSearch', () => {
  it('opens with Ctrl+K without throwing and renders the input and commands', () => {
    const onSelect = vi.fn();
    const errors = mount(
      <IGRPTemplateCommandSearch
        commands={[
          { id: 'dash', label: 'Dashboard', group: 'Navegação', onSelect },
          { id: 'rep', label: 'Relatórios', group: 'Navegação', onSelect },
        ]}
      />,
    );

    pressCtrlK();

    expect(errors).toEqual([]);
    const input = document.body.querySelector<HTMLInputElement>('[data-slot="command-input"]');
    expect(input?.placeholder).toBe('Digite um comando ou pesquisa...');
    const items = [...document.body.querySelectorAll('[data-slot="command-item"]')].map(
      (el) => el.textContent,
    );
    expect(items).toEqual(['Dashboard', 'Relatórios']);
    expect(document.body.textContent).toContain('Navegação');
  });

  it('opens with no commands and shows the pt-PT empty state', () => {
    const errors = mount(<IGRPTemplateCommandSearch />);

    pressCtrlK();

    expect(errors).toEqual([]);
    expect(document.body.textContent).toContain('Sem resultados.');
  });
});
