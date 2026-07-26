import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import type { InventoryManifest, Room } from './types';

const mocks = vi.hoisted(() => ({
  loadManifest: vi.fn(),
  saveManifest: vi.fn(),
}));

vi.mock('../lib/inventoryFile', () => ({
  loadManifest: mocks.loadManifest,
  saveManifest: mocks.saveManifest,
}));

const { InventoryProvider, useInventory } = await import('./InventoryContext');

function Consumer() {
  const { state, dispatch } = useInventory();
  return (
    <div>
      <div data-testid="loaded">{String(state.loaded)}</div>
      <div data-testid="room-count">{state.rooms.length}</div>
      <button onClick={() => dispatch({ type: 'ADD_ROOM', name: 'Salon' })}>add</button>
    </div>
  );
}

describe('InventoryProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.loadManifest.mockResolvedValue({ version: 1, rooms: [] } satisfies InventoryManifest);
    mocks.saveManifest.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads the manifest on mount and exposes it as state', async () => {
    const rooms: Room[] = [{ id: 'r1', name: 'Salon', items: [] }];
    mocks.loadManifest.mockResolvedValue({ version: 1, rooms });

    render(
      <InventoryProvider>
        <Consumer />
      </InventoryProvider>,
    );

    expect(mocks.loadManifest).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId('loaded').textContent).toBe('true');
    expect(screen.getByTestId('room-count').textContent).toBe('1');
  });

  it('debounces saveManifest and only persists once after the state settles', async () => {
    render(
      <InventoryProvider>
        <Consumer />
      </InventoryProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(mocks.saveManifest).not.toHaveBeenCalled();

    act(() => {
      screen.getByText('add').click();
    });
    // Advancing less than the debounce window must not have saved yet.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(mocks.saveManifest).not.toHaveBeenCalled();

    act(() => {
      screen.getByText('add').click();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(mocks.saveManifest).toHaveBeenCalledTimes(1);
    expect(mocks.saveManifest).toHaveBeenCalledWith({ version: 1, rooms: expect.arrayContaining([expect.objectContaining({ name: 'Salon' })]) });
  });

  it('flushes any pending save immediately on beforeunload', async () => {
    render(
      <InventoryProvider>
        <Consumer />
      </InventoryProvider>,
    );
    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      screen.getByText('add').click();
    });
    expect(mocks.saveManifest).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });
    expect(mocks.saveManifest).toHaveBeenCalledTimes(1);
  });

  it('does not schedule a save before the initial manifest has loaded', async () => {
    let resolveLoad: (m: InventoryManifest) => void = () => {};
    mocks.loadManifest.mockReturnValue(new Promise((resolve) => (resolveLoad = resolve)));

    render(
      <InventoryProvider>
        <Consumer />
      </InventoryProvider>,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mocks.saveManifest).not.toHaveBeenCalled();

    await act(async () => {
      resolveLoad({ version: 1, rooms: [] });
      await Promise.resolve();
    });
    expect(screen.getByTestId('loaded').textContent).toBe('true');
  });
});

describe('useInventory', () => {
  it('throws when used outside an InventoryProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useInventory();
      } catch (err) {
        return err as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/InventoryProvider/);
  });
});
