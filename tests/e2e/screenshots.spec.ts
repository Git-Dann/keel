import { test, expect } from './fixtures';

const PAGES: [string, string][] = [
  ['home', '/'],
  ['contracts', '/contracts'],
  ['contract-drawer', '/contracts?open=c3'],
  ['ai', '/ai'],
  ['ai-drawer', '/ai?open=a4'],
  ['tribunal', '/tribunal'],
  ['accounts', '/accounts?open=p1'],
  ['board', '/board'],
  ['case-for-keel', '/case-for-keel'],
];
const WIDTHS = [375, 768, 1440];
const THEMES = ['light', 'dark'] as const;

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    test(`screenshots at ${width}px, ${theme}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: width < 500 ? 812 : 900 });
      for (const [name, path] of PAGES) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        if (name === 'accounts') await expect(page.getByText('In one line')).toBeVisible({ timeout: 6000 });
        await page.waitForTimeout(250);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(overflow, `${name} scrolls sideways at ${width}px`).toBe(false);
        await page.screenshot({ path: `tests/screenshots/${name}-${width}-${theme}.png`, fullPage: false });
      }
    });
  }
}
