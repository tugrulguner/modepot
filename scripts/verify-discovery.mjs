import { renderProjectSnapshots } from './sync-projects.mjs';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const llms = await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8');
const failures = [];
const readme = await readFile(new URL('../README.md', import.meta.url), 'utf8');
const projects = JSON.parse(await readFile(new URL('../src/data/projects.json', import.meta.url), 'utf8'));
const projectNames = projects.map(({ name }) => name);
const publicSnapshots = JSON.parse(await readFile(new URL('../dist/project-sources.json', import.meta.url), 'utf8'));
if (JSON.stringify(publicSnapshots) !== JSON.stringify(projects)) failures.push('Agent-readable JSON must match the website source snapshots');
const snapshotBlock = renderProjectSnapshots(projects);
for (const [surface, text] of [['README', readme], ['agent map', await readFile(new URL('../dist/llms.txt', import.meta.url), 'utf8')]]) {
  if (!text.includes(snapshotBlock)) failures.push(`${surface}: source and release snapshots must be generated from the same records`);
}
for (const record of projects) {
  if (!record.checkedAt || !Number.isFinite(Date.parse(record.checkedAt))) failures.push(`${record.name}: source snapshot needs a valid checked timestamp`);
}
const readmeHero = readme.slice(0, readme.indexOf('## Projects'));
for (const token of [
  '<picture>', 'srcset="public/products/modepot-lockup.png?v=wordmark-parity-1"', '<img src="public/products/modepot-lockup.png?v=wordmark-parity-1"', 'alt="ModePot — open-source software foundations, tools and games"', 'width="600"',
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
if (!readme.includes('https://dexpot.modepot.io/quick-start/') || !readme.includes('https://intpot.modepot.io/quickstart/') || !readme.includes('https://summonpot.modepot.io/quick-start/') || !readme.includes('docs/simulation-contract.md') || !readme.includes('https://refpot.modepot.io/package/')) {
  failures.push('README.md: project index must retain verified learning routes for all projects');
}
for (const product of projectNames) {
  if ((product !== 'skillpot' && !readme.includes(`https://${product}.modepot.io/`)) || !readme.includes(`https://github.com/tugrulguner/${product}`)) {
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
  '/products/refpot-lockup-v2.svg?v=public-info-1',
  '/products/skillpot-lockup.svg',
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
  refpot: 'https://refpot.modepot.io/package/',
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
const itemList = jsonLdBlocks.map(([, source]) => JSON.parse(source)).flatMap((value) => value['@graph'] ?? []).find((item) => item['@type'] === 'ItemList');
if (itemList?.numberOfItems !== projectNames.length || itemList?.itemListElement?.length !== projectNames.length) {
  failures.push(`index.html: structured project count does not match source inventory (${projectNames.length})`);
}
const skillpotSchema = itemList?.itemListElement?.find(({ item }) => item.name === 'skillpot')?.item;
if (skillpotSchema?.url !== 'https://github.com/tugrulguner/skillpot' || skillpotSchema?.codeRepository !== 'https://github.com/tugrulguner/skillpot' || skillpotSchema?.programmingLanguage || skillpotSchema?.runtimePlatform || skillpotSchema?.license) failures.push('SkillPot schema must remain repository-first without invented site, runtime, language, or license metadata');
const utilitySchema = itemList?.itemListElement?.find(({ item }) => item.name === 'utilitypot')?.item;
if (utilitySchema?.programmingLanguage !== 'JavaScript' || utilitySchema?.runtimePlatform !== 'Web browser and Cloudflare Workers' || utilitySchema?.license !== 'https://opensource.org/license/mit' || utilitySchema?.url !== 'https://utilitypot.modepot.io/' || utilitySchema?.codeRepository !== 'https://github.com/tugrulguner/utilitypot' || !utilitySchema?.description.includes('Five browser-local utilities') || !utilitySchema?.description.includes('Three AI-assisted tools') || !utilitySchema?.description.includes('after disclosed submission')) {
  failures.push('UtilityPot schema must preserve its live destination and execution boundary');
}
for (const [surface, content] of [['README', readme], ['llms', llms]]) {
  for (const token of ['https://utilitypot.modepot.io/', 'https://github.com/tugrulguner/utilitypot', 'Eight focused browser tools', 'five browser-local', 'three AI-assisted', 'One fixed workflow per tool', 'inspect results']) {
    if (!content.toLowerCase().includes(token.toLowerCase())) failures.push(`${surface}: missing UtilityPot contract ${token}`);
  }
  for (const stale of ['Seven tools', 'four browser-local', 'four local converters']) {
    if (content.toLowerCase().includes(stale.toLowerCase())) failures.push(`${surface}: stale UtilityPot inventory ${stale}`);
  }
}
if (!html.includes('href="#utilitypot"')) failures.push('UtilityPot must appear in the shared chooser');
if (!html.includes('href="#skillpot"') || !html.includes('https://github.com/tugrulguner/skillpot')) failures.push('SkillPot must appear in discovery and link to its repository');
const skillpotCard = html.slice(html.indexOf('id="skillpot"'), html.indexOf('</article>', html.indexOf('id="skillpot"')));
for (const token of ['In development', 'v0.2.0', 'broad usefulness evaluation not established', 'Illustrative skill contract · not a live task run', 'Source snapshot', 'Quickstart']) if (!skillpotCard.includes(token)) failures.push(`SkillPot card must show current maturity and discovery: ${token}`);
if (!skillpotCard.includes('https://github.com/tugrulguner/skillpot/releases/tag/v0.2.0') || skillpotCard.includes('skillpot.modepot.io/')) failures.push('SkillPot card must link its verified collection release and avoid inventing a product website');
const dexpotSchema = itemList?.itemListElement?.find(({ item }) => item.name === 'dexpot')?.item;
if (html.includes('Response[T]') || llms.includes('Response[T]')) {
  failures.push('Dexpot declares output with response=T; Response[T] is not a public API');
}
if (!dexpotSchema?.description?.includes('response=T validates and projects public output') || !dexpotSchema.description.includes('Any is not a privacy filter')) {
  failures.push('index.html: Dexpot structured data must carry the current response contract');
}
const refpotSchema = itemList?.itemListElement?.find(({ item }) => item.name === 'refpot')?.item;
if (JSON.stringify(refpotSchema?.programmingLanguage) !== JSON.stringify(['C++', 'Python']) || refpotSchema?.runtimePlatform !== 'CPython 3.11–3.14 on Linux x86_64 and macOS arm64' || refpotSchema?.license !== 'https://opensource.org/license/mit') {
  failures.push('index.html: RefPot structured data must match its verified native/Python runtime and MIT license');
}
if (llms.includes("RefPot's license and distribution policy remain undecided") || !llms.includes('https://github.com/tugrulguner/refpot/blob/main/LICENSE')) {
  failures.push('llms.txt: RefPot MIT license must not remain labeled undecided');
}
const refpotMetadata = projects.find(({ name }) => name === 'refpot');
const refpotRelease = {
  tag: 'v0.1.1',
  url: 'https://github.com/tugrulguner/refpot/releases/tag/v0.1.1',
  publishedAt: '2026-10-12T17:32:11Z',
};
if (!refpotMetadata?.latestRelease || refpotMetadata.latestRelease.url !== `https://github.com/tugrulguner/refpot/releases/tag/${refpotMetadata.latestRelease.tag}` || !Number.isFinite(Date.parse(refpotMetadata.latestRelease.publishedAt))) {
  failures.push('RefPot source metadata must identify a valid published release, without freezing future refreshes to the historical v0.1.1 evidence');
}
const refpotCommit = refpotMetadata?.commit ?? '';
if (!/^[a-f0-9]{40}$/.test(refpotCommit) || refpotMetadata.commitUrl !== `https://github.com/tugrulguner/refpot/commit/${refpotCommit}` || refpotMetadata.readme.url !== `https://github.com/tugrulguner/refpot/blob/${refpotCommit}/README.md` || refpotMetadata.roadmap.url !== `https://github.com/tugrulguner/refpot/blob/${refpotCommit}/ROADMAP.md`) {
  failures.push('RefPot source provenance must use consistent, valid current-commit anchors');
}
const refpotFacts = [
  'publicly released experimental alpha', 'v0.1.1', 'native C++',
  'fixed-schema CRUD', 'explicit transactions', 'SQL and ORM remain planned',
  'no broad performance', 'production-durability claim',
];
for (const [surface, content] of [['README.md', readme], ['llms.txt', llms], ['index.html', html]]) {
  for (const fact of refpotFacts) if (!content.includes(fact)) failures.push(`${surface}: RefPot must preserve verified alpha fact “${fact}”`);
}
const refpotStart = html.indexOf('id="refpot"');
const refpotEnd = html.indexOf('</article>', refpotStart);
const refpotCard = refpotStart >= 0 && refpotEnd >= 0 ? html.slice(refpotStart, refpotEnd) : '';
if (readme.includes('No engine or package is released') || readme.includes('not an installable engine') || llms.includes('there is no installable package') || refpotCard.includes('No published release yet')) {
  failures.push('RefPot summary must not retain obsolete unreleased/no-package claims');
}
if (!readme.includes('https://refpot.modepot.io/package/') || !readme.includes(refpotRelease.url) || !llms.includes(refpotRelease.url)) {
  failures.push('RefPot quick start and v0.1.1 release evidence must be linked in human- and agent-readable summaries');
}

for (const product of projectNames) {
  if ((html.match(new RegExp(`class="product product-[^"]+" id="${product}"`, 'g')) ?? []).length !== 1) {
    failures.push(`index.html: expected exactly one project card for ${product}`);
  }
  if (!html.includes(`https://github.com/tugrulguner/${product}/commit/`)) {
    failures.push(`index.html: missing source-backed development link for ${product}`);
  }
  if (!html.includes(`data-posthog-project="${product}"`) || !html.includes('data-posthog-surface="modepot_homepage"')) {
    failures.push(`index.html: missing project intent event markers for ${product}`);
  }
  const metadata = projects.find((entry) => entry.name === product);
  const start = html.indexOf(`id="${product}"`);
  const card = html.slice(start, html.indexOf('</article>', start));
  for (const token of [metadata.commit.slice(0, 7), metadata.readme.sha256.slice(0, 12), metadata.roadmap.status === 'available' ? metadata.roadmap.sha256.slice(0, 12) : 'not published']) {
    if (!card.includes(token)) failures.push(`index.html: project metadata provenance missing ${token} for ${product}`);
  }
  if (metadata.latestRelease && (!card.includes(metadata.latestRelease.tag) || !card.includes(metadata.latestRelease.url))) {
    failures.push(`index.html: published release metadata missing for ${product}`);
  }
  if (!metadata.latestRelease && product !== 'skillpot' && !card.includes('No release recorded')) {
    failures.push(`index.html: explicit no-release state missing for ${product}`);
  }
  if (!metadata.checkedAt || !card.includes(metadata.checkedAt) || !card.includes('Source snapshot')) failures.push(`index.html: timestamped source snapshot missing for ${product}`);
}
for (const destination of projectNames.map((product) => `https://github.com/tugrulguner/${product}`)) {
  const repoLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)].filter(([, href]) => href === destination);
  if (repoLinks.some(([tag]) => !tag.includes('ph-no-autocapture') || !(tag.includes('data-posthog-event="modepot_resource_clicked"') || (destination.endsWith('/skillpot') && tag.includes('data-posthog-destination-type="repository"'))) || !(tag.includes('data-posthog-resource-type="repository"') || destination.endsWith('/skillpot')))) {
    failures.push(`index.html: repository link ${destination} must emit resource intent only and exclude autocapture`);
  }
}
const projectEventLinks = [...html.matchAll(/<a\b[^>]*data-posthog-event="modepot_project_clicked"[^>]*>/g)];
const expectedProjectEventLinks = projectNames.length * 2;
if (projectEventLinks.length !== expectedProjectEventLinks) failures.push(`index.html: expected ${expectedProjectEventLinks} explicit project links, found ${projectEventLinks.length}`);
for (const [index, [tag]] of projectEventLinks.entries()) {
  if (!tag.includes('ph-no-autocapture')) failures.push(`index.html: project event link ${index + 1} must exclude autocapture`);
  for (const attribute of ['data-posthog-project=', 'data-posthog-surface="modepot_homepage"']) {
    if (!tag.includes(attribute)) failures.push(`index.html: project event link ${index + 1} missing ${attribute}`);
  }
}
if (!html.includes("document.addEventListener('auxclick', captureOutboundEvent)") || !html.includes("event.type === 'auxclick' && event.button !== 1")) {
  failures.push('index.html: middle-button activation must be tracked and non-middle auxclick excluded');
}
for (const token of ['## Quick starts and documentation', 'https://dexpot.modepot.io/quick-start/', 'response=T` validates/projects public output', 'invalid output is sanitized as a 500 before success bytes', '`Any` is not a privacy filter', 'This response contract is published in v0.7.0', 'https://intpot.modepot.io/quickstart/', 'https://summonpot.modepot.io/quick-start/', '## Contribute to ModePot', 'CONTRIBUTING.md', 'Propose a Dexpot feature', 'Discord', '## Selection guide', '## Maturity and licensing', 'https://github.com/tugrulguner/dexpot', 'https://github.com/tugrulguner/intpot', 'https://github.com/tugrulguner/summonpot', 'https://github.com/tugrulguner/lifepot', 'https://github.com/tugrulguner/refpot', 'https://github.com/tugrulguner/refpot/blob/main/LICENSE']) {
  if (!llms.includes(token)) failures.push(`llms.txt: missing ${token}`);
}

for (const [surface, content] of [['README.md', readme], ['llms.txt', llms]]) {
  for (const token of ['## Releases and changelogs', 'https://github.com/tugrulguner/intpot/releases']) {
    if (!content.includes(token)) failures.push(`${surface}: missing evergreen release discovery ${token}`);
  }
  for (const stale of ['## Intpot v0.11.0', '## Intpot v0.10.0', 'discussions/205', 'discussions/192']) {
    if (content.includes(stale)) failures.push(`${surface}: version-specific announcement should link to evergreen release information (${stale})`);
  }
}

for (const [surface, content] of [['README', readme], ['llms', llms], ['index.html', html]]) {
  for (const token of ['https://github.com/tugrulguner/skillpot', 'v0.2.0', 'seven', 'in development']) if (!content.toLowerCase().includes(token.toLowerCase())) failures.push(`${surface}: missing SkillPot current status ${token}`);
  if (content.includes('skillpot.modepot.io')) failures.push(`${surface}: invented SkillPot website destination`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Verified ModePot canonical metadata, social metadata, JSON-LD, and llms.txt.');
}
