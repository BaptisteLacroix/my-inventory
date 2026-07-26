import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('./ItemThumb', () => ({
  ItemThumb: ({ photoFile }: { photoFile: string }) => <div data-testid="thumb">{photoFile}</div>,
}));

const { ItemCard } = await import('./ItemCard');

const baseItem = { id: 'i1', photoFile: 'i1.jpg', fields: {} };

describe('ItemCard', () => {
  it('renders the title, thumb and details', () => {
    render(
      <ItemCard
        item={baseItem}
        title="Canapé"
        details={[{ label: "Prix d'achat", value: '850 €' }]}
        needsInfo={false}
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText('Canapé')).toBeInTheDocument();
    expect(screen.getByTestId('thumb')).toHaveTextContent('i1.jpg');
    expect(screen.getByText("Prix d'achat :")).toBeInTheDocument();
    expect(screen.getByText('850 €')).toBeInTheDocument();
  });

  it('shows the "needs info" badge only when needsInfo is true', () => {
    const { rerender } = render(
      <ItemCard item={baseItem} title="Canapé" details={[]} needsInfo={true} onEdit={() => {}} onDelete={() => {}} />,
    );
    expect(screen.getByText('Informations à ajouter')).toBeInTheDocument();

    rerender(<ItemCard item={baseItem} title="Canapé" details={[]} needsInfo={false} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.queryByText('Informations à ajouter')).toBeNull();
  });

  it('calls onEdit and onDelete when their buttons are clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<ItemCard item={baseItem} title="Canapé" details={[]} needsInfo={false} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByText('✏️ Ajouter les informations'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    await user.click(screen.getByText('Retirer'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
