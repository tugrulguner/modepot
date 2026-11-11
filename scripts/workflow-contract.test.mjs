import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/website-layout.yml', import.meta.url), 'utf8');

test('layout workflow trusts checkout before git-based steps', () => {
  const checkout = workflow.indexOf('actions/checkout@');
  const trust = workflow.indexOf('git config --global --add safe.directory "$GITHUB_WORKSPACE"');
  assert.notEqual(checkout, -1, 'checkout action is present');
  assert.notEqual(trust, -1, 'workspace safe.directory is configured');
  assert.ok(trust > checkout, 'workspace trust follows checkout');
});

test('layout browser tests use only the pinned official Playwright image', () => {
  assert.match(workflow, /image: mcr\.microsoft\.com\/playwright:v1\.63\.0-noble@sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27/);
  assert.match(workflow, /options: --shm-size=1g/);
  assert.match(workflow, /run: npm run test:layout/);
  assert.doesNotMatch(workflow, /playwright install --with-deps/);
});
