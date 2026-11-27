// node --test scripts/skill-hash.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hashSkillFiles } from './skill-hash.mjs';

const files = (skill, extra = []) => [
  { path: 'SKILL.md', content: Buffer.from(skill) },
  { path: 'rules/a.md', content: Buffer.from('a\nb\n') },
  ...extra,
];

test('LF and CRLF checkouts hash the same', () => {
  assert.equal(hashSkillFiles(files('# x\nbody\n')), hashSkillFiles(files('# x\r\nbody\r\n')));
});

test('a changed byte changes the hash', () => {
  assert.notEqual(hashSkillFiles(files('# x\nbody\n')), hashSkillFiles(files('# x\nbodY\n')));
});

test('binary content (NUL byte) is hashed raw', () => {
  const bin = (s) => [{ path: 'a.png', content: Buffer.from(s, 'latin1') }];
  assert.notEqual(hashSkillFiles(bin('\0\r\n')), hashSkillFiles(bin('\0\n')));
});

test('file order and metadata.json do not matter', () => {
  const meta = { path: 'metadata.json', content: Buffer.from('{}') };
  assert.equal(hashSkillFiles(files('x', [meta])), hashSkillFiles(files('x').reverse()));
});
