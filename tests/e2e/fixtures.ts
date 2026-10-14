import { test as base, expect, type Page } from '@playwright/test';

/** Fails a test if the page logs a console error or throws. */
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));
    await provide(errors);
    expect(errors, 'console errors').toEqual([]);
  },
});

export { expect };

/** Load a page with a fresh workspace and wait for the shell. */
export async function open(page: Page, path = '/') {
  await page.goto(path);
  await expect(page.getByRole('navigation', { name: 'Main' }).or(page.getByRole('button', { name: 'Open menu' })).first()).toBeVisible();
}

export const toast = (page: Page, title: string) => page.getByRole('status').getByText(title, { exact: true });
