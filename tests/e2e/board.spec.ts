import { test, expect, open, toast } from './fixtures';

test('build the draft and send with gaps', async ({ page }) => {
  await open(page, '/board');
  await expect(page.getByText('2 sources need attention before the meeting in 17 days.')).toBeVisible();
  await page.getByRole('button', { name: 'Build draft pack' }).click();
  await expect(page.getByRole('heading', { name: /Board pack · / })).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Missing data')).toBeVisible();
  await page.getByRole('button', { name: 'Send to board' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Send with gaps?' });
  await expect(confirm).toContainText('Product delivery, People and hiring');
  await confirm.getByRole('button', { name: 'Send with a note' }).click();
  await expect(toast(page, 'Sent to board')).toBeVisible();
});

test('sync and connect sources, then send without gaps', async ({ page }) => {
  await open(page, '/board');
  await page.getByRole('button', { name: 'Sync now' }).click();
  await expect(toast(page, 'Linear synced')).toBeVisible();
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Connect BambooHR' });
  await expect(modal).toContainText('Salaries');
  await modal.getByRole('button', { name: 'Connect BambooHR' }).click();
  await expect(toast(page, 'BambooHR connected')).toBeVisible();
  await expect(page.getByText('Every source is fresh.')).toBeVisible();
  await page.getByRole('button', { name: 'Build draft pack' }).click();
  await expect(page.getByText('Headcount is 64')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Send to board' }).click();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await expect(toast(page, 'Sent to board')).toBeVisible();
});

test('building with nothing ticked warns', async ({ page }) => {
  await open(page, '/board');
  for (const name of ['Financial summary', 'Pipeline and sales', 'Product delivery', 'People and hiring', 'Risk register from Keel', 'Decisions needed from the board'])
    await page.locator('section[aria-labelledby="sections-h"]').getByText(name, { exact: true }).click();
  await page.getByRole('button', { name: 'Build draft pack' }).click();
  await expect(toast(page, 'Nothing to build')).toBeVisible();
});
