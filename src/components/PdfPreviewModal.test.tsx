import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Room } from '../state/types';
import type { FlatItem, PrintMeta } from '../lib/pdf';

const mocks = vi.hoisted(() => ({
  flatItems: vi.fn(),
  printMeta: vi.fn(),
}));

vi.mock('../lib/pdf', () => ({
  flatItems: mocks.flatItems,
  printMeta: mocks.printMeta,
}));

const { PdfPreviewModal } = await import('./PdfPreviewModal');

const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'Canapé' } }] }];
const meta: PrintMeta = { dateStr: '23 juillet 2026', roomCount: 1, itemCount: 1, totalStr: '850 €' };

describe('PdfPreviewModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.printMeta.mockReturnValue(meta);
  });

  it('shows a loading placeholder until the flattened items resolve', async () => {
    mocks.flatItems.mockReturnValue(new Promise(() => {}));
    render(<PdfPreviewModal rooms={rooms} generating={false} downloadLabel="Télécharger le PDF" onClose={() => {}} onDownload={() => {}} onPrint={() => {}} />);
    expect(screen.getByText("Préparation de l'aperçu…")).toBeInTheDocument();
  });

  it('renders the cover page meta and one print page per flattened item', async () => {
    const items: FlatItem[] = [{ roomName: 'Salon', title: 'Canapé', photoDataUrl: null, fields: [{ label: "Prix d'achat", value: '850 €' }] }];
    mocks.flatItems.mockResolvedValue(items);
    render(<PdfPreviewModal rooms={rooms} generating={false} downloadLabel="Télécharger le PDF" onClose={() => {}} onDownload={() => {}} onPrint={() => {}} />);

    await waitFor(() => expect(screen.getByText('Canapé')).toBeInTheDocument());
    expect(screen.getByText('23 juillet 2026')).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === '1 objet(s) · 2 page(s)')).toBeInTheDocument();
  });

  it('shows the italic placeholder for an item with no printable fields', async () => {
    const items: FlatItem[] = [{ roomName: 'Cuisine', title: 'Objet sans nom', photoDataUrl: null, fields: [] }];
    mocks.flatItems.mockResolvedValue(items);
    render(<PdfPreviewModal rooms={rooms} generating={false} downloadLabel="Télécharger le PDF" onClose={() => {}} onDownload={() => {}} onPrint={() => {}} />);
    await waitFor(() => expect(screen.getByText('Aucune information renseignée pour cet objet.')).toBeInTheDocument());
  });

  it('wires the close/download/print buttons and disables download+print while generating', async () => {
    mocks.flatItems.mockResolvedValue([]);
    const onClose = vi.fn();
    const onDownload = vi.fn();
    const onPrint = vi.fn();
    const user = userEvent.setup();
    render(
      <PdfPreviewModal rooms={rooms} generating={true} downloadLabel="Création en cours…" onClose={onClose} onDownload={onDownload} onPrint={onPrint} />,
    );
    await waitFor(() => expect(screen.getByText('Création en cours…')).toBeInTheDocument());

    expect(screen.getByText('Création en cours…')).toBeDisabled();
    expect(screen.getByText('Imprimer')).toBeDisabled();

    await user.click(screen.getByText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('enables download/print and calls their handlers when not generating', async () => {
    mocks.flatItems.mockResolvedValue([]);
    const onDownload = vi.fn();
    const onPrint = vi.fn();
    const user = userEvent.setup();
    render(
      <PdfPreviewModal rooms={rooms} generating={false} downloadLabel="Télécharger le PDF" onClose={() => {}} onDownload={onDownload} onPrint={onPrint} />,
    );
    await waitFor(() => expect(screen.getByText('Télécharger le PDF')).not.toBeDisabled());

    await user.click(screen.getByText('Télécharger le PDF'));
    expect(onDownload).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Imprimer'));
    expect(onPrint).toHaveBeenCalledTimes(1);
  });
});
