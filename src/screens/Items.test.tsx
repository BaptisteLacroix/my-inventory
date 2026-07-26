import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, Action } from '../state/actions';
import type { Room } from '../state/types';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  startFormTour: vi.fn(),
  dispatch: vi.fn(),
  state: undefined as unknown as AppState,
  open: vi.fn(),
  confirm: vi.fn(),
  readAndDownscaleImage: vi.fn(),
  listImagesInFolder: vi.fn(),
  writeItemImage: vi.fn(),
  deleteItemImage: vi.fn(),
  getItemImageSrc: vi.fn(),
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour, startFormTour: mocks.startFormTour }),
}));

vi.mock('../state/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: mocks.open,
  confirm: mocks.confirm,
}));

vi.mock('../lib/image', () => ({
  readAndDownscaleImage: mocks.readAndDownscaleImage,
  listImagesInFolder: mocks.listImagesInFolder,
}));

vi.mock('../lib/inventoryFile', () => ({
  writeItemImage: mocks.writeItemImage,
  deleteItemImage: mocks.deleteItemImage,
  getItemImageSrc: mocks.getItemImageSrc,
}));

let uuidCounter = 0;
vi.stubGlobal('crypto', { ...crypto, randomUUID: () => `uuid-${++uuidCounter}` });

const { Items } = await import('./Items');

function makeState(room: Room | null): AppState {
  return { screen: 'items', rooms: room ? [room] : [], currentRoomId: room?.id ?? 'missing', newRoomName: '', loaded: true };
}

function lastDispatched(): Action {
  return mocks.dispatch.mock.calls[mocks.dispatch.mock.calls.length - 1][0];
}

