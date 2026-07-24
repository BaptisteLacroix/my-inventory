import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { GuidedTour } from './GuidedTour';
import type { TourStep } from '../lib/tours';

const steps: TourStep[] = [
  { targetId: 'target-a', title: 'Étape A', text: 'Texte A' },
  { targetId: 'target-b', title: 'Étape B', text: 'Texte B' },
];

async function measure() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(80);
  });
}

// GuidedTour looks up its target by document.getElementById, so tests need real DOM nodes
// outside the RTL-managed render container. Keep them in their own throwaway container so
// afterEach can remove just that, without touching the portal RTL's own cleanup() unmounts.
let targets: HTMLDivElement;

function addTarget(id: string) {
  const el = document.createElement('div');
  el.id = id;
  targets.appendChild(el);
}

describe('GuidedTour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    targets = document.createElement('div');
    document.body.appendChild(targets);
  });

  afterEach(() => {
    vi.useRealTimers();
    targets.remove();
  });

  it('renders nothing when the target element is not in the DOM', async () => {
    render(<GuidedTour steps={steps} stepIndex={0} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.queryByText('Étape A')).toBeNull();
  });

  it('renders the step title/text and progress once the target is found', async () => {
    addTarget('target-a');
    render(<GuidedTour steps={steps} stepIndex={0} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.getByText('Étape A')).toBeInTheDocument();
    expect(screen.getByText('Texte A')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('hides the "Précédent" button on the first step and shows it afterwards', async () => {
    addTarget('target-a');
    addTarget('target-b');
    const { rerender } = render(<GuidedTour steps={steps} stepIndex={0} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.queryByText('Précédent')).toBeNull();

    rerender(<GuidedTour steps={steps} stepIndex={1} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.getByText('Précédent')).toBeInTheDocument();
  });

  it('labels the primary button "Terminer" only on the last step', async () => {
    addTarget('target-a');
    addTarget('target-b');
    const { rerender } = render(<GuidedTour steps={steps} stepIndex={0} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.getByText('Suivant →')).toBeInTheDocument();

    rerender(<GuidedTour steps={steps} stepIndex={1} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.getByText('Terminer')).toBeInTheDocument();
  });

  it('wires onNext, onPrev and onSkip to their respective buttons', async () => {
    addTarget('target-a');
    addTarget('target-b');
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onSkip = vi.fn();
    render(<GuidedTour steps={steps} stepIndex={1} onNext={onNext} onPrev={onPrev} onSkip={onSkip} />);
    await measure();

    act(() => screen.getByText('Passer').click());
    act(() => screen.getByText('Précédent').click());
    act(() => screen.getByText('Terminer').click());

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('re-measures the target on window resize', async () => {
    addTarget('target-a');
    render(<GuidedTour steps={steps} stepIndex={0} onNext={() => {}} onPrev={() => {}} onSkip={() => {}} />);
    await measure();
    expect(screen.getByText('Étape A')).toBeInTheDocument();

    // Resizing after the target is removed should make the tooltip disappear.
    document.getElementById('target-a')?.remove();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.queryByText('Étape A')).toBeNull();
  });
});
