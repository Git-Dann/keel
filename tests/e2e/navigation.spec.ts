import { test, expect, open } from './fixtures';

const PAGES: [string, string][] = [
  ['/', 'Good'],
  ['/contracts', 'Contracts'],
  ['/ai', 'AI register'],
  ['/tribunal', 'Tribunal risk'],
  ['/accounts', 'Account research'],
  ['/board', 'Board pack'],
  ['/case-for-keel', 'Five quiet problems. One platform that watches them.'],
];

test('every page loads without console errors', async ({ page, errors }) => {
  for (const [path, heading] of PAGES) {
    await open(page, path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
  }
  expect(errors).toEqual([]);
});

test('records open from the URL on every tool', async ({ page }) => {
  await open(page, '/contracts?open=c3');
  await expect(page.getByRole('dialog', { name: 'Cloud hosting' })).toBeVisible();
  await expect(page.getByText('The notice window closed 18 days ago.')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/contracts$/);

  await open(page, '/ai?open=a4');
  await expect(page.getByRole('dialog', { name: 'MoodLens' })).toBeVisible();
  await expect(page.getByText('Emotion recognition at work is a banned practice.')).toBeVisible();

  await open(page, '/tribunal?open=t2');
  await expect(page.getByRole('heading', { name: 'HR-0415 · S.K.' })).toBeVisible();

  await open(page, '/accounts?open=p1');
  await expect(page.getByRole('heading', { name: 'Harlow & Finch', level: 2 })).toBeVisible({ timeout: 6000 });
  await expect(page.getByText('In one line')).toBeVisible();
});

test('an unknown record id warns and shows the list', async ({ page }) => {
  await open(page, '/contracts?open=nope');
  await expect(page.getByRole('status').getByText('Contract not found')).toBeVisible();
  await expect(page).toHaveURL(/\/contracts$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('sidebar badges, collapse and keyboard navigation', async ({ page }) => {
  await open(page, '/');
  const nav = page.getByRole('navigation', { name: 'Main' });
  await expect(nav.getByRole('link', { name: /Contracts/ })).toContainText('6');
  await page.keyboard.press('[');
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await page.keyboard.press('[');
  await page.keyboard.press('g');
  await page.keyboard.press('b');
  await expect(page).toHaveURL(/\/board$/);
  await page.keyboard.press('g');
  await page.keyboard.press('h');
  await expect(page).toHaveURL(/\/$/);
});

test('the horizon plots deadlines and opens them', async ({ page }) => {
  await open(page, '/');
  const dots = page.getByRole('list', { name: 'Deadlines in the next 90 days' }).getByRole('link');
  await expect(dots.first()).toBeVisible();
  expect(await dots.count()).toBeGreaterThan(15);
  await page.getByRole('link', { name: /Notice deadline: Enterprise CRM licence/ }).click();
  await expect(page.getByRole('dialog', { name: 'Enterprise CRM licence' })).toBeVisible();
});

test('mobile menu opens as a drawer and closes on navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page, '/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await menu.getByRole('link', { name: /AI register/ }).click();
  await expect(page).toHaveURL(/\/ai$/);
  await expect(menu).toBeHidden();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(375);
});
