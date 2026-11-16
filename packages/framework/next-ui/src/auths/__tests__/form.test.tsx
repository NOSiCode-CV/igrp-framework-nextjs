// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { IGRP_CHROME_STRINGS_PT } from '../../i18n/strings.js';

const signIn = vi.fn();
vi.mock('@igrp/framework-next-auth/client', () => ({
  IGRP_AUTH_PROVIDER_ID: 'igrp',
  signIn: (...args: unknown[]) => signIn(...args),
}));
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => <img {...(props as object)} />,
}));

const { IGRPAuthForm } = await import('../form.js');

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

const texts = {
  welcome: 'w',
  description: 'd',
  copyright: 'c',
  igrpLabel: 'i',
  igrpUrl: 'https://i.example',
  nosiLabel: 'n',
  nosiUrl: 'https://n.example',
};

describe('IGRPAuthForm sign-in failure', () => {
  it('shows the catalog sign-in error, not the thrown message', async () => {
    signIn.mockRejectedValue(new TypeError('Failed to fetch'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <IGRPAuthForm texts={texts} logo={{ src: '/l.png', width: 1, height: 1 }} name="App" />,
      ),
    );

    await act(async () => {
      container!.querySelector<HTMLButtonElement>('button[aria-busy]')!.click();
    });

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe(IGRP_CHROME_STRINGS_PT.authForm.signInError);
    expect(container.textContent).not.toContain('Failed to fetch');
  });
});

describe('IGRPAuthForm compound parts', () => {
  it('signs in with the chosen provider and disables every button while one is pending', async () => {
    const { IGRPAuthFormRoot, IGRPAuthFormSignInButton } = await import('../form.js');
    signIn.mockReturnValue(new Promise(() => {}));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root!.render(
        <IGRPAuthFormRoot>
          <IGRPAuthFormSignInButton>IGRP</IGRPAuthFormSignInButton>
          <IGRPAuthFormSignInButton providerId={'other' as never} callbackUrl="/x">
            Other
          </IGRPAuthFormSignInButton>
        </IGRPAuthFormRoot>,
      ),
    );
    const [igrp, other] = container.querySelectorAll<HTMLButtonElement>('button[aria-busy]');

    await act(async () => other!.click());

    expect(signIn).toHaveBeenLastCalledWith('other', { callbackUrl: '/x' });
    expect(igrp!.disabled).toBe(true);
    expect(other!.getAttribute('aria-busy')).toBe('true');
    expect(igrp!.getAttribute('aria-busy')).toBe('false');
  });
});
