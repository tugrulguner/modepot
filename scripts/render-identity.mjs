import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const root = new URL('../', import.meta.url);
const font = async path => (await readFile(new URL(path, root))).toString('base64');
const styles = `@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${await font('node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}@font-face{font-family:'IBM Plex Mono';src:url(data:font/woff2;base64,${await font('node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}) format('woff2');font-weight:400}html,body{margin:0;padding:0}svg{display:block}`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<style>${styles}</style>${await readFile(new URL('public/modepot-og.svg', root), 'utf8')}`);
  await page.evaluate(() => document.fonts.ready);
  const session = await page.context().newCDPSession(page);
  const { data } = await session.send('Page.captureScreenshot', { format: 'webp', quality: 92, clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
  await writeFile(new URL('public/modepot-og.webp', root), Buffer.from(data, 'base64'));
  console.log('Rendered canonical 1200x630 neutral ModePot social card with declared local fonts.');
} finally { await browser.close(); }
