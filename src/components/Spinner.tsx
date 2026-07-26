interface SpinnerProps {
  size?: number;
  color?: string;
  trackColor?: string;
}

export function Spinner({ size = 22, color = 'var(--accent)', trackColor = 'rgba(58,52,44,.15)' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Chargement en cours"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `${Math.max(2, Math.round(size / 8))}px solid ${trackColor}`,
        borderTopColor: color,
        animation: 'spin .8s linear infinite',
        flex: 'none',
      }}
    />
  );
}
