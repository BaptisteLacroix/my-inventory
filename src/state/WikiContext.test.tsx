import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AppState } from './actions';
import type { Screen } from './types';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
  startFormTour: vi.fn(),
  dispatch: vi.fn(),
  state: undefined as unknown as AppState,
}));

vi.mock('./InventoryContext', () => ({
  useInventory: () => ({ state: mocks.state, dispatch: mocks.dispatch }),
}));

vi.mock('./TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour, startFormTour: mocks.startFormTour }),
}));

const { WikiProvider, useWiki } = await import('./WikiContext');

function makeState(screen: Screen, overrides: Partial<AppState> = {}): AppState {
  return { screen, rooms: [], currentRoomId: null, newRoomName: '', loaded: true, ...overrides };
}

function Consumer() {
  const { openWiki } = useWiki();
  return (
    <>
      <button onClick={() => openWiki()}>open-current</button>
      <button onClick={() => openWiki('faq')}>open-faq</button>
    </>
  );
}

function renderProvider() {
  return render(
    <WikiProvider>
      <Consumer />
    </WikiProvider>,
  );
}

describe('WikiContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.state = makeState('review');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the floating help button while the wiki is closed', () => {
    renderProvider();
    expect(screen.getByLabelText("Ouvrir l'aide")).toBeInTheDocument();
  });

  it('opens the wiki on the current screen and hides the floating button', async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText('open-current'));
    expect(screen.getByRole('heading', { name: 'Aperçu' })).toBeInTheDocument();
    expect(screen.queryByLabelText("Ouvrir l'aide")).not.toBeInTheDocument();
  });

  it('opens the wiki directly on a requested section', async () => {
    const user = userEvent.setup();
    renderProvider();
    await user.click(screen.getByText('open-faq'));
    expect(screen.getByText('Vous vous demandez peut-être…')).toBeInTheDocument();
  });

  it('replaying a tour closes the wiki, navigates and force-starts the screen tour', async () => {
    const user = userEvent.setup();
    mocks.state = makeState('welcome');
    renderProvider();
    await user.click(screen.getByText('open-current'));
    await user.click(screen.getByText('▶ Revoir les bulles de cet écran'));

    expect(screen.queryByText("Guide d'utilisation")).not.toBeInTheDocument();
    expect(mocks.dispatch).not.toHaveBeenCalled(); // already on 'welcome', no navigation needed
    vi.advanceTimersByTime(600);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('welcome', true);
  });

  it('redirects the items tour to rooms when no room is open', async () => {
    const user = userEvent.setup();
    mocks.state = makeState('items', { currentRoomId: null });
    renderProvider();
    await user.click(screen.getByText('open-current'));
    await user.click(screen.getByText('▶ Revoir les bulles de cet écran'));

    expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'GO_TO', screen: 'rooms' });
    vi.advanceTimersByTime(600);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('rooms', true);
  });
});
