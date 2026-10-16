import { test, expect } from "@playwright/test";
const projects = [
  "dexpot",
  "intpot",
  "summonpot",
  "lifepot",
  "refpot",
  "utilitypot",
];
for (const name of projects)
  test(`${name} artwork retains an off-white prefix and amber pot`, async ({
    page,
  }) => {
    await page.goto("/");
    const image = page.locator(`#${name} .product-art img`);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("filter", "none");
    await expect(image).toHaveCSS("transform", "none");

    const counts = await image.evaluate(async (im) => {
      if (!(im instanceof HTMLImageElement)) throw Error("Expected HTML image");
      await im.decode();
      const canvas = document.createElement("canvas");
      canvas.width = im.naturalWidth;
      canvas.height = im.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(im, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let white = 0,
        gold = 0;
      for (let y = 330; y < 470; y++)
        for (let x = 510; x < 1100; x++) {
          const k = (y * canvas.width + x) * 4,
            r = data[k],
            g = data[k + 1],
            b = data[k + 2];
          if (
            x < 610 &&
            Math.abs(r - 244) < 14 &&
            Math.abs(g - 241) < 14 &&
            Math.abs(b - 233) < 14
          )
            white++;
          if (
            x > 710 &&
            Math.abs(r - 242) < 14 &&
            Math.abs(g - 184) < 14 &&
            Math.abs(b - 75) < 14
          )
            gold++;
        }
      return { width: canvas.width, height: canvas.height, white, gold };
    });
    await image.hover();
    await expect(image).toHaveCSS("object-fit", "contain");
    await expect(image).toHaveCSS("filter", "none");
    await expect(image).toHaveCSS("transform", "none");
    await image.screenshot({ path: test.info().outputPath(`${name}-artwork.png`) });
    expect(counts.width).toBe(1200);
    expect(counts.height).toBe(900);
    expect(
      counts.white,
      "name prefix must not become entirely amber",
    ).toBeGreaterThan(100);
    expect(
      counts.gold,
      "pot suffix must be amber inside the wordmark, not elsewhere in the poster",
    ).toBeGreaterThan(100);
  });
test("UtilityPot flask has its own rose accent, distinct from Intpot orange", async ({
  page,
}) => {
  await page.goto("/");
  for (const [name, colour] of [
    ["utilitypot", [242, 140, 190]],
    ["intpot", [242, 184, 75]],
  ]) {
    const icon = page.locator(`#${name} .product-mark`);
    await icon.scrollIntoViewIfNeeded();
    const matching = await icon.evaluate(async (im, target) => {
      if (!(im instanceof HTMLImageElement)) throw Error("Expected HTML image");
      await im.decode();
      const c = document.createElement("canvas");
      c.width = im.naturalWidth;
      c.height = im.naturalHeight;
      const ctx = c.getContext("2d");
      ctx.drawImage(im, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      let count = 0;
      for (let k = 0; k < data.length; k += 4)
        if (
          data[k + 3] > 200 &&
          target.every((v, i) => Math.abs(data[k + i] - v) < 12)
        )
          count++;
      return count;
    }, colour);
    expect(matching, `${name} flask identity colour`).toBeGreaterThan(40);
  }
});
