import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const failures = [];
const expected = {
  dexpot: { label: 'Recorded HTTP example', href: 'https://dexpot.modepot.io/examples/', evidence: '{&quot;id&quot;:7,&quot;name&quot;:&quot;item-7&quot;,&quot;price&quot;:7.0}' },
  intpot: { label: 'Recorded CLI · HTTP · MCP', href: 'https://intpot.modepot.io/#agent-demo-title', evidence: 'Hello, Ada!' },
  summonpot: { label: 'Recorded keyless contract trace', href: 'https://summonpot.modepot.io/#agent-demo-title', evidence: 'Ada · customer-7 · detailed' },
  lifepot: { label: 'Browser-local preset preview', href: 'https://lifepot.modepot.io/', evidence: 'DETERMINISTIC · NO LIVE JEV' },
};
for (const [project, preview] of Object.entries(expected)) {
  const card = html.match(new RegExp(`<article class="product product-[^"]+" id="${project}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) {
    failures.push(`missing ${project} project card`);
    continue;
  }
  if (!card.includes(preview.label)) failures.push(`${project}: missing preview label`);
  if (!card.includes(`href="${preview.href}"`)) failures.push(`${project}: missing direct demo route ${preview.href}`);
  if (!card.includes(preview.evidence)) failures.push(`${project}: missing recorded/static preview evidence`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Verified four honest preview labels, content markers, and direct routes.');
