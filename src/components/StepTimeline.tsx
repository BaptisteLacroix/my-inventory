import type { Screen } from '../state/types';

const ORDER: Screen[] = ['welcome', 'rooms', 'items', 'review', 'export'];
const LABELS = ['Bienvenue', 'Vos pièces', 'Vos objets', 'Aperçu', 'PDF'];
/** Steps that need at least one room to exist before they make sense to open. */
const REQUIRES_ROOMS = [false, false, true, true, true];

interface StepTimelineProps {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  /** Whether at least one room has been created yet - steps beyond "Vos pièces" stay locked until it has. */
  hasRooms: boolean;
}

export function StepTimeline({ screen, onNavigate, hasRooms }: StepTimelineProps) {
  const cur = ORDER.indexOf(screen);

  return (
    <aside style={{ position: 'sticky', top: 16, flex: '1 1 0', minWidth: 230, maxWidth: 380 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '0 2px 10px',
          color: '#7a6642',
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: 20 }}>👆</span> Touchez une étape
      </div>
      <div
        id="tour-timeline"
        style={{
          background: '#fffdf8',
          border: '1px solid #ece3d4',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(46,40,32,.05)',
        }}
      >
        {LABELS.map((label, i) => {
          const status = i < cur ? 'done' : i === cur ? 'current' : 'todo';
          const isLast = i === LABELS.length - 1;
          const locked = REQUIRES_ROOMS[i] && !hasRooms;
          return (
            <button
              key={label}
              onClick={() => onNavigate(ORDER[i])}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                width: '100%',
                border: 'none',
                padding: '15px 16px',
                cursor: locked ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                background: status === 'current' ? '#f1faf6' : 'transparent',
                borderBottom: isLast ? 'none' : '1px solid #ece3d4',
                opacity: locked ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 18,
                  flex: 'none',
                  background: status === 'done' ? 'var(--accent)' : status === 'current' ? '#c98a3f' : '#e6ddcf',
                  color: status === 'todo' ? '#9a8f7d' : '#fff',
                  boxShadow: status === 'current' ? '0 0 0 4px rgba(201,138,63,.20)' : 'none',
                }}
              >
                {status === 'done' ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: status === 'todo' ? '#8a8073' : '#3a342c',
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginTop: 1,
                    color: locked ? '#a9927a' : status === 'done' ? 'var(--accent)' : status === 'current' ? '#c98a3f' : '#a9927a',
                  }}
                >
                  {locked
                    ? 'Verrouillé'
                    : status === 'done'
                      ? 'Terminé'
                      : status === 'current'
                        ? 'Vous êtes ici'
                        : 'À faire'}
                </div>
              </div>
              <div style={{ fontSize: locked ? 22 : 32, color: status === 'todo' ? '#d3c8b6' : '#c2b6a2', flex: 'none', lineHeight: 1 }}>
                {locked ? '🔒' : '›'}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
