import { test, expect } from '@playwright/test';
import { gotoFreshApp, dismissTourIfPresent, addRoomWithOnePhoto, setSaveResult, readWrittenBytes } from './fixtures';

async function goToExportWithOneItem(page: import('@playwright/test').Page) {
  await gotoFreshApp(page);
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: /Commencer/ }).click();
  await dismissTourIfPresent(page);
  await addRoomWithOnePhoto(page, 'Salon');
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: "Continuer vers l'aperçu →" }).click();
  await dismissTourIfPresent(page);
  await page.getByRole('button', { name: 'Passer au PDF →' }).click();
  await dismissTourIfPresent(page);
}

test.describe('Export screen', () => {
  test('shows the export tour and the item/room summary', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await addRoomWithOnePhoto(page, 'Salon');
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: "Continuer vers l'aperçu →" }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: 'Passer au PDF →' }).click();

    await expect(page.getByText('Étape 4 · Le PDF')).toBeVisible();
    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByText('1 objet(s)')).toBeVisible();
    await expect(page.getByText('1 pièce(s)')).toBeVisible();
  });

  test('refuses to open the preview when the inventory is empty', async ({ page }) => {
    await gotoFreshApp(page);
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: /Commencer/ }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: '+ Salon' }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: "Voir l'aperçu →" }).click();
    await dismissTourIfPresent(page);
    await page.getByRole('button', { name: 'Passer au PDF →' }).click();
    await dismissTourIfPresent(page);

    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
    await expect(page.getByText("Ajoutez d'abord au moins une photo.")).toBeVisible();
    await expect(page.getByText('Aperçu de votre document')).toHaveCount(0);
  });

  test('opens the PDF preview with the cover page and the one item page', async ({ page }) => {
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();

    await expect(page.getByText('Aperçu de votre document')).toBeVisible();
    await expect(page.getByText('Liste de mes objets')).toBeVisible();
    await expect(page.getByText('Objet sans nom')).toBeVisible();
    await expect(page.getByText('1 objet(s) · 2 page(s)')).toBeVisible();
  });

  test('closes the preview via Fermer', async ({ page }) => {
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByText('Aperçu de votre document')).toHaveCount(0);
  });

  test('"Imprimer" triggers the native print dialog directly (window.print)', async ({ page }) => {
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
    await expect(page.getByText('Aperçu de votre document')).toBeVisible();

    await page.evaluate(() => {
      (window as unknown as { __printed: boolean }).__printed = false;
      window.print = () => {
        (window as unknown as { __printed: boolean }).__printed = true;
      };
    });
    await page.getByRole('button', { name: 'Imprimer' }).click();
    const printed = await page.evaluate(() => (window as unknown as { __printed: boolean }).__printed);
    expect(printed).toBe(true);
  });

  test('regression: print stylesheet hides the rest of the app so only the document pages show', async ({ page }) => {
    // Encodes the fix for the blank-first-page bug: #root must be fully removed from layout
    // (display:none), not merely visibility:hidden, or its reserved height pushes the real
    // content onto page 2.
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
    await expect(page.getByText('Aperçu de votre document')).toBeVisible();

    await page.emulateMedia({ media: 'print' });
    const rootDisplay = await page.evaluate(() => getComputedStyle(document.getElementById('root')!).display);
    expect(rootDisplay).toBe('none');

    const toolbarDisplay = await page.locator('.no-print').first().evaluate((el) => getComputedStyle(el).display);
    expect(toolbarDisplay).toBe('none');

    await expect(page.getByText('Liste de mes objets')).toBeVisible();
    await page.emulateMedia({ media: 'screen' });
  });

  test('downloads the PDF via the save dialog and writes real PDF bytes', async ({ page }) => {
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "Voir l'aperçu du PDF" }).click();
    await setSaveResult(page, '/downloads/my-inventory.pdf');

    await page.getByRole('button', { name: 'Télécharger le PDF' }).click();
    await expect(page.getByText('PDF enregistré !')).toBeVisible();

    const bytes = await readWrittenBytes(page, '/downloads/my-inventory.pdf');
    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBeGreaterThan(100);
    const header = String.fromCharCode(...bytes!.slice(0, 5));
    expect(header).toBe('%PDF-');
  });

  test('navigates back to Review via "Revenir à l\'aperçu"', async ({ page }) => {
    await goToExportWithOneItem(page);
    await page.getByRole('button', { name: "← Revenir à l'aperçu" }).click();
    await expect(page.getByText('Étape 3 · Aperçu')).toBeVisible();
  });
});
