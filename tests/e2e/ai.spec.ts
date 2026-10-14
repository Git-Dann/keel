import { test, expect, open, toast } from './fixtures';

test('add an AI tool through the wizard', async ({ page }) => {
  await open(page, '/ai');
  await page.getByRole('button', { name: 'Add AI tool' }).click();
  const w = page.getByRole('dialog', { name: 'Add an AI tool' });
  await w.getByRole('button', { name: 'Continue' }).click();
  await expect(w.getByText('Give the tool a name so people can find it.')).toBeVisible();
  await w.getByRole('textbox', { name: 'Tool name' }).fill('Recruit Bot');
  await w.getByRole('textbox', { name: 'Vendor' }).fill('Botworks');
  await w.getByRole('button', { name: 'Continue' }).click();
  await w.getByRole('button', { name: 'Continue' }).click();
  await expect(w.getByText('Pick at least one use, or go back and save it as not assessed.')).toBeVisible();
  await w.getByText('Screens, ranks or scores job candidates').click();
  await w.getByText('Talks directly to customers or the public').click();
  // Back keeps entered values.
  await w.getByRole('button', { name: 'Back' }).click();
  await expect(w.getByRole('textbox', { name: 'Tool name' })).toHaveValue('Recruit Bot');
  await w.getByRole('button', { name: 'Continue' }).click();
  await expect(w.getByRole('checkbox', { name: 'Screens, ranks or scores job candidates' })).toBeChecked();
  await w.getByRole('button', { name: 'Continue' }).click();
  await expect(w.getByText('Recruit Bot looks high risk')).toBeVisible();
  await expect(w.getByText('Guidance only, not legal advice.')).toBeVisible();
  await w.getByRole('button', { name: 'Add to register' }).click();
  await expect(toast(page, 'Added to register')).toBeVisible();
  const drawer = page.getByRole('dialog', { name: 'Recruit Bot' });
  await expect(drawer.getByText('High risk').first()).toBeVisible();
  await expect(drawer.getByText('Unassigned')).toBeVisible();
});

test('duties update paperwork and reassessing changes tier', async ({ page }) => {
  await open(page, '/ai?open=a2');
  const drawer = page.getByRole('dialog', { name: 'HireSift' });
  await expect(drawer.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  await drawer.getByText('Activity logging switched on').click();
  await expect(drawer.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  await drawer.getByRole('button', { name: 'Reassess' }).click();
  const w = page.getByRole('dialog', { name: 'Reassess HireSift' });
  await w.getByText('Drafting, coding or summarising for staff').click();
  await w.getByRole('button', { name: 'Continue' }).click();
  await expect(w.getByText('The tier changes.')).toBeVisible();
  await w.getByRole('button', { name: 'Save reassessment' }).click();
  await expect(toast(page, 'Reassessed')).toBeVisible();
  const d2 = page.getByRole('dialog', { name: 'HireSift' });
  await expect(d2.getByText('Minimal risk').first()).toBeVisible();
  await expect(d2.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
});

test('a duplicate tool name warns but is kept', async ({ page }) => {
  await open(page, '/ai');
  await page.getByRole('button', { name: 'Add AI tool' }).click();
  const w = page.getByRole('dialog', { name: 'Add an AI tool' });
  await w.getByRole('textbox', { name: 'Tool name' }).fill('moodlens');
  await w.getByRole('button', { name: 'Save as not assessed' }).click();
  await expect(toast(page, 'Already on the register')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'moodlens' }).getByText('Not assessed').first()).toBeVisible();
});
