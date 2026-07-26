import { describe, it, expect } from 'vitest';
import { itemTitle, itemSummary, itemDetails, itemNeedsInfo, FIELDS, SUGGESTED_ROOMS } from './fields';
import type { Item } from '../state/types';

function withFields(fields: Item['fields']): Pick<Item, 'fields'> {
  return { fields };
}

describe('itemTitle', () => {
  it('returns the trimmed nom when present', () => {
    expect(itemTitle(withFields({ nom: '  Canapé  ' }))).toBe('Canapé');
  });

  it('falls back to a placeholder when nom is missing', () => {
    expect(itemTitle(withFields({}))).toBe('Objet sans nom');
  });

  it('falls back to the placeholder when nom is only whitespace', () => {
    expect(itemTitle(withFields({ nom: '   ' }))).toBe('Objet sans nom');
  });
});

describe('itemSummary', () => {
  it('joins the first two present summary fields with a middle dot', () => {
    expect(itemSummary(withFields({ prix: '850 €', date: 'mars 2018', lieu: 'Conforama' }))).toBe('850 € · mars 2018');
  });

  it('uses whatever subset of fields is available', () => {
    expect(itemSummary(withFields({ dimensions: '200x90' }))).toBe('200x90');
  });

  it('falls back to a truncated note when no summary fields are present', () => {
    const longNote = 'a'.repeat(80);
    expect(itemSummary(withFields({ note: longNote }))).toBe(longNote.slice(0, 50));
  });

  it('returns an empty string when nothing is set at all', () => {
    expect(itemSummary(withFields({}))).toBe('');
  });
});

describe('itemDetails', () => {
  it('excludes nom and empty fields, keeping FIELDS order', () => {
    const details = itemDetails(withFields({ nom: 'Canapé', prix: '850 €', serie: '  ', note: 'Cadeau' }));
    expect(details).toEqual([
      { label: "Prix d'achat", value: '850 €' },
      { label: 'Autres informations', value: 'Cadeau' },
    ]);
  });

  it('returns an empty array when only nom is set', () => {
    expect(itemDetails(withFields({ nom: 'Canapé' }))).toEqual([]);
  });
});

describe('itemNeedsInfo', () => {
  it('is true when no field is populated', () => {
    expect(itemNeedsInfo(withFields({}))).toBe(true);
  });

  it('is true when fields only contain blank strings', () => {
    expect(itemNeedsInfo(withFields({ nom: '  ', prix: '' }))).toBe(true);
  });

  it('is false as soon as any field has content', () => {
    expect(itemNeedsInfo(withFields({ note: 'x' }))).toBe(false);
  });
});

describe('static field/room data', () => {
  it('exposes exactly the 7 expected field keys', () => {
    expect(FIELDS.map((f) => f.key)).toEqual(['nom', 'prix', 'date', 'lieu', 'dimensions', 'serie', 'note']);
  });

  it('exposes a non-empty list of suggested rooms', () => {
    expect(SUGGESTED_ROOMS.length).toBeGreaterThan(0);
    expect(SUGGESTED_ROOMS).toContain('Salon');
  });
});
