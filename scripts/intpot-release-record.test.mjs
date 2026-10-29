import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
test('Intpot published release and source snapshot agree across family surfaces', async () => {
  const records = JSON.parse(await readFile(new URL('src/data/projects.json', root), 'utf8'));
  const record = records.find((project) => project.name === 'intpot');
  assert.equal(record.latestRelease.tag, 'v0.16.0');
  assert.equal(record.commit, 'f6ec26afc60011d41209cd705636f60e881d492f');
  assert.match(record.commit, /^[a-f0-9]{40}$/);
  assert.equal(record.latestRelease.url, `https://github.com/tugrulguner/intpot/releases/tag/${record.latestRelease.tag}`);
  assert.ok(record.readme.url.includes(`/blob/${record.commit}/`));
  assert.ok(record.roadmap.url.includes(`/blob/${record.commit}/`));
  const publicRecords = JSON.parse(await readFile(new URL('public/project-sources.json', root), 'utf8'));
  assert.deepEqual(publicRecords, records);
  for (const path of ['README.md', 'public/llms.txt']) {
    const text = await readFile(new URL(path, root), 'utf8');
    assert.ok(text.includes(record.commitUrl), path);
    assert.ok(text.includes(record.latestRelease.url), path);
  }
  const homepage = await readFile(new URL('src/pages/index.astro', root), 'utf8');
  assert.ok(homepage.includes(`${record.latestRelease.tag} published:`));
  assert.ok(homepage.includes('definition-time binding diagnostics'));
  assert.ok(homepage.includes('string/postponed annotation globals'));
  assert.ok(homepage.includes('bounded static binding paths'));
  assert.ok(homepage.includes('synthetic wrapper origins remain unavailable'));
  assert.ok(homepage.includes('verified original body-reference ranges'));
  assert.ok(homepage.includes('source-fingerprint checks'));
  assert.ok(homepage.includes('Transformed, nested or stale source leaves ranges unavailable'));
  assert.ok(!homepage.includes('v0.15.0 published:'));
  assert.ok(!homepage.includes('v0.11.0 published: bounded helper recovery'));
});
