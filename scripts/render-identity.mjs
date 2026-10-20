import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const root = new URL('../', import.meta.url);
const check = process.argv.includes('--check');
if (process.argv.slice(2).some(arg => arg !== '--check')) throw new Error('Usage: node scripts/render-identity.mjs [--check]');
const font = async path => (await readFile(new URL(path, root))).toString('base64');
const styles = `@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${await font('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}@font-face{font-family:'IBM Plex Mono';src:url(data:font/woff2;base64,${await font('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}) format('woff2');font-weight:400}html,body{margin:0;padding:0}svg{display:block}`;
const assets = [
  { source: 'public/products/modepot-lockup.svg', output: 'public/products/modepot-lockup.png', width: 1200, height: 900, format: 'png' },
  { source: 'public/modepot-og.svg', output: 'public/modepot-og.webp', width: 1200, height: 630, format: 'webp' },
];
const browser = await chromium.launch();
try {
  for (const asset of assets) {
    const page = await browser.newPage({ viewport: { width: asset.width, height: asset.height }, deviceScaleFactor: 1 });
    try {
      await page.setContent(`<style>${styles}</style>${await readFile(new URL(asset.source, root), 'utf8')}`);
      await page.evaluate(() => document.fonts.ready);
      // Capture a lossless reference for the read-only comparison. Do not rewrite sources or derivatives in --check mode.
      const expected = await page.screenshot({ type: 'png' });
      if (check) {
        const committed = await readFile(new URL(asset.output, root));
        const result = await page.evaluate(async ({ expected, committed, format, width, height }) => {
          const decode = async (data, type) => {
            const image = new Image(); image.src = `data:image/${type};base64,${data}`; await image.decode(); return image;
          };
          const reference = await decode(expected, 'png');
          const actual = await decode(committed, format);
          if (actual.naturalWidth !== width || actual.naturalHeight !== height) return { dimensions: false };
          // Half-size sampling and a 24/255 channel tolerance ignore small cross-platform font/WebP antialias differences.
          const pixels = image => {
            const canvas = document.createElement('canvas'); canvas.width = width / 2; canvas.height = height / 2;
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, canvas.width, canvas.height);
            return context.getImageData(0, 0, canvas.width, canvas.height).data;
          };
          const a = pixels(reference), b = pixels(actual); let changed = 0;
          for (let i = 0; i < a.length; i += 4) if ([0, 1, 2, 3].some(channel => Math.abs(a[i + channel] - b[i + channel]) > 24)) changed++;
          return { dimensions: true, changedRatio: changed / (a.length / 4) };
        }, { expected: expected.toString('base64'), committed: committed.toString('base64'), ...asset });
        if (!result.dimensions || result.changedRatio > 0.002) throw new Error(`${asset.output} is stale or differs from its canonical SVG: ${JSON.stringify(result)}. Run npm run render:identity.`);
        console.log(`Verified ${asset.output} against its canonical SVG (${result.changedRatio} changed fraction).`);
      } else {
        let data = expected;
        if (asset.format === 'webp') {
          const session = await page.context().newCDPSession(page);
          const capture = await session.send('Page.captureScreenshot', { format: 'webp', quality: 92, clip: { x: 0, y: 0, width: asset.width, height: asset.height, scale: 1 } });
          data = Buffer.from(capture.data, 'base64');
        }
        await writeFile(new URL(asset.output, root), data);
        console.log(`Rendered ${asset.output} (${asset.width}×${asset.height}) with declared local fonts.`);
      }
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
