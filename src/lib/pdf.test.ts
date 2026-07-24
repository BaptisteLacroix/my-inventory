import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Room } from '../state/types';

const mocks = vi.hoisted(() => ({
  getInventoryPaths: vi.fn(),
  readFile: vi.fn(),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join('/'))),
}));

vi.mock('./inventoryFile', () => ({
  getInventoryPaths: mocks.getInventoryPaths,
}));

vi.mock('./storage', () => ({
  readFile: mocks.readFile,
  join: mocks.join,
}));

const { buildPdfFromFlatItems, printMeta, flatItems, generatePDF } = await import('./pdf');
type FlatItem = Awaited<ReturnType<typeof flatItems>>[number];
type PrintMeta = ReturnType<typeof printMeta>;

// A valid minimal 1x1 JPEG, needed so jsPDF's getImageProperties() can read real dimensions.
const TINY_JPEG_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD/AKACiiigD//Z';

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

  it('draws an embedded photo when photoDataUrl is a real image', () => {
    const items: FlatItem[] = [
      { roomName: 'Salon', title: 'Canapé', photoDataUrl: TINY_JPEG_DATA_URL, fields: [{ label: "Prix d'achat", value: '850 €' }] },
    ];
    const { pageCount } = buildPdfFromFlatItems(items, baseMeta);
    expect(pageCount).toBe(2);
  });

  it('falls back gracefully when the photo data URL cannot be read as an image', () => {
    const items: FlatItem[] = [
      { roomName: 'Salon', title: 'Canapé', photoDataUrl: 'data:image/jpeg;base64,not-a-real-image', fields: [] },
    ];
    expect(() => buildPdfFromFlatItems(items, baseMeta)).not.toThrow();
  });
});

describe('printMeta', () => {
  it('sums item count and parsed prices across every room', () => {
    const rooms: Room[] = [
      { id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: { prix: '850 €' } }, { id: 'i2', photoFile: '', fields: { prix: '150 €' } }] },
      { id: 'r2', name: 'Cuisine', items: [{ id: 'i3', photoFile: '', fields: {} }] },
    ];
    const meta = printMeta(rooms);
    expect(meta.roomCount).toBe(2);
    expect(meta.itemCount).toBe(3);
    expect(meta.totalStr).toBe('1 000 €');
  });

  it('handles an empty inventory', () => {
    const meta = printMeta([]);
    expect(meta).toMatchObject({ roomCount: 0, itemCount: 0, totalStr: '—' });
  });
});

describe('flatItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getInventoryPaths.mockResolvedValue({ root: '/data/default', manifestPath: '/data/default/manifest.json', imagesDir: '/data/default/images' });
    mocks.join.mockImplementation((...parts: string[]) => Promise.resolve(parts.join('/')));
  });

  it('flattens rooms/items, keeps only non-empty fields, and inlines the photo as a data URL', async () => {
    mocks.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]));
    const rooms: Room[] = [
      { id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'Canapé', prix: '850 €', note: '' } }] },
    ];
    const result = await flatItems(rooms);
    expect(result).toEqual([
      {
        roomName: 'Salon',
        title: 'Canapé',
        photoDataUrl: expect.stringMatching(/^data:image\/jpeg;base64,/),
        fields: [
          { label: "Nom de l'objet", value: 'Canapé' },
          { label: "Prix d'achat", value: '850 €' },
        ],
      },
    ]);
    expect(mocks.join).toHaveBeenCalledWith('/data/default/images', 'i1.jpg');
  });

  it('leaves photoDataUrl null when the item has no photoFile', async () => {
    const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }] }];
    const result = await flatItems(rooms);
    expect(result[0].photoDataUrl).toBeNull();
    expect(mocks.readFile).not.toHaveBeenCalled();
  });

  it('leaves photoDataUrl null when reading the photo file fails', async () => {
    mocks.readFile.mockRejectedValue(new Error('ENOENT'));
    const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'missing.jpg', fields: {} }] }];
    const result = await flatItems(rooms);
    expect(result[0].photoDataUrl).toBeNull();
  });

  it('returns an empty array for an inventory with no items', async () => {
    expect(await flatItems([{ id: 'r1', name: 'Salon', items: [] }])).toEqual([]);
  });
});

describe('generatePDF', () => {
  it('builds the full PDF from rooms by combining flatItems and printMeta', async () => {
    mocks.getInventoryPaths.mockResolvedValue({ root: '/data/default', manifestPath: '/data/default/manifest.json', imagesDir: '/data/default/images' });
    const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: { prix: '100 €' } }] }];
    const { pageCount, blob } = await generatePDF(rooms);
    expect(pageCount).toBe(2);
    expect(blob).toBeInstanceOf(Blob);
  });
});
