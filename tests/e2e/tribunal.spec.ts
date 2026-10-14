import { test, expect, open, toast } from './fixtures';

test('a whistleblowing case with gaps is scored high', async ({ page }) => {
  await open(page, '/tribunal');
  await page.getByRole('button', { name: 'New check' }).first().click();
  await expect(page.getByRole('heading', { name: 'New check' })).toBeVisible();
  await page.getByRole('button', { name: 'Save case' }).click();
  await expect(page.getByText('Add the employee’s initials so you can find the case later.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Employee initials' }).fill('Q.R.');
  await page.getByRole('button', { name: 'Save case' }).click();
  await expect(page.getByText('Add length of service in months. Use 0 if they started this month.')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Length of service (months)' }).fill('3');
  await page.getByRole('combobox', { name: 'Has the employee raised any of these?' }).selectOption('whistleblowing');
  await page.getByRole('group', { name: /see the evidence/ }).getByLabel('No', { exact: true }).check();
  const checker = page.locator('section[aria-labelledby="checker-title"]');
  await expect(checker.getByText('Linked to whistleblowing')).toBeVisible();
  await expect(checker.getByText('High risk').first()).toBeVisible();
  await page.getByRole('button', { name: 'Save case' }).click();
  await expect(toast(page, 'Case added')).toBeVisible();
  await expect(page.getByRole('button', { name: /HR-0422 · Q.R./ })).toContainText('High risk');
  // The new case raises an alert and the nav count.
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: /Tribunal risk/ })).toContainText('2');
});

test('changing the qualifying period rescores every case', async ({ page }) => {
  await open(page, '/tribunal?open=t3');
  await expect(page.getByRole('button', { name: /HR-0419/ })).toContainText('Low risk');
  await page.getByRole('combobox', { name: 'Qualifying period' }).selectOption('0');
  await expect(toast(page, 'Rule updated')).toBeVisible();
  await expect(page.getByRole('button', { name: /HR-0419/ })).toContainText('Low risk');
  await expect(page.getByText('Under your 24-month qualifying period')).toHaveCount(0);
});

test('closing a case asks first', async ({ page }) => {
  await open(page, '/tribunal?open=t1');
  await page.getByRole('button', { name: 'Close case' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Close HR-0412?' });
  await confirm.getByRole('button', { name: 'Close case' }).click();
  await expect(toast(page, 'Case closed')).toBeVisible();
  await expect(page.getByRole('button', { name: /HR-0412/ })).toHaveCount(0);
});
