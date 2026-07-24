import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepTimeline } from './StepTimeline';

describe('StepTimeline', () => {
  it('renders all 5 step labels', () => {
    render(<StepTimeline screen="welcome" onNavigate={() => {}} />);
    ['Bienvenue', 'Vos pièces', 'Vos objets', 'Aperçu', 'PDF'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('calls onNavigate with the target screen when a step is clicked', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepTimeline screen="welcome" onNavigate={onNavigate} />);
    await user.click(screen.getByText('Vos objets'));
    expect(onNavigate).toHaveBeenCalledWith('items');
  });

  it('lets the user navigate to every screen from the timeline', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<StepTimeline screen="export" onNavigate={onNavigate} />);
    await user.click(screen.getByText('Bienvenue'));
    expect(onNavigate).toHaveBeenCalledWith('welcome');
  });
});
