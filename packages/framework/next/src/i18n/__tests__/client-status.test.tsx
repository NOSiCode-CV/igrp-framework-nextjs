import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

// No DOM in this package's vitest env, so the failed state is forced by making
// the switcher's only `useState` (`failed`) start true.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useState: ((init: unknown) =>
      actual.useState(init === false ? true : init)) as typeof actual.useState,
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const { IGRPIntlTestProvider } = await import('../testing/index.js');
const { IGRPLocaleSwitcher } = await import('../client/index.js');
const { IGRP_MESSAGES_PT } = await import('../messages/index.js');

describe('IGRPLocaleSwitcher status region', () => {
  it('announces a failed change in a status region', () => {
    const html = renderToString(
      <IGRPIntlTestProvider locale="pt">
        <IGRPLocaleSwitcher action={async () => ({ success: false, error: 'x', status: 500 })} />
      </IGRPIntlTestProvider>,
    );
    expect(html).toMatch(
      new RegExp(
        `<span role="status"[^>]*>${IGRP_MESSAGES_PT.i18n.localeSwitcher.changeError}</span>`,
      ),
    );
  });
});
