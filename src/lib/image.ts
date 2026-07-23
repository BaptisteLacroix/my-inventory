import { readFile, readDir } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';

const MAX_SIDE = 1400;
const JPEG_QUALITY = 0.85;
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp']);

/** Reads an image file from disk and re-encodes it as a downscaled JPEG, mirroring the mockup's canvas-based readImage(). */
export async function readAndDownscaleImage(path: string): Promise<Uint8Array> {
  const bytes = await readFile(path);
  const blob = new Blob([bytes]);
  const bitmap = await createImageBitmap(blob);

  let { width, height } = bitmap;
  if (width > MAX_SIDE || height > MAX_SIDE) {
    const scale = Math.min(MAX_SIDE / width, MAX_SIDE / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const jpegBlob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', JPEG_QUALITY);
  });
  return new Uint8Array(await jpegBlob.arrayBuffer());
}

/** Lists image file paths directly inside a folder (non-recursive, matching the mockup's flat folder-import behavior). */
export async function listImagesInFolder(folderPath: string): Promise<string[]> {
  const entries = await readDir(folderPath);
  const paths: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const ext = entry.name.split('.').pop()?.toLowerCase();
    if (ext && IMAGE_EXTENSIONS.has(ext)) {
      paths.push(await join(folderPath, entry.name));
    }
  }
  return paths;
}
