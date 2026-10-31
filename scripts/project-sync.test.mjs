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
for (const name of ['dexpot', 'intpot', 'summonpot', 'lifepot', 'refpot', 'utilitypot', 'skillpot']) assert.ok(stored.some(p => p.name === name));
assert.ok(projects.includes('utilitypot'), 'UtilityPot must be supported by source sync');
assert.ok(projects.includes('skillpot'), 'SkillPot must be supported by source sync');
assert.match(projectTable, /\*\*SkillPot\*\*/);
const skillpotRow = projectTable.split('\n').find(line => line.includes('**SkillPot**'));
assert.ok(skillpotRow, 'SkillPot row must exist');
assert.equal(skillpotRow.split('|').length, 7, 'SkillPot must retain all five project-table columns');
assert.match(skillpotRow, /\| \[skillpot\.modepot\.io\]\(https:\/\/skillpot\.modepot\.io\/\) \| \[GitHub\]/, 'SkillPot website and source must remain distinct chooser columns');
const agentMap = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8');
assert.equal(agentMap.split('## Quick starts and documentation').length - 1, 1, 'Keep one canonical documentation section');
const skillpot = stored.find(p => p.name === 'skillpot');
assert.match(skillpot.commit, /^[a-f0-9]{40}$/);
assert.match(skillpot.readme.sha256, /^[a-f0-9]{64}$/);
assert.equal(skillpot.readme.url, `${skillpot.repository}/blob/${skillpot.commit}/README.md`);
assert.equal(skillpot.roadmap.status, 'available');
assert.equal(skillpot.roadmap.sha256.length, 64);
assert.equal(skillpot.latestRelease.tag, 'v0.3.0');
assert.equal(skillpot.latestRelease.url, 'https://github.com/tugrulguner/skillpot/releases/tag/v0.3.0');
assert.match(skillpot.checkedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/);
assert.ok(Number.isFinite(Date.parse(skillpot.checkedAt)), 'SkillPot check timestamp must remain valid after future source refreshes');
assert.equal(createHash('sha256').update(await readFile(new URL('../public/marks/skillpot-mark.svg', import.meta.url))).digest('hex'), '1fc7fff4f5384fce02e9205fc757f5a3448f64d08fb03f041f46b93f6c3b4334', 'SkillPot mark must preserve canonical upstream bytes');
assert.equal(createHash('sha256').update(await readFile(new URL('../public/products/skillpot-lockup.svg', import.meta.url))).digest('hex'), '44970bbd30c8ca4474908454dc4996a399b14872c1c9f47f236dbaa190f182d8', 'SkillPot lockup must preserve canonical upstream bytes');
const utility = stored.find(p => p.name === 'utilitypot');
assert.match(utility.commit, /^[a-f0-9]{40}$/);
assert.match(utility.readme.sha256, /^[a-f0-9]{64}$/);
assert.equal(utility.readme.url, `${utility.repository}/blob/${utility.commit}/README.md`);
assert.ok(['missing', 'available'].includes(utility.roadmap.status));
if (utility.latestRelease) assert.ok(utility.latestRelease.url.startsWith(`${utility.repository}/releases/tag/`));

assert.equal(createHash('sha256').update(await readFile(new URL('../public/marks/utilitypot-mark-v1.svg', import.meta.url))).digest('hex'), 'd0611af2ce31a9cea77ff05f143f51db8b599c7f3b0ff60bb6f49f03862f5dbf', 'UtilityPot artwork must retain exact family bytes');
assert.equal(createHash('sha256').update(await readFile(new URL('../public/products/utilitypot-lockup-v1.svg', import.meta.url))).digest('hex'), 'd89978b2ac7555b2ec0f89247a691b6a6fdc89ddabd2e9908a6d5118ee2f6d7c', 'UtilityPot artwork must retain exact family bytes');

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
  const beforeSelectiveRefresh = replay;
  await writeFile(join(temp, 'skillpot.json'), JSON.stringify({
    sha: 'f'.repeat(40), readme: '# SkillPot refreshed\n', roadmap: '# Roadmap\n', release: null,
  }));
  const selectivelyRefreshed = await sync({ fixtureDir: temp, outputFile: output, only: 'skillpot', checkedAt: '2026-10-28T12:00:00.000Z' });
  for (const name of projects.filter((name) => name !== 'skillpot')) {
    assert.deepEqual(selectivelyRefreshed.find((record) => record.name === name), beforeSelectiveRefresh.find((record) => record.name === name), `${name} must remain unchanged during a SkillPot-only refresh`);
  }
  assert.equal(selectivelyRefreshed.find((record) => record.name === 'skillpot').commit, 'f'.repeat(40));
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log(`project sync normalization and offline ${projects.length}-project replay passed`);
