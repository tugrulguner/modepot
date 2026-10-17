import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sync } from './sync-projects.mjs';

test('missing canonical README refuses a refresh without overwriting the prior snapshot', async () => {
  const temp = await mkdtemp(join(process.env.TMPDIR ?? process.cwd(), 'source-failure-'));
  const outputFile = pathToFileURL(join(temp, 'projects.json'));
  const prior = '[{"previous":"reviewed snapshot"}]\n';
  await writeFile(outputFile, prior);
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => url.endsWith('/commits/main')
    ? Response.json({ sha: 'a'.repeat(40) })
    : new Response('', { status: 404 });
  try {
    await assert.rejects(sync({ outputFile }), /README\.md is missing/);
    assert.equal(await readFile(outputFile, 'utf8'), prior);
  } finally {
    globalThis.fetch = originalFetch;
    await rm(temp, { recursive: true, force: true });
  }
});
