export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 28,
        transform: 'translateX(-50%)',
        zIndex: 950,
        background: '#2f3a34',
        color: '#fff',
        padding: '14px 26px',
        borderRadius: 999,
        fontSize: 17,
        fontWeight: 700,
        boxShadow: '0 10px 30px rgba(0,0,0,.25)',
        animation: 'fadeUp .3s ease both',
      }}
    >
      {message}
    </div>
  );
}