describe('Items', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
    mocks.getItemImageSrc.mockResolvedValue(null);
    mocks.state = makeState({ id: 'r1', name: 'Salon', items: [] });
  });

  it('redirects to rooms and renders nothing when the current room cannot be found', () => {
    mocks.state = makeState(null);
    const { container } = render(<Items onToast={() => {}} />);
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO', screen: 'rooms' });
    expect(container).toBeEmptyDOMElement();
  });

  it('starts the items tour and shows the current room name', () => {
    render(<Items onToast={() => {}} />);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('items');
    expect(screen.getByText('Étape 2 · Salon')).toBeInTheDocument();
  });

  it('shows the empty state when the room has no items', () => {
    render(<Items onToast={() => {}} />);
    expect(screen.getByText(/Aucune photo ici pour l'instant/)).toBeInTheDocument();
  });

  it('renders an ItemCard per item, reflecting title/details/needs-info', () => {
    mocks.state = makeState({
      id: 'r1',
      name: 'Salon',
      items: [
        { id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'Canapé', prix: '850 €' } },
        { id: 'i2', photoFile: 'i2.jpg', fields: {} },
      ],
    });
    render(<Items onToast={() => {}} />);
    expect(screen.getByText('Canapé')).toBeInTheDocument();
    expect(screen.getByText('Objet sans nom')).toBeInTheDocument();
    expect(screen.getAllByText('Informations à ajouter')).toHaveLength(1);
  });

  it('changes room by dispatching GO_TO rooms', async () => {
    const user = userEvent.setup();
    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('⇄ Changer de pièce'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'rooms' });
  });

  it('navigates via the footer buttons', async () => {
    const user = userEvent.setup();
    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('← Mes pièces'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'rooms' });
    await user.click(screen.getByText("Continuer vers l'aperçu →"));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'review' });
  });

  it('imports picked files: downscales, writes, and adds them all as items', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.open.mockResolvedValue(['/photos/a.jpg', '/photos/b.jpg']);
    mocks.readAndDownscaleImage.mockImplementation(async (p: string) => new Uint8Array([p.length]));
    mocks.writeItemImage.mockImplementation(async (id: string) => `${id}.jpg`);

    render(<Items onToast={onToast} />);
    await user.click(screen.getByText('Ajouter des photos'));

    await waitFor(() => expect(lastDispatched()).toMatchObject({ type: 'ADD_ITEMS', roomId: 'r1' }));
    const action = lastDispatched() as Extract<Action, { type: 'ADD_ITEMS' }>;
    expect(action.items).toHaveLength(2);
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('photos ajoutées'));
  });

  it('does nothing when the file picker is cancelled', async () => {
    const user = userEvent.setup();
    mocks.open.mockResolvedValue(null);
    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('Ajouter des photos'));
    await Promise.resolve();
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_ITEMS' }));
  });

  it('normalizes a single picked file into a one-item import', async () => {
    const user = userEvent.setup();
    mocks.open.mockResolvedValue('/photos/a.jpg');
    mocks.readAndDownscaleImage.mockResolvedValue(new Uint8Array([1]));
    mocks.writeItemImage.mockResolvedValue('uuid-1.jpg');

    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('Ajouter des photos'));
    await waitFor(() => expect(lastDispatched()).toMatchObject({ type: 'ADD_ITEMS' }));
    const action = lastDispatched() as Extract<Action, { type: 'ADD_ITEMS' }>;
    expect(action.items).toHaveLength(1);
  });

  it('skips files that fail to downscale and toasts when every import fails', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.open.mockResolvedValue(['/photos/broken.jpg']);
    mocks.readAndDownscaleImage.mockRejectedValue(new Error('bad image'));

    render(<Items onToast={onToast} />);
    await user.click(screen.getByText('Ajouter des photos'));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith("Aucune image n'a pu être ajoutée."));
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_ITEMS' }));
  });

  it('imports a whole folder of images', async () => {
    const user = userEvent.setup();
    mocks.open.mockResolvedValue('/photos');
    mocks.listImagesInFolder.mockResolvedValue(['/photos/a.jpg', '/photos/b.jpg']);
    mocks.readAndDownscaleImage.mockResolvedValue(new Uint8Array([1]));
    mocks.writeItemImage.mockResolvedValue('x.jpg');

    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('Choisir un dossier'));

    await waitFor(() => expect(lastDispatched()).toMatchObject({ type: 'ADD_ITEMS' }));
  });

  it('toasts when the chosen folder has no images', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.open.mockResolvedValue('/empty-folder');
    mocks.listImagesInFolder.mockResolvedValue([]);

    render(<Items onToast={onToast} />);
    await user.click(screen.getByText('Choisir un dossier'));
    await waitFor(() => expect(onToast).toHaveBeenCalledWith('Aucune image trouvée dans ce dossier.'));
  });

  it('ignores an array result when a single folder was requested', async () => {
    const user = userEvent.setup();
    mocks.open.mockResolvedValue(['/photos']);
    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('Choisir un dossier'));
    await Promise.resolve();
    expect(mocks.listImagesInFolder).not.toHaveBeenCalled();
  });

  it('deletes an item via the card button, removing its stored image', async () => {
    const user = userEvent.setup();
    mocks.state = makeState({ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: {} }] });
    render(<Items onToast={() => {}} />);
    await user.click(screen.getByText('Retirer'));
    expect(lastDispatched()).toEqual({ type: 'DELETE_ITEM', roomId: 'r1', itemId: 'i1' });
    await waitFor(() => expect(mocks.deleteItemImage).toHaveBeenCalledWith('i1.jpg'));
  });

  it('opens the edit modal and saves fields through it', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.state = makeState({ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: {} }] });
    render(<Items onToast={onToast} />);

    await user.click(screen.getByText('✏️ Ajouter les informations'));
    expect(screen.getByText('Décrivez votre objet')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Ex : Canapé en cuir marron'), 'Canapé');
    await user.click(screen.getByText('Enregistrer'));

    expect(lastDispatched()).toEqual({
      type: 'SET_ITEM_FIELDS',
      roomId: 'r1',
      itemId: 'i1',
      fields: expect.objectContaining({ nom: 'Canapé' }),
    });
    expect(onToast).toHaveBeenCalledWith('Informations enregistrées.');
    expect(screen.queryByText('Décrivez votre objet')).toBeNull();
  });

  it('deletes the item being edited from within the modal, after confirming', async () => {
    const user = userEvent.setup();
    mocks.confirm.mockResolvedValue(true);
    mocks.state = makeState({ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: {} }] });
    render(<Items onToast={() => {}} />);

    await user.click(screen.getByText('✏️ Ajouter les informations'));
    await user.click(screen.getByText('Supprimer'));

    expect(lastDispatched()).toEqual({ type: 'DELETE_ITEM', roomId: 'r1', itemId: 'i1' });
    expect(screen.queryByText('Décrivez votre objet')).toBeNull();
  });

  it('closes the modal via Annuler without dispatching any change', async () => {
    const user = userEvent.setup();
    mocks.state = makeState({ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: 'i1.jpg', fields: {} }] });
    render(<Items onToast={() => {}} />);

    await user.click(screen.getByText('✏️ Ajouter les informations'));
    await user.click(screen.getByText('Annuler'));

    expect(screen.queryByText('Décrivez votre objet')).toBeNull();
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'SET_ITEM_FIELDS' }));
  });
});
