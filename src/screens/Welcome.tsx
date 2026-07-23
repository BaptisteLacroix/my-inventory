export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div
      style={{
        animation: 'fadeUp .4s ease both',
        textAlign: 'center',
        padding: '14px 0 40px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "'Lora',serif",
          fontSize: 40,
          lineHeight: 1.15,
          fontWeight: 700,
          maxWidth: 720,
          margin: '0 auto 18px',
        }}
      >
        Faisons ensemble la liste de vos objets
      </div>
      <p style={{ fontSize: 20, lineHeight: 1.6, color: '#5c5346', maxWidth: 640, margin: '0 auto 10px' }}>
        Cette application vous aide, tout doucement, à photographier vos objets et à noter leurs informations, pour
        votre assurance.
      </p>
      <p style={{ fontSize: 18, lineHeight: 1.6, color: '#8a8073', maxWidth: 600, margin: '0 auto 30px' }}>
        Vous avancez à votre rythme. Rien n'est obligatoire, et vous pouvez toujours revenir en arrière.
      </p>
      <button
        onClick={onStart}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 16,
          padding: '20px 40px',
          fontSize: 22,
          fontWeight: 800,
          cursor: 'pointer',
          boxShadow: '0 8px 22px rgba(47,125,110,.30)',
        }}
      >
        Commencer &nbsp;→
      </button>
      <div
        style={{
          maxWidth: 560,
          margin: '34px auto 0',
          background: '#fffdf8',
          border: '1px solid #ece3d4',
          borderRadius: 14,
          padding: '16px 20px',
          fontSize: 16,
          color: '#7a6f60',
          lineHeight: 1.55,
        }}
      >
        Votre travail est <strong>gardé automatiquement</strong> sur cet appareil : vous pouvez fermer et revenir
        plus tard.
      </div>
    </div>
  );
}
