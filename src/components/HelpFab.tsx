interface HelpFabProps {
  onClick: () => void;
}

/** Floating, always-visible help button (bottom-right) that opens the wiki. */
export function HelpFab({ onClick }: HelpFabProps) {
  return (
    <button
      onClick={onClick}
      title="Ouvrir l'aide"
      aria-label="Ouvrir l'aide"
      style={{
        position: 'fixed',
        right: 22,
        bottom: 22,
        zIndex: 880,
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: 'var(--accent)',
        color: '#fff',
        border: 'none',
        cursor: 'pointer',
        fontSize: 30,
        fontWeight: 800,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'pulseHelp 2.6s ease-in-out infinite',
      }}
    >
      ?
    </button>
  );
}
