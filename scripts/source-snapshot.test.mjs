import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { projects, sync } from './sync-projects.mjs';

const checkedAt = '2026-10-17T04:00:00.000Z';
const sha = 'a'.repeat(40);
const digest = (s) => createHash('sha256').update(s).digest('hex');

test('snapshot fetches documents at the resolved commit and synchronizes README from the same records', async () => {
  const temp = await mkdtemp(join(process.env.TMPDIR ?? process.cwd(), 'source-snapshot-'));
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.GH_TOKEN;
  process.env.GH_TOKEN = 'synthetic-metadata-token';
  const requests = [];
  const readmeFile = pathToFileURL(join(temp, 'README.md'));
  const agentMapFile = pathToFileURL(join(temp, 'llms.txt'));
  const publicFile = pathToFileURL(join(temp, 'public-projects.json'));
  await writeFile(readmeFile, '# Family\n\n<!-- project-snapshots:start -->\nold snapshot\n<!-- project-snapshots:end -->\n\nPreserve surrounding prose.\n');
  await writeFile(agentMapFile, '# Agents\n\n<!-- project-snapshots:start -->\nold snapshot\n<!-- project-snapshots:end -->\n');
  globalThis.fetch = async (url, options) => {
    assert.equal(options.headers.authorization, 'Bearer synthetic-metadata-token');
    const parsed = new URL(url);
    requests.push(parsed);
    if (parsed.pathname.endsWith('/commits/main')) return Response.json({ sha });
    if (parsed.pathname.endsWith('/contents/README.md')) return new Response('# README at resolved revision\n');
    if (parsed.pathname.endsWith('/contents/ROADMAP.md')) return new Response('', { status: 404 });
    if (parsed.pathname.endsWith('/releases/latest')) {
      const project = parsed.pathname.split('/')[3];
      if (project === 'utilitypot') return new Response('', { status: 404 });
      return Response.json({ tag_name: 'v2.3.4', html_url: `https://github.com/tugrulguner/${project}/releases/tag/v2.3.4`, published_at: checkedAt, prerelease: false, draft: false });
    }
    throw new Error(`Unexpected request ${url}`);
  };
  try {
    const records = await sync({ outputFile: pathToFileURL(join(temp, 'projects.json')), readmeFile, agentMapFile, publicFile, checkedAt });
    assert.equal(records.length, projects.length);
    assert.ok(records.every((r) => r.checkedAt === checkedAt), 'every source record must expose when it was checked');
    assert.equal(requests.filter((u) => u.pathname.includes('/contents/')).length, projects.length * 2);
    for (const u of requests.filter((u) => u.pathname.includes('/contents/'))) assert.equal(u.searchParams.get('ref'), sha, 'README/roadmap bytes must match their linked immutable commit');
    assert.ok(records.every((r) => r.readme.sha256 === digest('# README at resolved revision\n')));
    const readme = await readFile(readmeFile, 'utf8');
    assert.ok(readme.includes('Preserve surrounding prose.'));
    assert.ok(!readme.includes('old snapshot'));
    for (const r of records) {
      assert.ok(readme.includes(r.commitUrl));
      if (r.latestRelease) assert.ok(readme.includes(r.latestRelease.url));
    }
    assert.match(readme, /No release recorded/);
    assert.match(readme, /snapshot/i);
    assert.deepEqual(JSON.parse(await readFile(publicFile, 'utf8')), records);
    const agentMap = await readFile(agentMapFile, 'utf8');
    for (const record of records) assert.ok(agentMap.includes(record.commitUrl));
    assert.ok(!agentMap.includes('old snapshot'));
    for (const value of [JSON.stringify(records), readme, agentMap]) assert.ok(!value.includes('synthetic-metadata-token'));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.GH_TOKEN;
    else process.env.GH_TOKEN = originalToken;
    await rm(temp, { recursive: true, force: true });
  }
});

test('public source labels disclose snapshot semantics instead of claiming continuously live GitHub data', async () => {
  const page = await readFile(new URL('../src/pages/index.astro', import.meta.url), 'utf8');
  assert.ok(!page.includes('Latest source commit'));
  assert.ok(!page.includes('No published release yet'));
  assert.match(page, /Source snapshot/);
  assert.match(page, /checkedAt/);
});
