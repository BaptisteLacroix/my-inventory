import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { TourProvider, useTour } from './TourContext';
import type { Screen } from './types';

function Consumer({ screen }: { screen: Screen }) {
  const { startScreenTour, startFormTour } = useTour();
  return (
    <div>
      <div id="tour-timeline">timeline</div>
      <div id="tour-autosave-info">autosave</div>
      <div id="tour-start">start</div>
      <div id="tour-rooms-suggestions">room suggestions</div>
      <div id="tour-import-area">import area</div>
      <div id="tour-info-hint">info hint</div>
      <div id="tour-review-area">review area</div>
      <div id="tour-export-summary">export summary</div>
      <div id="tour-form-name">form name</div>
      <div id="tour-form-grid">form grid</div>
      <div id="tour-form-serie">form serie</div>
      <div id="tour-form-note">form note</div>
      <div id="tour-form-save">form save</div>
      <button onClick={() => startScreenTour(screen)}>start-auto</button>
      <button onClick={() => startScreenTour(screen, true)}>start-forced</button>
      <button onClick={() => startFormTour(true)}>start-form-forced</button>
    </div>
  );
}

async function flushMeasure() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(80);
  });
}

describe('TourProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show a tour before it is started', () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    expect(screen.queryByText('Bienvenue !')).toBeNull();
  });

  it('auto-starts a screen tour after the delay, once, when unseen', async () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-auto').click());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    await flushMeasure();
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('does not auto-start a screen tour already marked as seen', async () => {
    window.localStorage.setItem('inv_tour_seen_screen-welcome', '1');
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-auto').click());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(450);
    });
    await flushMeasure();
    expect(screen.queryByText('Bienvenue !')).toBeNull();
  });

  it('force-starting replays a tour even if already marked as seen', async () => {
    window.localStorage.setItem('inv_tour_seen_screen-welcome', '1');
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();
    expect(screen.getByText('Bienvenue !')).toBeInTheDocument();
  });

  it('walks forward through steps with "Suivant" and marks the tour seen on the last step', async () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    act(() => screen.getByText('Suivant →').click());
    await flushMeasure();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    act(() => screen.getByText('Suivant →').click());
    await flushMeasure();
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByText('Terminer')).toBeInTheDocument();

    act(() => screen.getByText('Terminer').click());
    expect(screen.queryByText('3 / 3')).toBeNull();
    expect(window.localStorage.getItem('inv_tour_seen_screen-welcome')).toBe('1');
  });

  it('walks backward with "Précédent", never going below the first step', async () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();
    expect(screen.queryByText('Précédent')).toBeNull();

    act(() => screen.getByText('Suivant →').click());
    await flushMeasure();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    act(() => screen.getByText('Précédent').click());
    await flushMeasure();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('"Passer" skips the tour immediately and marks it seen', async () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();

    act(() => screen.getByText('Passer').click());
    expect(screen.queryByText('1 / 3')).toBeNull();
    expect(window.localStorage.getItem('inv_tour_seen_screen-welcome')).toBe('1');
  });

  it('ignores a second start request while a tour is already active', async () => {
    render(
      <TourProvider>
        <Consumer screen="welcome" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();
    act(() => screen.getByText('Suivant →').click());
    await flushMeasure();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Re-triggering start (even forced) while a tour is mid-flight must not reset it to step 1.
    act(() => screen.getByText('start-forced').click());
    await flushMeasure();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('runs the form tour via startFormTour', async () => {
    render(
      <TourProvider>
        <Consumer screen="items" />
      </TourProvider>,
    );
    act(() => screen.getByText('start-form-forced').click());
    await flushMeasure();
    expect(screen.getByText("La fiche de l'objet")).toBeInTheDocument();
  });
});

describe('useTour', () => {
  it('throws when used outside a TourProvider', () => {
    const { result } = renderHook(() => {
      try {
        return useTour();
      } catch (err) {
        return err as Error;
      }
    });
    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/TourProvider/);
  });
});
