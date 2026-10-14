import { test, expect, open, toast } from './fixtures';

test('try a sample: staged extraction, then the new contract in its drawer and the table', async ({ page }) => {
  await open(page, '/contracts');
  await page.getByRole('button', { name: 'Try a sample' }).click();
  const modal = page.getByRole('dialog', { name: 'Upload a contract' });
  await expect(modal.getByText('Reading the document').first()).toBeVisible();
  await expect(modal.getByRole('button', { name: 'Use a sample instead' })).toBeDisabled();
  const drawer = page.getByRole('dialog', { name: 'Telephony services agreement' });
  await expect(drawer).toBeVisible({ timeout: 6000 });
  await expect(toast(page, 'Contract added')).toBeVisible();
  await expect(drawer.getByText('Annual value.')).toBeVisible();
  await drawer.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('row', { name: /Telephony services agreement/ })).toBeVisible();
});

test('upload validates type, size and empty files', async ({ page }) => {
  await open(page, '/contracts');
  await page.getByRole('button', { name: 'Upload contract' }).click();
  const input = page.locator('input[type=file]');
  await input.setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('x') });
  await expect(page.locator('#upload-error')).toContainText('is not a PDF or Word file');
  await input.setInputFiles({ name: 'empty.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) });
  await expect(page.locator('#upload-error')).toContainText('That file is empty');
  await input.setInputFiles({ name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(25 * 1024 * 1024 + 1) });
  await expect(page.locator('#upload-error')).toContainText('The limit is 25 MB');
});

test('a duplicate name warns but is still added, named from the file', async ({ page }) => {
  await open(page, '/contracts');
  await page.getByRole('button', { name: 'Upload contract' }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'cloud_hosting.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') });
  await expect(toast(page, 'Possible duplicate')).toBeVisible({ timeout: 6000 });
  await expect(page.getByRole('dialog', { name: 'Cloud hosting' }).getByText('Counterparty to confirm')).toBeVisible();
});

test('closing the upload mid-way cancels it', async ({ page }) => {
  await open(page, '/contracts');
  await page.getByRole('button', { name: 'Upload contract' }).click();
  await page.getByRole('button', { name: 'Use a sample instead' }).click();
  await expect(page.getByText('Finding parties and dates').first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toast(page, 'Upload cancelled')).toBeVisible();
  await page.waitForTimeout(3500);
  await expect(page.getByRole('row', { name: /Telephony services agreement/ })).toHaveCount(0);
});

test('mark as checked refuses without a renewal date', async ({ page }) => {
  await open(page, '/contracts?open=c7');
  const drawer = page.getByRole('dialog', { name: 'Data processing agreement' });
  await drawer.getByRole('button', { name: 'Mark as checked' }).click();
  await expect(toast(page, 'Add the renewal date first')).toBeVisible();
  await expect(drawer.getByRole('button', { name: 'Draft notice letter' })).toHaveCount(0);
});

test('reminder, notice letter and filters', async ({ page }) => {
  await open(page, '/contracts?open=c1');
  const drawer = page.getByRole('dialog', { name: 'Enterprise CRM licence' });
  await drawer.getByRole('button', { name: 'Remind me' }).click();
  await expect(drawer.getByRole('button', { name: 'Reminder set' })).toBeDisabled();
  await drawer.getByRole('button', { name: 'Draft notice letter' }).click();
  const letter = page.getByRole('dialog', { name: 'Notice letter' });
  await expect(letter.getByRole('textbox')).toHaveValue(/Dear Northwind Software Ltd/);
  await letter.getByRole('button', { name: 'Copy letter' }).click();
  await expect(toast(page, 'Letter copied')).toBeVisible();
  await expect(letter).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();

  await page.getByRole('button', { name: /^Missed/ }).click();
  await expect(page.getByRole('row')).toHaveCount(3); // header + 2
  await page.getByRole('searchbox', { name: 'Search contracts' }).fill('zzz');
  await expect(page.getByText('No contracts match')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('row')).toHaveCount(13);
});
