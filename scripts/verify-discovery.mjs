import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const llms = await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8');
const failures = [];
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const readmeHero = readme.slice(0, readme.indexOf('## Projects'));
for (const token of [
  '<img src="public/modepot-mark.svg"', 'alt="ModePot family mark"',
  'We simplify, modernize, and performance-optimize',
  'frameworks, tools, engines, and games',
  'https://tugrul.modepot.io/',
  'Created by Tugrul Guner',
  'https://modepot.io/',
  'https://github.com/tugrulguner/modepot',
  'https://discord.gg/u3AANZr6RG',
]) {
  if (!readmeHero.includes(token)) failures.push(`README.md: opening is missing prominent family identity/resource ${token}`);
}
if (!readmeHero.includes('<p align="center">') || !['ModePot', 'GitHub', 'Community', 'Created by Tugrul Guner'].every((label) => readmeHero.includes(label))) {
  failures.push('README.md: centered ModePot/GitHub/community/creator resource row must be directly below the hero');
}
if (!readmeHero.includes('https://tugrul.modepot.io/')) {
  failures.push('README.md: creator personal site must be linked in the opening resource row');
}
if (!readme.includes('https://dexpot.modepot.io/quick-start/') || !readme.includes('https://intpot.modepot.io/quickstart/') || !readme.includes('https://summonpot.modepot.io/quick-start/') || !readme.includes('docs/simulation-contract.md')) {
  failures.push('README.md: project index must retain verified learning routes for all projects');
}
for (const product of ['dexpot', 'intpot', 'summonpot', 'lifepot']) {
  if (!readme.includes(`https://${product}.modepot.io/`) || !readme.includes(`https://github.com/tugrulguner/${product}`)) {
    failures.push(`README.md: missing site/source chooser destinations for ${product}`);
  }
}
const qualification = 'AI-native and agent-friendly where they add real value';
if (!readme.includes(qualification) || !llms.includes(qualification)) {
  failures.push('README.md/llms.txt: missing qualified family AI/agent positioning');
}
if (!html.includes('AI-native and agent-friendly approaches where they add value')) {
  failures.push('index.html: missing qualified family positioning beyond the hero');
}

const requiredHtml = [
  '<link rel="canonical" href="https://modepot.io/">',
  '<link rel="alternate" type="text/plain" href="/llms.txt"',
  'property="og:image"',
  'name="twitter:image"',
  '/products/dexpot-lockup.webp',
  '/products/intpot-lockup.webp',
  '/products/summonpot-lockup.webp',
  '/products/lifepot-lockup.webp',
  'Docs',
  'Build with us.',
  'participation-links',
];
for (const token of requiredHtml) {
  if (!html.includes(token)) failures.push(`index.html: missing ${token}`);
}
for (const [product, docsUrl] of Object.entries({
  dexpot: 'https://dexpot.modepot.io/quick-start/',
  intpot: 'https://intpot.modepot.io/quickstart/',
  summonpot: 'https://summonpot.modepot.io/quick-start/',
  lifepot: 'https://github.com/tugrulguner/lifepot/blob/main/docs/simulation-contract.md',
})) {
  for (const destination of [
    docsUrl,
    `https://github.com/tugrulguner/${product}`,
  ]) {
    if (!html.includes(`href="${destination}"`)) {
      failures.push(`index.html: missing project Docs/GitHub destination ${destination}`);
    }
  }
}
for (const stale of ['/products/dexpot.webp', '/products/intpot.webp', '/products/summonpot.webp', '/products/lifepot.webp']) {
  if (html.includes(stale)) failures.push(`index.html: stale product artwork URL ${stale}`);
}

const description = html.match(/<meta name="description" content="([^"]+)">/)?.[1];
if (!description || description.length > 160) {
  failures.push(`index.html: meta description must be present and at most 160 characters; got ${description?.length ?? 0}`);
}

const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
if (jsonLdBlocks.length === 0) failures.push('index.html: missing JSON-LD');
const schemaTypes = new Set();
function collectSchemaTypes(value) {
  if (Array.isArray(value)) {
    for (const item of value) collectSchemaTypes(item);
    return;
  }
  if (!value || typeof value !== 'object') return;
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  for (const type of types) if (type) schemaTypes.add(type);
  for (const nested of Object.values(value)) collectSchemaTypes(nested);
}
for (const [, source] of jsonLdBlocks) {
  try {
    const value = JSON.parse(source);
    collectSchemaTypes(value);
  } catch (error) {
    failures.push(`index.html: invalid JSON-LD (${error.message})`);
  }
}
for (const type of ['CollectionPage', 'ItemList', 'SoftwareSourceCode', 'WebSite']) {
  if (!schemaTypes.has(type)) failures.push(`index.html: missing ${type} structured data`);
}

for (const product of ['dexpot', 'intpot', 'summonpot', 'lifepot']) {
  if ((html.match(new RegExp(`class="product product-[^"]+" id="${product}"`, 'g')) ?? []).length !== 1) {
    failures.push(`index.html: expected exactly one project card for ${product}`);
  }
  if (!html.includes(`https://github.com/tugrulguner/${product}/commit/`)) {
    failures.push(`index.html: missing source-backed development link for ${product}`);
  }
  if (!html.includes(`data-posthog-project="${product}"`) || !html.includes('data-posthog-surface="modepot_homepage"')) {
    failures.push(`index.html: missing project intent event markers for ${product}`);
  }
  const metadata = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8')).find((entry) => entry.name === product);
  for (const token of [metadata.commit.slice(0, 7), metadata.readme.sha256.slice(0, 12), metadata.roadmap.status === 'available' ? metadata.roadmap.sha256.slice(0, 12) : 'not published']) {
    if (!html.includes(token)) failures.push(`index.html: project metadata provenance missing ${token} for ${product}`);
  }
  if (metadata.latestRelease && (!html.includes(metadata.latestRelease.tag) || !html.includes(metadata.latestRelease.url))) {
    failures.push(`index.html: published release metadata missing for ${product}`);
  }
  if (!metadata.latestRelease && !html.includes('No published release yet')) {
    failures.push(`index.html: explicit no-release state missing for ${product}`);
  }
}
for (const destination of ['https://github.com/tugrulguner/dexpot', 'https://github.com/tugrulguner/intpot', 'https://github.com/tugrulguner/summonpot', 'https://github.com/tugrulguner/lifepot']) {
  const repoLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].filter(([, href]) => href === destination);
  if (repoLinks.some(([tag]) => !tag.includes('ph-no-autocapture') || tag.includes('data-posthog-event'))) {
    failures.push(`index.html: repository link ${destination} must be excluded from autocapture and custom project-visit events`);
  }
}
if ((html.match(/data-posthog-event="modepot_project_clicked"/g) ?? []).length !== 4) {
  failures.push('index.html: project-visit intent must be limited to the four Explore links');
}
for (const token of ['## Quick starts and documentation', 'https://dexpot.modepot.io/quick-start/', 'https://intpot.modepot.io/quickstart/', 'https://summonpot.modepot.io/quick-start/', '## Contribute to ModePot', 'CONTRIBUTING.md', 'Propose a Dexpot feature', 'Discord', '## Selection guide', '## Maturity and licensing', 'https://github.com/tugrulguner/dexpot', 'https://github.com/tugrulguner/intpot', 'https://github.com/tugrulguner/summonpot', 'https://github.com/tugrulguner/lifepot']) {
  if (!llms.includes(token)) failures.push(`llms.txt: missing ${token}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Verified ModePot canonical metadata, social metadata, JSON-LD, and llms.txt.');
}
