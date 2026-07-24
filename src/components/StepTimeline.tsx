import type { Screen } from '../state/types';

const ORDER: Screen[] = ['welcome', 'rooms', 'items', 'review', 'export'];
const LABELS = ['Bienvenue', 'Vos pièces', 'Vos objets', 'Aperçu', 'PDF'];

export function StepTimeline({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void }) {
  const cur = ORDER.indexOf(screen);

  return (
    <div
      id="tour-timeline"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 4,
        flexWrap: 'wrap',
        background: '#fffdf8',
        border: '1px solid #ece3d4',
        borderRadius: 18,
        padding: '14px 10px',
        boxShadow: '0 4px 14px rgba(46,40,32,.05)',
        marginBottom: 26,
      }}
    >
      {LABELS.map((label, i) => {
        const status = i < cur ? 'done' : i === cur ? 'current' : 'todo';
        return (
          <button
            key={label}
            onClick={() => onNavigate(ORDER[i])}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 7,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: '4px 8px',
              minWidth: 78,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 18,
                transition: 'all .2s',
                background: status === 'done' ? 'var(--accent)' : status === 'current' ? '#c98a3f' : '#e6ddcf',
                color: status === 'todo' ? '#9a8f7d' : '#fff',
                boxShadow: status === 'current' ? '0 0 0 5px rgba(201,138,63,.22)' : 'none',
              }}
            >
              {i + 1}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: status === 'todo' ? 600 : 800,
                color: status === 'todo' ? '#9a8f7d' : status === 'current' ? '#3a342c' : '#5c5346',
                textAlign: 'center',
                maxWidth: 90,
              }}
            >
              {label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
