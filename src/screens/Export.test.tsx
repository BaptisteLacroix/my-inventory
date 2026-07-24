import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, Action } from '../state/actions';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  dispatch: vi.fn(),
  state: undefined as unknown as AppState,
  save: vi.fn(),
  generatePDF: vi.fn(),
  flatItems: vi.fn(),
  printMeta: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour }),
}));

vi.mock('../state/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: mocks.save,
}));

vi.mock('../lib/pdf', () => ({
  generatePDF: mocks.generatePDF,
  flatItems: mocks.flatItems,
  printMeta: mocks.printMeta,
}));

vi.mock('../lib/storage', () => ({
  writeFile: mocks.writeFile,
}));

const { Export } = await import('./Export');

function lastDispatched(): Action {
  return mocks.dispatch.mock.calls[mocks.dispatch.mock.calls.length - 1][0];
}

describe('Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.printMeta.mockReturnValue({ dateStr: '23 juillet 2026', roomCount: 1, itemCount: 1, totalStr: '850 €' });
    mocks.flatItems.mockResolvedValue([]);
    window.print = vi.fn();
    mocks.state = {
      screen: 'export',
      currentRoomId: null,
      newRoomName: '',
      loaded: true,
      rooms: [{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: {} }] }],
    };
  });

  it('starts the export tour on mount and summarizes the inventory', () => {
    render(<Export onToast={() => {}} />);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('export');
    expect(screen.getByText('1 objet(s)')).toBeInTheDocument();
    expect(screen.getByText('1 pièce(s)')).toBeInTheDocument();
  });

  it('toasts instead of opening the preview when there are no items', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.state = { ...mocks.state, rooms: [] };
    render(<Export onToast={onToast} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    expect(onToast).toHaveBeenCalledWith("Ajoutez d'abord au moins une photo.");
    expect(screen.queryByText('Aperçu de votre document')).toBeNull();
  });

  it('opens the PDF preview modal when there are items', async () => {
    const user = userEvent.setup();
    render(<Export onToast={() => {}} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    expect(screen.getByText('Aperçu de votre document')).toBeInTheDocument();
  });

  it('navigates back to review', async () => {
    const user = userEvent.setup();
    render(<Export onToast={() => {}} />);
    await user.click(screen.getByText("← Revenir à l'aperçu"));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'review' });
  });

  it('downloads the PDF: generates it, saves to the chosen path, and toasts success', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
    (blob as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer);
    mocks.generatePDF.mockResolvedValue({ blob, pageCount: 2 });
    mocks.save.mockResolvedValue('/home/user/my-inventory.pdf');

    render(<Export onToast={onToast} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    await user.click(screen.getByText('Télécharger le PDF'));

    await waitFor(() => expect(mocks.writeFile).toHaveBeenCalledWith('/home/user/my-inventory.pdf', expect.any(Uint8Array)));
    expect(onToast).toHaveBeenCalledWith('PDF enregistré !');
  });

  it('does not write a file when the save dialog is cancelled', async () => {
    const user = userEvent.setup();
    const blob = new Blob(['%PDF-1.4']);
    (blob as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = () => Promise.resolve(new Uint8Array([1]).buffer);
    mocks.generatePDF.mockResolvedValue({ blob, pageCount: 1 });
    mocks.save.mockResolvedValue(null);

    render(<Export onToast={() => {}} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    await user.click(screen.getByText('Télécharger le PDF'));

    await waitFor(() => expect(mocks.save).toHaveBeenCalled());
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it('toasts an error message when PDF generation fails', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.generatePDF.mockRejectedValue(new Error('boom'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<Export onToast={onToast} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    await user.click(screen.getByText('Télécharger le PDF'));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('Une erreur est survenue lors de la création du PDF.'));
    consoleSpy.mockRestore();
  });

  it('triggers window.print when "Imprimer" is clicked', async () => {
    const user = userEvent.setup();
    render(<Export onToast={() => {}} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    await user.click(screen.getByText('Imprimer'));
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('closes the preview modal', async () => {
    const user = userEvent.setup();
    render(<Export onToast={() => {}} />);
    await user.click(screen.getByText("Voir l'aperçu du PDF"));
    await user.click(screen.getByText('Fermer'));
    expect(screen.queryByText('Aperçu de votre document')).toBeNull();
  });
});
