import { test, expect } from '@playwright/test';
import {
  gotoFreshApp,
  dismissTourIfPresent,
  seedImportedFile,
  setOpenResult,
  setConfirmResult,
} from './fixtures';

async function goToItemsWithRoom(
  page: import('@playwright/test').Page,
  roomName = 'Salon',
  dismissItemsTour = true,
) {
  await gotoFreshApp(page);
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: /Commencer/ }).click();
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: `+ ${roomName}` }).click();
  await page.getByRole('button', { name: /Ouvrir cette pièce/ }).click();
  if (dismissItemsTour) await dismissTourIfPresent(page);
}

test.describe('Items screen', () => {
  test('shows the items tour (2 steps) and the empty state', async ({ page }) => {
    await goToItemsWithRoom(page, 'Salon', false);
    await expect(page.getByText('Étape 2 · Vos photos')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Décrire un objet')).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();

    await expect(page.getByText("Aucune photo ici pour l'instant")).toBeVisible();
  });

  test('imports a single photo and shows it as a card needing info', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();

    await expect(page.getByText('1 photo ajoutée !')).toBeVisible();
    await expect(page.getByText('Objet sans nom')).toBeVisible();
    await expect(page.getByText('Informations à ajouter')).toBeVisible();
  });

  test('imports several photos at once', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await seedImportedFile(page, '/fixtures/b.jpg');
    await setOpenResult(page, ['/fixtures/a.jpg', '/fixtures/b.jpg']);
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();

    await expect(page.getByText('2 photos ajoutées !')).toBeVisible();
    await expect(page.getByText('✏️ Ajouter les informations')).toHaveCount(2);
  });

  test('imports a whole folder of photos', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/folder/a.jpg');
    await seedImportedFile(page, '/fixtures/folder/b.jpg');
    await page.evaluate(() => {
      window.__e2e__!.files.set('/fixtures/folder', { isDir: true });
    });
    await setOpenResult(page, '/fixtures/folder');
    await page.getByRole('button', { name: 'Choisir un dossier' }).click();

    await expect(page.getByText(/photos? ajoutée/)).toBeVisible();
  });

  test('cancelling the file picker imports nothing', async ({ page }) => {
    await goToItemsWithRoom(page);
    await setOpenResult(page, null);
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await page.waitForTimeout(300);

    await expect(page.getByText("Aucune photo ici pour l'instant")).toBeVisible();
  });

  test('deletes an item via the card button', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await expect(page.getByText('✏️ Ajouter les informations')).toBeVisible();

    await page.getByRole('button', { name: 'Retirer' }).click();
    await expect(page.getByText("Aucune photo ici pour l'instant")).toBeVisible();
  });

  test('opens the item form, fills fields, and saves them', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await page.getByRole('button', { name: '✏️ Ajouter les informations' }).click();
    await dismissTourIfPresent(page);

    await expect(page.getByText('Décrivez votre objet')).toBeVisible();
    await page.getByPlaceholder('Ex : Canapé en cuir marron').fill('Canapé en cuir marron');
    await page.getByPlaceholder('Ex : 850 €').fill('850 €');
    await page.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page.getByText('Informations enregistrées.')).toBeVisible();
    await expect(page.getByText('Canapé en cuir marron')).toBeVisible();
    await expect(page.getByText('Informations à ajouter')).toHaveCount(0);
  });

  test('cancelling the form discards changes', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await page.getByRole('button', { name: '✏️ Ajouter les informations' }).click();
    await dismissTourIfPresent(page);

    await page.getByPlaceholder('Ex : Canapé en cuir marron').fill('Ne devrait pas être sauvé');
    await page.getByRole('button', { name: 'Annuler' }).click();

    await expect(page.getByText('Décrivez votre objet')).toHaveCount(0);
    await expect(page.getByText('Informations à ajouter')).toBeVisible();
  });

  test('deletes the item from within the form, after confirming', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await page.getByRole('button', { name: '✏️ Ajouter les informations' }).click();
    await dismissTourIfPresent(page);

    await setConfirmResult(page, true);
    await page.getByRole('button', { name: 'Supprimer' }).click();

    await expect(page.getByText("Aucune photo ici pour l'instant")).toBeVisible();
  });

  test('the item form guided tour walks through all 5 fields and is replayable via "? Aide"', async ({ page }) => {
    await goToItemsWithRoom(page);
    await seedImportedFile(page, '/fixtures/a.jpg');
    await setOpenResult(page, '/fixtures/a.jpg');
    await page.getByRole('button', { name: 'Ajouter des photos' }).click();
    await page.getByRole('button', { name: '✏️ Ajouter les informations' }).click();

    await expect(page.getByText("La fiche de l'objet")).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Ses informations utiles')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Le numéro de série')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Écrire librement')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Enregistrer la fiche')).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();

    await page.getByRole('button', { name: '? Aide' }).click();
    await expect(page.getByText("La fiche de l'objet")).toBeVisible();
  });

  test('regression: the item form stays within the viewport after scrolling down a long list', async ({ page }) => {
    await goToItemsWithRoom(page);
    for (let i = 0; i < 14; i++) {
      await seedImportedFile(page, `/fixtures/${i}.jpg`);
      await setOpenResult(page, `/fixtures/${i}.jpg`);
      await page.getByRole('button', { name: 'Ajouter des photos' }).click();
      await page.waitForTimeout(50);
    }
    await dismissTourIfPresent(page);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const buttons = page.getByRole('button', { name: '✏️ Ajouter les informations' });
    await buttons.last().click();

    const heading = page.getByText('Décrivez votre objet');
    await expect(heading).toBeVisible();
    const box = await heading.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 720;
    expect(box).not.toBeNull();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeLessThan(viewportHeight);
  });

  test('changing rooms and navigating via footer buttons', async ({ page }) => {
    await goToItemsWithRoom(page);
    await page.getByRole('button', { name: '⇄ Changer de pièce' }).click();
    await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
  });
});
