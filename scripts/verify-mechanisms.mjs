import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const stylesheet = await readFile(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const mark = await readFile(new URL('../public/marks/refpot-mark.svg', import.meta.url), 'utf8');
const lockup = await readFile(new URL('../public/products/refpot-lockup-v2.svg', import.meta.url), 'utf8');
const failures = [];
const lifeSeed = ['00000000', '00100000', '00010000', '01110000', '00000000', '00000000', '00000000', '00000000'];
const lifeStep = (grid) => grid.map((row, y) => [...row].map((cell, x) => {
  let neighbors = 0;
  for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
    if (!dx && !dy) continue;
    neighbors += grid[(y + dy + 8) % 8][(x + dx + 8) % 8] === '1' ? 1 : 0;
  }
  return neighbors === 3 || (cell === '1' && neighbors === 2) ? '1' : '0';
}).join(''));
const lifeExpected = [lifeSeed];
for (let i = 1; i < 4; i += 1) lifeExpected.push(lifeStep(lifeExpected[i - 1]));
const expected = {
  dexpot: ['Request', 'Typed validation', 'Response'],
  intpot: ['One typed function', 'CLI', 'HTTP', 'MCP'],
  summonpot: ['Fixed request-owned values', 'Bounded agent choice', 'Application result'],
  lifepot: ['Birth · death · movement', 'Explore LifePot and choose a preset'],
  refpot: ['DIRECT SQL', 'SQL statements', 'STRUCTURED ORM', 'Python operations', 'PROPOSED EXECUTION CORE', 'Shared relational engine'],
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
  if (project !== 'refpot' && !card.includes(`href="${route}"`)) failures.push(`${project}: missing project-owned playground route`);
  if (project === 'refpot') {
    if (!card.includes('Illustrative animation · proposed architecture, not a live run')) failures.push('refpot: proposed architecture animation is not honestly labeled');
    if (!card.includes('two proposed entry paths') || !card.includes('converge on one shared relational execution core')) failures.push('refpot: accessible equivalent must describe both paths converging on the core');
    if (card.includes('Open project playground') || card.includes('class="demo-route')) failures.push('refpot: unshipped playground destination is present');
    if (!card.includes('https://refpot.modepot.io/design/')) failures.push('refpot: missing design documentation destination');
    if (!card.includes('/products/refpot-lockup-v2.svg')) failures.push('refpot: lockup URL is not cache-versioned');
    for (const className of ['ref-sql', 'ref-orm', 'ref-core', 'ref-flow-sql', 'ref-flow-orm']) {
      if (!card.includes(className)) failures.push(`refpot: missing proposed path/core step ${className}`);
    }
  } else if (!card.includes('Illustrative animation')) failures.push(`${project}: animation is not labeled illustrative`);
  if (project === 'lifepot') {
    const frames = [...card.matchAll(/<div class="life-generation" data-generation="(\d+)"[^>]*>(.*?)<\/div>/gs)];
    if (frames.length !== 4) failures.push(`lifepot: expected 4 generation frames, got ${frames.length}`);
    const actual = frames.map(([, generation, body], index) => {
      const cells = [...body.matchAll(/<i(?: class(?:="([^"]*)")?)?><\/i>/g)].map(([, cellClass]) => cellClass === 'alive' ? '1' : '0');
      const grid = Array.from({ length: 8 }, (_, y) => cells.slice(y * 8, y * 8 + 8).join(''));
      if (Number(generation) !== index) failures.push(`lifepot: unexpected generation index ${generation}`);
      if (grid.join('') !== lifeExpected[index]?.join('')) failures.push(`lifepot: generation ${index} does not follow Conway rules`);
      return grid.join('');
    });
    if (new Set(actual).size !== 4) failures.push('lifepot: generations are not distinct');
    if (!card.includes('Game of Life') || !card.includes('neighbor-count birth and survival rules')) failures.push('lifepot: missing accessible explanation of generation rules');
  }
}
if (html.includes('Recorded HTTP example') || html.includes('Recorded CLI') || html.includes('keyless contract trace')) failures.push('recording-panel content remains in built homepage');
if (mark.includes('#58DFB4') || !mark.includes('#F4F2EA')) failures.push('refpot: compact mark must use the neutral RefPot accent');
if (lockup.includes('#58DFB4') || !lockup.includes('#F4F2EA')) failures.push('refpot: versioned lockup must use the neutral RefPot accent');
if (!stylesheet.includes('.product-refpot { --accent: #F4F2EA;') || stylesheet.includes('#refpot .product-copy') || stylesheet.includes('#refpot .demo-preview')) failures.push('refpot: off-white accent must use the shared card and preview surfaces');
if (html.includes('/products/refpot-lockup.png')) failures.push('refpot: stale lockup URL remains in built homepage');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else console.log('Verified five project previews, truthful RefPot architecture status, and no recording-panel content.');
