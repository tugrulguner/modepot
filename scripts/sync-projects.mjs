import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

export const projects = ['dexpot', 'intpot', 'summonpot', 'lifepot'];
const owner = 'tugrulguner';
const api = `https://api.github.com/repos/${owner}`;
const sha256 = (text) => createHash('sha256').update(text).digest('hex');

export function normalizeProject(name, input) {
  const repository = `https://github.com/${owner}/${name}`;
  return {
    name, repository, commit: input.sha,
    commitUrl: `${repository}/commit/${input.sha}`,
    readme: { url: `${repository}/blob/${input.sha}/README.md`, sha256: sha256(input.readme) },
    roadmap: input.roadmap == null
      ? { status: 'missing', url: `${repository}/blob/${input.sha}/ROADMAP.md`, sha256: null }
      : { status: 'available', url: `${repository}/blob/${input.sha}/ROADMAP.md`, sha256: sha256(input.roadmap) },
    latestRelease: input.release && !input.release.draft && !input.release.prerelease
      ? { tag: input.release.tag_name, name: input.release.name || input.release.tag_name, url: input.release.html_url, publishedAt: input.release.published_at }
      : null,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'ModePot-project-sync' } });
  if (!response.ok) throw new Error(`GitHub ${response.status} fetching ${url}`);
  return response.json();
}
async function fetchLatestRelease(url) {
  const response = await fetch(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'ModePot-project-sync' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status} fetching ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { accept: 'application/vnd.github.raw+json', 'user-agent': 'ModePot-project-sync' } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status} fetching ${url}`);
  return response.text();
}

export async function sync({ fixtureDir, outputFile = new URL('../src/data/projects.json', import.meta.url) } = {}) {
  const output = [];
  for (const name of projects) {
    let input;
    if (fixtureDir) {
      const f = JSON.parse(await readFile(`${fixtureDir}/${name}.json`, 'utf8'));
      input = f;
    } else {
      const [commit, readme, roadmap, release] = await Promise.all([
        fetchJson(`${api}/${name}/commits/main`),
        fetchText(`${api}/${name}/contents/README.md`),
        fetchText(`${api}/${name}/contents/ROADMAP.md`),
        fetchLatestRelease(`${api}/${name}/releases/latest`),
      ]);
      if (readme == null) throw new Error(`${name}: README.md is missing`);
      input = { sha: commit.sha, readme, roadmap, release };
    }
    output.push(normalizeProject(name, input));
  }
  await mkdir(new URL('.', outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const fixtureArg = process.argv.indexOf('--fixtures');
  const records = await sync({ fixtureDir: fixtureArg >= 0 ? process.argv[fixtureArg + 1] : undefined });
  console.log(`Synchronized ${records.length} projects: ${records.map((r) => `${r.name}@${r.commit.slice(0, 7)}`).join(', ')}`);
}
