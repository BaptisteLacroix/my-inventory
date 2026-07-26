import { test, expect } from '@playwright/test';
import { gotoFreshApp, dismissTourIfPresent, addRoomWithOnePhoto, setConfirmResult } from './fixtures';

test.describe('App header', () => {
  test('"Recommencer" clears the inventory after confirmation', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: '+ Salon' }).click();
    await expect(page.getByText('Salon', { exact: true })).toBeVisible();

    await setConfirmResult(page, true);
    await page.getByRole('button', { name: 'Recommencer' }).click();

    await expect(page.getByText('Faisons ensemble la liste de vos objets')).toBeVisible();
  });

  test('"Recommencer" does nothing when the confirmation is declined', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: '+ Salon' }).click();

    await setConfirmResult(page, false);
    await page.getByRole('button', { name: 'Recommencer' }).click();

    await expect(page.getByText('Salon', { exact: true })).toBeVisible();
  });

  test('the step timeline lets you jump directly to a completed step', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await addRoomWithOnePhoto(page, 'Salon');
    await dismissTourIfPresent(page);

    await page.getByRole('button', { name: /Vos pièces/ }).click();
    await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
  });

  test('the timeline redirects "Vos objets" to Rooms when no room is open yet', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);

    await page.getByRole('button', { name: /Vos objets/ }).click();
    await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
  });
});
