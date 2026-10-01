import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const llms = await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8');
const failures = [];
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
for (const product of ['dexpot', 'intpot', 'summonpot', 'lifepot']) {
  if (!readme.includes(`https://${product}.modepot.io/`) || !readme.includes(`https://github.com/tugrulguner/${product}`)) {
    failures.push(`README.md: missing site/source chooser destinations for ${product}`);
  }
}
const qualification = 'AI-native and agent-friendly where they add real value';
if (!readme.includes(qualification) || !llms.includes(qualification)) {
  failures.push('README.md/llms.txt: missing qualified family AI/agent positioning');
}
if (!html.includes('AI and agent support where it adds value')) {
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
  'Latest development',
  'Latest release notes',
];
for (const token of requiredHtml) {
  if (!html.includes(token)) failures.push(`index.html: missing ${token}`);
}
for (const product of ['dexpot', 'intpot', 'summonpot', 'lifepot']) {
  for (const destination of [
    `https://${product}.modepot.io/docs/`,
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

for (const token of ['## Selection guide', '## Maturity and licensing', 'https://github.com/tugrulguner/dexpot', 'https://github.com/tugrulguner/intpot', 'https://github.com/tugrulguner/summonpot', 'https://github.com/tugrulguner/lifepot']) {
  if (!llms.includes(token)) failures.push(`llms.txt: missing ${token}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Verified ModePot canonical metadata, social metadata, JSON-LD, and llms.txt.');
}
