import { describe, it, expect } from 'vitest';
import { parsePrice, fmtEuro } from './price';

describe('parsePrice', () => {
  it('parses a simple euro amount', () => {
    expect(parsePrice('850 €')).toBe(850);
  });

  it('parses thousands with a space and a comma decimal', () => {
    expect(parsePrice('1 200,50€')).toBe(1200.5);
  });

  it('returns 0 for empty/undefined input', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
  });

  it('returns 0 for garbage text with no digits', () => {
    expect(parsePrice('gratuit, cadeau de mamie')).toBe(0);
  });

  it('strips the minus sign since it is not preserved by the digit filter (documented limitation)', () => {
    expect(parsePrice('-100 €')).toBe(100);
  });

  it('ignores a plain integer without currency symbol', () => {
    expect(parsePrice('300')).toBe(300);
  });
});

describe('fmtEuro', () => {
  it('formats a positive amount with the fr-FR euro suffix', () => {
    const grouped = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(1200);
    expect(fmtEuro(1200)).toBe(grouped + ' €');
  });

  it('returns an em dash for zero or negative amounts', () => {
    expect(fmtEuro(0)).toBe('—');
    expect(fmtEuro(-5)).toBe('—');
  });
});
