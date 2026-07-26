export async function appDataDir(): Promise<string> {
  return '/fake-appdata';
}

export async function join(...parts: string[]): Promise<string> {
  return parts
    .filter((p) => p.length > 0)
    .join('/')
    .replace(/\/+/g, '/');
}
