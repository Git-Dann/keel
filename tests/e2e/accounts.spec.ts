import { test, expect, open } from './fixtures';

test('search validation and a thin-data briefing for an unknown company', async ({ page }) => {
  await open(page, '/accounts');
  const input = page.getByRole('textbox', { name: 'Company name or website' });
  await page.getByRole('button', { name: 'Build briefing' }).click();
  await expect(page.locator('#account-search-msg')).toContainText('Type a company name or website first');
  await input.fill('Q');
  await page.getByRole('button', { name: 'Build briefing' }).click();
  await expect(page.locator('#account-search-msg')).toContainText('Use at least two characters');
  await input.fill('Quayside Foods');
  await page.getByRole('button', { name: 'Build briefing' }).click();
  await expect(page.getByText('No exact match for “Quayside Foods”')).toBeVisible();
  await page.getByRole('button', { name: 'Build anyway' }).click();
  await expect(page.getByText(/Reading filings|Scanning news/).first()).toBeVisible();
  await expect(page.getByText('Thin data.')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('listitem').filter({ hasText: 'Quayside Foods' })).toContainText('Fit 40');
  await expect(page).toHaveURL(/open=/);
});

test('a URL with https and www finds the exact account', async ({ page }) => {
  await open(page, '/accounts');
  await page.getByRole('textbox', { name: 'Company name or website' }).fill('https://www.harlowfinch.example');
  await page.getByRole('button', { name: 'Build briefing' }).click();
  await expect(page.getByRole('heading', { name: 'Harlow & Finch', level: 2 })).toBeVisible({ timeout: 6000 });
  await expect(page.getByText('Suggested openers')).toBeVisible();
});

test('a partial match suggests accounts', async ({ page }) => {
  await open(page, '/accounts');
  await page.getByRole('textbox', { name: 'Company name or website' }).fill('Orbitex');
  await page.getByRole('button', { name: 'Build briefing' }).click();
  await expect(page.getByText('Did you mean one of these?')).toBeVisible();
  await page.getByRole('button', { name: /Orbitex Logistics/ }).last().click();
  await expect(page.getByRole('heading', { name: 'Orbitex Logistics', level: 2 })).toBeVisible({ timeout: 6000 });
});
