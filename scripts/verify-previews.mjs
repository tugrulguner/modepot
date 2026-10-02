import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const dexBytes = await readFile(new URL('../fixtures/dexpot-typed-crud-capture.json', import.meta.url));
const intBytes = await readFile(new URL('../fixtures/intpot-demo-preview.json', import.meta.url));
const dexCapture = JSON.parse(dexBytes);
const intCapture = JSON.parse(intBytes);
const failures = [];
const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const dexStep = dexCapture.steps[0];
const dexRequest = `${dexStep.method} ${dexStep.path}`;
const dexResponse = JSON.stringify(dexStep.response);
const intExample = intCapture.examples.find(({ id }) => id === 'greet');
const intRequest = `greet(${Object.entries(intExample.input).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(', ')})`;
const intOutput = `CLI  → ${intExample.interfaces.cli.trim()}\nHTTP → ${intExample.interfaces.api}\nMCP  → ${intExample.interfaces.mcp}`;
const sources = {
  dexpot: {
    bytes: dexBytes,
    hash: '12e3b9f08b83075e4f514714c0b7459e0ecdb4c2940b997dd2715f1f13cf9c2b',
    href: 'https://github.com/tugrulguner/dexpot/blob/c2adef4c8cfc4635e56cbb562e861b235311d6c0/website/src/content/docs/data/typed-crud-capture.json',
  },
  intpot: {
    bytes: intBytes,
    hash: 'b9cc223c7626dcf6126020a9dbb97599de3a141a415793f15f55c06500b5efda',
    href: 'https://github.com/tugrulguner/intpot/blob/b32a9025c6e4f9a536fea8c285816561adba9b0e/website/src/data/demo-preview.json',
  },
};
for (const [project, source] of Object.entries(sources)) {
  const actualHash = createHash('sha256').update(source.bytes).digest('hex');
  if (actualHash !== source.hash) failures.push(`${project}: fixture differs from reviewed source capture (expected ${source.hash}, got ${actualHash})`);
  if (!html.includes(`href=\"${source.href}\"`)) failures.push(`${project}: missing commit-pinned capture provenance`);
}
const expected = {
  dexpot: { label: 'Recorded HTTP example', href: 'https://dexpot.modepot.io/examples/', text: `Recorded request · ${dexRequest}`, evidence: escapeHtml(dexResponse) },
  intpot: { label: 'Recorded CLI · HTTP · MCP', href: 'https://intpot.modepot.io/#demo-preview-title', text: escapeHtml(intRequest), evidence: escapeHtml(intOutput) },
  summonpot: { label: 'Recorded keyless contract trace', href: 'https://summonpot.modepot.io/#agent-demo-title', text: '', evidence: 'Ada · customer-7 · detailed' },
  lifepot: { label: 'Browser-local preset preview', href: 'https://lifepot.modepot.io/', text: '', evidence: 'DETERMINISTIC · NO LIVE JEV' },
};
for (const [project, preview] of Object.entries(expected)) {
  const card = html.match(new RegExp(`<article class="product product-[^"]+" id="${project}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) {
    failures.push(`missing ${project} project card`);
    continue;
  }
  if (!card.includes(preview.label)) failures.push(`${project}: missing preview label`);
  if (!card.includes(`href="${preview.href}"`)) failures.push(`${project}: missing direct demo route ${preview.href}`);
  if (preview.text && !card.includes(preview.text)) failures.push(`${project}: preview request/input does not match canonical capture`);
  if (!card.includes(preview.evidence)) failures.push(`${project}: preview does not exactly reflect its canonical capture`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Verified preview labels, source-hashed Dexpot/Intpot captures, and direct routes.');
