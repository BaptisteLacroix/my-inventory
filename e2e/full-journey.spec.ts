import { test, expect } from '@playwright/test';
import {
  gotoFreshApp,
  dismissTourIfPresent,
  seedImportedFile,
  setOpenResult,
  setSaveResult,
  readWrittenBytes,
} from './fixtures';

test('golden path: welcome → room → photo → fill fields → review → export → download PDF', async ({ page }) => {
  await gotoFreshApp(page);

  // Welcome
  await expect(page.getByText('Faisons ensemble la liste de vos objets')).toBeVisible();
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: /Commencer/ }).click();

  // Rooms
  await dismissTourIfPresent(page);
  await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
  await page.getByRole('button', { name: '+ Chambre' }).click();
  await page.getByRole('button', { name: /Ouvrir cette pièce/ }).click();

  // Items
  await dismissTourIfPresent(page);
  await expect(page.getByText('Étape 2 · Chambre')).toBeVisible();
  await seedImportedFile(page, '/fixtures/lamp.jpg');
  await setOpenResult(page, '/fixtures/lamp.jpg');
  await page.getByRole('button', { name: 'Ajouter des photos' }).click();
  await expect(page.getByText('1 photo ajoutée !')).toBeVisible();

  await page.getByRole('button', { name: '✏️ Ajouter les informations' }).click();
  await dismissTourIfPresent(page);
  await page.getByPlaceholder('Ex : Canapé en cuir marron').fill('Lampe de chevet');
  await page.getByPlaceholder('Ex : 850 €').fill('45 €');
  await page.getByPlaceholder('Ex : SN-48213 (souvent au dos de l\'objet)').fill('SN-1234');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Lampe de chevet')).toBeVisible();

  // Review
  await page.getByRole('button', { name: "Continuer vers l'aperçu →" }).click();
  await dismissTourIfPresent(page);
  await expect(page.getByText('Étape 3 · Aperçu')).toBeVisible();
  await expect(page.getByText('Lampe de chevet')).toBeVisible();
  await expect(page.getByText('45 €').first()).toBeVisible();

  // Export
  await page.getByRole('button', { name: 'Passer au PDF →' }).click();
  await dismissTourIfPresent(page);
  await expect(page.getByText('Étape 4 · Créer votre PDF')).toBeVisible();
  await expect(page.getByText('1 objet(s)')).toBeVisible();

  await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
  await expect(page.getByText('Lampe de chevet').first()).toBeVisible();
  await expect(page.getByText('45 €').first()).toBeVisible();

  await setSaveResult(page, '/downloads/my-inventory.pdf');
  await page.getByRole('button', { name: 'Télécharger le PDF' }).click();
  await expect(page.getByText('PDF enregistré !')).toBeVisible();

  const bytes = await readWrittenBytes(page, '/downloads/my-inventory.pdf');
  expect(bytes).not.toBeNull();
  expect(String.fromCharCode(...bytes!.slice(0, 5))).toBe('%PDF-');
});
