import { env } from './e2e-env';

export interface DirEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  isSymlink: boolean;
}

function dirPrefix(path: string): string {
  return path.endsWith('/') ? path : `${path}/`;
}

export async function exists(path: string): Promise<boolean> {
  const { files } = env();
  if (files.has(path)) return true;
  const prefix = dirPrefix(path);
  for (const key of files.keys()) {
    if (key.startsWith(prefix)) return true;
  }
  return false;
}

export async function mkdir(path: string): Promise<void> {
  env().files.set(path, { isDir: true });
}

export async function readTextFile(path: string): Promise<string> {
  const f = env().files.get(path);
  if (!f || f.text === undefined) throw new Error(`ENOENT (e2e fake fs): ${path}`);
  return f.text;
}

export async function writeTextFile(path: string, contents: string): Promise<void> {
  env().files.set(path, { text: contents });
}

export async function writeFile(path: string, data: Uint8Array): Promise<void> {
  env().files.set(path, { bytes: data });
}

export async function readFile(path: string): Promise<Uint8Array> {
  const f = env().files.get(path);
  if (!f || !f.bytes) throw new Error(`ENOENT (e2e fake fs): ${path}`);
  return f.bytes;
}

export async function remove(path: string, opts?: { recursive?: boolean }): Promise<void> {
  const { files } = env();
  if (opts?.recursive) {
    const prefix = dirPrefix(path);
    for (const key of [...files.keys()]) {
      if (key === path || key.startsWith(prefix)) files.delete(key);
    }
  } else {
    files.delete(path);
  }
}

export async function rename(from: string, to: string): Promise<void> {
  const { files } = env();
  const f = files.get(from);
  if (f) {
    files.set(to, f);
    files.delete(from);
  }
}

export async function readDir(path: string): Promise<DirEntry[]> {
  const { files } = env();
  const prefix = dirPrefix(path);
  const names = new Map<string, boolean>();
  for (const key of files.keys()) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const name = rest.split('/')[0];
    if (name && !names.has(name)) {
      names.set(name, files.get(prefix + name)?.isDir === true);
    }
  }
  return [...names.entries()].map(([name, isDirectory]) => ({
    name,
    isDirectory,
    isFile: !isDirectory,
    isSymlink: false,
  }));
}
