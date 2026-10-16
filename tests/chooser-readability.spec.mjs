import { test, expect } from "@playwright/test";
for (const width of [1280, 1050, 390])
  test(`project chooser has a readable introduction at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const chooser = page.locator(".mode-selector");
    await chooser.scrollIntoViewIfNeeded();
    const heading = chooser.getByRole("heading", {
      name: "Which ModePot project should you use?",
    });
    const box = await heading.boundingBox();
    expect(box.width).toBeGreaterThan(200);
    expect(box.height).toBeGreaterThanOrEqual(24);
    if (width >= 1050)
      for (const label of await chooser.locator(".selector-label").all()) {
        const style = await label.evaluate((e) => {
          const s = getComputedStyle(e);
          const lum = (rgb) =>
            rgb
              .match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
              .map((v) => {
                v /= 255;
                return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
              })
              .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
          let p = e;
          let bg;
          while (p) {
            bg = getComputedStyle(p).backgroundColor;
            if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") break;
            p = p.parentElement;
          }
          const a = lum(s.color),
            b = lum(bg);
          return {
            font: parseFloat(s.fontSize),
            contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          };
        });
        expect(style.font).toBeGreaterThanOrEqual(16);
        expect(style.contrast).toBeGreaterThanOrEqual(7);
      }
    await expect(chooser.locator(".selector-row")).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await chooser.screenshot({
      path: test.info().outputPath(`chooser-${width}.png`),
    });
  });
