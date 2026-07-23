import { appDataDir, join } from '@tauri-apps/api/path';
import { exists, mkdir, readTextFile, writeTextFile, writeFile, readFile, remove, rename } from '@tauri-apps/plugin-fs';

export async function ensureDir(path: string): Promise<void> {
  if (!(await exists(path))) {
    await mkdir(path, { recursive: true });
  }
}

export async function getAppDataDir(): Promise<string> {
  return appDataDir();
}

export { join, exists, readTextFile, readFile, writeFile, remove };

/**
 * Write text to `path` via a temp-file-then-rename so a crash mid-write never leaves
 * a truncated/corrupt file in place (the previous version stays intact until the rename succeeds).
 */
export async function writeTextFileAtomic(path: string, contents: string): Promise<void> {
  const tmpPath = `${path}.tmp`;
  await writeTextFile(tmpPath, contents);
  await rename(tmpPath, path);
}
