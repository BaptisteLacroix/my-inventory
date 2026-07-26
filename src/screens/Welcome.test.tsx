import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  startScreenTour: vi.fn(),
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startScreenTour: mocks.startScreenTour }),
}));

const { Welcome } = await import('./Welcome');

describe('Welcome', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts the welcome tour automatically on mount', () => {
    render(<Welcome onStart={() => {}} />);
    expect(mocks.startScreenTour).toHaveBeenCalledWith('welcome');
  });

  it('calls onStart when "Commencer" is clicked', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<Welcome onStart={onStart} />);
    await user.click(screen.getByText(/Commencer/));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('force-replays the tour from the help link', async () => {
    const user = userEvent.setup();
    render(<Welcome onStart={() => {}} />);
    await user.click(screen.getByText('Montrez-moi comment ça marche'));
    expect(mocks.startScreenTour).toHaveBeenCalledWith('welcome', true);
  });
});
