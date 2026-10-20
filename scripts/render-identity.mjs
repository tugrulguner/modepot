import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';


const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/render-identity.mjs [--check]');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fontPaths = [
  'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2',
  'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
];
const fontBytes = await Promise.all(fontPaths.map(path => readFile(new URL(path, root))));
const fonts = fontPaths.map((path, index) => ({ path, sha256: digest(fontBytes[index]) }));
const rendererSha256 = digest(await readFile(new URL(import.meta.url)));
const manifestURL = new URL('src/data/identity-renders.json', root);
const assets = [
  { source: 'public/products/modepot-lockup.svg', output: 'public/products/modepot-lockup.png', width: 1200, height: 900, format: 'png' },
  { source: 'public/modepot-og.svg', output: 'public/modepot-og.webp', width: 1200, height: 630, format: 'webp' },
];
const record = async asset => ({ ...asset, sourceSha256: digest(await readFile(new URL(asset.source, root))), outputSha256: digest(await readFile(new URL(asset.output, root))) });

if (check) {
  // Native text rasterization differs across operating systems. Bind exact source, font,
  // renderer and output bytes instead of weakening a cross-platform pixel threshold.
  // test:identity independently checks actual decoded suffix colours and dimensions.
  const committed = JSON.parse(await readFile(manifestURL, 'utf8'));
  const current = { version: 1, rendererSha256, fonts, assets: await Promise.all(assets.map(record)) };
  assert.deepEqual(committed, current, 'Identity render provenance is stale. Run npm run render:identity and commit sources, derivatives and manifest together.');
  console.log('Verified exact SHA-256 provenance for both SVGs, both declared fonts, renderer and both committed derivatives; no files written.');
} else {
  const { chromium } = await import('@playwright/test');
  const styles = `@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${fontBytes[0].toString('base64')}) format('woff2');font-weight:100 900}@font-face{font-family:'IBM Plex Mono';src:url(data:font/woff2;base64,${fontBytes[1].toString('base64')}) format('woff2');font-weight:400}html,body{margin:0;padding:0}svg{display:block}`;
  const browser = await chromium.launch();
  try {
    for (const asset of assets) {
      const page = await browser.newPage({ viewport: { width: asset.width, height: asset.height }, deviceScaleFactor: 1 });
      try {
        await page.setContent(`<style>${styles}</style>${await readFile(new URL(asset.source, root), 'utf8')}`);
        await page.evaluate(() => document.fonts.ready);
        let data;
        if (asset.format === 'png') data = await page.screenshot({ type: 'png' });
        else {
          const session = await page.context().newCDPSession(page);
          const capture = await session.send('Page.captureScreenshot', { format: 'webp', quality: 92, clip: { x: 0, y: 0, width: asset.width, height: asset.height, scale: 1 } });
          data = Buffer.from(capture.data, 'base64');
        }
        await writeFile(new URL(asset.output, root), data);
        console.log(`Rendered ${asset.output} (${asset.width}×${asset.height}) with declared local fonts.`);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  await writeFile(manifestURL, JSON.stringify({ version: 1, rendererSha256, fonts, assets: await Promise.all(assets.map(record)) }, null, 2) + '\n');
  console.log('Recorded exact source/font/renderer/output provenance in src/data/identity-renders.json.');
}
