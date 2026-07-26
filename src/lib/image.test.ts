import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(),
  readDir: vi.fn(),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
}));

vi.mock('@tauri-apps/plugin-fs', () => ({
  readFile: mocks.readFile,
  readDir: mocks.readDir,
}));

vi.mock('@tauri-apps/api/path', () => ({
  join: mocks.join,
}));

const { readAndDownscaleImage, listImagesInFolder } = await import('./image');

describe('readAndDownscaleImage', () => {
  let bitmapClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    bitmapClose = vi.fn();

    (globalThis as unknown as { createImageBitmap: unknown }).createImageBitmap = vi.fn().mockResolvedValue({
      width: 2000,
      height: 1000,
      close: bitmapClose,
    });

    const fakeCtx = { drawImage: vi.fn() };
    // jsdom's Blob doesn't implement arrayBuffer(), unlike a real browser - stub just enough of the
    // Blob shape that readAndDownscaleImage's `await jpegBlob.arrayBuffer()` call works.
    const fakeJpegBlob = { arrayBuffer: () => Promise.resolve(new Uint8Array([9, 9, 9]).buffer) };
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => fakeCtx,
        toBlob: (cb: (b: unknown) => void) => cb(fakeJpegBlob),
      };
      return canvas as unknown as HTMLCanvasElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downscales an oversized image to fit within MAX_SIDE and returns JPEG bytes', async () => {
    const result = await readAndDownscaleImage('/photos/a.png');
    expect(mocks.readFile).toHaveBeenCalledWith('/photos/a.png');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(bitmapClose).toHaveBeenCalled();
  });

  it('throws when the canvas has no 2D context', async () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = { width: 0, height: 0, getContext: () => null, toBlob: vi.fn() };
      return canvas as unknown as HTMLCanvasElement;
    });
    await expect(readAndDownscaleImage('/photos/a.png')).rejects.toThrow('Canvas 2D context unavailable');
  });

  it('rejects when toBlob fails to produce a blob', async () => {
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage: vi.fn() }),
        toBlob: (cb: (b: Blob | null) => void) => cb(null),
      };
      return canvas as unknown as HTMLCanvasElement;
    });
    await expect(readAndDownscaleImage('/photos/a.png')).rejects.toThrow('toBlob failed');
  });
});

describe('listImagesInFolder', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists only image files, skipping directories and non-image extensions', async () => {
    mocks.readDir.mockResolvedValue([
      { name: 'photo1.jpg', isDirectory: false },
      { name: 'photo2.PNG', isDirectory: false },
      { name: 'notes.txt', isDirectory: false },
      { name: 'subfolder', isDirectory: true },
      { name: 'noext', isDirectory: false },
    ]);
    const result = await listImagesInFolder('/photos');
    expect(result).toEqual(['/photos/photo1.jpg', '/photos/photo2.PNG']);
  });

  it('returns an empty array for a folder with no images', async () => {
    mocks.readDir.mockResolvedValue([{ name: 'readme.md', isDirectory: false }]);
    expect(await listImagesInFolder('/photos')).toEqual([]);
  });
});
