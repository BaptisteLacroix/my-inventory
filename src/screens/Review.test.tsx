import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState, Action } from '../state/actions';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  dispatch: vi.fn(),
  getItemImageSrc: vi.fn(),
  state: undefined as unknown as AppState,
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour }),
}));

vi.mock('../state/InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('../lib/inventoryFile', () => ({
  getItemImageSrc: mocks.getItemImageSrc,
}));

const { Review } = await import('./Review');

function lastDispatched(): Action {
  return mocks.dispatch.mock.calls[mocks.dispatch.mock.calls.length - 1][0];
}

describe('Review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getItemImageSrc.mockResolvedValue(null);
    mocks.state = {
      screen: 'review',
      currentRoomId: null,
      newRoomName: '',
      loaded: true,
      rooms: [
        {
          id: 'r1',
          name: 'Salon',
          items: [
            { id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'Canapé', prix: '850 €' } },
            { id: 'i2', photoFile: 'i2.jpg', fields: {} },
          ],
        },
        { id: 'r2', name: 'Cuisine', items: [] },
      ],
    };
  });

  it('starts the review tour on mount', () => {
    render(<Review />);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('review');
  });

  it('shows aggregate stats: room count, item count, and total estimated value', () => {
    render(<Review />);
    expect(screen.getAllByText('2')).toHaveLength(2); // 2 rooms and 2 items
    expect(screen.getByText('pièce(s)')).toBeInTheDocument();
    expect(screen.getByText('objet(s)')).toBeInTheDocument();
    expect(screen.getAllByText('850 €').length).toBeGreaterThan(0);
    expect(screen.getByText('valeur estimée')).toBeInTheDocument();
  });

  it('lists each room with its items and flags items with no information', () => {
    render(<Review />);
    expect(screen.getByText('Canapé')).toBeInTheDocument();
    expect(screen.getByText('Objet sans nom')).toBeInTheDocument();
    expect(screen.getByText('Aucune information ajoutée')).toBeInTheDocument();
  });

  it('shows an italic placeholder for a room with no items', () => {
    render(<Review />);
    expect(screen.getByText('Aucun objet dans cette pièce.')).toBeInTheDocument();
  });

  it('navigates back to items and forward to export', async () => {
    const user = userEvent.setup();
    render(<Review />);
    await user.click(screen.getByText('← Modifier'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'items' });

    await user.click(screen.getByText('Passer au PDF →'));
    expect(lastDispatched()).toEqual({ type: 'GO_TO', screen: 'export' });
  });

  it('shows a dash total and zero counts for an empty inventory', () => {
    mocks.state = { ...mocks.state, rooms: [] };
    render(<Review />);
    expect(screen.getAllByText('0')).toHaveLength(2);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
