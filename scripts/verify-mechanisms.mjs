import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const failures = [];
const expected = {
  dexpot: ['Request', 'Typed validation', 'Response'],
  intpot: ['One typed function', 'CLI', 'HTTP', 'MCP'],
  summonpot: ['Fixed request-owned values', 'Bounded agent choice', 'Application result'],
  lifepot: ['Cells evolve', 'Explore LifePot and choose a preset'],
};
for (const [project, concepts] of Object.entries(expected)) {
  const card = html.match(new RegExp(`<article class="product product-[^"]+" id="${project}">([\\s\\S]*?)<\\/article>`))?.[1];
  if (!card) {
    failures.push(`missing ${project} project card`);
    continue;
  }
  const normalized = card.replaceAll('<br>', ' ');
  for (const concept of concepts) if (!normalized.includes(concept)) failures.push(`${project}: missing mechanism concept “${concept}”`);
  const route = project === 'lifepot' ? 'https://lifepot.modepot.io/' : `https://${project}.modepot.io/playground/`;
  if (!card.includes(`href="${route}"`)) failures.push(`${project}: missing project-owned playground route`);
  if (!card.includes('Illustrative animation')) failures.push(`${project}: animation is not labeled illustrative`);
}
if (html.includes('Recorded HTTP example') || html.includes('Recorded CLI') || html.includes('keyless contract trace')) failures.push('recording-panel content remains in built homepage');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Verified four illustrative mechanism previews, playground routes, and no recording-panel content.');
