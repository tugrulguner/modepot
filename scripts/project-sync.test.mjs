import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalizeProject, projects, sync } from './sync-projects.mjs';

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
  assert.equal(records.length, 4);
  assert.deepEqual(replay, records);
  assert.equal(replay[1].roadmap.status, 'missing');
  assert.equal(replay[0].latestRelease.tag, 'v1.0.0');
  assert.equal(replay[3].latestRelease, null);
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('project sync normalization and offline four-project replay passed');
