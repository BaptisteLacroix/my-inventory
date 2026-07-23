import { convertFileSrc } from '@tauri-apps/api/core';
import { getAppDataDir, join, ensureDir, exists, readTextFile, writeTextFileAtomic, writeFile, remove } from './storage';
import type { InventoryManifest, Room } from '../state/types';

// Phase 1: single hardcoded inventory, ahead of the multi-inventory switcher (Phase 4).
const DEFAULT_INVENTORY_ID = 'default';

export interface InventoryPaths {
  root: string;
  manifestPath: string;
  imagesDir: string;
}

export async function getInventoryPaths(inventoryId: string = DEFAULT_INVENTORY_ID): Promise<InventoryPaths> {
  const appData = await getAppDataDir();
  const root = await join(appData, 'inventories', inventoryId);
  const manifestPath = await join(root, 'manifest.json');
  const imagesDir = await join(root, 'images');
  return { root, manifestPath, imagesDir };
}

function emptyManifest(): InventoryManifest {
  return { version: 1, rooms: [] };
}

/** Defensively normalizes a possibly hand-edited or legacy-shaped manifest, matching the mockup's onOpenWork() guard. */
export function normalizeManifest(raw: unknown): InventoryManifest {
  const obj = raw as { rooms?: unknown } | unknown[] | null | undefined;
  const rawRooms: unknown[] | null = Array.isArray(obj) ? obj : Array.isArray((obj as { rooms?: unknown })?.rooms) ? (obj as { rooms: unknown[] }).rooms : null;
  if (!rawRooms) return emptyManifest();

  const rooms: Room[] = rawRooms.map((r) => {
    const room = r as Partial<Room> & { items?: unknown[] };
    const items = Array.isArray(room.items) ? room.items : [];
    return {
      id: typeof room.id === 'string' && room.id ? room.id : crypto.randomUUID(),
      name: typeof room.name === 'string' && room.name ? room.name : 'Pièce',
      items: items.map((it) => {
        const item = it as { id?: unknown; photoFile?: unknown; fields?: unknown };
        return {
          id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
          photoFile: typeof item.photoFile === 'string' ? item.photoFile : '',
          fields: typeof item.fields === 'object' && item.fields !== null ? (item.fields as Room['items'][number]['fields']) : {},
        };
      }),
    };
  });

  return { version: 1, rooms };
}

export async function loadManifest(inventoryId: string = DEFAULT_INVENTORY_ID): Promise<InventoryManifest> {
  const { root, manifestPath, imagesDir } = await getInventoryPaths(inventoryId);
  await ensureDir(root);
  await ensureDir(imagesDir);
  if (!(await exists(manifestPath))) {
    return emptyManifest();
  }
  try {
    const raw = await readTextFile(manifestPath);
    return normalizeManifest(JSON.parse(raw));
  } catch {
    // A corrupt/unreadable manifest must not crash the app on startup - start fresh instead.
    return emptyManifest();
  }
}

export async function saveManifest(manifest: InventoryManifest, inventoryId: string = DEFAULT_INVENTORY_ID): Promise<void> {
  const { manifestPath } = await getInventoryPaths(inventoryId);
  await writeTextFileAtomic(manifestPath, JSON.stringify(manifest));
}

export async function writeItemImage(itemId: string, bytes: Uint8Array, inventoryId: string = DEFAULT_INVENTORY_ID): Promise<string> {
  const { imagesDir } = await getInventoryPaths(inventoryId);
  await ensureDir(imagesDir);
  const fileName = `${itemId}.jpg`;
  const path = await join(imagesDir, fileName);
  await writeFile(path, bytes);
  return fileName;
}

export async function deleteItemImage(photoFile: string, inventoryId: string = DEFAULT_INVENTORY_ID): Promise<void> {
  if (!photoFile) return;
  const { imagesDir } = await getInventoryPaths(inventoryId);
  const path = await join(imagesDir, photoFile);
  try {
    await remove(path);
  } catch {
    // Already gone - nothing to clean up.
  }
}

export async function clearInventoryImages(inventoryId: string = DEFAULT_INVENTORY_ID): Promise<void> {
  const { imagesDir } = await getInventoryPaths(inventoryId);
  try {
    await remove(imagesDir, { recursive: true });
  } catch {
    // Nothing to remove.
  }
  await ensureDir(imagesDir);
}

export async function getItemImageSrc(photoFile: string, inventoryId: string = DEFAULT_INVENTORY_ID): Promise<string | null> {
  if (!photoFile) return null;
  const { imagesDir } = await getInventoryPaths(inventoryId);
  const path = await join(imagesDir, photoFile);
  return convertFileSrc(path);
}
