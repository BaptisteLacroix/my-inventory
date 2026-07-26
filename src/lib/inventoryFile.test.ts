import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InventoryManifest } from '../state/types';

const mocks = vi.hoisted(() => ({
  getAppDataDir: vi.fn(),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
  ensureDir: vi.fn(),
  exists: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFileAtomic: vi.fn(),
  writeFile: vi.fn(),
  remove: vi.fn(),
  convertFileSrc: vi.fn((path: string) => `asset://${path}`),
}));

vi.mock('./storage', () => ({
  getAppDataDir: mocks.getAppDataDir,
  join: mocks.join,
  ensureDir: mocks.ensureDir,
  exists: mocks.exists,
  readTextFile: mocks.readTextFile,
  writeTextFileAtomic: mocks.writeTextFileAtomic,
  writeFile: mocks.writeFile,
  remove: mocks.remove,
}));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: mocks.convertFileSrc,
}));

const {
  getInventoryPaths,
  normalizeManifest,
  loadManifest,
  saveManifest,
  writeItemImage,
  deleteItemImage,
  clearInventoryImages,
  getItemImageSrc,
} = await import('./inventoryFile');

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAppDataDir.mockResolvedValue('/appdata');
  mocks.join.mockImplementation((...parts: string[]) => Promise.resolve(parts.join('/')));
});

describe('getInventoryPaths', () => {
  it('builds root/manifest/images paths under the default inventory id', async () => {
    const paths = await getInventoryPaths();
    expect(paths).toEqual({
      root: '/appdata/inventories/default',
      manifestPath: '/appdata/inventories/default/manifest.json',
      imagesDir: '/appdata/inventories/default/images',
    });
  });

  it('honors a custom inventory id', async () => {
    const paths = await getInventoryPaths('other');
    expect(paths.root).toBe('/appdata/inventories/other');
  });
});

describe('normalizeManifest', () => {
  it('returns an empty manifest for null/undefined/garbage input', () => {
    expect(normalizeManifest(null)).toEqual({ version: 1, rooms: [] });
    expect(normalizeManifest(undefined)).toEqual({ version: 1, rooms: [] });
    expect(normalizeManifest('not an object')).toEqual({ version: 1, rooms: [] });
  });

  it('accepts a bare array as a legacy rooms list', () => {
    const result = normalizeManifest([{ id: 'r1', name: 'Salon', items: [] }]);
    expect(result.rooms).toHaveLength(1);
    expect(result.rooms[0]).toMatchObject({ id: 'r1', name: 'Salon', items: [] });
  });

  it('reads rooms from a well-formed manifest object', () => {
    const raw = { version: 1, rooms: [{ id: 'r1', name: 'Cuisine', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'x' } }] }] };
    const result = normalizeManifest(raw);
    expect(result).toEqual({
      version: 1,
      rooms: [{ id: 'r1', name: 'Cuisine', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'x' } }] }],
    });
  });

  it('generates ids and defaults names for rooms missing them', () => {
    const result = normalizeManifest({ rooms: [{ items: [] }] });
    expect(result.rooms[0].id).toEqual(expect.any(String));
    expect(result.rooms[0].id.length).toBeGreaterThan(0);
    expect(result.rooms[0].name).toBe('Pièce');
  });

  it('defaults item id/photoFile/fields when malformed or missing', () => {
    const result = normalizeManifest({ rooms: [{ id: 'r1', name: 'Salon', items: [{}, { id: 123, photoFile: 42, fields: 'nope' }] }] });
    const [first, second] = result.rooms[0].items;
    expect(first.id).toEqual(expect.any(String));
    expect(first.photoFile).toBe('');
    expect(first.fields).toEqual({});
    expect(second.id).toEqual(expect.any(String));
    expect(second.photoFile).toBe('');
    expect(second.fields).toEqual({});
  });

  it('treats a non-array items property as an empty item list', () => {
    const result = normalizeManifest({ rooms: [{ id: 'r1', name: 'Salon', items: 'not-an-array' }] });
    expect(result.rooms[0].items).toEqual([]);
  });
});

