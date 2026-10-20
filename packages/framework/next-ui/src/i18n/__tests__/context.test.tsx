// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { IGRPChromeI18nProvider, useIGRPChromeI18n } from '../context.js';
import { IGRP_CHROME_STRINGS_EN } from '../strings.en.js';

function Probe() {
  const strings = useIGRPChromeI18n();
  return <span data-testid="probe">{strings.navUser.logout}</span>;
}

let root: Root | null = null;
let host: HTMLDivElement;

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  host?.remove();
  document.cookie = 'IGRP_LOCALE=; Max-Age=0; path=/';
});

function mount(ui: React.ReactNode): string {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(ui));
  return host.querySelector('[data-testid="probe"]')?.textContent ?? '';
}

describe('useIGRPChromeI18n', () => {
  it('returns the provided catalog', () => {
    expect(
      mount(
        <IGRPChromeI18nProvider strings={IGRP_CHROME_STRINGS_EN}>
          <Probe />
        </IGRPChromeI18nProvider>,
      ),
    ).toBe('Sign out');
  });

  it('without a provider reads the IGRP_LOCALE cookie on the client, regional tags included', () => {
    document.cookie = 'IGRP_LOCALE=fr-FR; path=/';
    expect(mount(<Probe />)).toBe('Se déconnecter');
  });

  it('without a provider and without a usable cookie falls back to Portuguese', () => {
    expect(mount(<Probe />)).toBe('Terminar sessão');
    document.cookie = 'IGRP_LOCALE=de; path=/';
    expect(mount(<Probe />)).toBe('Terminar sessão');
  });

  it('renders Portuguese on the server regardless of cookies (no document there)', () => {
    expect(renderToString(<Probe />)).toContain('Terminar sessão');
  });

  it('without a provider never throws on a malformed cookie value', () => {
    document.cookie = 'IGRP_LOCALE=fr%E0%A4%A; path=/';
    expect(mount(<Probe />)).toBe('Terminar sessão');
  });

  it('without a provider decodes a percent-encoded value', () => {
    document.cookie = 'IGRP_LOCALE=fr%2DFR; path=/';
    expect(mount(<Probe />)).toBe('Se déconnecter');
  });

  it('without a provider accepts an RFC 6265 quoted value', () => {
    document.cookie = 'IGRP_LOCALE="fr"; path=/';
    expect(mount(<Probe />)).toBe('Se déconnecter');
  });
});
