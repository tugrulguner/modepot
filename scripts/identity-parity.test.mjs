import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const read = async path => readFile(new URL(`../${path}`, import.meta.url));
const surfaces = [
  { svg: 'public/products/modepot-lockup.svg', raster: 'public/products/modepot-lockup.png', width: 1200, height: 900, format: 'png' },
  { svg: 'public/modepot-og.svg', raster: 'public/modepot-og.webp', width: 1200, height: 630, format: 'webp' },
];
const paths = source => [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(match => match[1]);
const palette = ['#66d9ff', '#a987ff', '#77e5bd'];

async function inspect(asset) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const svg = (await read(asset.svg)).toString();
    const font = (await read('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')).toString('base64');
    await page.setContent(`<style>@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${font}) format('woff2');font-weight:100 900}body{margin:0}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => {
      const word = [...document.querySelectorAll('text')].find(text => text.textContent.trim() === 'modepot');
      if (!word) throw new Error('ModePot wordmark not found');
      const suffix = word.querySelector('tspan');
      const box = el => { const b = el.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; };
      const bounds = box(word), suffixBounds = box(suffix);
      const fill = suffix.getAttribute('fill');
      const id = fill?.match(/url\(#([^)]*)\)/)?.[1];
      const gradient = id && document.getElementById(id);
      return {
        font: getComputedStyle(word).fontFamily,
        weight: getComputedStyle(word).fontWeight,
        tracking: Number.parseFloat(getComputedStyle(word).letterSpacing) / Number.parseFloat(getComputedStyle(word).fontSize),
        prefix: { ...bounds, width: suffixBounds.x - bounds.x }, suffix: suffixBounds,
        gradient: gradient && {
          units: gradient.getAttribute('gradientUnits'),
          x1: Number(gradient.getAttribute('x1')), y1: Number(gradient.getAttribute('y1')),
          x2: Number(gradient.getAttribute('x2')), y2: Number(gradient.getAttribute('y2')),
          stops: [...gradient.querySelectorAll('stop')].map(stop => ({ color: stop.getAttribute('stop-color').toLowerCase(), offset: stop.getAttribute('offset') })),
        },
      };
    });
    return { svg, geometry };
  } finally { await browser.close(); }
}
const cached = new Map();
const inspected = asset => { if (!cached.has(asset.svg)) cached.set(asset.svg, inspect(asset)); return cached.get(asset.svg); };

for (const asset of surfaces) {
  test(`${asset.svg}: website gradient, typography and unchanged flask paths`, async () => {
    const { svg, geometry: g } = await inspected(asset);
    const canonical = paths((await read('public/modepot-mark.svg')).toString());
    assert.deepEqual(paths(svg).filter(d => canonical.includes(d)), canonical, 'canonical vessel and M paths must remain unchanged');
    assert.match(g.font, /Manrope/);
    assert.equal(Number(g.weight), 720, 'wordmark weight must match the website hero');
    assert.ok(Math.abs(g.tracking + 0.085) < 0.0001, 'tracking must match website -.085em');
    assert.ok(g.gradient, 'suffix itself must reference a gradient, not flat mint');
    assert.equal(g.gradient.units, 'userSpaceOnUse');
    assert.deepEqual(g.gradient.stops.map(s => s.color), palette);
    assert.deepEqual(g.gradient.stops.map(s => s.offset), ['0%', '52%', '100%']);
    // CSS 0deg points up; native SVG 0deg points right. Check direction, not a misleading rotate(105) literal.
    const angle = (Math.atan2(g.gradient.x2 - g.gradient.x1, -(g.gradient.y2 - g.gradient.y1)) * 180 / Math.PI + 360) % 360;
    assert.ok(Math.abs(angle - 105) < 0.01, `actual SVG direction must equal CSS 105deg, got ${angle}`);
    const css = (await read('src/styles/multicolour-identity.css')).toString().toLowerCase();
    assert.match(css, /linear-gradient\(105deg, #66d9ff 0%, #a987ff 52%, #77e5bd 100%\)/);
  });

  test(`${asset.raster}: gradient colours inside the measured suffix; off-white prefix`, async () => {
    const { geometry } = await inspected(asset);
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      const result = await page.evaluate(async ({ data, format, geometry, palette }) => {
        const image = new Image(); image.src = `data:image/${format};base64,${data}`; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const count = (box, color) => {
          const rgb = color.match(/[0-9a-f]{2}/gi).map(value => parseInt(value, 16)); let n = 0;
          for (let y = Math.max(0, Math.floor(box.y)); y < Math.min(canvas.height, Math.ceil(box.y + box.height)); y++)
            for (let x = Math.max(0, Math.floor(box.x)); x < Math.min(canvas.width, Math.ceil(box.x + box.width)); x++) {
              const i = (y * canvas.width + x) * 4;
              if (pixels[i + 3] > 180 && rgb.every((channel, k) => Math.abs(pixels[i + k] - channel) <= 42)) n++;
            }
          return n;
        };
        return { width: canvas.width, height: canvas.height, suffix: palette.map(color => count(geometry.suffix, color)), prefix: count(geometry.prefix, '#f4f0e7') };
      }, { data: (await read(asset.raster)).toString('base64'), format: asset.format, geometry, palette });
      assert.equal(result.width, asset.width); assert.equal(result.height, asset.height);
      for (const [index, color] of palette.entries()) assert.ok(result.suffix[index] >= 15, `measured pot suffix lacks ${color}: ${result.suffix[index]} pixels`);
      assert.ok(result.prefix >= 100, 'mode prefix must remain off-white');
    } finally { await browser.close(); }
  });
}

test('family guide covers every current product and social copy retains qualified AI positioning', async () => {
  const guide = (await read('BRAND.md')).toString();
  const projects = JSON.parse((await read('src/data/projects.json')).toString());
  for (const { name } of projects) assert.ok(guide.toLowerCase().includes(`| ${name} |`), `brand guide omits ${name}`);
  const og = (await read('public/modepot-og.svg')).toString().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  assert.match(og, /AI-native and agent-friendly where they add real value/i);
  assert.doesNotMatch(og, /Agent-native/i);
  assert.match((await read('README.md')).toString(), /AI-native and agent-friendly where they add real value/i);
});

test('read-only provenance rejects every stale source/font/renderer/output without rewriting files', async () => {
  const manifest = JSON.parse((await read('src/data/identity-renders.json')).toString());
  const files = [...new Set(['scripts/render-identity.mjs', 'src/data/identity-renders.json', ...manifest.fonts.map(font => font.path), ...manifest.assets.flatMap(asset => [asset.source, asset.output])])];
  const original = new Map(await Promise.all(files.map(async file => [file, await read(file)])));
  const directory = await mkdtemp(join(tmpdir(), 'modepot-identity-'));
  const hashes = async () => Promise.all(files.map(async file => createHash('sha256').update(await readFile(join(directory, file))).digest('hex')));
  try {
    for (const [file, bytes] of original) {
      await mkdir(join(directory, file, '..'), { recursive: true });
      await writeFile(join(directory, file), bytes);
    }
    const run = async expected => {
      const before = await hashes();
      const result = spawnSync(process.execPath, ['scripts/render-identity.mjs', '--check'], { cwd: directory, encoding: 'utf8' });
      assert.equal(result.status, expected, result.stderr || result.stdout);
      await assert.deepEqual(await hashes(), before, '--check must not rewrite sources, derivatives or manifest');
    };
    await run(0);
    for (const file of files) {
      const bytes = original.get(file);
      const changed = file.endsWith('.mjs') ? Buffer.concat([bytes, Buffer.from('\n// stale renderer\n')])
        : file.endsWith('.json') ? Buffer.from(JSON.stringify({ ...JSON.parse(bytes.toString()), version: 99 }))
        : Buffer.concat([bytes, Buffer.from('\n')]);
      await writeFile(join(directory, file), changed);
      await run(1);
      await writeFile(join(directory, file), bytes);
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});
