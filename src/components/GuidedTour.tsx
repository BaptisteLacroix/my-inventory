import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TourStep } from '../lib/tours';

interface GuidedTourProps {
  steps: TourStep[];
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const skipStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#a9927a',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
};

const ghostStyle: React.CSSProperties = {
  background: '#fffdf8',
  color: '#5c5346',
  border: '2px solid #e6ddcf',
  borderRadius: 11,
  padding: '10px 18px',
  fontSize: 15,
  fontWeight: 800,
  cursor: 'pointer',
};

const primaryStyle: React.CSSProperties = {
  background: 'var(--accent)',
  color: '#fff',
  border: 'none',
  borderRadius: 11,
  padding: '12px 22px',
  fontSize: 16,
  fontWeight: 800,
  cursor: 'pointer',
};

export function GuidedTour({ steps, stepIndex, onNext, onPrev, onSkip }: GuidedTourProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const step = steps[stepIndex];

  useEffect(() => {
    setRect(null);
    if (!step) return;

    function measure() {
      const el = document.getElementById(step!.targetId);
      if (!el) {
        setRect(null);
        return;
      }
      if (el.scrollIntoView) {
        try {
          el.scrollIntoView({ block: 'nearest' });
        } catch {
          // Best-effort - some environments don't support scroll options.
        }
      }
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    }

    const timer = setTimeout(measure, 80);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [step]);

  if (!step || !rect) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const below = rect.top < vh * 0.52;
  const tipWidth = Math.min(380, vw - 32);
  const tipLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - tipWidth / 2), Math.max(16, vw - tipWidth - 16));

  const tipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    width: tipWidth,
    left: tipLeft,
    background: '#fffdf8',
    borderRadius: 16,
    padding: '20px 22px 16px',
    boxShadow: '0 20px 55px rgba(46,40,32,.4)',
    border: '1px solid #ece3d4',
    animation: 'fadeUp .25s ease both',
    ...(below ? { top: rect.top + rect.height + 18 } : { bottom: vh - rect.top + 18 }),
  };

  return createPortal(
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} />
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          left: rect.left - 8,
          top: rect.top - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: 14,
          animation: 'spot 1.9s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
      <div style={tipStyle}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: '#c98a3f' }}>
          {stepIndex + 1} / {steps.length}
        </div>
        <div style={{ fontFamily: "'Lora',serif", fontSize: 23, fontWeight: 700, margin: '6px 0 8px', color: '#3a342c' }}>
          {step.title}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.5, color: '#5c5346' }}>{step.text}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18, alignItems: 'center' }}>
          <button onClick={onSkip} style={skipStyle}>
            Passer
          </button>
          <div style={{ flex: 1 }} />
          {stepIndex > 0 && (
            <button onClick={onPrev} style={ghostStyle}>
              Précédent
            </button>
          )}
          <button onClick={onNext} style={primaryStyle}>
            {stepIndex === steps.length - 1 ? 'Terminer' : 'Suivant →'}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
