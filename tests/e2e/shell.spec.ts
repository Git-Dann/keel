import { test, expect, open, toast } from './fixtures';

test('command palette: search, arrow keys and Enter', async ({ page }) => {
  await open(page, '/');
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('combobox', { name: 'Search pages, records and actions' });
  await expect(input).toBeFocused();
  await input.fill('zzzz');
  await expect(page.getByText('Nothing matches “zzzz”. Try a contract, tool or page name.')).toBeVisible();
  await input.fill('cloud');
  await expect(page.getByRole('option', { name: /Cloud hosting/ })).toHaveAttribute('aria-selected', 'true');
  await input.fill('a');
  await input.press('ArrowDown');
  await expect(page.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await input.fill('moodlens');
  await input.press('Enter');
  await expect(page.getByRole('dialog', { name: 'MoodLens' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('ControlOrMeta+k');
  await expect(input).toBeVisible();
  await page.keyboard.press('ControlOrMeta+k');
  await expect(input).toBeHidden();
});

test('tray toggles with backtick and Ask Keel answers a suggestion', async ({ page }) => {
  await open(page, '/');
  await page.locator('body').press('`');
  const tray = page.getByRole('region', { name: 'Workbench' });
  await expect(tray.getByRole('tabpanel')).toBeVisible();
  await tray.getByRole('tab', { name: 'Ask Keel' }).click();
  await tray.getByRole('button', { name: 'Any high-risk HR cases?' }).click();
  await expect(tray.getByText('HR-0415: high risk, 5 issues to fix')).toBeVisible();
  await tray.getByRole('textbox', { name: 'Ask Keel a question' }).fill('What is the weather?');
  await tray.getByRole('button', { name: 'Send question' }).click();
  await expect(tray.getByText('I can only answer from this workspace.', { exact: false })).toBeVisible();
  await page.locator('body').press('`');
  await expect(tray.getByRole('tabpanel')).toBeHidden();
});

test('dismissing every alert empties Home and the tray; reset restores everything', async ({ page }) => {
  await open(page, '/');
  await page.getByRole('button', { name: 'Dismiss tip' }).click();
  await page.getByRole('button', { name: /^Alerts/ }).click();
  const tray = page.getByRole('region', { name: 'Workbench' });
  const dismiss = tray.getByRole('button', { name: /^Dismiss alert/ });
  while ((await dismiss.count()) > 0) await dismiss.first().click();
  await expect(tray.getByText('No alerts')).toBeVisible();
  await expect(page.getByText('All clear')).toBeVisible();
  await expect(page.getByText('Nothing needs you right now.', { exact: false })).toBeVisible();

  await tray.getByRole('tab', { name: 'Shortcuts' }).click();
  await tray.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset demo' }).click();
  await expect(toast(page, 'Demo reset')).toBeVisible();
  await expect(page.getByText('This is your horizon')).toBeVisible();
  await expect(page.getByText('10 things need you.', { exact: false })).toBeVisible();
});

test('state persists across a reload', async ({ page }) => {
  await open(page, '/contracts?open=c1');
  await page.getByRole('button', { name: 'Remind me' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Reminder set' })).toBeDisabled();
});

test('the app works when localStorage is blocked', async ({ page, errors }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await open(page, '/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dan');
  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
  await page.getByRole('link', { name: /Contracts/ }).first().click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Contracts');
  expect(errors).toEqual([]);
});

test('theme toggle persists and is applied before paint', async ({ page }) => {
  await open(page, '/');
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole('button', { name: /Switch to (dark|light) mode/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});

test('very long names never break the layout', async ({ page }) => {
  await open(page, '/contracts');
  await page.getByRole('button', { name: 'Upload contract' }).click();
  const long = 'Master services agreement for the provision of managed cloud infrastructure and associated professional services across all regions';
  await page.locator('input[type=file]').setInputFiles({ name: `${long}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
  await expect(page.getByRole('dialog', { name: long })).toBeVisible({ timeout: 6000 });
  await page.keyboard.press('Escape');
  for (const w of [1440, 375]) {
    await page.setViewportSize({ width: w, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  }
});
