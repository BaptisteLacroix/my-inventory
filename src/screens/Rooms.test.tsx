import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, Action } from '../state/actions';
import type { Room } from '../state/types';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  dispatch: vi.fn(),
  confirm: vi.fn(),
  state: undefined as unknown as AppState,
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour }),
}));

vi.mock('../state/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: mocks.confirm,
}));

const { Rooms } = await import('./Rooms');

function makeState(rooms: Room[], newRoomName = ''): AppState {
  return { screen: 'rooms', rooms, currentRoomId: null, newRoomName, loaded: true };
}

function lastDispatched(): Action {
  return mocks.dispatch.mock.calls[mocks.dispatch.mock.calls.length - 1][0];
}

describe('Rooms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = makeState([]);
  });

  it('starts the rooms tour automatically on mount', () => {
    render(<Rooms onToast={() => {}} />);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('rooms');
  });

  it('shows the empty state when there are no rooms yet', () => {
    render(<Rooms onToast={() => {}} />);
    expect(screen.getByText(/Aucune pièce pour l'instant/)).toBeInTheDocument();
  });

  it('hides suggestions that are already used as room names', () => {
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [] }]);
    render(<Rooms onToast={() => {}} />);
    expect(screen.queryByText(/Aucune pièce pour l'instant/)).toBeNull();
    expect(screen.queryByText('+ Salon')).toBeNull();
    expect(screen.getByText('+ Cuisine')).toBeInTheDocument();
  });

  it('adds a room by clicking a suggestion', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    render(<Rooms onToast={onToast} />);
    await user.click(screen.getByText('+ Salon'));
    expect(lastDispatched()).toEqual({ type: 'ADD_ROOM', name: 'Salon' });
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('Salon'));
  });

  it('adds a room by typing then clicking Ajouter, and trims the name', async () => {
    const user = userEvent.setup();
    mocks.state = makeState([], 'Véranda  ');
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('Ajouter'));
    expect(lastDispatched()).toEqual({ type: 'ADD_ROOM', name: 'Véranda' });
  });

  it('dispatches SET_NEW_ROOM_NAME as the user types', async () => {
    const user = userEvent.setup();
    render(<Rooms onToast={() => {}} />);
    await user.type(screen.getByPlaceholderText(/Ou écrivez une pièce/), 'X');
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'SET_NEW_ROOM_NAME', name: 'X' });
  });

  it('rejects a duplicate room name (case-insensitive) with a toast instead of adding it', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [] }], 'salon');
    render(<Rooms onToast={onToast} />);
    await user.click(screen.getByText('Ajouter'));
    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'SET_NEW_ROOM_NAME', name: '' });
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'ADD_ROOM' }));
    expect(onToast).toHaveBeenCalledWith(expect.stringContaining('existe déjà'));
  });

  it('renders room cards with singular/plural item counts', () => {
    mocks.state = makeState([
      { id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }] },
      { id: 'r2', name: 'Cuisine', items: [] },
    ]);
    render(<Rooms onToast={() => {}} />);
    expect(screen.getByText('1 objet')).toBeInTheDocument();
    expect(screen.getByText('Aucun objet')).toBeInTheDocument();
  });

  it('opens a room by dispatching OPEN_ROOM', async () => {
    const user = userEvent.setup();
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [] }]);
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('Ouvrir cette pièce →'));
    expect(lastDispatched()).toEqual({ type: 'OPEN_ROOM', roomId: 'r1' });
  });

  it('removes an empty room without asking for confirmation', async () => {
    const user = userEvent.setup();
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [] }]);
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('Retirer'));
    expect(mocks.confirm).not.toHaveBeenCalled();
    expect(lastDispatched()).toEqual({ type: 'REMOVE_ROOM', roomId: 'r1' });
  });

  it('asks for confirmation before removing a room that has items, and respects a decline', async () => {
    const user = userEvent.setup();
    mocks.confirm.mockResolvedValue(false);
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }] }]);
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('Retirer'));
    expect(mocks.confirm).toHaveBeenCalledWith(expect.stringContaining('Salon'), { title: 'Confirmer la suppression' });
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'REMOVE_ROOM' }));
  });

  it('removes a non-empty room once confirmed', async () => {
    const user = userEvent.setup();
    mocks.confirm.mockResolvedValue(true);
    mocks.state = makeState([{ id: 'r1', name: 'Salon', items: [{ id: 'i1', photoFile: '', fields: {} }] }]);
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('Retirer'));
    expect(lastDispatched()).toEqual({ type: 'REMOVE_ROOM', roomId: 'r1' });
  });

  it('navigates back and forward via the footer buttons', async () => {
    const user = userEvent.setup();
    render(<Rooms onToast={() => {}} />);
    await user.click(screen.getByText('← Précédent'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'welcome' });

    await user.click(screen.getByText("Voir l'aperçu →"));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'review' });
  });
});
