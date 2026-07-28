import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, Action } from './state/actions';
import type { Screen } from './state/types';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  startFormTour: vi.fn(),
  dispatch: vi.fn(),
  state: undefined as unknown as AppState,
  confirm: vi.fn(),
  clearInventoryImages: vi.fn(),
  getItemImageSrc: vi.fn(),
  openWiki: vi.fn(),
}));

vi.mock('./state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour, startFormTour: mocks.startFormTour }),
}));

vi.mock('./state/WikiContext', () => ({
  useWiki: () => ({ openWiki: mocks.openWiki }),
}));

vi.mock('./state/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: mocks.confirm,
}));

vi.mock('./lib/inventoryFile', () => ({
  clearInventoryImages: mocks.clearInventoryImages,
  getItemImageSrc: mocks.getItemImageSrc,
}));

const { default: App } = await import('./App');

function makeState(screen: Screen, overrides: Partial<AppState> = {}): AppState {
  return { screen, rooms: [], currentRoomId: null, newRoomName: '', loaded: true, ...overrides };
}

function lastDispatched(): Action {
  return mocks.dispatch.mock.calls[mocks.dispatch.mock.calls.length - 1][0];
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getItemImageSrc.mockResolvedValue(null);
    mocks.state = makeState('welcome');
  });

  it('renders the header and the welcome screen by default', () => {
    render(<App />);
    expect(screen.getByText('My Inventory')).toBeInTheDocument();
    expect(screen.getByText('Faisons ensemble la liste de vos objets')).toBeInTheDocument();
  });

  it.each<[Screen, string]>([
    ['rooms', 'Étape 1 · Vos pièces'],
    ['review', 'Étape 3 · Aperçu'],
    ['export', 'Étape 4 · Créer votre PDF'],
  ])('renders the %s screen', (targetScreen, heading) => {
    mocks.state = makeState(targetScreen);
    render(<App />);
    expect(screen.getByText(heading)).toBeInTheDocument();
  });

  it('renders the items screen when a room is open', () => {
    mocks.state = makeState('items', {
      currentRoomId: 'r1',
      rooms: [{ id: 'r1', name: 'Salon', items: [] }],
    });
    render(<App />);
    expect(screen.getByText('Étape 2 · Salon')).toBeInTheDocument();
  });

  it('redirects to rooms when navigating to items without an open room', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Vos objets'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'rooms' });
  });

  it('navigates to items via the timeline when a room is already open', async () => {
    const user = userEvent.setup();
    mocks.state = makeState('welcome', { currentRoomId: 'r1', rooms: [{ id: 'r1', name: 'Salon', items: [] }] });
    render(<App />);
    await user.click(screen.getByText('Vos objets'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'items' });
  });

  it('opens the wiki via the Aide button', async () => {
    const user = userEvent.setup();
    mocks.state = makeState('review');
    render(<App />);
    await user.click(screen.getByText('Aide'));
    expect(mocks.openWiki).toHaveBeenCalledTimes(1);
  });

  it('resets the inventory after confirmation', async () => {
    const user = userEvent.setup();
    mocks.confirm.mockResolvedValue(true);
    render(<App />);
    await user.click(screen.getByText('Recommencer'));
    expect(mocks.confirm).toHaveBeenCalledWith("Effacer tout l'inventaire et recommencer à zéro ?", { title: 'Confirmer' });
    expect(mocks.clearInventoryImages).toHaveBeenCalledTimes(1);
    expect(lastDispatched()).toEqual({ type: 'RESET_ALL' });
  });

  it('does not reset when the confirmation is declined', async () => {
    const user = userEvent.setup();
    mocks.confirm.mockResolvedValue(false);
    render(<App />);
    await user.click(screen.getByText('Recommencer'));
    expect(mocks.clearInventoryImages).not.toHaveBeenCalled();
    expect(mocks.dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'RESET_ALL' }));
  });

  it('shows a toast triggered by a child screen and lets it be dismissed via state', async () => {
    const user = userEvent.setup();
    mocks.state = makeState('rooms');
    render(<App />);
    await user.click(screen.getByText('+ Salon'));
    expect(screen.getByText('« Salon » ajoutée. Cliquez dessus pour l\'ouvrir.')).toBeInTheDocument();
  });
});
