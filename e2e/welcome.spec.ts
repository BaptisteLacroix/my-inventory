import { test, expect } from '@playwright/test';
import { gotoFreshApp } from './fixtures';

test.describe('Welcome screen', () => {
  test('renders the intro and starts the guided tour automatically', async ({ page }) => {
    await gotoFreshApp(page);

    await expect(page.getByText('Faisons ensemble la liste de vos objets')).toBeVisible();
    await expect(page.getByRole('button', { name: /Commencer/ })).toBeVisible();

    await expect(page.getByText('Bienvenue !')).toBeVisible();
    await expect(page.getByText('1 / 3')).toBeVisible();
  });

  test('walks through all three welcome tour steps and dismisses on Terminer', async ({ page }) => {
    await gotoFreshApp(page);

    await expect(page.getByText('Bienvenue !')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText('Gardez votre travail')).toBeVisible();
    await page.getByRole('button', { name: 'Suivant →' }).click();
    await expect(page.getByText("C'est parti !")).toBeVisible();

    await page.getByRole('button', { name: 'Terminer' }).click();
    await expect(page.getByText("C'est parti !")).toHaveCount(0);
  });

  test('remembers the tour was seen and does not auto-replay on reload', async ({ page }) => {
    await gotoFreshApp(page);
    await page.getByRole('button', { name: 'Passer' }).click();
    await expect(page.getByText('Bienvenue !')).toHaveCount(0);

    await page.reload();
    await page.waitForTimeout(800);
    await expect(page.getByText('Bienvenue !')).toHaveCount(0);
  });

  test('the header "Aide" button force-replays the tour even after it was seen', async ({ page }) => {
    await gotoFreshApp(page);
    await page.getByRole('button', { name: 'Passer' }).click();

    await page.getByRole('button', { name: 'Aide' }).click();
    await expect(page.getByText('Bienvenue !')).toBeVisible();
  });

  test('"Montrez-moi comment ça marche" also force-replays the welcome tour', async ({ page }) => {
    await gotoFreshApp(page);
    await page.getByRole('button', { name: 'Passer' }).click();

    await page.getByRole('button', { name: 'Montrez-moi comment ça marche' }).click();
    await expect(page.getByText('Bienvenue !')).toBeVisible();
  });

  test('navigates to the Rooms screen via Commencer', async ({ page }) => {
    await gotoFreshApp(page);
    await page.getByRole('button', { name: 'Passer' }).click();
    await page.getByRole('button', { name: /Commencer/ }).click();
    await expect(page.getByText('Étape 1 · Vos pièces')).toBeVisible();
  });
});
