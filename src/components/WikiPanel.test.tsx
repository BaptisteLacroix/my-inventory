import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WikiPanel } from './WikiPanel';
import type { WikiSelection } from '../lib/wiki';

function setup(selection: WikiSelection = 'welcome') {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const onReplayTour = vi.fn();
  render(<WikiPanel selection={selection} onSelect={onSelect} onClose={onClose} onReplayTour={onReplayTour} />);
  return { onSelect, onClose, onReplayTour };
}

describe('WikiPanel', () => {
  it('renders the guide header and the selected screen section', () => {
    setup('rooms');
    expect(screen.getByText("Guide d'utilisation")).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vos pièces' })).toBeInTheDocument();
    expect(screen.getByText('« Ouvrir cette pièce »')).toBeInTheDocument();
  });

  it('selects another section from the left nav', async () => {
    const user = userEvent.setup();
    const { onSelect } = setup('welcome');
    await user.click(screen.getByText('Questions fréquentes'));
    expect(onSelect).toHaveBeenCalledWith('faq');
  });

  it('renders the FAQ section when selected', () => {
    setup('faq');
    expect(screen.getByText('Vous vous demandez peut-être…')).toBeInTheDocument();
    expect(screen.getByText('Dois-je tout remplir ?')).toBeInTheDocument();
  });

  it('renders the troubleshooting section when selected', () => {
    setup('trouble');
    expect(screen.getByText('Si quelque chose ne marche pas')).toBeInTheDocument();
  });

  it('renders the step-by-step section when selected', () => {
    setup('steps');
    expect(screen.getByText('En 5 étapes')).toBeInTheDocument();
    expect(screen.getByText('Téléchargez le PDF')).toBeInTheDocument();
  });

  it('replays the tour for the current screen', async () => {
    const user = userEvent.setup();
    const { onReplayTour } = setup('items');
    await user.click(screen.getByText('▶ Revoir les bulles de cet écran'));
    expect(onReplayTour).toHaveBeenCalledWith('items');
  });

  it('closes via the Fermer button', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByText('Fermer ✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but not when the panel is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.click(screen.getByText("Guide d'utilisation"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to a placeholder when the screenshot fails to load', () => {
    setup('welcome');
    const shot = screen.getByAltText("Capture de l'écran « Accueil »");
    fireEvent.error(shot);
    expect(screen.getByText('Capture à venir')).toBeInTheDocument();
  });
});
