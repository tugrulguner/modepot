import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeProject, projects, sync } from './sync-projects.mjs';

// Validate live schema without freezing moving source/release records.
const readmeText = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const projectTable = readmeText.match(/^\| Project \|[^\n]*\n(?:\|[^\n]*\n)+/m)?.[0] || '';
assert.match(projectTable, /\*\*UtilityPot\*\*/, 'UtilityPot must remain inside the contiguous Markdown project table');
const stored = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8'));
for (const name of ['dexpot', 'intpot', 'summonpot', 'lifepot', 'refpot', 'utilitypot']) assert.ok(stored.some(p => p.name === name));
assert.ok(projects.includes('utilitypot'), 'UtilityPot must be supported by source sync');
const utility = stored.find(p => p.name === 'utilitypot');
assert.match(utility.commit, /^[a-f0-9]{40}$/);
assert.match(utility.readme.sha256, /^[a-f0-9]{64}$/);
assert.equal(utility.readme.url, `${utility.repository}/blob/${utility.commit}/README.md`);
assert.ok(['missing', 'available'].includes(utility.roadmap.status));
if (utility.latestRelease) assert.ok(utility.latestRelease.url.startsWith(`${utility.repository}/releases/tag/`));

assert.equal(createHash('sha256').update(await readFile(new URL('../public/marks/utilitypot-mark-v1.svg', import.meta.url))).digest('hex'), '74e035fed2ed483257e7c35965a4a49a8a377abe45f458bc6e06a6e89892adf3', 'UtilityPot artwork must retain exact family bytes');
assert.equal(createHash('sha256').update(await readFile(new URL('../public/products/utilitypot-lockup-v1.svg', import.meta.url))).digest('hex'), '797a7c453661b989296ea40e335e56b79dea8a6920f52b29dc281ee9ffdc6246', 'UtilityPot artwork must retain exact family bytes');

const p = normalizeProject('dexpot', {
  sha: 'a'.repeat(40), readme: '# Project\n', roadmap: null,
  release: { tag_name: 'v1.2', name: 'Release', html_url: 'https://github.com/tugrulguner/dexpot/releases/tag/v1.2', prerelease: false, draft: false, published_at: '2026-01-01T00:00:00Z' },
});
assert.equal(p.repository, 'https://github.com/tugrulguner/dexpot');
assert.equal(p.commit, 'a'.repeat(40));
assert.equal(p.roadmap.status, 'missing');
assert.equal(p.latestRelease.tag, 'v1.2');
assert.equal(normalizeProject('dexpot', { sha: 'b'.repeat(40), readme: '# P', roadmap: '# Plan', release: null }).latestRelease, null);

const temp = await mkdtemp(join(process.env.TMPDIR ?? process.cwd(), 'modepot-sync-'));
try {
  for (const [index, name] of projects.entries()) {
    await writeFile(join(temp, `${name}.json`), JSON.stringify({
      sha: String(index + 1).repeat(40), readme: `# ${name}\n`, roadmap: index === 1 ? null : `# ${name} roadmap\n`,
      release: index === 0 ? { tag_name: 'v1.0.0', name: `${name} 1.0.0`, html_url: `https://github.com/tugrulguner/${name}/releases/tag/v1.0.0`, prerelease: false, draft: false, published_at: '2026-01-01T00:00:00Z' } : null,
    }));
  }
  const output = pathToFileURL(join(temp, 'generated', 'projects.json'));
  const records = await sync({ fixtureDir: temp, outputFile: output });
  const replay = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(records.length, projects.length);
  assert.deepEqual(replay, records);
  assert.equal(replay[1].roadmap.status, 'missing');
  assert.equal(replay[0].latestRelease.tag, 'v1.0.0');
  assert.equal(replay[3].latestRelease, null);
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log(`project sync normalization and offline ${projects.length}-project replay passed`);