describe('loadManifest', () => {
  it('ensures root and images directories exist', async () => {
    mocks.exists.mockResolvedValue(false);
    await loadManifest();
    expect(mocks.ensureDir).toHaveBeenCalledWith('/appdata/inventories/default');
    expect(mocks.ensureDir).toHaveBeenCalledWith('/appdata/inventories/default/images');
  });

  it('returns an empty manifest when the manifest file does not exist yet', async () => {
    mocks.exists.mockResolvedValue(false);
    const manifest = await loadManifest();
    expect(manifest).toEqual({ version: 1, rooms: [] });
    expect(mocks.readTextFile).not.toHaveBeenCalled();
  });

  it('parses and normalizes an existing manifest file', async () => {
    mocks.exists.mockResolvedValue(true);
    mocks.readTextFile.mockResolvedValue(JSON.stringify({ version: 1, rooms: [{ id: 'r1', name: 'Salon', items: [] }] }));
    const manifest = await loadManifest();
    expect(manifest.rooms).toEqual([{ id: 'r1', name: 'Salon', items: [] }]);
  });

  it('falls back to an empty manifest when the file contains invalid JSON', async () => {
    mocks.exists.mockResolvedValue(true);
    mocks.readTextFile.mockResolvedValue('{not valid json');
    const manifest = await loadManifest();
    expect(manifest).toEqual({ version: 1, rooms: [] });
  });

  it('falls back to an empty manifest when reading the file rejects', async () => {
    mocks.exists.mockResolvedValue(true);
    mocks.readTextFile.mockRejectedValue(new Error('permission denied'));
    const manifest = await loadManifest();
    expect(manifest).toEqual({ version: 1, rooms: [] });
  });
});

describe('saveManifest', () => {
  it('writes the JSON-serialized manifest atomically to the manifest path', async () => {
    const manifest: InventoryManifest = { version: 1, rooms: [] };
    await saveManifest(manifest);
    expect(mocks.writeTextFileAtomic).toHaveBeenCalledWith('/appdata/inventories/default/manifest.json', JSON.stringify(manifest));
  });
});

describe('writeItemImage', () => {
  it('ensures the images dir exists and writes a <itemId>.jpg file', async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const fileName = await writeItemImage('item-1', bytes);
    expect(mocks.ensureDir).toHaveBeenCalledWith('/appdata/inventories/default/images');
    expect(mocks.writeFile).toHaveBeenCalledWith('/appdata/inventories/default/images/item-1.jpg', bytes);
    expect(fileName).toBe('item-1.jpg');
  });
});

describe('deleteItemImage', () => {
  it('does nothing when photoFile is empty', async () => {
    await deleteItemImage('');
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('removes the file at imagesDir/photoFile', async () => {
    await deleteItemImage('item-1.jpg');
    expect(mocks.remove).toHaveBeenCalledWith('/appdata/inventories/default/images/item-1.jpg');
  });

  it('swallows a remove failure (file already gone)', async () => {
    mocks.remove.mockRejectedValue(new Error('ENOENT'));
    await expect(deleteItemImage('missing.jpg')).resolves.toBeUndefined();
  });
});

describe('clearInventoryImages', () => {
  it('recursively removes the images dir then recreates it', async () => {
    await clearInventoryImages();
    expect(mocks.remove).toHaveBeenCalledWith('/appdata/inventories/default/images', { recursive: true });
    expect(mocks.ensureDir).toHaveBeenCalledWith('/appdata/inventories/default/images');
  });

  it('still recreates the images dir if remove fails', async () => {
    mocks.remove.mockRejectedValue(new Error('boom'));
    await clearInventoryImages();
    expect(mocks.ensureDir).toHaveBeenCalledWith('/appdata/inventories/default/images');
  });
});

describe('getItemImageSrc', () => {
  it('returns null for an empty photoFile', async () => {
    await expect(getItemImageSrc('')).resolves.toBeNull();
    expect(mocks.convertFileSrc).not.toHaveBeenCalled();
  });

  it('converts the resolved path via convertFileSrc', async () => {
    const src = await getItemImageSrc('item-1.jpg');
    expect(src).toBe('asset:///appdata/inventories/default/images/item-1.jpg');
  });
});
