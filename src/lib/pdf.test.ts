import { describe, it, expect } from 'vitest';
import { buildPdfFromFlatItems, type FlatItem, type PrintMeta } from './pdf';

const baseMeta: PrintMeta = { dateStr: '23 juillet 2026', roomCount: 1, itemCount: 1, totalStr: '850 €' };

describe('buildPdfFromFlatItems', () => {
  it('produces a cover page plus one page for a single short item', () => {
    const items: FlatItem[] = [
      {
        roomName: 'Salon',
        title: 'Canapé',
        photoDataUrl: null,
        fields: [{ label: "Prix d'achat", value: '850 €' }],
      },
    ];
    const { pageCount } = buildPdfFromFlatItems(items, baseMeta);
    expect(pageCount).toBe(2);
  });

  it('breaks to a new page when the field table overflows past PH-M-14', () => {
    // All 6 printable fields (nom is excluded from the table), each long enough to wrap to several
    // lines, so cumulative y crosses the threshold partway through and the loop's own
    // `if (y > PH-M-14) { doc.addPage(); ... }` check fires before the next field is drawn.
    const longValue = Array.from({ length: 15 }, (_, i) => `partie ${i} du texte assez longue pour occuper plusieurs lignes`).join(', ');
    const items: FlatItem[] = [
      {
        roomName: 'Salon',
        title: 'Objet avec beaucoup de texte',
        photoDataUrl: null,
        fields: [
          { label: "Prix d'achat", value: longValue },
          { label: "Date d'achat", value: longValue },
          { label: "Lieu d'achat", value: longValue },
          { label: 'Dimensions', value: longValue },
          { label: 'N° de série / référence', value: longValue },
          { label: 'Autres informations', value: longValue },
        ],
      },
    ];
    const { pageCount } = buildPdfFromFlatItems(items, baseMeta);
    // Cover page + at least 2 pages for this one item, proving the y>PH-M-14 branch called addPage()
    // instead of letting the field table overflow silently off the bottom of the page.
    expect(pageCount).toBeGreaterThan(2);
  });

  it('renders an italic placeholder instead of a table when an item has no fields', () => {
    const items: FlatItem[] = [{ roomName: 'Cuisine', title: 'Objet sans nom', photoDataUrl: null, fields: [] }];
    expect(() => buildPdfFromFlatItems(items, baseMeta)).not.toThrow();
    expect(buildPdfFromFlatItems(items, baseMeta).pageCount).toBe(2);
  });

  it('handles zero items by producing only the cover page', () => {
    const { pageCount } = buildPdfFromFlatItems([], baseMeta);
    expect(pageCount).toBe(1);
  });
});
