import { env } from './e2e-env';

/** Real convertFileSrc() turns a path into an asset:// URL the webview can load; here we just
 * inline the fake file's bytes as a data URL, so <img> tags render real thumbnails in tests. */
export function convertFileSrc(path: string): string {
  const f = env().files.get(path);
  if (!f?.bytes) return '';
  let binary = '';
  for (const byte of f.bytes) binary += String.fromCharCode(byte);
  return `data:image/jpeg;base64,${btoa(binary)}`;
}
