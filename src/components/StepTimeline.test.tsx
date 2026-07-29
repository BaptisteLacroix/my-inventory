import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepTimeline } from './StepTimeline';

describe('StepTimeline', () => {
  it('renders all 5 step labels', () => {
    render(<StepTimeline screen="welcome" onNavigate={() => {}} hasRooms={true} />);
    ['Bienvenue', 'Vos pièces', 'Vos objets', 'Aperçu', 'PDF'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('calls onNavigate with the target screen when a step is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepTimeline screen="welcome" onNavigate={onNavigate} hasRooms={true} />);
    await user.click(screen.getByText('Vos objets'));
    expect(onNavigate).toHaveBeenCalledWith('items');
  });

  it('lets the user navigate to every screen from the timeline', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepTimeline screen="export" onNavigate={onNavigate} hasRooms={true} />);
    await user.click(screen.getByText('Bienvenue'));
    expect(onNavigate).toHaveBeenCalledWith('welcome');
  });

  it('shows Vos objets/Aperçu/PDF as locked when no room exists yet, but not Vos pièces', () => {
    render(<StepTimeline screen="welcome" onNavigate={() => {}} hasRooms={false} />);
    expect(screen.getAllByText('Verrouillé')).toHaveLength(3);
    expect(screen.getByText('À faire')).toBeInTheDocument(); // "Vos pièces" - reachable with no rooms yet
  });

  it('does not lock any step once a room exists', () => {
    render(<StepTimeline screen="welcome" onNavigate={() => {}} hasRooms={true} />);
    expect(screen.queryByText('Verrouillé')).not.toBeInTheDocument();
  });

  it('still calls onNavigate when a locked step is clicked, leaving the redirect to the caller', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepTimeline screen="welcome" onNavigate={onNavigate} hasRooms={false} />);
    await user.click(screen.getByText('Aperçu'));
    expect(onNavigate).toHaveBeenCalledWith('review');
  });
});
