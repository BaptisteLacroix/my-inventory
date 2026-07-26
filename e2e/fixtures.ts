import type { Page } from '@playwright/test';
import type {} from './mocks/e2e-env';

/** A real, valid 4x4 red JPEG (generated via canvas.toDataURL, same encoder path the app itself
 * uses) - needed because readAndDownscaleImage() feeds bytes through createImageBitmap(), which
 * rejects anything that isn't an actually-decodable image. */
export const TEST_JPEG_BASE64 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAEAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABQf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCeAIUV/9k=';

/** Navigates to the app and clears both the fake-fs env and localStorage (tour "seen" flags,
 * onboarding state) so every test starts from a truly blank slate. */
export async function gotoFreshApp(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.__e2e__ = { files: new Map(), dialogOpenResult: null, dialogSaveResult: null, dialogConfirmResult: true };
  });
  await page.reload();
}

/** Seeds one fake image file so the next "Ajouter des photos" / "Choisir un dossier" import can
 * read it via the mocked readFile(). Also configures the dialog's next open() result. */
export async function seedImportedFile(page: Page, path: string, base64: string = TEST_JPEG_BASE64): Promise<void> {
  await page.evaluate(
    ({ path, base64 }) => {
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      window.__e2e__!.files.set(path, { bytes });
    },
    { path, base64 },
  );
}

export async function setOpenResult(page: Page, result: string | string[] | null): Promise<void> {
  await page.evaluate((result) => {
    window.__e2e__!.dialogOpenResult = result;
  }, result);
}

export async function setSaveResult(page: Page, result: string | null): Promise<void> {
  await page.evaluate((result) => {
    window.__e2e__!.dialogSaveResult = result;
  }, result);
}

export async function setConfirmResult(page: Page, result: boolean): Promise<void> {
  await page.evaluate((result) => {
    window.__e2e__!.dialogConfirmResult = result;
  }, result);
}

/** Reads back the bytes written to a fake path (e.g. to assert a downloaded PDF is non-empty
 * and looks like a real PDF). */
export async function readWrittenBytes(page: Page, path: string): Promise<number[] | null> {
  return page.evaluate((path) => {
    const f = window.__e2e__!.files.get(path) as { bytes?: Uint8Array } | undefined;
    return f?.bytes ? Array.from(f.bytes) : null;
  }, path);
}

/** Adds a room, opens it, and imports one seeded photo - the common setup for Items/Review/Export
 * journeys that need at least one real item to work with. */
export async function addRoomWithOnePhoto(page: Page, roomName = 'Salon'): Promise<void> {
  const { expect } = await import('@playwright/test');
  await page.getByRole('button', { name: `+ ${roomName}` }).click();
  await page.getByRole('button', { name: /Ouvrir cette pièce/ }).click();
  await expect(page.getByText(/Étape 2 ·/)).toBeVisible();
  await dismissTourIfPresent(page);
  await seedImportedFile(page, '/fixtures/photo.jpg');
  await setOpenResult(page, '/fixtures/photo.jpg');
  await page.getByRole('button', { name: 'Ajouter des photos' }).click();
  await expect(page.getByText('✏️ Ajouter les informations')).toBeVisible();
}

/** Dismisses whichever guided-tour overlay (if any) is currently active, by clicking "Passer".
 * Tours auto-start ~450ms after the screen mounts (see TourContext's AUTO_DELAY_MS), so this
 * actively waits for that window instead of checking visibility at a single instant - a
 * one-shot check races the delay and can miss a tour that pops up a moment later, leaving its
 * full-screen blocker overlay swallowing every subsequent click for the rest of the test.
 *
 * `exact: true` matters here: Review/Export have a real "Passer au PDF →" nav button, and
 * getByRole's name matching is substring-by-default, so an inexact "Passer" locator resolves to
 * two elements there - .click() then throws a strict-mode violation that silently defeats the
 * dismissal (and the tour's blocker overlay is left swallowing every later click in the test). */
export async function dismissTourIfPresent(page: Page, timeout = 2500): Promise<void> {
  const skip = page.getByRole('button', { name: 'Passer', exact: true });
  try {
    await skip.waitFor({ state: 'visible', timeout });
    await skip.click();
  } catch {
    // No tour appeared within the window - nothing to dismiss.
  }
}
