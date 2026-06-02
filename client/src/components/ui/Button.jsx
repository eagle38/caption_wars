export function PrimaryButton({ children, onClick, disabled, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-2xl font-display font-700 text-lg tracking-wide transition-all duration-200 ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'active:scale-95'
      } ${className}`}
      style={{
        background: disabled ? 'var(--bg-elevated)' : 'var(--accent)',
        color: disabled ? 'var(--cream-muted)' : 'var(--cream)',
        boxShadow: disabled ? 'none' : '0 4px 24px rgba(255,77,28,0.35)',
      }}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-4 rounded-2xl font-display font-600 text-lg tracking-wide transition-all duration-200 active:scale-95 border ${className}`}
      style={{
        background: 'transparent',
        color: 'var(--cream)',
        borderColor: 'var(--border-hover)',
      }}
    >
      {children}
    </button>
  );
}