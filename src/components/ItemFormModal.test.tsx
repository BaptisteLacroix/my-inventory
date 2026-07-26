import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Item } from '../state/types';

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  startFormTour: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: mocks.confirm,
}));

vi.mock('../state/TourContext', () => ({
  useTour: () => ({ startFormTour: mocks.startFormTour }),
}));

vi.mock('./ItemThumb', () => ({
  ItemThumb: () => <div data-testid="thumb" />,
}));

const { ItemFormModal } = await import('./ItemFormModal');

const item: Item = { id: 'i1', photoFile: 'i1.jpg', fields: { nom: 'Canapé', prix: '850 €' } };

describe('ItemFormModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('pre-fills inputs from the item fields and triggers the form tour on mount', () => {
    render(<ItemFormModal item={item} onSave={() => {}} onCancel={() => {}} onDelete={() => {}} />);
    expect(screen.getByPlaceholderText('Ex : Canapé en cuir marron')).toHaveValue('Canapé');
    expect(screen.getByPlaceholderText('Ex : 850 €')).toHaveValue('850 €');
    expect(mocks.startFormTour).toHaveBeenCalledWith();
  });

  it('updates draft fields as the user types and saves them on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ItemFormModal item={item} onSave={onSave} onCancel={() => {}} onDelete={() => {}} />);

    const nameInput = screen.getByPlaceholderText('Ex : Canapé en cuir marron');
    await user.clear(nameInput);
    await user.type(nameInput, 'Fauteuil');

    await user.click(screen.getByText('Enregistrer'));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nom: 'Fauteuil', prix: '850 €' }));
  });

  it('calls onCancel without touching the fields', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ItemFormModal item={item} onSave={() => {}} onCancel={onCancel} onDelete={() => {}} />);
    await user.click(screen.getByText('Annuler'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('deletes the item only after the confirm dialog is accepted', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    mocks.confirm.mockResolvedValue(true);
    render(<ItemFormModal item={item} onSave={() => {}} onCancel={() => {}} onDelete={onDelete} />);

    await user.click(screen.getByText('Supprimer'));
    expect(mocks.confirm).toHaveBeenCalledWith('Supprimer cet objet ?', { title: 'Confirmer la suppression' });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('does not delete when the confirm dialog is dismissed', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    mocks.confirm.mockResolvedValue(false);
    render(<ItemFormModal item={item} onSave={() => {}} onCancel={() => {}} onDelete={onDelete} />);

    await user.click(screen.getByText('Supprimer'));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('force-replays the form tour when the help button is clicked', async () => {
    const user = userEvent.setup();
    render(<ItemFormModal item={item} onSave={() => {}} onCancel={() => {}} onDelete={() => {}} />);
    await user.click(screen.getByText('? Aide'));
    expect(mocks.startFormTour).toHaveBeenCalledWith(true);
  });
});
