import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Screen } from './types';
import { GuidedTour } from '../components/GuidedTour';
import { SCREEN_TOURS, FORM_TOUR_STEPS } from '../lib/tours';
import { hasSeenTour, markTourSeen } from '../lib/tourStorage';

type ActiveTour = { kind: 'screen'; key: Screen } | { kind: 'form' };

interface TourState {
  tour: ActiveTour | null;
  stepIndex: number;
}

interface TourContextValue {
  startScreenTour: (key: Screen, force?: boolean) => void;
  startFormTour: (force?: boolean) => void;
}

const TourContext = createContext<TourContextValue | null>(null);
const AUTO_DELAY_MS = 450;

export function TourProvider({ children }: { children: ReactNode }) {
  const [tourState, setTourState] = useState<TourState>({ tour: null, stepIndex: 0 });

  function beginIfIdle(tour: ActiveTour, seenKey: string, force: boolean) {
    setTourState((prev) => {
      if (prev.tour) return prev;
      if (!force && hasSeenTour(seenKey)) return prev;
      return { tour, stepIndex: 0 };
    });
  }

  function startScreenTour(key: Screen, force = false) {
    if (!SCREEN_TOURS[key]?.length) return;
    if (force) beginIfIdle({ kind: 'screen', key }, `screen-${key}`, true);
    else setTimeout(() => beginIfIdle({ kind: 'screen', key }, `screen-${key}`, false), AUTO_DELAY_MS);
  }

  function startFormTour(force = false) {
    if (force) beginIfIdle({ kind: 'form' }, 'form', true);
    else setTimeout(() => beginIfIdle({ kind: 'form' }, 'form', false), AUTO_DELAY_MS);
  }

  const steps = tourState.tour?.kind === 'screen' ? SCREEN_TOURS[tourState.tour.key] ?? [] : tourState.tour?.kind === 'form' ? FORM_TOUR_STEPS : [];

  function finish() {
    if (tourState.tour?.kind === 'screen') markTourSeen(`screen-${tourState.tour.key}`);
    else if (tourState.tour?.kind === 'form') markTourSeen('form');
    setTourState({ tour: null, stepIndex: 0 });
  }

  function next() {
    if (tourState.stepIndex >= steps.length - 1) finish();
    else setTourState((prev) => ({ ...prev, stepIndex: prev.stepIndex + 1 }));
  }

  function prev() {
    setTourState((prev) => ({ ...prev, stepIndex: Math.max(0, prev.stepIndex - 1) }));
  }

  return (
    <TourContext.Provider value={{ startScreenTour, startFormTour }}>
      {children}
      {tourState.tour && steps.length > 0 && (
        <GuidedTour steps={steps} stepIndex={tourState.stepIndex} onNext={next} onPrev={prev} onSkip={finish} />
      )}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
