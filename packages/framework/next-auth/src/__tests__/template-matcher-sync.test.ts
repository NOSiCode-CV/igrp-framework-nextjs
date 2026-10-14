import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { withIGRPAuth } from '../config';

/**
 * Next parses the middleware `config` at build time, so the template cannot
 * re-export `auth.config` — it carries a literal copy of the matcher. This keeps
 * the copy and the default from drifting apart. Skips outside the monorepo.
 */
const TEMPLATE_MIDDLEWARE = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../templates/demo-v1/src/middleware.ts',
);

describe.skipIf(!existsSync(TEMPLATE_MIDDLEWARE))('template middleware matcher', () => {
  const source = existsSync(TEMPLATE_MIDDLEWARE) ? readFileSync(TEMPLATE_MIDDLEWARE, 'utf8') : '';

  it('is a literal, not a re-export Next would ignore', () => {
    // Line-anchored: the file's own comment quotes the old re-export.
    expect(source).not.toMatch(/^export const \{\s*config\s*\}\s*=/m);
    expect(source).toMatch(/^export const config = \{/m);
  });

  it('matches the framework default', () => {
    const block = /export const config = \{\s*matcher:\s*\[([\s\S]*?)\]/.exec(source)?.[1] ?? '';
    // The literal is TypeScript source: evaluate its string array as JSON.
    const literal = JSON.parse(`[${block.replace(/,\s*$/, '')}]`) as string[];
    const { config } = withIGRPAuth({ env: { AUTH_PROVIDER: 'none' } });
    expect(literal).toEqual(config.matcher);
  });
});
