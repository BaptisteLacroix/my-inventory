import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  exists: vi.fn(),
  mkdir: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
  remove: vi.fn(),
  rename: vi.fn(),
  appDataDir: vi.fn(),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  exists: mocks.exists,
  mkdir: mocks.mkdir,
  readTextFile: mocks.readTextFile,
  writeTextFile: mocks.writeTextFile,
  writeFile: mocks.writeFile,
  readFile: mocks.readFile,
  remove: mocks.remove,
  rename: mocks.rename,
}));

vi.mock('@tauri-apps/api/path', () => ({
  appDataDir: mocks.appDataDir,
  join: mocks.join,
}));

const { ensureDir, getAppDataDir, writeTextFileAtomic } = await import('./storage');

describe('ensureDir', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the directory recursively when it does not exist', async () => {
    mocks.exists.mockResolvedValue(false);
    await ensureDir('/data/inventories/default');
    expect(mocks.mkdir).toHaveBeenCalledWith('/data/inventories/default', { recursive: true });
  });

  it('does nothing when the directory already exists', async () => {
    mocks.exists.mockResolvedValue(true);
    await ensureDir('/data/inventories/default');
    expect(mocks.mkdir).not.toHaveBeenCalled();
  });
});

describe('getAppDataDir', () => {
  it('delegates to the Tauri appDataDir API', async () => {
    mocks.appDataDir.mockResolvedValue('/data');
    await expect(getAppDataDir()).resolves.toBe('/data');
  });
});

describe('writeTextFileAtomic', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes to a .tmp path then renames it over the destination', async () => {
    await writeTextFileAtomic('/data/manifest.json', '{"a":1}');
    expect(mocks.writeTextFile).toHaveBeenCalledWith('/data/manifest.json.tmp', '{"a":1}');
    expect(mocks.rename).toHaveBeenCalledWith('/data/manifest.json.tmp', '/data/manifest.json');
  });

  it('writes before renaming, so a crash mid-write never touches the real file', async () => {
    const order: string[] = [];
    mocks.writeTextFile.mockImplementation(async () => {
      order.push('write');
    });
    mocks.rename.mockImplementation(async () => {
      order.push('rename');
    });
    await writeTextFileAtomic('/data/manifest.json', '{}');
    expect(order).toEqual(['write', 'rename']);
  });

  it('propagates a write failure and never renames', async () => {
    mocks.writeTextFile.mockRejectedValue(new Error('disk full'));
    await expect(writeTextFileAtomic('/data/manifest.json', '{}')).rejects.toThrow('disk full');
    expect(mocks.rename).not.toHaveBeenCalled();
  });
});
