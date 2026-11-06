import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeProject, projects, renderProjectSnapshots, sync } from './sync-projects.mjs';

// The compact README catalogue gives every project a direct learning route before prose.
const readmeText = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const projectIntro = readmeText.split('## Projects')[1].split('<!-- project-snapshots:start -->')[0];
for (const [name, quickstart, site] of [
  ['Dexpot', 'https://dexpot.modepot.io/quick-start/', 'https://dexpot.modepot.io/'],
  ['Intpot', 'https://intpot.modepot.io/quickstart/', 'https://intpot.modepot.io/'],
  ['Summonpot', 'https://summonpot.modepot.io/quick-start/', 'https://summonpot.modepot.io/'],
  ['LifePot', 'https://lifepot.modepot.io/play', 'https://lifepot.modepot.io/'],
  ['RefPot', 'https://refpot.modepot.io/package/', 'https://refpot.modepot.io/'],
  ['UtilityPot', 'https://github.com/tugrulguner/utilitypot/blob/main/README.md', 'https://utilitypot.modepot.io/'],
  ['SkillPot', 'https://skillpot.modepot.io/quickstart/', 'https://skillpot.modepot.io/'],
]) {
  const block = projectIntro.split(`**${name}**`)[1]?.split('\n- **')[0];
  assert.ok(block, `${name} must have a concise project block`);
  assert.ok(block.indexOf(quickstart) >= 0, `${name} must expose its learning route in the project block`);
  assert.ok(block.indexOf(`](${quickstart})`) < block.indexOf(`](${site})`), `${name} learning route precedes project site link`);
}
assert.doesNotMatch(projectIntro, /^\| Project \|/m, 'README project list must not use the mobile-hostile 5-column table');
assert.match(projectIntro, /SQL and ORM remain planned/);
assert.match(projectIntro, /Repository-readiness is experimental/);
assert.match(readmeText, /MIT License/);
const licenseText = await readFile(new URL('../LICENSE', import.meta.url), 'utf8');
assert.match(licenseText, /^MIT License\n\nCopyright \(c\) 2026 Tugrul Guner\n/);
assert.match(licenseText, /Permission is hereby granted, free of charge, to any person obtaining a copy/);
assert.match(licenseText, /THE SOFTWARE IS PROVIDED "AS IS"/);
const homepageSource = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
assert.match(homepageSource, /<link rel="license" href="https:\/\/github\.com\/tugrulguner\/modepot\/blob\/main\/LICENSE" \/>/);
const stored = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8'));
const renderedSnapshots = renderProjectSnapshots(stored);
assert.match(renderedSnapshots, /\| Checked \(UTC\) \|/);
const rangeFixture = [
  { ...stored[0], checkedAt: '2026-03-02T12:00:00.000Z' },
  { ...stored[1], checkedAt: '2026-01-04T12:00:00.000Z' },
];
assert.match(renderProjectSnapshots(rangeFixture), /current snapshot range: 2026-01-04–2026-03-02/);
assert.match(renderProjectSnapshots([rangeFixture[0]]), /current snapshot range: 2026-03-02\)/);
for (const record of stored) assert.ok(renderedSnapshots.includes(`| ${record.checkedAt.slice(0, 10)} |`), `${record.name} must display its actual individual check date`);
assert.doesNotMatch(renderedSnapshots, /checked at \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/i, 'snapshot heading must not imply one timestamp applies globally');
for (const name of ['dexpot', 'intpot', 'summonpot', 'lifepot', 'refpot', 'utilitypot', 'skillpot']) assert.ok(stored.some(p => p.name === name));
assert.ok(projects.includes('utilitypot'), 'UtilityPot must be supported by source sync');
assert.ok(projects.includes('skillpot'), 'SkillPot must be supported by source sync');
assert.equal(stored.length, 7, 'all seven projects must remain represented');
const agentMap = await readFile(new URL('../public/llms.txt', import.meta.url), 'utf8');
assert.equal(agentMap.split('## Quick starts and documentation').length - 1, 1, 'Keep one canonical documentation section');
const skillpot = stored.find(p => p.name === 'skillpot');
assert.match(skillpot.commit, /^[a-f0-9]{40}$/);
assert.match(skillpot.readme.sha256, /^[a-f0-9]{64}$/);
assert.equal(skillpot.readme.url, `${skillpot.repository}/blob/${skillpot.commit}/README.md`);
assert.equal(skillpot.roadmap.status, 'available');
assert.equal(skillpot.roadmap.sha256.length, 64);
assert.equal(skillpot.latestRelease.tag, 'v0.4.1');
assert.equal(skillpot.latestRelease.publishedAt, '2026-11-05T22:53:52Z');
assert.equal(skillpot.latestRelease.url, 'https://github.com/tugrulguner/skillpot/releases/tag/v0.4.1');
assert.equal(skillpot.commit, '79284b3faa928dc556a9032aa9dbeb059b4ee915');
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
