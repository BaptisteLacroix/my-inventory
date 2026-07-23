export function parsePrice(str: string | undefined): number {
  if (!str) return 0;
  const cleaned = String(str)
    .replace(/[^0-9.,]/g, '')
    .replace(/\s/g, '')
    .replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export function fmtEuro(n: number): string {
  return n > 0 ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' €' : '—';
}
