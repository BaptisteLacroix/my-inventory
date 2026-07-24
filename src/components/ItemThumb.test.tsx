import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  getItemImageSrc: vi.fn(),
}));

vi.mock('../lib/inventoryFile', () => ({
  getItemImageSrc: mocks.getItemImageSrc,
}));

const { ItemThumb } = await import('./ItemThumb');

describe('ItemThumb', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders nothing until the image src resolves', () => {
    mocks.getItemImageSrc.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ItemThumb photoFile="item.jpg" />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders an img with the resolved src once loaded', async () => {
    mocks.getItemImageSrc.mockResolvedValue('asset://item.jpg');
    const { container } = render(<ItemThumb photoFile="item.jpg" />);
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')).toHaveAttribute('src', 'asset://item.jpg');
    expect(mocks.getItemImageSrc).toHaveBeenCalledWith('item.jpg');
  });

  it('stays empty when the resolved src is null', async () => {
    mocks.getItemImageSrc.mockResolvedValue(null);
    const { container } = render(<ItemThumb photoFile="" />);
    await waitFor(() => expect(mocks.getItemImageSrc).toHaveBeenCalled());
    expect(container.querySelector('img')).toBeNull();
  });

  it('discards a stale resolution after the photoFile prop changes', async () => {
    let resolveFirst: (v: string | null) => void = () => {};
    mocks.getItemImageSrc.mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)));
    mocks.getItemImageSrc.mockResolvedValueOnce('asset://second.jpg');

    const { rerender, container } = render(<ItemThumb photoFile="first.jpg" />);
    rerender(<ItemThumb photoFile="second.jpg" />);
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull());
    expect(container.querySelector('img')).toHaveAttribute('src', 'asset://second.jpg');

    resolveFirst('asset://first.jpg');
    await Promise.resolve();
    expect(container.querySelector('img')).toHaveAttribute('src', 'asset://second.jpg');
  });
});
