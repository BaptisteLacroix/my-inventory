import { test, expect } from '@playwright/test';
import { gotoFreshApp, dismissTourIfPresent, addRoomWithOnePhoto } from './fixtures';

async function goToReviewWithOneItem(page: import('@playwright/test').Page) {
  await gotoFreshApp(page);
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: /Commencer/ }).click();
  await dismissTourIfPresent(page);
  await addRoomWithOnePhoto(page, 'Salon');
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: "Continuer vers l'aperçu →" }).click();
  await dismissTourIfPresent(page);
}

test.describe('Review screen', () => {
  test('shows the review tour and reflects room/item counts', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await addRoomWithOnePhoto(page, 'Salon');
    await page.getByRole('button', { name: "Continuer vers l'aperçu →" }).click();

    await expect(page.getByText("Étape 3 · L'aperçu")).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();

    await expect(page.getByText('Étape 3 · Aperçu')).toBeVisible();
    await expect(page.getByText('pièce(s)')).toBeVisible();
    await expect(page.getByText('objet(s)')).toBeVisible();
    await expect(page.getByText('Salon')).toBeVisible();
  });

  test('shows the item title and "no info" placeholder for a bare item', async ({ page }) => {
    await goToReviewWithOneItem(page);
    await expect(page.getByText('Objet sans nom')).toBeVisible();
    await expect(page.getByText('Aucune information ajoutée')).toBeVisible();
  });

  test('navigates back to Items via "Modifier"', async ({ page }) => {
    await goToReviewWithOneItem(page);
    await page.getByRole('button', { name: '← Modifier' }).click();
    await expect(page.getByText(/Étape 2 ·/)).toBeVisible();
  });

  test('navigates forward to Export via "Passer au PDF"', async ({ page }) => {
    await goToReviewWithOneItem(page);
    await page.getByRole('button', { name: 'Passer au PDF →' }).click();
    await expect(page.getByText('Étape 4 · Créer votre PDF')).toBeVisible();
  });
});
