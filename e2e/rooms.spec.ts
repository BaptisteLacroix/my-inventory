import { test, expect } from '@playwright/test';
import { gotoFreshApp, dismissTourIfPresent, setConfirmResult } from './fixtures';

async function goToRooms(page: import('@playwright/test').Page) {
  await gotoFreshApp(page);
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: /Commencer/ }).click();
  await dismissTourIfPresent(page);
}

test.describe('Rooms screen', () => {
  test('shows the rooms tour and the empty state', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();

    await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
    await expect(page.getByText("Aucune pièce pour l'instant")).toBeVisible();
  });

  test('adding a suggested room shows it in the list and removes it from suggestions', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '+ Salon' }).click();

    await expect(page.getByText('« Salon » ajoutée. Cliquez dessus pour l\'ouvrir.')).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Salon' })).toHaveCount(0);
    await expect(page.getByText('Aucun objet')).toBeVisible();
  });

  test('adding a custom room via the text input', async ({ page }) => {
    await goToRooms(page);
    await page.getByPlaceholder('Ou écrivez une pièce (ex : véranda)').fill('Véranda');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    await expect(page.getByText('Véranda', { exact: true })).toBeVisible();
  });

  test('rejects a duplicate room name with a toast', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '+ Salon' }).click();
    await page.getByPlaceholder('Ou écrivez une pièce (ex : véranda)').fill('salon');
    await page.getByRole('button', { name: 'Ajouter' }).click();

    await expect(page.getByText('« salon » existe déjà.')).toBeVisible();
  });

  test('removes an empty room without confirmation', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '+ Salon' }).click();
    await page.getByRole('button', { name: 'Retirer' }).click();

    await expect(page.getByText("Aucune pièce pour l'instant")).toBeVisible();
  });

  test('opening a room navigates to the Items screen', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '+ Cuisine' }).click();
    await page.getByRole('button', { name: /Ouvrir cette pièce/ }).click();

    await expect(page.getByText('Étape 2 · Cuisine')).toBeVisible();
  });

  test('going back to Welcome via the footer button', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '← Précédent' }).click();
    await expect(page.getByText('Faisons ensemble la liste de vos objets')).toBeVisible();
  });

  test('declining the confirm dialog keeps a non-empty room', async ({ page }) => {
    await goToRooms(page);
    await page.getByRole('button', { name: '+ Garage' }).click();
    await page.getByRole('button', { name: /Ouvrir cette pièce/ }).click();
    await dismissTourIfPresent(page);

    // seed one item so the room is non-empty, then go back and try to remove it
    const { seedImportedFile, setOpenResult } = await import('./fixtures');
    await seedImportedFile(page, '/fixtures/photo.jpg');
    await setOpenResult(page, '/fixtures/photo.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await expect(page.getByText('✏️ Ajouter les informations')).toBeVisible();

    await page.getByRole('button', { name: '← Mes pièces' }).click();
    await setConfirmResult(page, false);
    await page.getByRole('button', { name: 'Retirer' }).click();

    await expect(page.getByText('Garage', { exact: true })).toBeVisible();
  });
});
